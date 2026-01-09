// sisfo-bengkel-baru/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 


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
        
        // --- LOG KRITIS BARU ---
        console.log(`[AUTH] Token terverifikasi. Mencari User ID: ${decoded.id}`);
        // -----------------------
        
        const user = await User.findById(decoded.id); 
    
        if (!user) {
            console.warn(`[AUTH] GAGAL: User ID ${decoded.id} tidak ditemukan di DB. Logout.`);
            res.clearCookie('token'); 
            return res.redirect('/login');
        }
        
        // --- LOGIKA SESI UNIK (Anda harus punya ini jika Anda melihat session_conflict) ---
        if (user.currentSessionToken && user.currentSessionToken !== token) {
            // Tambahkan pengecekan: Jika token berbeda tetapi user baru saja login (< 5 detik lalu), 
            // izinkan untuk menghindari 'race condition' pada redirect login.
            const isRecentlyUpdated = (Date.now() - new Date(user.updatedAt).getTime()) < 5000;
        
            if (!isRecentlyUpdated) {
                console.warn(`[AUTH] GAGAL SESI: Token tidak cocok. User mungkin login di perangkat lain.`);
                res.clearCookie('token'); 
                return res.redirect('/login?err=session_conflict');
            }
            
            console.log(`[AUTH] Toleransi sesi aktif (Race Condition dihindari).`);
        }
        // ---------------------------------------------------------------------------------
    
        // Jika semua sukses:
        req.user = user; 
        console.log(`[AUTH] SUKSES. User ${user.email} (${user.role}) terlampir.`);
        next();
    
    } catch (error) {
        console.error('[AUTH] JWT GAGAL VERIFIKASI:', error.message); 
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

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            // Pastikan path ini benar sesuai file yang kita buat di langkah 1
            return res.status(403).render('error/403', { 
                title: 'Forbidden',
                user: req.user 
            });
        }
        next();
    };
};
module.exports = { protect, restrictTo };