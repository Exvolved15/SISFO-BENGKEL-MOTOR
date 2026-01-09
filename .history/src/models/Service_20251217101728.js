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

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    code: { // Kode Suku Cadang (SKU)
        type: String,
        unique: true,
        required: true,
    },
    price: { // Harga jual
        type: Number,
        required: true,
        min: 0,
    },
    stock: { // Jumlah stok tersedia
        type: Number,
        default: 0,
        min: 0,
    },
    isPart: { // True jika ini suku cadang, False jika jasa (Service)
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;
