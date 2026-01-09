// sisfo-bengkel-baru/server.js

require('dotenv').config(); 

const express = require('express');
const connectDB = require('./src/config/db'); 
const partRoutes = require('./src/routes/partRoutes'); 
const viewRoutes = require('./src/routes/viewRoutes'); 
const expressLayouts = require('express-ejs-layouts'); // <-- Panggil express-ejs-layouts

connectDB(); 

const app = express();
const PORT = process.env.PORT || 3000; // Perbaiki dari process.env.env menjadi process.env.PORT

// ===================================
// KONFIGURASI VIEW ENGINE (EJS)
// ===================================
app.use(expressLayouts); // <-- Gunakan middleware layout
app.set('layout', './layouts/main'); // <-- Set layout default
app.set('view engine', 'ejs'); 
app.set('views', 'views');

// ===================================
// KONFIGURASI STATIC FILES (CSS, JS, GAMBAR)
// ===================================
app.use(express.static('public')); // <-- Folder 'public' akan diakses secara statis
// ===================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/parts', partRoutes); 

// VIEW Routes (untuk halaman yang diakses browser)
app.use('/', viewRoutes); 

app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Beranda',
        activePage: 'home' // Untuk menandai nav item yang aktif
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});