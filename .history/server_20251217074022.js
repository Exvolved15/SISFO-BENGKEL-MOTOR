// sisfo-bengkel-baru/server.js

require('dotenv').config(); 

const path = require('path');
const connectDB = require('./src/config/db'); 
const express = require('express'); 
const expressLayouts = require('express-ejs-layouts'); // <-- PASTIKAN BARIS INI ADA!
const methodOverride = require('method-override');connectDB(); 
const cookieParser = require('cookie-parser'); // <-- Panggil cookie-parser
const partRoutes = require('./src/routes/partRoutes'); 
const mekanikViewRoutes = require('./src/routes/mekanikViewRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes'); 
const transactionRoutes = require('./src/routes/transactionRoutes'); // <-- Panggil Transaction Routes
const userRoutes = require('./src/routes/userRoutes');
const jobRoutes = require('./src/routes/jobRoutes'); // <--- TAMBAHKAN INI
const viewRoutes = require('./src/routes/viewRoutes');
const authRoutes = require('./src/routes/authRoutes'); // <-- Panggil Auth Routes
const authViewRoutes = require('./src/routes/authViewRoutes'); // <-- Panggil Auth View Routes
// ...

connectDB(); 

const app = express();
const PORT = process.env.PORT || 3000;

// ===================================
// KONFIGURASI VIEW ENGINE (EJS)
// ===================================
app.use(expressLayouts); 
app.set('layout', './layouts/main'); 
app.set('view engine', 'ejs'); 
app.set('views', 'views');

// ===================================
// KONFIGURASI STATIC FILES (CSS, JS, GAMBAR)
// ===================================
app.use(express.static(path.join(__dirname, 'public')));
// ===================================
// MIDDLEWARE UTAMA
// ===================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method')); // <-- Gunakan method-override
app.use(cookieParser()); // <-- Gunakan cookie-parser
// ===================================

app.use('/mekanik', mekanikViewRoutes);

// API Routes

app.use('/api/parts', partRoutes); 
app.use('/api/services', serviceRoutes); 
app.use('/api/transactions', transactionRoutes); // <-- Tambahkan middleware ini
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes); // <--- TAMBAHKAN INI
app.use('/api/auth', authRoutes); // <-- Tambahkan Auth Routes



// VIEW Routes (untuk halaman yang diakses browser)
app.use('/', authViewRoutes); // <-- Daftarkan Auth View Routes (sebelum viewRoutes yang diproteksi)
app.use('/', viewRoutes);

app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Beranda',
        activePage: 'home' 
    });
});
app.get('/', protect, (req, res) => {
    // Diasumsikan req.user tersedia dari protect middleware
    const role = req.user.role; 
    
    if (role === 'admin') {
        res.redirect('/admin/dashboard');
    } else if (role === 'kasir') {
        res.redirect('/kasir/dashboard');
    } else if (role === 'mekanik') {
        res.redirect('/mekanik/jobs'); // <-- Redirect Mekanik
    } else {
        res.render('home');
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});