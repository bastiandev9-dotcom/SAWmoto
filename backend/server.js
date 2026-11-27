const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { checkDatabaseHealth, closePool } = require('./db/pool');
const { apiLimiter } = require('./middleware/rateLimit');
const { getAuthConfig } = require('./lib/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3001';
const allowedOrigins = corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);

if (isProduction && (!corsOrigin || corsOrigin === '*')) {
  throw new Error('CORS_ORIGIN wajib berisi origin eksplisit di produksi');
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const error = new Error('Origin tidak diizinkan');
    error.status = 403;
    return callback(error);
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use('/api', apiLimiter);

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.get('/health', async (req, res) => {
  try {
    await checkDatabaseHealth();
    res.json({
      status: 'ok',
      db: 'connected',
      uptime: Math.round(process.uptime()),
    });
  } catch (error) {
    console.error('Health check database gagal:', error.message);
    res.status(503).json({
      status: 'error',
      db: 'disconnected',
      uptime: Math.round(process.uptime()),
    });
  }
});

app.use('/docs', express.static(path.join(__dirname, 'public')));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/motors', require('./routes/motors'));
app.use('/api/kriteria', require('./routes/kriteria'));

app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Body JSON tidak valid' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Body request terlalu besar' });
  }
  if (err.status === 403) {
    return res.status(403).json({ message: err.message });
  }

  console.error(err.stack || err.message);
  return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
});

async function start() {
  getAuthConfig();
  await checkDatabaseHealth();
  const server = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  return server;
}

if (require.main === module) {
  let server;
  start()
    .then((instance) => {
      server = instance;
    })
    .catch((error) => {
      console.error('Server gagal start:', error.message);
      process.exitCode = 1;
    });

  const shutdown = async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closePool();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { app, start };
