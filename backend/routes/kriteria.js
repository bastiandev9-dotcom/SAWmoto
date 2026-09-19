const express = require('express');
const router = express.Router();
const Kriteria = require('../models/Kriteria');

router.get('/', async (req, res) => {
  try {
    const kriteria = await Kriteria.find();
    res.json(kriteria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;