const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateMotorInput,
  validateKriteriaInput,
  validateCriteriaRelationship,
  validateSawIds,
  validateBobotOverride,
} = require('../lib/validation');

const motor = {
  id: 'A01',
  nama: 'Vario',
  tipe: 'Matic',
  harga: 10000000,
  tangki: 5.5,
  cc: 125,
};

test('validasi motor valid dan trim string', () => {
  assert.deepStrictEqual(validateMotorInput({ ...motor, id: ' A01 ', nama: ' Vario ' }), motor);
});

test('validasi motor menolak field asing dan angka negatif', () => {
  assert.throws(() => validateMotorInput({ ...motor, admin: true }), /tidak dikenali/);
  assert.throws(() => validateMotorInput({ ...motor, harga: -1 }), /tidak boleh negatif/);
  assert.throws(() => validateMotorInput({ ...motor, harga: 1.5 }), /bilangan bulat/);
});

test('validasi kriteria menegakkan kombinasi key dan type', () => {
  const valid = { id: 'C1', label: 'Harga', key: 'harga', type: 'cost', bobot: 5 };
  assert.deepStrictEqual(validateKriteriaInput(valid), valid);
  assert.throws(
    () => validateCriteriaRelationship('harga', 'benefit'),
    /tidak valid/,
  );
  assert.throws(
    () => validateKriteriaInput({ ...valid, key: 'lainnya' }),
    /Key kriteria/,
  );
});

test('validasi subset SAW menyingkirkan duplikat', () => {
  assert.deepStrictEqual(validateSawIds(['A01', 'A01', ' A02 ']), ['A01', 'A02']);
  assert.throws(() => validateSawIds('A01'), /array string/);
});

test('validasi bobot override menolak key asing dan nol', () => {
  const kriteria = [{ key: 'harga' }, { key: 'cc' }];
  assert.deepStrictEqual(validateBobotOverride({ harga: 10 }, kriteria), { harga: 10 });
  assert.throws(() => validateBobotOverride({ tangki: 2 }, kriteria), /tidak dikenali/);
  assert.throws(() => validateBobotOverride({ harga: 0 }, kriteria), /positif/);
});
