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

// 1. Rute Auth & View Publik
app.use('/', authViewRoutes); // Menangani Login Page (GET)
app.use('/api/auth', authRoutes); // Menangani Proses Login (POST)

// 2. Rute API Data
app.use('/api/parts', partRoutes); 
app.use('/api/services', serviceRoutes); 
app.use('/api/transactions', transactionRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);

// 3. Rute Tampilan Dashboard (Admin/Kasir)
app.use('/', viewRoutes);
if (result.success) {
  alert('Status Berhasil Diperbarui!');
  window.location.href = '/kasir/dashboard'; // Paksa pindah halaman ke dashboard untuk refresh data
}

// 4. Rute Tampilan Mekanik
app.use('/', mekanikViewRoutes);


// 5. Redirect Halaman Utama
app.get('/', protect, (req, res) => {
  const role = req.user.role; 
  if (role === 'admin') res.redirect('/admin/dashboard');
  else if (role === 'kasir') res.redirect('/kasir/dashboard');
  // PERBAIKAN REDIRECT: Arahkan ke rute yang benar-benar ada
  else if (role === 'mekanik') res.redirect('/mechanic/dashboard'); 
    
    else res.render('index', { title: 'Beranda', activePage: 'home' });
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