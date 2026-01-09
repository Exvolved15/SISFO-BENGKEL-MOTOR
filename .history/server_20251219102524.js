require('dotenv').config(); 
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const connectDB = require('./src/config/db'); 

// Import Middleware Otorisasi
const { protect, restrictTo } = require('./src/middleware/authMiddleware');

// Import Routes API
const partRoutes = require('./src/routes/partRoutes'); 
const transactionRoutes = require('./src/routes/transactionRoutes'); 
const userRoutes = require('./src/routes/userRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes'); 
const jobRoutes = require('./src/routes/jobRoutes'); 
const authRoutes = require('./src/routes/authRoutes');

// Import Routes View (Tampilan)
const viewRoutes = require('./src/routes/viewRoutes');
const authRoutes = require('./src/routes/authRoutes');
const authViewRoutes = require('./src/routes/authViewRoutes');
const mekanikViewRoutes = require('./src/routes/mekanikViewRoutes');

// Hubungkan ke Database
connectDB(); 

const app = express();
const PORT = process.env.PORT || 5000;

// ===================================
// MIDDLEWARE KEAMANAN (VERSI LONGGAR/STABIL)
// ===================================
app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "script-src": [
            "'self'", 
            "'unsafe-inline'", // Mengizinkan script di dalam EJS
            "https://cdn.jsdelivr.net", 
            "https://www.gstatic.com", 
            "https://www.firebasejs.com"
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
            "https://www.gstatic.com", // Fix untuk Firebase Maps
            "https://firebase.googleapis.com"
          ],
          "img-src": ["'self'", "data:", "https://www.gstatic.com"],
          "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
          "font-src": ["'self'", "https://fonts.gstatic.com"],
        },
      },
      crossOriginEmbedderPolicy: false // Matikan jika mengganggu loading resource
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ===================================
// KONFIGURASI VIEW ENGINE (EJS)
// ===================================
app.use(expressLayouts); 
app.set('layout', './layouts/main'); 
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));

// Middleware Global: Kirim User ke View
app.use((req, res, next) => {
    res.locals.user = req.user || undefined; 
    res.locals.activePage = ''; 
    next();
});

// ===================================
// PENDAFTARAN ROUTES
// ===================================

// 1. Rute API (Logika)
app.use('/api/auth', authRoutes);

// 2. Rute View (Tampilan Browser)
app.use('/', authViewRoutes);

// 2. Rute API Data
app.use('/api/parts', partRoutes); 
app.use('/api/services', serviceRoutes); 
app.use('/api/transactions', transactionRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);

// 3. Rute Tampilan Dashboard (Admin/Kasir)
app.use('/', viewRoutes);

// 4. Rute Tampilan Mekanik
app.use('/mekanik', protect, restrictTo('mekanik', 'admin'), mekanikViewRoutes);

// 5. Redirect Halaman Utama
app.get('/', protect, (req, res) => {
    const role = req.user.role; 
    if (role === 'admin') res.redirect('/admin/dashboard');
    else if (role === 'kasir') res.redirect('/kasir/dashboard');
    else if (role === 'mekanik') res.redirect('/mekanik/jobs');
    else res.render('index', { title: 'Beranda', activePage: 'home' });
});

// 6. Handle 404
app.use((req, res) => {
    // Pastikan file views/404.ejs ada, jika tidak, kirim text biasa
    res.status(404);
    try {
        res.render('404', { title: 'Halaman Tidak Ditemukan', activePage: 'error' });
    } catch (err) {
        res.send("<h1>404 - Halaman Tidak Ditemukan</h1>");
    }
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});