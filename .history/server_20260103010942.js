// [LOKASI]: server.js
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

// 1. IMPORT UTILITY & MODELS
const { syncToFirebase } = require('./src/utils/firebaseSync');
connectDB(); 
const User = require('./src/models/User');

// --- TAMBAHKAN IMPORT ROUTES DI SINI ---
const { protect } = require('./src/middleware/authMiddleware');
const authRoutes = require('./src/routes/authRoutes'); 
const authViewRoutes = require('./src/routes/authViewRoutes');
const partRoutes = require('./src/routes/partRoutes'); 
const serviceRoutes = require('./src/routes/serviceRoutes'); 
const viewRoutes = require('./src/routes/viewRoutes');
const mekanikViewRoutes = require('./src/routes/mekanikViewRoutes');
// ---------------------------------------

// ==================================================================
// 2. PASANG MONGOOSE PLUGIN (SINKRONISASI FIREBASE)
// ==================================================================
mongoose.plugin((schema) => {
    schema.post('save', function(doc) {
        const collection = this.constructor.modelName.toLowerCase();
        syncToFirebase(collection, doc);
    });
    schema.post('findOneAndUpdate', function(doc) {
        if (doc) {
            const collection = doc.constructor.modelName.toLowerCase();
            syncToFirebase(collection, doc);
        }
    });
});

const app = express();
const PORT = process.env.PORT || 5000;

// ===================================
// 3. MIDDLEWARE KEAMANAN (FIX SSL & CSP)
// ===================================
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                "default-src": ["'self'"],
                "script-src": [
                    "'self'", 
                    "'unsafe-inline'", 
                    "https://cdn.jsdelivr.net", 
                    "https://cdnjs.cloudflare.com",
                    "https://www.gstatic.com"
                ],
                "connect-src": [
                    "'self'", 
                    "http://localhost:5000", 
                    "http://127.0.0.1:5000", 
                    "https://cdn.jsdelivr.net",
                    "https://*.googleapis.com", 
                    "https://*.firebasedatabase.app"
                ],
                "img-src": [
                    "'self'", 
                    "data:", 
                    "https://placehold.co", 
                    "https://ui-avatars.com", 
                    "https://*.unsplash.com"
                ],
                "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
                "font-src": ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            },
        },
        crossOriginEmbedderPolicy: false,
        hsts: false 
    })
);

// ===================================
// 4. SETTINGS & STATIC FILES
// ===================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(expressLayouts); 
app.set('layout', './layouts/main'); 
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));

// ===================================
// 5. MIDDLEWARE GLOBAL (SESSION)
// ===================================
app.use(async (req, res, next) => {
    res.locals.user = null;
    res.locals.activePage = ''; 
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

// ===================================
// 6. PENDAFTARAN ROUTES (FIXED ORDER)
// ===================================

// --- A. API (Prioritas 1) ---
app.use('/api/auth', authRoutes);
app.use('/api/parts', protect, partRoutes);

// --- B. Tampilan Publik (Prioritas 2) ---
app.use('/', authViewRoutes); // Menangani /login dan /register

// --- C. Tampilan Terproteksi/Dashboard (Prioritas 3) ---
// Gunakan path spesifik atau pastikan viewRoutes tidak bentrok dengan /login
app.use('/dashboard', protect, viewRoutes); 
app.use('/mechanic', protect, mekanikViewRoutes);

// Rute Overview (Beranda)
app.get('/', (req, res) => {
    if (req.cookies.token) return res.redirect('/dashboard'); // Jika sudah login, lempar ke dashboard
    res.render('index', { title: 'ACR Motor' });
});

app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));