const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { motors, kriterias } = require('./data');

const connectionString = process.env.DATABASE_URL || 'postgresql://sawmoto:sawmoto@127.0.0.1:5432/sawmoto';
const useSsl = process.env.PGSSLMODE === 'require' || process.env.NODE_ENV === 'production';
const pool = new Pool({
  connectionString,
  ssl: useSsl && !connectionString.includes('sslmode=') ? { rejectUnauthorized: true } : undefined,
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const motor of motors) {
      await client.query(
        `INSERT INTO motors (id, nama, tipe, harga, tangki, cc)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [motor.id, motor.nama, motor.tipe, motor.harga, motor.tangki, motor.cc],
      );
    }

    for (const kriteria of kriterias) {
      await client.query(
        `INSERT INTO criteria (id, label, key, type, bobot)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [kriteria.id, kriteria.label, kriteria.key, kriteria.type, kriteria.bobot],
      );
    }

    await client.query('COMMIT');
    console.log(`Seed selesai: ${motors.length} motor, ${kriterias.length} kriteria`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

seed()
  .catch((error) => {
    console.error('Seed gagal:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
