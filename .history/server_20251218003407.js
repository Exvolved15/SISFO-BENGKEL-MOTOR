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
const authViewRoutes = require('./src/routes/authViewRoutes');
const mekanikViewRoutes = require('./src/routes/mekanikViewRoutes');

// Hubungkan ke Database
connectDB(); 

const app = express();
const PORT = process.env.PORT || 5000;

// ===================================
// MIDDLEWARE KEAMANAN & PARSER
// ===================================
// Konfigurasi Helmet agar tidak memblokir Firebase & Onclick inline
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
          "https://www.firebasejs.com"
        ],
        "script-src-attr": ["'unsafe-inline'"], // Mengizinkan onclick="..."
        "connect-src": [
          "'self'", 
          "http://localhost:5000", 
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
          "https://*.googleapis.com"
        ],
        "img-src": ["'self'", "data:", "https://www.gstatic.com"],
        "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
      },
    },
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

// ===================================
// PENDAFTARAN ROUTES
// ===================================

// Rute Tampilan Mekanik (Khusus Mekanik)
app.use('/mekanik', mekanikViewRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/parts', partRoutes); 
app.use('/api/services', serviceRoutes); 
app.use('/api/transactions', transactionRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);

// View Routes (Halaman Web)
app.use('/', authViewRoutes); // Login, Register (Publik)
app.use('/', viewRoutes);     // Dashboard Kasir/Admin (Terproteksi)

// Logika Redirect Halaman Utama berdasarkan Role
app.get('/', protect, (req, res) => {
    const role = req.user.role; 
    if (role === 'admin') {
        res.redirect('/admin/dashboard'); // Server mencoba pindah ke sini
    }
    } else if (role === 'kasir') {
        res.redirect('/kasir/dashboard');
    } else if (role === 'mekanik') {
        res.redirect('/mekanik/jobs');
    } else {
        res.render('index', { 
            title: 'Beranda',
            activePage: 'home',
            user: req.user
        });
    }
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});