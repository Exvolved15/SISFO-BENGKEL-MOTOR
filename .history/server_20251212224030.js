// sisfo-bengkel-baru/server.js

// 1. Panggil dan konfigurasi dotenv untuk memuat variabel dari .env
require('dotenv').config(); 

// 2. Panggil Express
const express = require('express');
const app = express();

// 3. Tentukan port dari file .env atau default ke 3000
const PORT = process.env.PORT || 3000;

// 4. Middleware dasar (untuk menangani JSON data dari request)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Contoh Route Dasar (Halaman Selamat Datang)
app.get('/', (req, res) => {
    res.send('Selamat datang di Sisfo Bengkel Baru!');
});

// 6. Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log('Tekan CTRL+C untuk menghentikan server');
});