// [LOKASI]: src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const protect = async (req, res, next) => {
    let token;
    // Pastikan req.cookies sudah diproses oleh cookie-parser
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    
    if (!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`[AUTH] Token terverifikasi. User ID: ${decoded.id}`);
        
        const user = await User.findById(decoded.id); 
    
        if (!user) {
            console.warn(`[AUTH] GAGAL: User ID ${decoded.id} tidak ada di DB.`);
            res.clearCookie('token'); 
            return res.redirect('/login');
        }
        
        // Logika Sesi Unik & Toleransi Race Condition
        if (user.currentSessionToken && user.currentSessionToken !== token) {
            const isRecentlyUpdated = (Date.now() - new Date(user.updatedAt).getTime()) < 5000;
            if (!isRecentlyUpdated) {
                console.warn(`[AUTH] GAGAL SESI: Token tidak cocok.`);
                res.clearCookie('token'); 
                return res.redirect('/login?err=session_conflict');
            }
            console.log(`[AUTH] Toleransi sesi aktif.`);
        }
    
        req.user = user; 
        console.log(`[AUTH] SUKSES: ${user.email} (${user.role})`);
        next();
    
    } catch (error) {
        console.error('[AUTH] JWT GAGAL:', error.message); 
        res.clearCookie('token'); 
        return res.redirect('/login');
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        console.log('--- CHECK OTORISASI ---');
        console.log('User Role:', req.user ? req.user.role : 'NULL');
        console.log('Allowed Roles:', roles);
        
        if (!req.user || !req.user.role) {
            return res.redirect('/login');
        }

        if (!roles.includes(req.user.role)) {
            console.warn(`AKSES DITOLAK (403): ${req.user.role} -> ${req.originalUrl}`);
            return res.status(403).render('error/403', { 
                title: 'Akses Ditolak',
                user: req.user,
                message: `Anda tidak memiliki izin (${req.user.role}) untuk mengakses rute ini.`
            });
        }
        next(); 
    };
};

module.exports = { protect, restrictTo };