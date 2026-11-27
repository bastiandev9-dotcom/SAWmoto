const { pool } = require('../db/pool');

const UPDATE_FIELDS = ['id', 'nama', 'tipe', 'harga', 'tangki', 'cc'];

function mapMotor(row) {
  if (!row) return null;
  const harga = Number(row.harga);
  if (!Number.isSafeInteger(harga)) {
    throw new Error('Harga PostgreSQL berada di luar rentang aman JavaScript');
  }
  return {
    id: row.id,
    nama: row.nama,
    tipe: row.tipe,
    harga,
    tangki: Number(row.tangki),
    cc: row.cc,
  };
}

async function findAll(ids = []) {
  const result = ids.length
    ? await pool.query('SELECT id, nama, tipe, harga, tangki, cc FROM motors WHERE id = ANY($1::text[]) ORDER BY id', [ids])
    : await pool.query('SELECT id, nama, tipe, harga, tangki, cc FROM motors ORDER BY id');
  return result.rows.map(mapMotor);
}

async function findById(id) {
  const result = await pool.query('SELECT id, nama, tipe, harga, tangki, cc FROM motors WHERE id = $1', [id]);
  return mapMotor(result.rows[0]);
}

async function existsById(id) {
  const result = await pool.query('SELECT 1 FROM motors WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function create(motor) {
  const result = await pool.query(
    `INSERT INTO motors (id, nama, tipe, harga, tangki, cc)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, nama, tipe, harga, tangki, cc`,
    [motor.id, motor.nama, motor.tipe, motor.harga, motor.tangki, motor.cc],
  );
  return mapMotor(result.rows[0]);
}

async function update(id, motor) {
  const fields = UPDATE_FIELDS.filter((field) => Object.hasOwn(motor, field));
  if (!fields.length) return findById(id);

  const assignments = fields.map((field, index) => `${field} = $${index + 1}`);
  const values = fields.map((field) => motor[field]);
  const result = await pool.query(
    `UPDATE motors SET ${assignments.join(', ')} WHERE id = $${fields.length + 1}
     RETURNING id, nama, tipe, harga, tangki, cc`,
    [...values, id],
  );
  return mapMotor(result.rows[0]);
}

async function deleteById(id) {
  const result = await pool.query(
    'DELETE FROM motors WHERE id = $1 RETURNING id, nama, tipe, harga, tangki, cc',
    [id],
  );
  return mapMotor(result.rows[0]);
}

module.exports = {
  findAll,
  findById,
  existsById,
  create,
  update,
  deleteById,
};
