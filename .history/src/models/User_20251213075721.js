// src/models/User.js (VERSI FIREBASE)

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    uid: { // UID dari Firebase
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    role: {
        type: String,
        enum: ['admin', 'kasir', 'mekanik'],
        default: 'kasir'
    }
}, {
    timestamps: true 
});

// HAPUS SEMUA HOOK DAN METHOD (Karena Firebase Auth yang mengatur password/hash)
// TIDAK ADA UserSchema.pre('save', ...);
// TIDAK ADA UserSchema.methods.matchPassword = ...;

module.exports = mongoose.model('User', UserSchema);