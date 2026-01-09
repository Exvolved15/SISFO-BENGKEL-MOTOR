// src/models/Service.js (Model Terpadu untuk Jasa dan Suku Cadang)
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Nama harus diisi'] 
    },
    code: { 
        type: String, 
        unique: true,
        required: [true, 'Kode harus diisi']
    },
    price: { 
        type: Number, 
        required: [true, 'Harga harus diisi'] 
    },
    stock: { 
        type: Number, 
        default: 0 
    },
    isPart: { 
        type: Boolean, 
        default: false 
    }
}, {
    timestamps: true 
});

// Pastikan menggunakan nama variabel 'serviceSchema' yang sudah didefinisikan di atas
module.exports = mongoose.model('Service', serviceSchema);