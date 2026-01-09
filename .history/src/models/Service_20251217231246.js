// src/models/Service.js (Model Terpadu untuk Jasa dan Suku Cadang)

const mongoose = require('mongoose'); // HANYA SATU KALI IMPOR

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, unique: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    isPart: { type: Boolean, default: false }
}, {
    timestamps: true 
});

const Service = mongoose.model('Service', ServiceSchema);
module.exports = Service;