// sisfo-bengkel-baru/src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

// Middleware untuk melindungi rute yang membutuhkan login
const protect = async (req, res, next) => {
    let token;

    if (req.cookies.token) {
        token = req.cookies.token;
    }
    
    if (!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Ambil user, termasuk field sesi yang baru
        const user = await User.findById(decoded.id).select('-password +currentSessionToken');

        if (!user) {
            res.clearCookie('token'); 
            return res.redirect('/login');
        }

        // --- LOGIKA VERIFIKASI SESI UNIK ---
        if (user.currentSessionToken !== token) {
            console.log(`Peringatan: Token lama digunakan oleh user ${user.email}`);
            res.clearCookie('token'); // Hapus cookie lama
            // Redirect ke login dengan pesan khusus
            return res.redirect('/login?session_conflict=true'); 
        }
        // ------------------------------------

        req.user = user;
        next();

    } catch (error) {
        console.error('Token gagal diverifikasi:', error);
        res.clearCookie('token'); 
        return res.redirect('/login');
    }
};

// Middleware untuk membatasi peran (misal: hanya Admin)
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // req.user harus ada karena sudah melewati middleware protect
        if (!roles.includes(req.user.role)) {
            // Arahkan ke dashboard jika tidak punya izin
            return res.status(403).render('error/403', { 
                title: 'Akses Ditolak',
                message: 'Anda tidak memiliki izin untuk mengakses halaman ini.'
            });
        }
        next(); // Lanjutkan
    };
};
module.exports = { protect, restrictTo };