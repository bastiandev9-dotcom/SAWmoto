const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://sawmoto:sawmoto@127.0.0.1:5432/sawmoto';
const useSsl = process.env.PGSSLMODE === 'require' || process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ...(useSsl && !connectionString.includes('sslmode=') ? { ssl: { rejectUnauthorized: true } } : {}),
});

pool.on('error', (error) => {
  console.error('PostgreSQL pool error:', error.message);
});

async function checkDatabaseHealth() {
  const result = await pool.query('SELECT 1 AS ok');
  return result.rows[0].ok === 1;
}

async function closePool() {
  await pool.end();
}

module.exports = { pool, checkDatabaseHealth, closePool };
