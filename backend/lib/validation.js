class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

const MOTOR_TYPES = ['Matic', 'Moped', 'Sport'];
const CRITERIA_TYPES = ['benefit', 'cost'];
const CRITERIA_KEYS = ['harga', 'tangki', 'cc'];
const MOTOR_FIELDS = ['id', 'nama', 'tipe', 'harga', 'tangki', 'cc'];
const KRITERIA_FIELDS = ['id', 'label', 'key', 'type', 'bobot'];

function rejectUnknownFields(payload, allowed, label) {
  const unknown = Object.keys(payload).filter((field) => !allowed.includes(field));
  if (unknown.length) {
    throw new ValidationError(`Field ${label} tidak dikenali: ${unknown.join(', ')}`);
  }
}

function requiredText(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError(`${label} wajib diisi`);
  }
  return value.trim();
}

function finiteNumber(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(`${label} harus berupa angka`);
  }
  return value;
}

function nonNegativeNumber(value, label) {
  const number = finiteNumber(value, label);
  if (number < 0) throw new ValidationError(`${label} tidak boleh negatif`);
  return number;
}

function validateMotorInput(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ValidationError('Body motor harus berupa object');
  }

  rejectUnknownFields(payload, MOTOR_FIELDS, 'motor');

  if (partial && !Object.keys(payload).length) {
    throw new ValidationError('Tidak ada field motor yang diperbarui');
  }

  const result = {};

  if (!partial || Object.hasOwn(payload, 'id')) {
    result.id = requiredText(payload.id, 'Field id');
  }
  if (!partial || Object.hasOwn(payload, 'nama')) {
    result.nama = requiredText(payload.nama, 'Field nama');
  }
  if (!partial || Object.hasOwn(payload, 'tipe')) {
    if (!MOTOR_TYPES.includes(payload.tipe)) {
      throw new ValidationError('Tipe harus Matic, Moped, atau Sport');
    }
    result.tipe = payload.tipe;
  }
  if (!partial || Object.hasOwn(payload, 'harga')) {
    result.harga = nonNegativeNumber(payload.harga, 'Harga');
    if (!Number.isSafeInteger(result.harga)) {
      throw new ValidationError('Harga harus berupa bilangan bulat yang aman');
    }
  }
  if (!partial || Object.hasOwn(payload, 'tangki')) {
    result.tangki = nonNegativeNumber(payload.tangki, 'Tangki');
  }
  if (!partial || Object.hasOwn(payload, 'cc')) {
    result.cc = nonNegativeNumber(payload.cc, 'CC');
    if (!Number.isInteger(result.cc) || result.cc > 2147483647) {
      throw new ValidationError('CC harus berupa bilangan bulat yang valid');
    }
  }

  return result;
}

function validateKriteriaInput(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ValidationError('Body kriteria harus berupa object');
  }

  rejectUnknownFields(payload, KRITERIA_FIELDS, 'kriteria');

  if (partial && !Object.keys(payload).length) {
    throw new ValidationError('Tidak ada field kriteria yang diperbarui');
  }

  const result = {};

  if (!partial || Object.hasOwn(payload, 'id')) {
    result.id = requiredText(payload.id, 'Field id');
  }
  if (!partial || Object.hasOwn(payload, 'label')) {
    result.label = requiredText(payload.label, 'Field label');
  }
  if (!partial || Object.hasOwn(payload, 'key')) {
    if (!CRITERIA_KEYS.includes(payload.key)) {
      throw new ValidationError('Key kriteria harus harga, tangki, atau cc');
    }
    result.key = payload.key;
  }
  if (!partial || Object.hasOwn(payload, 'type')) {
    if (!CRITERIA_TYPES.includes(payload.type)) {
      throw new ValidationError('Type harus benefit atau cost');
    }
    result.type = payload.type;
  }
  if (!partial || Object.hasOwn(payload, 'bobot')) {
    result.bobot = nonNegativeNumber(payload.bobot, 'Bobot');
  }

  return result;
}

function validateCriteriaRelationship(key, type) {
  const valid = (key === 'harga' && type === 'cost')
    || (['tangki', 'cc'].includes(key) && type === 'benefit');
  if (!valid) {
    throw new ValidationError(`Kombinasi key ${key} dan type ${type} tidak valid`);
  }
}

function validateSawIds(ids) {
  if (ids == null) return [];
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string' || !id.trim())) {
    throw new ValidationError('Field ids harus berupa array string');
  }
  return [...new Set(ids.map((id) => id.trim()))];
}

function validateBobotOverride(bobot, kriteriaList) {
  if (bobot == null) return {};
  if (typeof bobot !== 'object' || Array.isArray(bobot)) {
    throw new ValidationError('Field bobot harus berupa object');
  }

  const allowedKeys = new Set(kriteriaList.map((kriteria) => kriteria.key));
  const unknownKeys = Object.keys(bobot).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length) {
    throw new ValidationError(`Key bobot tidak dikenali: ${unknownKeys.join(', ')}`);
  }

  const result = {};
  for (const [key, value] of Object.entries(bobot)) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new ValidationError(`Bobot ${key} harus berupa angka positif`);
    }
    result[key] = value;
  }
  return result;
}

module.exports = {
  ValidationError,
  validateMotorInput,
  validateKriteriaInput,
  validateCriteriaRelationship,
  validateSawIds,
  validateBobotOverride,
};
