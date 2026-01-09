// sisfo-bengkel-baru/server.js

require('dotenv').config(); 

const express = require('express');
// Panggil fungsi koneksi DB
const connectDB = require('./src/config/db'); 

// Panggil fungsi koneksi DB
connectDB(); 

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Selamat datang di Sisfo Bengkel Baru!');
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});