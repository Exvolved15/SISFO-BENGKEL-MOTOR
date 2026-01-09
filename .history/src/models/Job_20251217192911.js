// src/models/Job.js

const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    jobTitle: {
        type: String,
        required: [true, 'Nama pekerjaan harus diisi'],
        trim: true,
    },
    description: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending',
    },
    // Siapa yang ditugaskan (ID Mekanik dari koleksi User)
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: [true, 'Pekerjaan harus ditugaskan ke Mekanik.'],
    },
    // Kendaraan yang dikerjakan (bisa disambungkan ke field di Transaksi)
    vehicleLicense: {
        type: String,
        required: [true, 'Nomor plat kendaraan harus dicatat.'],
    },
    // Tanggal target selesai (opsional)
    dueDate: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
    transactionDetails: [{
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
        name: String,
        price: Number,
        quantity: Number,
        subtotal: Number
    }],
    totalAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    completedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);