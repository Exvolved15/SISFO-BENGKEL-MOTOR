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
UserSchema.pre('save', async function (next) { // <--- PASTIKAN 'next' ADA SEBAGAI ARGUMEN
    if (!this.isModified('password')) {
        return next();
    }
    try {
        // Hashing password
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next(); // <--- next() dipanggil di sini, menandakan sukses
    } catch (err) {
        // Jika hashing gagal, teruskan error ke Mongoose
        next(err); 
    }
});

// Metode untuk membandingkan password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);