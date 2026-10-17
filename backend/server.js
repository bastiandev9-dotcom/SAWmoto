const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

// Request logger sederhana (tanpa dependency)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sawmoto')
  .then(() => console.log('MongoDB Connected: sawmoto'))
  .catch(err => console.error('MongoDB Error:', err));

// Health check
app.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    db: states[mongoose.connection.readyState] || 'unknown',
    uptime: Math.round(process.uptime()),
  });
});

app.use('/docs', express.static(path.join(__dirname, 'public')));

app.use('/api/motors', require('./routes/motors'));
app.use('/api/kriteria', require('./routes/kriteria'));

// 404
app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }));

// Error handler global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
