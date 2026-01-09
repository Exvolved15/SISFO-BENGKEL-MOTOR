const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Gunakan 'name' secara konsisten
    code: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    isPart: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);