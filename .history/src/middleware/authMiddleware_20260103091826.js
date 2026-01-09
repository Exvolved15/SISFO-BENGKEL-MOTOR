// [LOKASI]: src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const protect = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Sesi Berakhir' });
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
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({ success: false, message: 'Invalid Token' });
        }
        return res.redirect('/login?err=invalid_token');
    }
};

module.exports = { protect };