const express = require('express');
const router = express.Router();
const Motor = require('../models/Motor');
const Kriteria = require('../models/Kriteria');

// ===== SAW CALCULATION ENGINE =====
function hitungSAW(data, kriteriaList) {
  const normalized = data.map(motor => {
    const r = motor.toObject ? motor.toObject() : { ...motor };
    kriteriaList.forEach(k => {
      const vals = data.map(m => m[k.key]);
      const maxVal = Math.max(...vals);
      const minVal = Math.min(...vals);
      // harga selalu cost, sisanya ikut type dari DB
      const isCost = k.key === 'harga' || k.type === 'cost';
      r['r_' + k.key] = isCost ? minVal / motor[k.key] : motor[k.key] / maxVal;
    });
    return r;
  });

  const withScore = normalized.map(motor => {
    let vi = 0;
    kriteriaList.forEach(k => {
      vi += k.bobot * motor['r_' + k.key];
    });
    return { ...motor, vi };
  });

  return withScore.sort((a, b) => b.vi - a.vi).map((m, i) => ({ ...m, rank: i + 1 }));
}

// ===== GET ALL MOTORS =====
router.get('/', async (req, res) => {
  try {
    const motors = await Motor.find();
    res.json(motors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== GET SAW CALCULATION =====
router.get('/calculate/saw', async (req, res) => {
  try {
    const motors = await Motor.find();
    const kriteria = await Kriteria.find();
    
    if (motors.length < 2) {
      return res.status(400).json({ message: 'Minimal 2 motor diperlukan' });
    }
    
    const result = hitungSAW(motors, kriteria);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== GET MOTOR BY ID =====
router.get('/:id', async (req, res) => {
  try {
    const motor = await Motor.findOne({ id: req.params.id });
    if (!motor) return res.status(404).json({ message: 'Motor tidak ditemukan' });
    res.json(motor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== POST (CREATE) MOTOR =====
router.post('/', async (req, res) => {
  const { id, nama, tipe, harga, tangki, cc } = req.body;
  if (!id || !nama || !tipe || harga == null || tangki == null || cc == null)
    return res.status(400).json({ message: 'Field id, nama, tipe, harga, tangki, cc wajib diisi' });
  try {
    const motor = new Motor({ id, nama, tipe, harga, tangki, cc });
    await motor.save();
    res.status(201).json(motor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ===== PUT (UPDATE) MOTOR =====
router.put('/:id', async (req, res) => {
  try {
    const motor = await Motor.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!motor) return res.status(404).json({ message: 'Motor tidak ditemukan' });
    res.json(motor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ===== DELETE MOTOR =====
router.delete('/:id', async (req, res) => {
  try {
    const motor = await Motor.findOneAndDelete({ id: req.params.id });
    if (!motor) return res.status(404).json({ message: 'Motor tidak ditemukan' });
    res.json({ message: 'Motor berhasil dihapus', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;