const express = require('express');
const router = express.Router();
const kriteriaRepository = require('../repositories/kriteriaRepository');
const { sendDatabaseError } = require('../lib/errors');
const { requireAdmin, requireCsrf } = require('../middleware/auth');
const {
  validateKriteriaInput,
  validateCriteriaRelationship,
} = require('../lib/validation');

router.get('/', async (req, res) => {
  try {
    res.json(await kriteriaRepository.findAll());
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.post('/', requireAdmin, requireCsrf, async (req, res) => {
  try {
    const kriteria = validateKriteriaInput(req.body);
    validateCriteriaRelationship(kriteria.key, kriteria.type);

    if (await kriteriaRepository.existsById(kriteria.id)) {
      return res.status(409).json({ message: `Kriteria dengan id ${kriteria.id} sudah ada` });
    }
    if (await kriteriaRepository.existsByKey(kriteria.key)) {
      return res.status(409).json({ message: `Kriteria dengan key ${kriteria.key} sudah ada` });
    }

    const created = await kriteriaRepository.create(kriteria);
    res.status(201).json(created);
  } catch (error) {
    sendDatabaseError(res, error, 'Kriteria sudah ada');
  }
});

router.put('/:id', requireAdmin, requireCsrf, async (req, res) => {
  try {
    const input = validateKriteriaInput(req.body, { partial: true });
    const existing = await kriteriaRepository.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Kriteria tidak ditemukan' });

    const merged = { ...existing, ...input };
    validateCriteriaRelationship(merged.key, merged.type);

    const updated = await kriteriaRepository.update(req.params.id, input);
    res.json(updated);
  } catch (error) {
    sendDatabaseError(res, error, 'ID atau key kriteria sudah digunakan');
  }
});

router.delete('/:id', requireAdmin, requireCsrf, async (req, res) => {
  try {
    const kriteria = await kriteriaRepository.deleteById(req.params.id);
    if (!kriteria) return res.status(404).json({ message: 'Kriteria tidak ditemukan' });
    res.json({ message: 'Kriteria berhasil dihapus', id: req.params.id });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

module.exports = router;
