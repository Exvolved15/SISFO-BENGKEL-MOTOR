require('dotenv').config(); 
const mongoose = require('mongoose');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const connectDB = require('./src/config/db'); 
const { syncToFirebase } = require('./src/utils/firebaseSync');

connectDB(); 
const User = require('./src/models/User');
const app = express();
const PORT = process.env.PORT || 5000;

// ===================================
// MIDDLEWARE KEAMANAN (HELMET CSP)
// ===================================
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                "default-src": ["'self'"],
                "img-src": ["'self'", "data:", "https://ui-avatars.com"], // 'self' mengizinkan folder public
                "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://www.gstatic.com"],
                "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
                "font-src": ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
                "connect-src": ["'self'", "https://*.firebasedatabase.app"]
            },
        },
        crossOriginEmbedderPolicy: false
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());

// PENTING: Pendaftaran Folder Statis
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(expressLayouts); 
app.set('layout', './layouts/main'); 
app.set('view engine', 'ejs'); 

// MIDDLEWARE AUTH & AUDIT
app.use(async (req, res, next) => {
    res.locals.user = null;
    try {
        const token = req.cookies.token || req.cookies.jwt;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const currentUser = await User.findById(decoded.id);
            if (currentUser) {
                req.user = currentUser;
                res.locals.user = currentUser;
            }
        }
    } catch (err) { res.locals.user = null; }
    next();
});

// PENDAFTARAN ROUTES
const { protect } = require('./src/middleware/authMiddleware');
const partRoutes = require('./src/routes/partRoutes'); 
const viewRoutes = require('./src/routes/viewRoutes');
const authViewRoutes = require('./src/routes/authViewRoutes');

app.use('/', authViewRoutes); 
app.use('/api/parts', protect, partRoutes); 
app.use('/', protect, viewRoutes);

app.use((req, res) => {
    res.status(404).render('404', { title: '404', activePage: 'error', user: res.locals.user });
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));