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

connectDB(); 
const User = require('./src/models/User');
const Part = require('./src/models/Part');

const app = express();
const PORT = process.env.PORT || 5000;

// ===================================
// 4. MIDDLEWARE KEAMANAN (FIX CSP)
// ===================================
app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "script-src": [
            "'self'", 
            "'unsafe-inline'", 
            "'unsafe-eval'", 
            "https://cdn.jsdelivr.net", 
            "https://www.gstatic.com", 
            "https://unpkg.com",
            "https://maps.googleapis.com", 
            "https://*.googleapis.com"
          ],
          "script-src-attr": ["'unsafe-inline'"],
          "connect-src": [
            "'self'", 
            "http://localhost:5000",
            "https://cdn.jsdelivr.net",
            "https://*.googleapis.com",
            "https://api.qrserver.com",
            "https://*.firebasedatabase.app",
            "https://*.google.com", 
            "https://maps.gstatic.com"
          ],
          "img-src": [
            "'self'",         // PENTING: Izinkan gambar dari server sendiri
            "data:", 
            "blob:",
            "https://api.qrserver.com",
            "https://images.unsplash.com", 
            "https://*.googleusercontent.com",
            "https://maps.gstatic.com", 
            "https://*.googleapis.com", 
            "https://*.google.com",
            "https://*", 
            "http://*"
          ],
          "style-src": [
            "'self'", 
            "'unsafe-inline'", 
            "https://cdn.jsdelivr.net", 
            "https://fonts.googleapis.com", 
            "https://cdnjs.cloudflare.com",
            "https://unpkg.com",
            "https://*.googleapis.com"
          ],
          "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
          "frame-src": [
            "'self'", 
            "https://www.google.com", 
            "https://maps.google.com"
          ],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: false 
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());

// FIX: Urutan static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public'))); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(expressLayouts); 
app.set('layout', './layouts/main'); 
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));

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

const { protect } = require('./src/middleware/authMiddleware');
const authRoutes = require('./src/routes/authRoutes'); 
const authViewRoutes = require('./src/routes/authViewRoutes');
const partRoutes = require('./src/routes/partRoutes'); 
const serviceRoutes = require('./src/routes/serviceRoutes'); 
const viewRoutes = require('./src/routes/viewRoutes');
const mekanikViewRoutes = require('./src/routes/mekanikViewRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');

app.use('/', authViewRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/parts', protect, partRoutes); 
app.use('/api/services', protect, serviceRoutes); 
app.use('/api/transactions', transactionRoutes);

app.get('/', async (req, res) => {
    try {
        const staffList = await User.find({ 
            role: { $in: ['admin', 'mekanik', 'kasir'] } 
        }).limit(4);

        if (req.user) {
            const role = req.user.role;
            if (role === 'admin') return res.redirect('/admin/dashboard');
            if (role === 'kasir') return res.redirect('/kasir/dashboard');
            if (role === 'mekanik') return res.redirect('/mechanic/dashboard');
            return res.redirect('/customer/dashboard');
        }

        res.render('index', { 
            title: 'ACR Motor', 
            staffList: staffList, 
            activePage: 'home' 
        });
    } catch (error) {
        res.render('index', { title: 'ACR Motor', staffList: [], activePage: 'home' });
    }
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'Tentang Kami', activePage: 'about' });
});

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