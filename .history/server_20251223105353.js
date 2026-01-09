require('dotenv').config(); 
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const connectDB = require('./src/config/db'); 
const User = require('./src/models/User');

// Import Middleware Otorisasi
const { protect, restrictTo } = require('./src/middleware/authMiddleware');

// Import Routes
const partRoutes = require('./src/routes/partRoutes'); 
const transactionRoutes = require('./src/routes/transactionRoutes'); 
const userRoutes = require('./src/routes/userRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes'); 
const jobRoutes = require('./src/routes/jobRoutes'); 
const authRoutes = require('./src/routes/authRoutes'); 
const viewRoutes = require('./src/routes/viewRoutes');
const authViewRoutes = require('./src/routes/authViewRoutes');
const mekanikViewRoutes = require('./src/routes/mekanikViewRoutes');

// Hubungkan ke Database
connectDB(); 

const app = express();
const PORT = process.env.PORT || 5000;

// ===================================
// MIDDLEWARE DASAR & KEAMANAN
// ===================================
// [LOKASI]: server.js
// [LOKASI]: server.js
app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "script-src": [
            "'self'", 
            "'unsafe-inline'", 
            "https://cdn.jsdelivr.net", 
            "https://www.gstatic.com", 
            "https://www.firebasejs.com",
            "https://maps.googleapis.com",
            "https://maps.google.com"
          ],
          "script-src-attr": ["'unsafe-inline'"],
          "connect-src": [
            "'self'", 
            "http://localhost:5000",
            "http://127.0.0.1:5000", 
            "https://cdn.jsdelivr.net", 
            "https://identitytoolkit.googleapis.com",
            "https://securetoken.googleapis.com",
            "https://*.googleapis.com",
            "https://www.gstatic.com", 
            "https://firebase.googleapis.com"
          ],
          // IZINKAN FRAME UNTUK GOOGLE MAPS
          "frame-src": [
            "'self'", 
            "https://www.google.com", 
            "https://www.google.co.id", 
            "https://maps.google.com"
          ],
          // UPDATE IMG-SRC UNTUK TILES PETA
          "img-src": [
            "'self'", 
            "data:", 
            "https://www.gstatic.com", 
            "https://*.googleapis.com", 
            "https://*.gstatic.com", 
            "https://*.google.com", 
            "https://*.google.co.id",
            "https://*.googleusercontent.com"
          ],
          "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
          "font-src": ["'self'", "https://fonts.gstatic.com"],
        },
      },
      crossOriginEmbedderPolicy: false 
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===================================
// KONFIGURASI VIEW ENGINE (EJS)
// ===================================
app.use(expressLayouts); 
app.set('layout', './layouts/main'); 
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));

// ===================================
// MIDDLEWARE GLOBAL (SINKRONISASI USER)
// ===================================
app.use(async (req, res, next) => {
    res.locals.user = null;
    res.locals.activePage = ''; // Mencegah ReferenceError di Navbar
    try {
        const token = req.cookies.token || req.cookies.jwt;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const currentUser = await User.findById(decoded.id);
            if (currentUser) {
                req.user = currentUser;
                res.locals.user = currentUser; // Tersedia untuk EJS
            }
        }
    } catch (err) {
        res.locals.user = null;
    }
    next();
});

// ===================================
// PENDAFTARAN ROUTES
// ===================================

// 1. Rute Publik (Tanpa protect agar Overview & About bisa diakses semua orang)
app.use('/', authViewRoutes); 
app.use('/api/auth', authRoutes);

// Halaman Utama / Overview (Logika Redirect Otomatis ke Dashboard jika sudah Login)
app.get('/', (req, res) => {
    if (req.user) {
        const role = req.user.role;
        console.log(`User ${req.user.email} login dengan role: ${role}`);
        
        if (role === 'admin') return res.redirect('/admin/dashboard');
        if (role === 'kasir') return res.redirect('/kasir/dashboard');
        if (role === 'mekanik') return res.redirect('/mechanic/dashboard');
        return res.redirect('/customer/dashboard');
    }
    // Jika tidak ada user login, tampilkan landing page publik
    res.render('index', { title: 'Overview Sisfo Bengkel', activePage: 'home' });
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'Tentang Kami', activePage: 'about' });
});

// 2. Rute Terproteksi (Semua rute di bawah ini Wajib Login)
app.use('/api/parts', protect, partRoutes); 
app.use('/api/services', protect, serviceRoutes); 
app.use('/api/transactions', protect, transactionRoutes); 
app.use('/api/users', protect, userRoutes);
app.use('/api/jobs', protect, jobRoutes);

app.use('/', protect, viewRoutes);
app.use('/', protect, mekanikViewRoutes);

// ===================================
// ERROR HANDLING
// ===================================

// Handle 404
app.use((req, res) => {
    res.status(404);
    res.render('404', { 
        title: 'Halaman Tidak Ditemukan', 
        activePage: 'error',
        user: res.locals.user 
    });
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});