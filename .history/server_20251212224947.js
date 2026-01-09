// sisfo-bengkel-baru/server.js

require('dotenv').config(); 

const express = require('express');
const connectDB = require('./src/config/db'); 
const partRoutes = require('./src/routes/partRoutes'); // <-- Panggil Routes

connectDB(); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Contoh Route Dasar (Halaman Selamat Datang)
app.get('/', (req, res) => {
    res.send('Selamat datang di Sisfo Bengkel Baru!');
});

// 2. Integrasi Routes Suku Cadang (dengan prefix /api/parts)
app.use('/api/parts', partRoutes); // <-- Tambahkan middleware ini

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});