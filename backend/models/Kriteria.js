const mongoose = require('mongoose');

const kriteriaSchema = new mongoose.Schema({
  id: { type: String, required: [true, 'Field id wajib diisi'], unique: true, trim: true },
  label: { type: String, required: [true, 'Field label wajib diisi'], trim: true },
  key: { type: String, required: [true, 'Field key wajib diisi'], unique: true, trim: true },
  type: { type: String, required: [true, 'Field type wajib diisi'], enum: { values: ['benefit', 'cost'], message: 'Type harus benefit atau cost' } },
  bobot: { type: Number, required: [true, 'Field bobot wajib diisi'], min: [0, 'Bobot tidak boleh negatif'] },
}, { collection: 'kriterias' });

module.exports = mongoose.model('Kriteria', kriteriaSchema);
