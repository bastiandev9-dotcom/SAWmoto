const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sawmoto')
  .then(() => console.log('MongoDB Connected: sawmoto'))
  .catch(err => console.error('MongoDB Error:', err));

app.use('/docs', express.static(path.join(__dirname, 'public')));

app.use('/api/motors', require('./routes/motors'));
app.use('/api/kriteria', require('./routes/kriteria'));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
