const path = require('path');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sawmoto';
const databaseUrl = process.env.DATABASE_URL || 'postgresql://sawmoto:sawmoto@127.0.0.1:5432/sawmoto';
const apply = process.argv.includes('--apply');
const useSsl = process.env.PGSSLMODE === 'require' || process.env.NODE_ENV === 'production';

function text(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} wajib berupa string dan tidak boleh kosong`);
  }
  return value.trim();
}

function number(value, label) {
  let result = value;
  if (result && typeof result.toNumber === 'function') result = result.toNumber();
  if (typeof result === 'string') {
    if (!result.trim()) throw new Error(`${label} harus berupa angka finite`);
    result = Number(result);
  }
  if (typeof result !== 'number' || !Number.isFinite(result)) {
    throw new Error(`${label} harus berupa angka finite`);
  }
  return result;
}

function validateMotor(document, index) {
  const id = text(document.id, `Motor[${index}].id`);
  const nama = text(document.nama, `Motor ${id}.nama`);
  const tipe = text(document.tipe, `Motor ${id}.tipe`);
  const harga = number(document.harga, `Motor ${id}.harga`);
  const tangki = number(document.tangki, `Motor ${id}.tangki`);
  const cc = number(document.cc, `Motor ${id}.cc`);

  if (!['Matic', 'Moped', 'Sport'].includes(tipe)) {
    throw new Error(`Motor ${id} memiliki tipe tidak valid: ${tipe}`);
  }
  if (!Number.isSafeInteger(harga) || harga < 0) {
    throw new Error(`Motor ${id} memiliki harga tidak valid`);
  }
  if (tangki < 0) throw new Error(`Motor ${id} memiliki tangki tidak valid`);
  if (!Number.isInteger(cc) || cc < 0 || cc > 2147483647) {
    throw new Error(`Motor ${id} memiliki CC tidak valid`);
  }

  return { id, nama, tipe, harga, tangki, cc };
}

function validateKriteria(document, index) {
  const id = text(document.id, `Kriteria[${index}].id`);
  const label = text(document.label, `Kriteria ${id}.label`);
  const key = text(document.key, `Kriteria ${id}.key`);
  const type = text(document.type, `Kriteria ${id}.type`);
  const bobot = number(document.bobot, `Kriteria ${id}.bobot`);

  if (!['harga', 'tangki', 'cc'].includes(key)) {
    throw new Error(`Kriteria ${id} memiliki key tidak valid: ${key}`);
  }
  if (!['benefit', 'cost'].includes(type)) {
    throw new Error(`Kriteria ${id} memiliki type tidak valid: ${type}`);
  }
  const validRelationship = (key === 'harga' && type === 'cost')
    || (['tangki', 'cc'].includes(key) && type === 'benefit');
  if (!validRelationship) {
    throw new Error(`Kriteria ${id} memiliki kombinasi key/type tidak valid`);
  }
  if (bobot < 0) throw new Error(`Kriteria ${id} memiliki bobot tidak valid`);

  return { id, label, key, type, bobot };
}

function ensureUnique(rows, field, label) {
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row[field])) throw new Error(`${label} duplikat: ${row[field]}`);
    seen.add(row[field]);
  }
}

function digest(rows) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify([...rows].sort((a, b) => a.id.localeCompare(b.id))))
    .digest('hex');
}

async function importData(client, motors, kriterias) {
  await client.query('BEGIN');
  try {
    for (const motor of motors) {
      await client.query(
        `INSERT INTO motors (id, nama, tipe, harga, tangki, cc)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           nama = EXCLUDED.nama,
           tipe = EXCLUDED.tipe,
           harga = EXCLUDED.harga,
           tangki = EXCLUDED.tangki,
           cc = EXCLUDED.cc`,
        [motor.id, motor.nama, motor.tipe, motor.harga, motor.tangki, motor.cc],
      );
    }

    for (const kriteria of kriterias) {
      await client.query(
        `INSERT INTO criteria (id, label, key, type, bobot)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           label = EXCLUDED.label,
           key = EXCLUDED.key,
           type = EXCLUDED.type,
           bobot = EXCLUDED.bobot`,
        [kriteria.id, kriteria.label, kriteria.key, kriteria.type, kriteria.bobot],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function validateImportedData(client, motors, kriterias) {
  const motorIds = motors.map((motor) => motor.id);
  const kriteriaIds = kriterias.map((kriteria) => kriteria.id);
  const [motorRows, kriteriaRows] = await Promise.all([
    client.query('SELECT id, nama, tipe, harga, tangki, cc FROM motors WHERE id = ANY($1::text[]) ORDER BY id', [motorIds]),
    client.query('SELECT id, label, key, type, bobot FROM criteria WHERE id = ANY($1::text[]) ORDER BY id', [kriteriaIds]),
  ]);

  const pgMotors = motorRows.rows.map((row) => ({
    id: row.id,
    nama: row.nama,
    tipe: row.tipe,
    harga: Number(row.harga),
    tangki: Number(row.tangki),
    cc: row.cc,
  }));
  const pgKriterias = kriteriaRows.rows.map((row) => ({
    id: row.id,
    label: row.label,
    key: row.key,
    type: row.type,
    bobot: Number(row.bobot),
  }));

  if (digest(pgMotors) !== digest(motors)) {
    throw new Error('Validasi data motor PostgreSQL tidak sama dengan MongoDB');
  }
  if (digest(pgKriterias) !== digest(kriterias)) {
    throw new Error('Validasi data kriteria PostgreSQL tidak sama dengan MongoDB');
  }
}

async function main() {
  const mongoClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
    ssl: useSsl && !databaseUrl.includes('sslmode=') ? { rejectUnauthorized: true } : undefined,
  });

  try {
    await mongoClient.connect();
    const database = mongoClient.db();
    const [motorDocuments, kriteriaDocuments] = await Promise.all([
      database.collection('motors').find({}).toArray(),
      database.collection('kriterias').find({}).toArray(),
    ]);

    if (!motorDocuments.length || !kriteriaDocuments.length) {
      throw new Error('Koleksi motors atau kriterias MongoDB kosong');
    }

    const motors = motorDocuments.map(validateMotor).sort((a, b) => a.id.localeCompare(b.id));
    const kriterias = kriteriaDocuments.map(validateKriteria).sort((a, b) => a.id.localeCompare(b.id));
    ensureUnique(motors, 'id', 'ID motor');
    ensureUnique(kriterias, 'id', 'ID kriteria');
    ensureUnique(kriterias, 'key', 'Key kriteria');

    console.log(`Validasi MongoDB: ${motors.length} motor, ${kriterias.length} kriteria`);
    console.log(`Checksum motor: ${digest(motors)}`);
    console.log(`Checksum kriteria: ${digest(kriterias)}`);

    if (!apply) {
      console.log('Dry run selesai. Tambahkan --apply untuk menulis ke PostgreSQL.');
      return;
    }

    const client = await pool.connect();
    try {
      await importData(client, motors, kriterias);
      await validateImportedData(client, motors, kriterias);
    } finally {
      client.release();
    }
    console.log('Migrasi selesai dan validasi PostgreSQL berhasil.');
  } finally {
    await mongoClient.close();
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Migrasi gagal:', error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  validateMotor,
  validateKriteria,
  ensureUnique,
};
