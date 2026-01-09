// sisfo-bengkel-baru/src/models/Service.js

const mongoose = require('mongoose');

// Definisi Skema untuk Jasa Servis
const ServiceSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: [true, 'Nama jasa wajib diisi'],
        trim: true,
        unique: true
    },
    serviceCode: { // Kode unik jasa (misalnya: SVC-001)
        type: String,
        required: [true, 'Kode jasa wajib diisi'],
        unique: true,
        uppercase: true
    },
    description: {
        type: String,
        required: false,
    },
    price: { // Harga Jasa
        type: Number,
        required: [true, 'Harga jasa wajib diisi'],
        min: 0
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('Service', ServiceSchema);