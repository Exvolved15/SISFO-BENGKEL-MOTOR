// sisfo-bengkel-baru/src/models/TransactionDetail.js

const mongoose = require('mongoose');

const TransactionDetailSchema = new mongoose.Schema({
    // FK ke Transaksi Utama (Header)
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },
    
    // Tipe Item: 'part' atau 'service'
    itemType: {
        type: String,
        enum: ['part', 'service'],
        required: true
    },

    // FK ke Part atau Service (dapat berupa salah satu)
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'itemType' // Referensi dinamis ke Model 'Part' atau 'Service'
    },
    
    // Data Item yang disimpan saat transaksi terjadi (untuk audit)
    itemName: {
        type: String,
        required: true
    },
    itemCode: {
        type: String,
        required: true
    },
    
    // Kuantitas & Harga
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    pricePerUnit: { // Harga jual saat transaksi terjadi
        type: Number,
        required: true,
        min: 0
    },
    subTotal: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('TransactionDetail', TransactionDetailSchema);