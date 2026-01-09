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
const Part = require('./src/models/Part');
const Job = require('./src/models/Job');
const Transaction = require('./src/models/Transaction');

// --- TAMBAHKAN IMPORT ROUTES DI SINI ---
const { protect, restrictTo } = require('./src/middleware/authMiddleware');
const authRoutes = require('./src/routes/authRoutes'); 
const authViewRoutes = require('./src/routes/authViewRoutes');
const partRoutes = require('./src/routes/partRoutes'); 
const serviceRoutes = require('./src/routes/serviceRoutes'); 
const viewRoutes = require('./src/routes/viewRoutes');
const mekanikViewRoutes = require('./src/routes/mekanikViewRoutes');
// ---------------------------------------

// ==================================================================
// JEMBATAN SINKRONISASI REALTIME GLOBAL
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
                    "https://*.firebaseio.com", 
                    "https://*.firebasedatabase.app"
                ],
                "img-src": [
                    "'self'", 
                    "data:",
                    "https://*",
                     "http://*", 
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

// --- A. API (Hanya JSON) ---
app.use('/api/auth', authRoutes);
app.use('/api/parts', protect, partRoutes);
app.use('/api/services', protect, serviceRoutes);

// --- B. Tampilan Publik ---
app.use('/', authViewRoutes); 

// --- C. Tampilan Terproteksi ---

// ADMIN
app.use('/admin/dashboard', protect, async (req, res) => {
    try {
        const [users, parts] = await Promise.all([User.find({}), Part.find({})]);
        res.render('admin/dashboard', { title: 'Admin Dashboard', users, parts, activePage: 'dashboard' });
    } catch (e) { res.status(500).send("Error Admin Dashboard"); }
});

// MEKANIK
app.use('/mechanic/dashboard', protect, async (req, res) => {
    try {
        const jobs = await Job.find({ mechanic: req.user._id }).sort({ createdAt: -1 });
        res.render('mechanic/dashboard', { title: 'Mekanik Dashboard', jobs, activePage: 'dashboard' });
    } catch (e) { res.status(500).send("Error Mekanik Dashboard"); }
});

// --- DASHBOARD KASIR ---
app.use('/kasir/dashboard', protect, async (req, res) => {
    try {
        // Ambil data transaksi terbaru untuk Realtime Database view
        const transactions = await Transaction.find({}).sort({ createdAt: -1 }).limit(10);
        res.render('kasir/dashboard', { 
            title: 'Kasir Dashboard', 
            transactions, 
            activePage: 'dashboard',
            user: req.user
        });
    } catch (e) {
        res.status(500).send("Gagal memuat dashboard kasir");
    }
});

// CUSTOMER
app.use('/customer/dashboard', protect, async (req, res) => {
    try {
        const myJobs = await Job.find({ customer: req.user._id }).sort({ createdAt: -1 });
        res.render('customer/dashboard', { title: 'My Dashboard', myJobs, activePage: 'dashboard', user: req.user });
    } catch (e) { res.status(500).send("Error Customer Dashboard"); }
});

// LOGIKA REDIRECT BERDASARKAN ROLE (Sesuai views/kasir)
app.get('/', (req, res) => {
    if (req.cookies.token) {
        try {
            const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
            if (decoded.role === 'admin') return res.redirect('/admin/dashboard');
            if (decoded.role === 'mekanik') return res.redirect('/mechanic/dashboard');
            if (decoded.role === 'kasir') return res.redirect('/kasir/dashboard'); 
            return res.redirect('/customer/dashboard');
        } catch (e) { res.clearCookie('token'); }
    }
    res.render('index', { title: 'ACR Motor' });
});
// Handler 404 API
app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: 'API Endpoint tidak ditemukan' });
});

app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));