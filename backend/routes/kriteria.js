const express = require('express');
const router = express.Router();
const Kriteria = require('../models/Kriteria');

const TYPES = ['benefit', 'cost'];
const isDuplicate = e => e.code === 11000;

router.get('/', async (req, res) => {
  try {
    const kriteria = await Kriteria.find();
    res.json(kriteria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  const { id, label, key, type, bobot } = req.body;
  if (!id || !label || !key || !type || bobot == null)
    return res.status(400).json({ message: 'Field id, label, key, type, bobot wajib diisi' });
  if (!TYPES.includes(type))
    return res.status(400).json({ message: 'Type harus benefit atau cost' });
  try {
    if (await Kriteria.exists({ id }))
      return res.status(409).json({ message: `Kriteria dengan id ${id} sudah ada` });
    if (await Kriteria.exists({ key }))
      return res.status(409).json({ message: `Kriteria dengan key ${key} sudah ada` });
    const kriteria = await new Kriteria({ id, label, key, type, bobot }).save();
    res.status(201).json(kriteria);
  } catch (error) {
    if (isDuplicate(error)) return res.status(409).json({ message: 'Kriteria sudah ada' });
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  if (req.body.type != null && !TYPES.includes(req.body.type))
    return res.status(400).json({ message: 'Type harus benefit atau cost' });
  try {
    const kriteria = await Kriteria.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!kriteria) return res.status(404).json({ message: 'Kriteria tidak ditemukan' });
    res.json(kriteria);
  } catch (error) {
    if (isDuplicate(error)) return res.status(409).json({ message: 'Key kriteria sudah dipakai' });
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const kriteria = await Kriteria.findOneAndDelete({ id: req.params.id });
    if (!kriteria) return res.status(404).json({ message: 'Kriteria tidak ditemukan' });
    res.json({ message: 'Kriteria berhasil dihapus', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
