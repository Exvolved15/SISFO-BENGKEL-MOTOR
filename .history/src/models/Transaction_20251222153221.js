const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, default: 'Umum' },
    vehicleLicense: { type: String, required: true },
    mechanicId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    mechanicName: { type: String, default: 'Tanpa Mekanik' },
    // FIELD UTAMA UNTUK RIWAYAT
    totalAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 }, 
    paymentMethod: { type: String, enum: ['Cash', 'Transfer'], default: 'Cash' },
    notes: { type: String, default: '-' },
    status: { type: String, enum: ['proses', 'lunas'], default: 'lunas' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);