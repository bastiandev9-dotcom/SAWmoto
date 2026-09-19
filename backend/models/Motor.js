const mongoose = require('mongoose');

const motorSchema = new mongoose.Schema({
  id: String, 
  nama: String,
  tipe: String,
  harga: Number,
  tangki: Number,
  cc: Number
}, { collection: 'motors' });  

module.exports = mongoose.model('Motor', motorSchema);