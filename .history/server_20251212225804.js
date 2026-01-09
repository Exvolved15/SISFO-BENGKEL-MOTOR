// sisfo-bengkel-baru/server.js

require('dotenv').config(); 

const express = require('express');
const connectDB = require('./src/config/db'); 
const partRoutes = require('./src/routes/partRoutes'); 

connectDB(); 

const app = express();
const PORT = process.env.PORT || 3000;

// ===================================
// KONFIGURASI VIEW ENGINE (EJS)
// ===================================
app.set('view engine', 'ejs'); // 1. Set engine yang digunakan
app.set('views', 'views');      // 2. Set folder tempat file .ejs berada (kita akan buat folder 'views')
// ===================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... (Routes) ...
app.use('/api/parts', partRoutes); 

// Kita akan modifikasi Route dasar '/' di Langkah 8.4
app.get('/', (req, res) => {
    // res.send('Selamat datang di Sisfo Bengkel Baru!'); // Hapus baris ini
    res.render('index', { title: 'Beranda Sisfo Bengkel' }); // <-- Ganti dengan render EJS
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});