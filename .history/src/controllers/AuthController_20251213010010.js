// sisfo-bengkel-baru/src/controllers/AuthController.js

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Fungsi untuk membuat JWT (JSON Web Token)
const generateToken = (id) => {
    // Ambil secret dari .env (akan kita buat di Langkah 21.4)
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Token kadaluarsa dalam 1 jam
    });
};

// @deskripsi: Otentikasi user dan dapatkan token (Login)
// @rute: POST /api/auth/login
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Ambil user, termasuk password dan currentSessionToken
    const user = await User.findOne({ email }).select('+password +currentSessionToken'); 

    if (user && (await user.matchPassword(password))) {
        
        // --- LOGIKA KONTROL SESI ---
        const newToken = generateToken(user._id);
        const oldToken = user.currentSessionToken;

        // Update data sesi user di database
        await User.findByIdAndUpdate(user._id, {
            currentSessionToken: newToken,
            lastLoginAt: new Date()
        });
        // --------------------------

        // Atur token baru di cookie
        res.cookie('token', newToken, {
            httpOnly: true, 
            maxAge: 3600000, 
        });
        
        // Kirim respons JSON (untuk API)
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: newToken, 
            // Tambahkan notifikasi sesi lama di respons (hanya jika ada token lama)
            sessionConflict: oldToken && (oldToken !== user.currentSessionToken)
        });
    } else {
        res.status(401).json({ message: 'Email atau password salah' });
    }
};
// @deskripsi: Otentikasi user dan dapatkan token (Login)
// @rute: POST /api/auth/login
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Tambahkan .select('+password') untuk mengambil field password (yang disembunyikan)
    const user = await User.findOne({ email }).select('+password'); 

    if (user && (await user.matchPassword(password))) {
        
        // Atur token di cookie (untuk View/Browser)
        res.cookie('token', generateToken(user._id), {
            httpOnly: true, // Tidak bisa diakses oleh JavaScript client
            maxAge: 3600000, // 1 jam
            // secure: process.env.NODE_ENV === 'production' ? true : false,
        });
        
        // Kirim respons JSON (untuk API)
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id), // Juga kirim token di body
        });
    } else {
        res.status(401).json({ message: 'Email atau password salah' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};