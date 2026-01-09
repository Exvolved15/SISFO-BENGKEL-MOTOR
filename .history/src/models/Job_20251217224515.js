// src/models/Job.js
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    jobTitle: { type: String, required: true },
    description: { type: String }, // Work To Do
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleLicense: { type: String, required: true },
    customer: {
        name: { type: String, required: true },
        phone: { type: String }
    },
    description: {
        type: String,
        required: false,
    },
    // Siapa yang ditugaskan (ID Mekanik dari koleksi User)
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: [true, 'Pekerjaan harus ditugaskan ke Mekanik.'],
    },
    // Kendaraan yang dikerjakan
    vehicleLicense: {
        type: String,
        required: [true, 'Nomor plat kendaraan harus dicatat.'],
    },
    dueDate: {
        type: Date,
    },
    // --- TAMBAHKAN KOMA DI SINI ---
    transactionDetails: [{
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
        name: String,
        price: Number,
        quantity: Number,
        subtotal: Number
    }],
    totalAmount: { 
        type: Number, 
        default: 0 
    },
    // Gunakan satu definisi status saja (disarankan huruf kecil sesuai logic controller)
    status: { 
        type: String, 
        enum: ['pending', 'in_progress', 'completed', 'cancelled'], 
        default: 'pending' 
    },
    completedAt: {
        type: Date
    }
}, { timestamps: true });

// FIX: Gunakan mongoose.model, bukan mongoose.器具
module.exports = mongoose.model('Job', JobSchema);