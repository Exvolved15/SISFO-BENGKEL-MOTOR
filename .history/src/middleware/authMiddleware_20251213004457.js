// sisfo-bengkel-baru/src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

// Middleware untuk melindungi rute yang membutuhkan login
const protect = async (req, res, next) => {
    let token;

    // 1. Cek apakah token ada di cookie
    if (req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        // Jika tidak ada token, paksa redirect ke halaman login
        return res.redirect('/login');
    }

    try {
        // 2. Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Ambil user dari database (tanpa password)
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            // Token valid, tapi user sudah dihapus
            return res.redirect('/login');
        }

        // 4. Lanjut ke controller jika semua berhasil
        next();

    } catch (error) {
        console.error('Token gagal diverifikasi:', error);
        // Hapus cookie yang kadaluarsa/rusak
        res.clearCookie('token'); 
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