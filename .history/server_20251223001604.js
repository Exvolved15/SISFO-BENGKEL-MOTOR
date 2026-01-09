// [LOKASI]: server.js
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

// Import Middleware
const { protect, restrictTo } = require('./src/middleware/authMiddleware');

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const authViewRoutes = require('./src/routes/authViewRoutes');
const viewRoutes = require('./src/routes/viewRoutes');
const mechanicRoutes = require('./src/routes/jobRoutes'); // API Jobs

connectDB();
const app = express();

// Security & Middleware
app.use(helmet({ 
    contentSecurityPolicy: false, // Dimatikan sementara agar CSS/JS CDN tidak terblokir
    crossOriginEmbedderPolicy: false 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// View Engine Setup
app.use(expressLayouts);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// ==================================================================
// MIDDLEWARE GLOBAL: Sinkronisasi User ke EJS
// ==================================================================
app.use(async (req, res, next) => {
    res.locals.user = null;
    res.locals.activePage = '';
    try {
        const token = req.cookies.jwt;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const currentUser = await User.findById(decoded.id);
            if (currentUser) {
                req.user = currentUser;
                res.locals.user = currentUser; // Tersedia di semua file .ejs
            }
        }
    } catch (err) {
        res.locals.user = null;
    }
    next();
});

// ==================================================================
// PENDAFTARAN ROUTES (URUTAN SANGAT PENTING)
// ==================================================================

// 1. RUTE PUBLIK (Tanpa Protect - Agar Overview & Login bisa dibuka)
app.use('/', authViewRoutes); 
app.use('/api/auth', authRoutes);

// 2. RUTE UTAMA / OVERVIEW (Harus di atas protect agar tidak redirect ke login)
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Overview Sisfo Bengkel',
        activePage: 'home'
    });
});

// 3. RUTE PROTECTED (Gunakan Middleware Protect)
app.use('/api/jobs', protect, require('./src/routes/jobRoutes'));
app.use('/api/parts', protect, require('./src/routes/partRoutes'));
app.use('/api/transactions', protect, require('./src/routes/transactionRoutes'));
app.use('/api/users', protect, require('./src/routes/userRoutes'));

// View Dashboards & Pages
app.use('/', protect, viewRoutes);

// 4. LOGIKA REDIRECT SETELAH LOGIN
app.get('/dashboard-redirect', protect, (req, res) => {
    const role = req.user.role;
    if (role === 'admin') return res.redirect('/admin/dashboard');
    if (role === 'kasir') return res.redirect('/kasir/dashboard');
    if (role === 'mekanik') return res.redirect('/mechanic/dashboard');
    return res.redirect('/customer/dashboard');
});

// Handle 404
app.use((req, res) => {
    res.status(404).render('404', { title: '404 - Not Found', activePage: 'error' });
});

app.listen(process.env.PORT || 5000, () => console.log('Server Running...'));