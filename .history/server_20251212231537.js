// sisfo-bengkel-baru/server.js

require('dotenv').config(); 

const express = require('express');
const connectDB = require('./src/config/db'); 
const partRoutes = require('./src/routes/partRoutes'); 
const serviceRoutes = require('./src/routes/serviceRoutes'); 
const viewRoutes = require('./src/routes/viewRoutes'); 
const expressLayouts = require('express-ejs-layouts'); // <-- PASTIKAN BARIS INI ADA!
const methodOverride = require('method-override');connectDB(); 

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
app.use(express.static('public')); 

// ===================================
// MIDDLEWARE UTAMA
// ===================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method')); // <-- Gunakan method-override
// ===================================

// API Routes
app.use('/api/parts', partRoutes); 
app.use('/api/services', serviceRoutes); // <-- Tambahkan middleware ini

// VIEW Routes (untuk halaman yang diakses browser)
app.use('/', viewRoutes); 

app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Beranda',
        activePage: 'home' 
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});