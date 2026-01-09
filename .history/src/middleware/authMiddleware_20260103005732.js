// [LOKASI]: src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const protect = async (req, res, next) => {
    let token;
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    
    if (!token) {
        // PERBAIKAN: Jika request adalah API, kirim JSON 401, bukan redirect HTML
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({ success: false, message: 'Sesi habis, silakan login kembali.' });
        }
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id); 
    
        if (!user) {
            res.clearCookie('token'); 
            if (req.originalUrl.startsWith('/api/')) {
                return res.status(401).json({ success: false, message: 'User tidak ditemukan.' });
            }
            return res.redirect('/login');
        }
        
        // Logika Sesi Unik
        if (user.currentSessionToken && user.currentSessionToken !== token) {
            const isRecentlyUpdated = (Date.now() - new Date(user.updatedAt).getTime()) < 5000;
            if (!isRecentlyUpdated) {
                res.clearCookie('token'); 
                if (req.originalUrl.startsWith('/api/')) {
                    return res.status(401).json({ success: false, message: 'Sesi conflict.' });
                }
                return res.redirect('/login?err=session_conflict');
            }
        }
    
        req.user = user; 
        next();
    
    } catch (error) {
        res.clearCookie('token'); 
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({ success: false, message: 'Token expired.' });
        }
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