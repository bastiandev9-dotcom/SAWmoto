const mongoose = require('mongoose');

const kriteriaSchema = new mongoose.Schema({
  id: String,
  label: String,
  key: String,
  type: String,
  bobot: Number
}, { collection: 'kriterias' });  

module.exports = mongoose.model('Kriteria', kriteriaSchema);