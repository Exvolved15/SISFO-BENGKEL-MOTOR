const mongoose = require('mongoose');

const motorSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Contoh: Honda Vario 150
    brand: { type: String, required: true }, // Contoh: Honda
    type: { type: String, enum: ['Matic', 'Bebek', 'Sport'], default: 'Matic' }
}, { timestamps: true });

module.exports = mongoose.model('Motor', motorSchema);