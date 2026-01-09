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
        // 1. Pastikan req.user ADA (sudah melewati protect)
        if (!req.user) {
            console.error("KRITIS: restrictTo dipanggil tanpa req.user. Redirecting to login.");
            return res.redirect('/login');
        }

        // 2. Cek apakah array roles yang diizinkan mencakup role user saat ini
        if (!roles.includes(req.user.role)) {
            console.warn(`Akses Ditolak: User ${req.user.email} dengan role ${req.user.role} mencoba mengakses rute terlarang.`);
            
            // Render halaman error 403 (Forbidden)
            return res.status(403).render('error/403', { 
                title: 'Akses Ditolak',
                // ... (data lain untuk view)
            });
        }
        
        // Lanjutkan jika peran diizinkan
        next(); 
    };
};
module.exports = { protect, restrictTo };