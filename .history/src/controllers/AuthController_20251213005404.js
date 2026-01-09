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

// @deskripsi: Register user baru
// @rute: POST /api/auth/register
const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            // Jika user sudah terdaftar, kembalikan error spesifik
            return res.status(400).json({ 
                success: false,
                errors: { email: { message: 'Email sudah terdaftar.' } } 
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
        });

        // Jika berhasil (kita tidak butuh token saat register dari view)
        res.status(201).json({ success: true, message: 'Registrasi berhasil. Silakan Login.' });
        
    } catch (error) {
        // TANGKAP VALIDASI MONGOOSE ERROR
        if (error.name === 'ValidationError') {
            const errors = {};
            // Loop melalui errors Mongoose untuk mendapatkan pesan per field
            Object.keys(error.errors).forEach((key) => {
                errors[key] = { message: error.errors[key].message };
            });
            return res.status(400).json({ 
                success: false,
                errors: errors // Mengirimkan objek errors yang terstruktur
            });
        }

        res.status(500).json({ success: false, message: error.message });
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