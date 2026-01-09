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
        // 2. Verifikasi token JWT (Secret kita)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Ambil user dari DB
        // Kita tidak perlu select('+currentSessionToken') di sini, 
        // karena kita asumsikan field itu sudah ada di Model Mongoose
        // dan tidak disembunyikan secara default.
        const user = await User.findById(decoded.id); 

        if (!user) {
            console.warn(`User ID ${decoded.id} tidak ditemukan di database.`);
            res.clearCookie('token'); 
            return res.redirect('/login');
        }

        // --- LOGIKA VERIFIKASI SESI UNIK (Opsional, tapi DIBIARKAN) ---
        // Catatan: Pastikan field currentSessionToken ada di model User
        if (user.currentSessionToken !== token) { 
            // Jika token di cookie TIDAK sama dengan token sesi yang terakhir disimpan di DB
            console.log(`Peringatan: Token lama digunakan oleh user ${user.email}. Menghapus cookie.`);
            res.clearCookie('token'); 
            return res.redirect('/login?session_conflict=true'); 
        }
        // ------------------------------------

        // 4. Lampirkan user ke request
        req.user = user; 
        
        // 5. Lanjutkan ke middleware/controller berikutnya
        next();

    } catch (error) {
        // Blok catch menangani error JWT (kedaluwarsa, tidak valid, dll.)
        console.error('Token gagal diverifikasi:', error.message); 
        res.clearCookie('token'); 
        return res.redirect('/login');
    }
    
    // TIDAK PERLU KODE LAGI DI SINI SETELAH CATCH
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