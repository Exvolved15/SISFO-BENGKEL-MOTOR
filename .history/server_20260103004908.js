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
        hsts: false // PENTING: Matikan paksaan HTTPS di localhost
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

// 6. PENDAFTARAN ROUTES (FIXED ORDER)
// ===================================
const { protect } = require('./src/middleware/authMiddleware');

// Import semua router
const authRoutes = require('./src/routes/authRoutes'); 
const authViewRoutes = require('./src/routes/authViewRoutes');
const partRoutes = require('./src/routes/partRoutes'); 
const transactionRoutes = require('./src/routes/transactionRoutes'); 
const userRoutes = require('./src/routes/userRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes'); 
const jobRoutes = require('./src/routes/jobRoutes'); 
const viewRoutes = require('./src/routes/viewRoutes');
const mekanikViewRoutes = require('./src/routes/mekanikViewRoutes');

// --- TAHAP 1: API ROUTES (Paling Atas) ---
// Daftarkan API dulu agar tidak "tertelan" oleh rute visual '/'
app.use('/api/auth', authRoutes); // Menangani POST /api/auth/login
app.use('/api/parts', protect, partRoutes); 
app.use('/api/services', protect, serviceRoutes); 
app.use('/api/transactions', protect, transactionRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/jobs', protect, jobRoutes);

// --- TAHAP 2: VIEW ROUTES (Bawah API) ---
// Rute untuk menampilkan halaman (HTML)
app.use('/', authViewRoutes); // Menangani GET /login

app.get('/about', (req, res) => {
    res.render('about', { title: 'Tentang Kami', activePage: 'about' });
});

// Landing Page / Overview
app.use('/', viewRoutes); 

// Mekanik Dashboard Terproteksi
app.use('/', protect, mekanikViewRoutes);

// --- TAHAP 3: API 404 HANDLER ---
// Jika ada request /api/ yang salah, kirim JSON bukan HTML 404
app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint API tidak ditemukan' });
});

app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));