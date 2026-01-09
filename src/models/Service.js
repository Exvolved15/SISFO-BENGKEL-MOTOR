// src/models/Service.js
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    description: { type: String, default: '' }, // TAMBAHKAN INI !
    isPart: { type: Boolean, default: false },
    stock: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);