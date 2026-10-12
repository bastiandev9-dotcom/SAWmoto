const mongoose = require('mongoose');

const motorSchema = new mongoose.Schema({
  id: { type: String, required: [true, 'Field id wajib diisi'], unique: true, trim: true },
  nama: { type: String, required: [true, 'Field nama wajib diisi'], trim: true },
  tipe: { type: String, required: [true, 'Field tipe wajib diisi'], enum: { values: ['Matic', 'Moped', 'Sport'], message: 'Tipe harus salah satu dari: Matic, Moped, Sport' } },
  harga: { type: Number, required: [true, 'Field harga wajib diisi'], min: [0, 'Harga tidak boleh negatif'] },
  tangki: { type: Number, required: [true, 'Field tangki wajib diisi'], min: [0, 'Tangki tidak boleh negatif'] },
  cc: { type: Number, required: [true, 'Field cc wajib diisi'], min: [0, 'CC tidak boleh negatif'] },
}, { collection: 'motors' });

module.exports = mongoose.model('Motor', motorSchema);
