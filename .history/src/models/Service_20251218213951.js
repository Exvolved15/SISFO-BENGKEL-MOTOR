// src/models/Service.js
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true }, 
    code: { type: String, required: true, unique: true }, // Gunakan 'code' secara konsisten
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    isPart: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);