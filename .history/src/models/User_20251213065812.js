// sisfo-bengkel-baru/src/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // <-- HARUS ADA

const UserSchema = new mongoose.Schema({
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
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false // Agar password tidak ikut terbawa saat query find()
    },
    role: {
        type: String,
        enum: ['admin', 'kasir', 'mekanik'],
        default: 'kasir'
    }, // <--- Pastikan koma (,) ini ada di sini!
    
    // --- FIELD BARU UNTUK KONTROL SESI ---
    currentSessionToken: { 
        type: String,
        select: false 
    },
    lastLoginAt: {
        type: Date
    }
    // ------------------------------------
}, {
    timestamps: true 
});

// Middleware Mongoose: Enkripsi password sebelum disimpan (pada save/create)
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next(); // <--- KRITIS: Mencegah loop/kesalahan
    }
    try { // <-- Tambahkan try/catch di sekitar operasi async
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        // Jika ada error di sini (misalnya bcrypt gagal), Mongoose akan tahu.
        next(err); 
    }
});

// Metode untuk membandingkan password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);