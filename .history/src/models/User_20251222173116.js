// src/models/User.js (VERSI FIREBASE)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    uid: { type: String, required: true, unique: true },
    role: { 
        type: String, 
        enum: ['admin', 'kasir', 'mekanik', 'customer'], 
        default: 'customer' 
    },
    currentSessionToken: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    department: { type: String, default: '-' } // Tambahkan field ini
}, { timestamps: true });
// HAPUS SEMUA HOOK DAN METHOD (Karena Firebase Auth yang mengatur password/hash)
// TIDAK ADA UserSchema.pre('save', ...);
// TIDAK ADA UserSchema.methods.matchPassword = ...;

module.exports = mongoose.model('User', UserSchema);