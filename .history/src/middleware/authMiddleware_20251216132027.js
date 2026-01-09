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

        req.user = await User.findById(decoded.id); // <-- Hapus .select('-password') di sini! 
    // Atau jika ada field lain yang mau dihilangkan:
    // req.user = await User.findById(decoded.id).select('-uid'); 

    if (!req.user) {
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
        
        // --- LOG KRITIS (TAMBAHKAN INI) ---
        console.log('--- CHECK OTORISASI ---');
        console.log('User Role Ditemukan:', req.user ? req.user.role : 'NULL');
        console.log('Roles Diizinkan:', roles);
        console.log('-----------------------');
        // -----------------------------------
        
        // 1. Pastikan req.user ada (meskipun seharusnya sudah ditangani oleh protect)
        if (!req.user || !req.user.role) {
            console.error("KRITIS: User atau Role tidak terdefinisi di req.user.");
            return res.redirect('/login');
        }

        // 2. Cek apakah array roles yang diizinkan mencakup role user saat ini
        if (!roles.includes(req.user.role)) {
            console.warn(`AKSES DITOLAK (403): User ${req.user.role} mencoba rute ${req.originalUrl}.`);
            
            return res.status(403).render('error/403', { 
                title: 'Akses Ditolak',
                message: `Anda tidak memiliki izin (${req.user.role}) untuk mengakses sumber daya ini.`
            });
        }
        
        next(); 
    };
};
module.exports = { protect, restrictTo };