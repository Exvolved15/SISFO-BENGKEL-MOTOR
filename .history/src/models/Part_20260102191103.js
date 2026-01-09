const mongoose = require('mongoose');

const PartSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    stock: { type: Number, required: true, default: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    supplier: { type: String, trim: true },
    imageUrl: { type: String, default: '' } 
}, { timestamps: true });

module.exports = mongoose.model('Part', PartSchema);