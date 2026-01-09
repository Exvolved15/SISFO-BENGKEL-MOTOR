// sisfo-bengkel-baru/src/middleware/authMiddleware.js


const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

// Middleware untuk melindungi rute yang membutuhkan login
const protect = async (req, res, next) => {
    let token;

    // 1. Ambil token dari Cookies
    if (req.cookies.token) {
        token = req.cookies.token;
    }
    
    // Jika token tidak ada, arahkan ke login
    if (!token) {
        return res.redirect('/login');
    }

    try {
        // 2. Verifikasi token JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Ambil user dari DB
        const user = await User.findById(decoded.id); // <--- FOKUS DI SINI
    
        if (!user) {
            // JIKA USER TIDAK DITEMUKAN, LOGOUT
            console.warn(`User ID ${decoded.id} tidak ditemukan di database. Logout.`);
            res.clearCookie('token'); 
            return res.redirect('/login'); // <--- INI YG MENYEBABKAN LOGOUT
        }
    
        // 4. (Logika Sesi Unik) ...
        // ... Jika sesi konflik, akan ada LOGOUT juga.
    
        // 5. Lampirkan user ke request
        req.user = user; 
        
        // 6. Lanjutkan ke middleware/controller berikutnya
        next();
    
    } catch (error) {
        // Blok catch menangani error JWT (Log out jika token rusak/kedaluwarsa)
        console.error('Token gagal diverifikasi:', error.message); 
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