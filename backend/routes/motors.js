const express = require('express');
const router = express.Router();
const motorRepository = require('../repositories/motorRepository');
const kriteriaRepository = require('../repositories/kriteriaRepository');
const { hitungSAW } = require('../lib/saw');
const { sendDatabaseError } = require('../lib/errors');
const { requireAdmin, requireCsrf } = require('../middleware/auth');
const {
  validateMotorInput,
  validateSawIds,
  validateBobotOverride,
} = require('../lib/validation');

router.get('/', async (req, res) => {
  try {
    res.json(await motorRepository.findAll());
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.get('/calculate/saw', async (req, res) => {
  try {
    const [motors, kriteria] = await Promise.all([
      motorRepository.findAll(),
      kriteriaRepository.findAll(),
    ]);

    if (motors.length < 2) {
      return res.status(400).json({ message: 'Minimal 2 motor diperlukan' });
    }
    if (!kriteria.length) {
      return res.status(400).json({ message: 'Kriteria belum tersedia' });
    }

    res.json(hitungSAW(motors, kriteria));
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.post('/calculate/saw', async (req, res) => {
  try {
    const body = req.body || {};
    if (typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ message: 'Body perhitungan harus berupa object' });
    }

    const ids = validateSawIds(body.ids);
    const [motors, kriteria] = await Promise.all([
      motorRepository.findAll(ids),
      kriteriaRepository.findAll(),
    ]);

    if (motors.length < 2) {
      return res.status(400).json({ message: 'Minimal 2 motor diperlukan' });
    }
    if (!kriteria.length) {
      return res.status(400).json({ message: 'Kriteria belum tersedia' });
    }

    const bobotOverride = validateBobotOverride(body.bobot, kriteria);
    res.json(hitungSAW(motors, kriteria, bobotOverride));
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const motor = await motorRepository.findById(req.params.id);
    if (!motor) return res.status(404).json({ message: 'Motor tidak ditemukan' });
    res.json(motor);
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.post('/', requireAdmin, requireCsrf, async (req, res) => {
  try {
    const motor = validateMotorInput(req.body);
    if (await motorRepository.existsById(motor.id)) {
      return res.status(409).json({ message: `Motor dengan id ${motor.id} sudah ada` });
    }
    const created = await motorRepository.create(motor);
    res.status(201).json(created);
  } catch (error) {
    sendDatabaseError(res, error, `Motor dengan id ${req.body?.id || ''} sudah ada`);
  }
});

router.put('/:id', requireAdmin, requireCsrf, async (req, res) => {
  try {
    const motor = validateMotorInput(req.body, { partial: true });
    const updated = await motorRepository.update(req.params.id, motor);
    if (!updated) return res.status(404).json({ message: 'Motor tidak ditemukan' });
    res.json(updated);
  } catch (error) {
    sendDatabaseError(res, error, 'ID motor sudah digunakan');
  }
});

router.delete('/:id', requireAdmin, requireCsrf, async (req, res) => {
  try {
    const motor = await motorRepository.deleteById(req.params.id);
    if (!motor) return res.status(404).json({ message: 'Motor tidak ditemukan' });
    res.json({ message: 'Motor berhasil dihapus', id: req.params.id });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

module.exports = router;
