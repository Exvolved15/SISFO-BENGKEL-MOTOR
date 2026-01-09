// sisfo-bengkel-baru/src/routes/viewRoutes.js

const express = require('express');
const router = express.Router();
const Part = require('../models/Part'); // Panggil Model Suku Cadang

// Route: GET /parts
// Bertujuan untuk menampilkan daftar suku cadang di browser
router.get('/parts', async (req, res) => {
    try {
        // 1. Controller Logic (Mengambil data dari Model)
        const parts = await Part.find({});

        // 2. Render View (Mengirim data ke tampilan .ejs)
        res.render('parts/list', { // render file views/parts/list.ejs
            title: 'Daftar Suku Cadang',
            parts: parts // Data suku cadang dikirim ke EJS
        });

    } catch (error) {
        // 3. Error Handling
        res.status(500).send('Terjadi kesalahan saat mengambil data: ' + error.message);
    }
});

module.exports = router;