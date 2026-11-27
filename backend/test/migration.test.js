const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateMotor,
  validateKriteria,
  ensureUnique,
} = require('../scripts/migrate-mongo-to-postgres');

test('validasi dokumen motor untuk migrasi', () => {
  assert.deepStrictEqual(
    validateMotor({ id: ' A01 ', nama: ' Vario ', tipe: 'Matic', harga: 10000000, tangki: 5.5, cc: 125 }, 0),
    { id: 'A01', nama: 'Vario', tipe: 'Matic', harga: 10000000, tangki: 5.5, cc: 125 },
  );
});

test('migrasi menolak boolean dan string kosong pada angka', () => {
  const motor = { id: 'A01', nama: 'Vario', tipe: 'Matic', harga: 10000000, tangki: 5.5, cc: 125 };
  assert.throws(() => validateMotor({ ...motor, harga: true }, 0), /angka finite/);
  assert.throws(() => validateMotor({ ...motor, tangki: '' }, 0), /angka finite/);
});

test('migrasi menolak kombinasi kriteria yang salah', () => {
  assert.throws(
    () => validateKriteria({ id: 'C1', label: 'Harga', key: 'harga', type: 'benefit', bobot: 5 }, 0),
    /kombinasi key\/type/,
  );
});

test('migrasi mendeteksi ID duplikat', () => {
  assert.throws(() => ensureUnique([{ id: 'A01' }, { id: 'A01' }], 'id', 'ID motor'), /duplikat/);
});
