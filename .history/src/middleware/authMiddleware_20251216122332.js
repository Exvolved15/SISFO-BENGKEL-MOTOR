// src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const protect = async (req, res, next) => {
    let token;

    // 1. Ambil token dari Cookies (BUKAN dari Headers seperti API murni)
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    // Jika token tidak ada
    if (!token) {
        // Redirect ke login jika tidak ada token
        return res.redirect('/login'); 
    }

    try {
        // 2. Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Cari user berdasarkan ID dari token
        // Token JWT kita dibuat dengan { id: user._id } di verifyToken
        req.user = await User.findById(decoded.id).select('-password'); 

        if (!req.user) {
            // Jika token valid tapi user tidak ada di DB (kasus jarang)
            return res.redirect('/login'); 
        }

        next(); // Lanjutkan ke rute yang diminta

    } catch (error) {
        console.error('Error verifikasi token JWT:', error);
        // Hapus cookie yang rusak
        res.clearCookie('token'); 
        // Arahkan ke login jika token kadaluarsa atau tidak valid
        return res.redirect('/login'); 
    }
};

// Middleware untuk membatasi peran (misal: hanya Admin)
const restrictTo = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            // Jika user tidak memiliki peran yang sesuai
            return res.status(403).send('Akses Ditolak: Anda tidak memiliki izin.');
        }
        next();
    };
};

module.exports = { protect, restrictTo };