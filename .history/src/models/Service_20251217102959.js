// src/models/Service.js (Model Terpadu untuk Jasa dan Suku Cadang)

const mongoose = require('mongoose'); // HANYA SATU KALI IMPOR

const ServiceSchema = new mongoose.Schema({
    // --- FIELD UMUM ---
    name: { // serviceName (Jasa) atau name (Suku Cadang)
        type: String,
        required: [true, 'Nama item wajib diisi'],
        trim: true,
        unique: true
    },
    code: { // serviceCode (Jasa) atau code (Suku Cadang/SKU)
        type: String,
        required: [true, 'Kode wajib diisi'],
        unique: true,
        uppercase: true
    },
    description: {
        type: String,
        required: false,
    },
    price: { // Harga Jual
        type: Number,
        required: [true, 'Harga wajib diisi'],
        min: 0
    },

    // --- FIELD KHUSUS SUKU CADANG ---
    stock: { // Jumlah stok tersedia (Hanya relevan jika isPart: true)
        type: Number,
        default: 0,
        min: 0,
    },
    isPart: { // TRUE: Suku Cadang (memiliki stok), FALSE: Jasa/Layanan
        type: Boolean,
        default: true,
        required: true,
    }
}, {
    timestamps: true 
});

const Service = mongoose.model('Service', ServiceSchema);
module.exports = Service;