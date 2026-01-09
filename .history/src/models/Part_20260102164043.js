// sisfo-bengkel-baru/src/models/Part.js

const mongoose = require('mongoose');

// Definisi Skema (Struktur Data) untuk Suku Cadang
const PartSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true },
    stock: { type: Number, required: true },
    purchasePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    supplier: { type: String },
    imageUrl: { type: String, default: '' } // <-- HARUS SAMA DENGAN DI SEEDER & EJS
}, { timestamps: true });

// Ekspor Model agar bisa digunakan di Controller
module.exports = mongoose.model('Part', PartSchema);