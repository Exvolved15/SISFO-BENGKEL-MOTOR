// sisfo-bengkel-baru/src/routes/viewRoutes.js

const express = require('express');
const router = express.Router();
const Part = require('../models/Part'); 
const Service = require('../models/Service'); // <-- Panggil Service Model

// Panggil Controller yang diperlukan
const { createPartView } = require('../controllers/PartController'); 
const { getAllTransactions } = require('../controllers/TransactionController'); // <-- Import Controller Transaksi

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
router.post('/parts/add', createPartView, (req, res) => { // <-- Gunakan createPartView
    // Middleware createPartView akan memanggil next() jika berhasil.
    // Jika next() dipanggil, kita akan masuk ke sini dan melakukan redirect.
    res.redirect('/parts'); 
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

// ... (Bagian atas file) ...
// Import Service Controller/Model (belum kita butuhkan sekarang, tapi untuk jaga-jaga)

// ...

// Route 5: GET /services - Menampilkan daftar jasa servis
router.get('/services', async (req, res) => {
    try {
        const services = await Service.find({}); // Panggil Model Service

        res.render('services/list', { // render file views/services/list.ejs
            title: 'Daftar Jasa Servis',
            services: services,
            activePage: 'services'
        });

    } catch (error) {
        res.status(500).send('Terjadi kesalahan saat mengambil data: ' + error.message);
    }
});

// ===================================
// ROUTE TRANSAKSI
// ===================================

// Route 6: GET /transactions - Menampilkan daftar riwayat transaksi
router.get('/transactions', async (req, res) => {
    try {
        // Logika Controller: Ambil semua transaksi
        const transactionsResponse = await getAllTransactions(req, res); 
        // Catatan: Karena getAllTransactions di-desain untuk API (mengirim res.json), 
        // kita perlu memodifikasi cara kita memanggilnya atau membuatnya hanya mengembalikan data.

        // Untuk sementara, kita panggil Model langsung agar lebih mudah di ViewRoutes
        const Transaction = require('../models/Transaction');
        const transactions = await Transaction.find({}).sort({ createdAt: -1 });

        res.render('transactions/list', { // render file views/transactions/list.ejs
            title: 'Riwayat Transaksi',
            transactions: transactions,
            activePage: 'transactions'
        });

    } catch (error) {
        res.status(500).send('Terjadi kesalahan saat mengambil data transaksi: ' + error.message);
    }
});

// ... (Route DELETE /parts/delete/:id) ...

module.exports = router;