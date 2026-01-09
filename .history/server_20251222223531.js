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
//app.use((req, res, next) => {
//    res.locals.user = req.user || undefined; 
//    res.locals.activePage = ''; 
//    next();
//});
const jwt = require('jsonwebtoken');
const User = require('./src/models/User');

app.use(async (req, res, next) => {
    res.locals.activePage = ''; // Reset state halaman aktif
    try {
        const token = req.cookies.jwt;
        if (token) {
            // 1. Verifikasi token JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // 2. Ambil data terbaru dari DB agar 'department' tersinkron
            const currentUser = await User.findById(decoded.id);
            
            if (currentUser) {
                req.user = currentUser; // Simpan di request
                res.locals.user = currentUser; // Kirim ke EJS
            } else {
                res.locals.user = undefined;
            }
        } else {
            res.locals.user = undefined;
        }
    } catch (err) {
        // Jika token expired atau rusak, user tetap undefined (tidak crash)
        res.locals.user = undefined;
    }
    next();
});
// Di server.js (Middleware Global)
app.use(async (req, res, next) => {
  try {
      if (req.cookies.jwt) {
          const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
          const user = await User.findById(decoded.id);
          
          // Sekarang user.department tersedia secara global di semua EJS
          res.locals.user = user; 
      } else {
          res.locals.user = null;
      }
  } catch (err) {
      res.locals.user = null;
  }
  next();
});

// ===================================
// PENDAFTARAN ROUTES
// ===================================

// ===================================
// PENDAFTARAN ROUTES (URUTAN DIPERBAIKI)
// ===================================

// 1. Rute LOGIN (Harus di paling atas dan TIDAK BOLEH pakai protect)
app.use('/', authViewRoutes); 
app.use('/api/auth', authRoutes); 

// 2. Rute PROTECTED (Semua yang butuh login diletakkan di bawah middleware protect)
app.use('/api/parts', protect, partRoutes); 
app.use('/api/services', protect, serviceRoutes); 
app.use('/api/transactions', protect, transactionRoutes); 
app.use('/api/users', protect, userRoutes);
app.use('/api/jobs', protect, jobRoutes);

app.use('/', protect, viewRoutes);
app.use('/', protect, mekanikViewRoutes);
// server.js
app.use('/uploads', express.static('uploads'));

// 3. Perbaikan Root Redirect (/)

app.get('/', protect, (req, res) => {
  const role = req.user.role;
  
  if (role === 'admin') return res.redirect('/admin/dashboard');
  if (role === 'kasir') return res.redirect('/kasir/dashboard');
  
  // Sesuaikan link ini dengan yang ada di navbar
  if (role === 'mekanik') return res.redirect('/api/jobs/mechanic/dashboard'); 
  
  if (role === 'customer' || role === 'user') return res.redirect('/customer/dashboard');
  
  res.redirect('/login');
});

// [LOKASI]: server.js
app.use(async (req, res, next) => {
  try {
      const token = req.cookies.jwt;
      if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          // FIX: Selalu ambil data terbaru dari DB agar foto profil sinkron
          const currentUser = await User.findById(decoded.id);
          res.locals.user = currentUser; 
      } else {
          res.locals.user = null;
      }
  } catch (err) {
      res.locals.user = null;
  }
  next();
});

// Penting: Izinkan akses folder upload ke publik
// server.js
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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