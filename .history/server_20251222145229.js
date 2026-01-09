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

// ===================================
// IMPORT ROUTES (Perbaikan: Tidak ada duplikat)
// ===================================

// Import Routes API
const partRoutes = require('./src/routes/partRoutes'); 
const transactionRoutes = require('./src/routes/transactionRoutes'); 
const userRoutes = require('./src/routes/userRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes'); 
const jobRoutes = require('./src/routes/jobRoutes'); 
const authRoutes = require('./src/routes/authRoutes'); // <--- Deklarasi API Auth (Cukup sekali disini)

// Import Routes View (Tampilan)
const viewRoutes = require('./src/routes/viewRoutes');
const authViewRoutes = require('./src/routes/authViewRoutes'); // <--- Deklarasi View Auth
const mekanikViewRoutes = require('./src/routes/mekanikViewRoutes');

// Hubungkan ke Database
connectDB(); 

const app = express();
const PORT = process.env.PORT || 5000;

// ===================================
// MIDDLEWARE KEAMANAN
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
            "https://www.gstatic.com", 
            "https://firebase.googleapis.com"
          ],
          "img-src": ["'self'", "data:", "https://www.gstatic.com"],
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
Halaman login yang hilang atau error 404 pada rute utama biasanya terjadi karena urutan pendaftaran rute di server.js yang tidak tepat atau bentrokan antara rute GET / untuk dashboard dan rute GET / untuk halaman login.

Berikut adalah perbaikan Full Fix pada file server.js Anda:

1. Perbaikan Urutan Rute di server.js
Dalam Express.js, rute diproses dari atas ke bawah. Anda perlu mendaftarkan rute login sebelum rute dashboard yang diproteksi.

JavaScript

// server.js

// ... (Bagian import dan middleware tetap sama)

// ===================================
// PENDAFTARAN ROUTES (URUTAN DIPERBAIKI)
// ===================================

// 1. Rute Auth View (Login Page) - JANGAN diproteksi agar bisa diakses publik
app.use('/', authViewRoutes); 

// 2. Rute API Data
app.use('/api/auth', authRoutes); 
app.use('/api/parts', partRoutes); 
app.use('/api/services', serviceRoutes); 
app.use('/api/transactions', transactionRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);

// 3. Rute Tampilan Dashboard & Detail (Diproteksi)
// Pastikan viewRoutes didaftarkan setelah authViewRoutes
app.use('/', protect, viewRoutes); 
app.use('/', protect, mekanikViewRoutes);

// 4. Redirect Halaman Utama (Login/Dashboard)
app.get('/', (req, res) => {
    // Jika user sudah login (punya cookie/token), lempar ke dashboard
    if (req.cookies && req.cookies.jwt) {
        return res.redirect('/admin/dashboard'); // Logic redirect role bisa diletakkan di rute dashboard
    }
    // Jika belum login, tampilkan halaman login
    res.redirect('/login'); 
});


// 5. Redirect Halaman Utama
app.get('/', protect, (req, res) => {
  // Tambahkan log untuk debugging manual di terminal
  console.log("Role yang terdeteksi saat redirect:", req.user.role);

  const role = req.user.role; 
  if (role === 'admin') {
      return res.redirect('/admin/dashboard');
  } else if (role === 'kasir') {
      return res.redirect('/kasir/dashboard');
  } else if (role === 'customer' || role === 'user') { 
      // Tambahkan 'user' jika itu adalah string yang tersimpan di DB Anda
      return res.redirect('/customer/dashboard'); 
  } else {
      res.render('index', { title: 'Beranda', activePage: 'home' });
  }
});
// 6. Handle 404
app.use((req, res) => {
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