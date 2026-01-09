require('dotenv').config(); 
const express = require('express'); 
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const connectDB = require('./src/config/db'); 

// Import Middleware
const { protect } = require('./src/middleware/authMiddleware');

// Import Routes
const partRoutes = require('./src/routes/partRoutes'); 
const serviceRoutes = require('./src/routes/serviceRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const userRoutes = require('./src/routes/userRoutes');
const jobRoutes = require('./src/routes/jobRoutes');
const authRoutes = require('./src/routes/authRoutes');

// Import View Routes
const viewRoutes = require('./src/routes/viewRoutes');
const authViewRoutes = require('./src/routes/authViewRoutes');
const mekanikViewRoutes = require('./src/routes/mekanikViewRoutes');

// Inisiasi DB
connectDB(); 

const app = express();
const PORT = process.env.PORT || 3000;

// ===================================
// KONFIGURASI VIEW ENGINE (EJS)
// ===================================
app.use(expressLayouts); 
app.set('layout', './layouts/main'); 
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));

// ===================================
// MIDDLEWARE UTAMA
// ===================================
app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          // Tambahkan domain Firebase di bawah ini
          "script-src": [
            "'self'", 
            "'unsafe-inline'", 
            "https://cdn.jsdelivr.net", 
            "https://www.gstatic.com", 
            "https://www.firebasejs.com"
          ],
          "connect-src": [
            "'self'", 
            "http://localhost:5000", 
            `http://localhost:${PORT}`,
            "https://identitytoolkit.googleapis.com", // Penting untuk Firebase Auth
            "https://securetoken.googleapis.com"
          ],
          "img-src": ["'self'", "data:", "https://www.gstatic.com"],
          "frame-src": ["'self'", "https://sisfo-bengkel-baru.firebaseapp.com"] // Ganti dengan domain firebaseapp Anda jika perlu
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
// API ROUTES
// ===================================
app.use('/api/auth', authRoutes);
app.use('/api/parts', partRoutes); 
app.use('/api/services', serviceRoutes); 
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);

// ===================================
// VIEW ROUTES
// ===================================
app.use('/mekanik', mekanikViewRoutes);
app.use('/', authViewRoutes); 
app.use('/', viewRoutes);

// Logika Rute Beranda (Digabung)
app.get('/', protect, (req, res) => {
    const role = req.user.role; 
    
    if (role === 'admin') {
        res.redirect('/admin/dashboard');
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