const { pool } = require('../db/pool');

const UPDATE_FIELDS = ['id', 'label', 'key', 'type', 'bobot'];

function mapKriteria(row) {
  if (!row) return null;
  return {
    id: row.id,
    label: row.label,
    key: row.key,
    type: row.type,
    bobot: Number(row.bobot),
  };
}

async function findAll() {
  const result = await pool.query('SELECT id, label, key, type, bobot FROM criteria ORDER BY id');
  return result.rows.map(mapKriteria);
}

async function findById(id) {
  const result = await pool.query('SELECT id, label, key, type, bobot FROM criteria WHERE id = $1', [id]);
  return mapKriteria(result.rows[0]);
}

async function existsById(id) {
  const result = await pool.query('SELECT 1 FROM criteria WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function existsByKey(key) {
  const result = await pool.query('SELECT 1 FROM criteria WHERE key = $1', [key]);
  return result.rowCount > 0;
}

async function create(kriteria) {
  const result = await pool.query(
    `INSERT INTO criteria (id, label, key, type, bobot)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, label, key, type, bobot`,
    [kriteria.id, kriteria.label, kriteria.key, kriteria.type, kriteria.bobot],
  );
  return mapKriteria(result.rows[0]);
}

async function update(id, kriteria) {
  const fields = UPDATE_FIELDS.filter((field) => Object.hasOwn(kriteria, field));
  if (!fields.length) return findById(id);

  const assignments = fields.map((field, index) => `${field} = $${index + 1}`);
  const values = fields.map((field) => kriteria[field]);
  const result = await pool.query(
    `UPDATE criteria SET ${assignments.join(', ')} WHERE id = $${fields.length + 1}
     RETURNING id, label, key, type, bobot`,
    [...values, id],
  );
  return mapKriteria(result.rows[0]);
}

async function deleteById(id) {
  const result = await pool.query(
    'DELETE FROM criteria WHERE id = $1 RETURNING id, label, key, type, bobot',
    [id],
  );
  return mapKriteria(result.rows[0]);
}

module.exports = {
  findAll,
  findById,
  existsById,
  existsByKey,
  create,
  update,
  deleteById,
};
