const test = require('node:test');
const assert = require('node:assert');
const { hitungSAW } = require('../lib/saw');

const kriteria = [
  { key: 'harga', type: 'cost', bobot: 1 },
  { key: 'cc', type: 'benefit', bobot: 1 },
];
const motors = [
  { id: 'A', harga: 100, cc: 5 },
  { id: 'B', harga: 200, cc: 20 },
];

test('normalisasi cost & benefit + urutan peringkat', () => {
  const r = hitungSAW(motors, kriteria);
  const [a, b] = r;
  assert.strictEqual(a.id, 'B');
  assert.strictEqual(b.id, 'A');
  assert.strictEqual(a.r_harga, 0.5); // cost: min/x
  assert.strictEqual(b.r_harga, 1);
  assert.strictEqual(a.r_cc, 1); // benefit: x/max
  assert.strictEqual(b.r_cc, 0.25);
  assert.strictEqual(a.rank, 1);
  assert.strictEqual(b.rank, 2);
  assert.strictEqual(a.vi, 1.5);
  assert.strictEqual(b.vi, 1.25);
});

test('bobot override mengubah pemenang', () => {
  const r = hitungSAW(motors, kriteria, { harga: 10 });
  assert.strictEqual(r[0].id, 'A');
  assert.strictEqual(r[0].w_harga, 10);
  assert.strictEqual(r[0].w_cc, 1); // tak di-override
});

test('guard bagi nol: benefit semua 0 -> r=0, tak NaN', () => {
  const r = hitungSAW([{ id: 'A', harga: 100, cc: 0 }, { id: 'B', harga: 200, cc: 0 }], kriteria);
  assert.ok(r.every(m => Number.isFinite(m.vi)));
  assert.strictEqual(r[0].r_cc, 0);
});

test('input kosong -> array kosong', () => {
  assert.deepStrictEqual(hitungSAW([], kriteria), []);
  assert.deepStrictEqual(hitungSAW(motors, []), []);
});
