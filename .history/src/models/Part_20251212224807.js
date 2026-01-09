// sisfo-bengkel-baru/src/models/Part.js

const mongoose = require('mongoose');

// Definisi Skema (Struktur Data) untuk Suku Cadang
const PartSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nama suku cadang wajib diisi'],
        trim: true,
        unique: true
    },
    code: { // Kode unik suku cadang (misalnya: SP-101)
        type: String,
        required: [true, 'Kode suku cadang wajib diisi'],
        unique: true,
        uppercase: true
    },
    stock: {
        type: Number,
        required: [true, 'Stok wajib diisi'],
        default: 0
    },
    purchasePrice: { // Harga Beli (Modal)
        type: Number,
        required: [true, 'Harga beli wajib diisi'],
        min: 0
    },
    sellingPrice: { // Harga Jual ke Pelanggan
        type: Number,
        required: [true, 'Harga jual wajib diisi'],
        min: 0
    },
    supplier: {
        type: String,
        trim: true
    }
}, {
    timestamps: true // Menambahkan createdAt dan updatedAt secara otomatis
});

// Ekspor Model agar bisa digunakan di Controller
module.exports = mongoose.model('Part', PartSchema);