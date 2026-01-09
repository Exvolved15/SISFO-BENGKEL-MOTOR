const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({ success: false, message: 'Sesi berakhir' });
        }
        return res.redirect('/login');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) throw new Error();
        req.user = user;
        next();
    } catch (e) {
        res.clearCookie('token');
        return res.redirect('/login?err=invalid');
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).render('403', { title: 'Akses Ditolak' });
        }
        next();
    };
};

module.exports = { protect, restrictTo };