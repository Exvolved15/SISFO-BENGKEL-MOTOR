// sisfo-bengkel-baru/src/models/Transaction.js

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    // Nomor Transaksi (misalnya: INV-20251201-001)
    invoiceNumber: {
        type: String,
        unique: true,
        required: true
    },
    
    // Informasi Pelanggan dan Kendaraan
    customerName: {
        type: String,
        required: [true, 'Nama pelanggan wajib diisi'],
        trim: true
    },
    vehicleLicense: { // Plat Nomor
        type: String,
        required: [true, 'Plat nomor wajib diisi'],
        trim: true
    },
    
    // Total Pembayaran
    totalAmount: { // Total yang harus dibayar customer
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },

    status: { 
        type: String, 
        default: 'proses' // Default awal saat transaksi dibuat
    },

    grandTotal: { // Total setelah diskon
        type: Number,
        required: true,
        min: 0
    },

    // Metode Pembayaran (Cash/Transfer/Debit)
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Transfer', 'Debit'],
        default: 'Cash'
    },

    // Keterangan
    notes: {
        type: String,
        required: false
    }

}, {
    timestamps: true 
});

module.exports = mongoose.model('Transaction', TransactionSchema);