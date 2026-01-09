// sisfo-bengkel-baru/server.js

require('dotenv').config(); 


const connectDB = require('./src/config/db'); 
const expressLayouts = require('express-ejs-layouts'); 
const methodOverride = require('method-override');
const express = require('express');
const connectDB = require('./src/config/db'); 
const partRoutes = require('./src/routes/partRoutes'); 
const serviceRoutes = require('./src/routes/serviceRoutes'); 
const viewRoutes = require('./src/routes/viewRoutes'); 
const expressLayouts = require('express-ejs-layouts'); // <-- PASTIKAN BARIS INI ADA!
const methodOverride = require('method-override');connectDB(); 
const partRoutes = require('./src/routes/partRoutes'); 
const serviceRoutes = require('./src/routes/serviceRoutes'); 
const transactionRoutes = require('./src/routes/transactionRoutes'); // <-- Panggil Transaction Routes
const viewRoutes = require('./src/routes/viewRoutes');

const app = express();
const PORT = process.env.PORT || 3000; 

// --- PANGGIL ROUTES SEKALI SAJA ---
const partRoutes = require('./src/routes/partRoutes');             // <-- HANYA SATU INI
const serviceRoutes = require('./src/routes/serviceRoutes');       // <-- HANYA SATU INI
const transactionRoutes = require('./src/routes/transactionRoutes'); // <-- HANYA SATU INI
const viewRoutes = require('./src/routes/viewRoutes');             // <-- HANYA SATU INI

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
app.use('/api/services', serviceRoutes); 
app.use('/api/transactions', transactionRoutes); // <-- Tambahkan middleware ini

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