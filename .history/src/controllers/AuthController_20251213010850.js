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

// @deskripsi: Register user baru (Hanya untuk Admin di masa depan, tapi sekarang bebas)
// @rute: POST /api/auth/register
const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User sudah terdaftar' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
        });

        if (user) {
            // Kita tidak mengirim password, jadi harus query ulang tanpa select: false
            const userWithoutPassword = await User.findById(user._id).select('-password');
            
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Data user tidak valid' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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

// @deskripsi: Mengambil semua user (Hanya untuk Admin)
// @rute: GET /api/auth/users
const getAllUsers = async (req, res) => {
    try {
        // Ambil semua user, kecuali password dan token sesi
        const users = await User.find({}).select('-password -currentSessionToken'); 
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


module.exports = {
    registerUser,
    loginUser,
};