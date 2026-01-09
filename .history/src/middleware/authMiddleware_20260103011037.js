// [LOKASI]: src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const protect = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        // Jika request API, kirim JSON. Jika halaman, redirect ke login.
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) throw new Error('User not found');
        
        req.user = user;
        next();
    } catch (error) {
        res.clearCookie('token');
        return res.redirect('/login?err=invalid_token');
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