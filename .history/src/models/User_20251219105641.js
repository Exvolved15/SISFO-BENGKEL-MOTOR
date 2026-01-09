// src/models/User.js (VERSI FIREBASE)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: [true, 'Nama wajib diisi']
    },
    email: {
        type: String,
        required: [true, 'Email wajib diisi'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Mohon isi email yang valid'
        ]
    },
    role: {
        type: String,
        // PERBAIKAN DISINI: Tambahkan 'user' ke dalam array enum
        enum: ['admin', 'kasir', 'mekanik', 'user'], 
        default: 'user'
    },
    currentSessionToken: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// HAPUS SEMUA HOOK DAN METHOD (Karena Firebase Auth yang mengatur password/hash)
// TIDAK ADA UserSchema.pre('save', ...);
// TIDAK ADA UserSchema.methods.matchPassword = ...;

module.exports = mongoose.model('User', UserSchema);