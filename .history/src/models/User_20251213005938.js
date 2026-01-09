// sisfo-bengkel-baru/src/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 

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
    }
    // --- FIELD BARU UNTUK KONTROL SESI ---
    currentSessionToken: { // Menyimpan token sesi aktif terakhir
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
        next();
    }
    // Hashing password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Metode untuk membandingkan password yang dimasukkan dengan hash di database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    // Fungsi ini akan dijalankan di Controller
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);