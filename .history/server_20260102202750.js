// [LOKASI]: server.js
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

const { syncToFirebase } = require('./src/utils/firebaseSync');

// 1. MONGOOSE PLUGIN SYNC FIREBASE
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

connectDB(); 
const User = require('./src/models/User');
const app = express();
const PORT = process.env.PORT || 5000;

// 2. MIDDLEWARE KEAMANAN (FIX CSP UNTUK GAMBAR)
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                "default-src": ["'self'"],
                "img-src": [
                    "'self'", 
                    "data:", 
                    "https://placehold.co", 
                    "https://ui-avatars.com", 
                    "https://images.unsplash.com",
                    "https://source.unsplash.com",
                    "https://*.googleusercontent.com"
                ],
                "script-src": [
                    "'self'", 
                    "'unsafe-inline'", 
                    "https://cdn.jsdelivr.net", 
                    "https://cdnjs.cloudflare.com",
                    "https://www.gstatic.com", 
                    "https://unpkg.com"
                ],
                "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
                "font-src": ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
                "connect-src": ["'self'", "http://localhost:5000", "https://*.googleapis.com", "https://*.firebasedatabase.app"],
            },
        },
        crossOriginEmbedderPolicy: false,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(expressLayouts); 
app.set('layout', './layouts/main'); 
app.set('view engine', 'ejs'); 

// 3. MIDDLEWARE SESSION & AUTH
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

// 4. DAFTAR ROUTES (SINKRON)
const { protect } = require('./src/middleware/authMiddleware');
const partRoutes = require('./src/routes/partRoutes'); 
const viewRoutes = require('./src/routes/viewRoutes');
const authViewRoutes = require('./src/routes/authViewRoutes');

app.use('/', authViewRoutes); 
app.use('/api/parts', protect, partRoutes); 
app.use('/', viewRoutes);

app.get('/about', (req, res) => {
    res.render('about', { title: 'Tentang Kami', activePage: 'about' });
});

app.use((req, res) => {
    res.status(404).render('404', { title: 'Not Found', activePage: 'error', user: res.locals.user });
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));

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
// 5. MIDDLEWARE GLOBAL (USER SESSION)
// ===================================
// 2. Middleware Audit Trail (Mencatat aktivitas User)
app.use((req, res, next) => {
    if (req.method !== 'GET' && req.user) {
        console.log(`[AUDIT] ${new Date().toLocaleString()} - ${req.user.name} (${req.user.role}): ${req.method} ${req.originalUrl}`);
    }
    next();
});

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
    } catch (err) {
        res.locals.user = null;
    }
    next();
});

// ===================================
// 6. PENDAFTARAN ROUTES
// ===================================
const { protect } = require('./src/middleware/authMiddleware');
const authRoutes = require('./src/routes/authRoutes'); 
const authViewRoutes = require('./src/routes/authViewRoutes');
const partRoutes = require('./src/routes/partRoutes'); 
const transactionRoutes = require('./src/routes/transactionRoutes'); 
const userRoutes = require('./src/routes/userRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes'); 
const jobRoutes = require('./src/routes/jobRoutes'); 
const viewRoutes = require('./src/routes/viewRoutes');
const mekanikViewRoutes = require('./src/routes/mekanikViewRoutes');

// Rute Auth
app.use('/', authViewRoutes); 
app.use('/api/auth', authRoutes);

// Rute Terproteksi API
// Pastikan rute ini ada agar POST /api/parts/add bisa diakses
app.use('/api/parts', protect, partRoutes); 
app.use('/api/services', protect, serviceRoutes); 
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/jobs', jobRoutes);

// Rute Tampilan (PENTING: Urutan ini menjamin navigasi Overview & Redirect Dashboard)
// viewRoutes akan menangani rute '/' untuk Overview dan '/dashboard-redirect'
app.use('/', viewRoutes);

// Fix Root Redirect Logic
//app.get('/', (req, res) => {
//    if (req.user) {
//        const role = req.user.role;
//        if (role === 'admin') return res.redirect('/admin/dashboard');
//        if (role === 'kasir') return res.redirect('/kasir/dashboard');
//        if (role === 'mekanik') return res.redirect('/mechanic/dashboard');
//        return res.redirect('/customer/dashboard');
//    }
//    res.render('index', { title: 'Overview Sisfo Bengkel', activePage: 'home' });
//});

app.get('/about', (req, res) => {
    res.render('about', { title: 'Tentang Kami', activePage: 'about' });
});

// Rute Terproteksi
app.use('/api/parts', protect, partRoutes); 
app.use('/api/services', protect, serviceRoutes); 
app.use('/api/transactions', transactionRoutes)
app.use('/api/users', protect, userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/', viewRoutes);
app.use('/', protect, mekanikViewRoutes);

app.use((req, res) => {
    res.status(404).render('404', { 
        title: 'Halaman Tidak Ditemukan', 
        activePage: 'error',
        user: res.locals.user 
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});