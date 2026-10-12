const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Motor = require('../models/Motor');
const Kriteria = require('../models/Kriteria');

const motors = [
  { id: 'A01', nama: 'Vario 125', tipe: 'Matic', harga: 11550000, tangki: 5.5, cc: 125 },
  { id: 'A02', nama: 'Vario 150', tipe: 'Matic', harga: 18350000, tangki: 5.5, cc: 150 },
  { id: 'A03', nama: 'Spacy', tipe: 'Matic', harga: 14004000, tangki: 5.5, cc: 113 },
  { id: 'A04', nama: 'Beat Pop', tipe: 'Matic', harga: 15150000, tangki: 3.7, cc: 113 },
  { id: 'A05', nama: 'Scoopy', tipe: 'Matic', harga: 16800000, tangki: 3.7, cc: 113 },
  { id: 'A06', nama: 'PCX', tipe: 'Matic', harga: 39850000, tangki: 3.7, cc: 113 },
  { id: 'A07', nama: 'Revo', tipe: 'Moped', harga: 14850000, tangki: 3.7, cc: 113 },
  { id: 'A08', nama: 'Blade', tipe: 'Moped', harga: 15550000, tangki: 3.7, cc: 113 },
  { id: 'A09', nama: 'Supra V 125', tipe: 'Moped', harga: 17007000, tangki: 3.7, cc: 125 },
  { id: 'A10', nama: 'Supra GTR 150', tipe: 'Moped', harga: 21550000, tangki: 3.7, cc: 125 },
  { id: 'A11', nama: 'CBR 150', tipe: 'Sport', harga: 33450000, tangki: 13.7, cc: 150 },
  { id: 'A12', nama: 'CBR 250', tipe: 'Sport', harga: 68900000, tangki: 13.7, cc: 250 },
  { id: 'A13', nama: 'CB 150', tipe: 'Sport', harga: 25600000, tangki: 13, cc: 150 },
  { id: 'A14', nama: 'New Sonic 150', tipe: 'Sport', harga: 21400000, tangki: 3.7, cc: 150 },
  { id: 'A15', nama: 'Verza 150', tipe: 'Sport', harga: 19490000, tangki: 13.5, cc: 150 },
  { id: 'A16', nama: 'Mega Pro', tipe: 'Sport', harga: 21360000, tangki: 13.7, cc: 150 },
  { id: 'A17', nama: 'Vario 160', tipe: 'Matic', harga: 20000000, tangki: 6.5, cc: 160 },
];

const kriterias = [
  { id: 'C1', label: 'Harga', key: 'harga', type: 'cost', bobot: 5 },
  { id: 'C2', label: 'Kapasitas Tangki', key: 'tangki', type: 'benefit', bobot: 3 },
  { id: 'C3', label: 'Volume Silinder (CC)', key: 'cc', type: 'benefit', bobot: 4 },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sawmoto');
    await Promise.all([Motor.deleteMany({}), Kriteria.deleteMany({})]);
    await Motor.insertMany(motors);
    await Kriteria.insertMany(kriterias);
    console.log(`Seed selesai: ${motors.length} motor, ${kriterias.length} kriteria`);
  } catch (err) {
    console.error('Seed gagal:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
