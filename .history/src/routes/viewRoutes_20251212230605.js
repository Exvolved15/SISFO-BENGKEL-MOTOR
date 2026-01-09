// sisfo-bengkel-baru/src/routes/viewRoutes.js

const express = require('express');
const router = express.Router();
const Part = require('../models/Part'); 

// Route: GET /parts - Menampilkan daftar suku cadang
router.get('/parts', async (req, res) => {
    try {
        const parts = await Part.find({});
        res.render('parts/list', { 
            title: 'Daftar Suku Cadang',
            parts: parts,
            activePage: 'parts' // Untuk menandai nav item aktif
        });
    } catch (error) {
        res.status(500).send('Terjadi kesalahan saat mengambil data: ' + error.message);
    }
});

// Route: POST /parts/delete/:id - Menghapus suku cadang dari tampilan (membutuhkan method-override)
router.delete('/parts/delete/:id', async (req, res) => {
    try {
        const part = await Part.findByIdAndDelete(req.params.id);
        if (!part) {
            return res.status(404).send('Suku Cadang tidak ditemukan');
        }
        res.redirect('/parts'); // Redirect kembali ke daftar suku cadang
    } catch (error) {
        res.status(500).send('Terjadi kesalahan saat menghapus data: ' + error.message);
    }
});

module.exports = router;