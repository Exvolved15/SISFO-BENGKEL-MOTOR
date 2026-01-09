// sisfo-bengkel-baru/src/routes/viewRoutes.js

const express = require('express');
const router = express.Router();
const Part = require('../models/Part'); 

// Import PartController untuk logika POST dari form
const { createPart } = require('../controllers/PartController'); // <-- Import createPart

// Route 1: GET /parts - Menampilkan daftar suku cadang
router.get('/parts', async (req, res) => {
    try {
        const parts = await Part.find({});
        res.render('parts/list', { 
            title: 'Daftar Suku Cadang',
            parts: parts,
            activePage: 'parts' 
        });
    } catch (error) {
        res.status(500).send('Terjadi kesalahan saat mengambil data: ' + error.message);
    }
});

// Route 2: GET /parts/add - Menampilkan FORM Tambah Suku Cadang
router.get('/parts/add', (req, res) => {
    res.render('parts/add', {
        title: 'Tambah Suku Cadang',
        activePage: 'parts',
        errors: null // Kirim objek errors kosong untuk menghindari error di view
    });
});

// Route 3: POST /parts/add - Menangani pengiriman data dari form
router.post('/parts/add', createPart, (req, res) => {
    // Fungsi createPart sudah diimpor dari PartController.js.
    // Jika createPart berhasil (status 201), kita akan redirect.
    res.redirect('/parts'); 
    
    // Catatan: Error handling akan ditangani oleh Mongoose dan perlu logic yang lebih kompleks
    // Saat ini, error POST akan ditampilkan sebagai 400 Bad Request di terminal jika terjadi.
    // Untuk pengembangan nanti, kita harus menambahkan logic untuk merender ulang form dengan pesan error.
});


// Route 4: DELETE /parts/delete/:id - Menghapus suku cadang dari tampilan 
router.delete('/parts/delete/:id', async (req, res) => {
    try {
        const part = await Part.findByIdAndDelete(req.params.id);
        if (!part) {
            return res.status(404).send('Suku Cadang tidak ditemukan');
        }
        res.redirect('/parts'); 
    } catch (error) {
        res.status(500).send('Terjadi kesalahan saat menghapus data: ' + error.message);
    }
});

module.exports = router;