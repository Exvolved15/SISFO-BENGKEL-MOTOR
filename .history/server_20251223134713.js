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

// 1. IMPORT UTILITY SYNC FIREBASE
const { syncToFirebase } = require('./src/utils/firebaseSync');

// ==================================================================
// 2. PASANG MONGOOSE PLUGIN (WAJIB SEBELUM MODEL DI-REQUIRE)
// ==================================================================
mongoose.plugin((schema) => {
    // Sinkron saat Data Baru atau Update (.save() / .create())
    schema.post('save', function(doc) {
        const collection = this.constructor.modelName.toLowerCase();
        syncToFirebase(collection, doc);
    });

    // Sinkron saat Update via Query (.findOneAndUpdate)
    schema.post('findOneAndUpdate', function(doc) {
        if (doc) {
            const collection = doc.constructor.modelName.toLowerCase();
            syncToFirebase(collection, doc);
        }
    });

    // Hapus di Firebase jika di MongoDB dihapus
    schema.post('findOneAndDelete', async function(doc) {
        if (doc) {
            const collection = doc.constructor.modelName.toLowerCase();
            try {
                const admin = require('firebase-admin');
                await admin.database().ref(`backups/${collection}/${doc._id}`).remove();
            } catch (err) {
                console.error("[SYNC DELETE ERROR]", err.message);
            }
        }
    });
});

// ==================================================================
// 3. IMPORT MODEL (SETELAH PLUGIN TERPASANG AGAR SEMUA TABEL SYNC)
// ==================================================================
const User = require('./src/models/User');
const Part = require('./src/models/Part');
// Model lainnya akan otomatis mengikuti plugin saat dipanggil di rute

// Hubungkan ke Database
connectDB(); 

const app = express();
const PORT = process.env.PORT || 5000;

// ===================================
// 4. MIDDLEWARE KEAMANAN (HELMET)
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
            "https://www.firebasejs.com",
            "https://maps.googleapis.com",
            "https://maps.google.com"
            "https://bengkelan-motor-default-rtdb.asia-southeast1.firebasedatabase.app", 
            "https://*.googleapis.com",
            "https://firebase.googleapis.com"
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
          "frame-src": [
            "'self'", 
            "https://www.google.com", 
            "https://www.google.co.id", 
            "https://maps.google.com"
          ],
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

// Konfigurasi View Engine
app.use(expressLayouts); 
app.set('layout', './layouts/main'); 
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));

// ===================================
// 5. MIDDLEWARE GLOBAL (USER SESSION)
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

// Rute Publik
app.use('/', authViewRoutes); 
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    if (req.user) {
        const role = req.user.role;
        if (role === 'admin') return res.redirect('/admin/dashboard');
        if (role === 'kasir') return res.redirect('/kasir/dashboard');
        if (role === 'mekanik') return res.redirect('/mechanic/dashboard');
        return res.redirect('/customer/dashboard');
    }
    res.render('index', { title: 'Overview Sisfo Bengkel', activePage: 'home' });
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'Tentang Kami', activePage: 'about' });
});

// Rute Terproteksi
app.use('/api/parts', protect, partRoutes); 
app.use('/api/services', protect, serviceRoutes); 
app.use('/api/transactions', protect, transactionRoutes); 
app.use('/api/users', protect, userRoutes);
app.use('/api/jobs', protect, jobRoutes);
app.use('/', protect, viewRoutes);
app.use('/', protect, mekanikViewRoutes);

// Error Handling 404
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