// sisfo-bengkel-baru/src/routes/viewRoutes.js

const express = require('express');
const router = express.Router();
const Part = require('../models/Part'); 
const { updatePart } = require('../controllers/PartController');
const Service = require('../models/Service'); // <-- Panggil Service Model

// Panggil Controller yang diperlukan
const { createPartView } = require('../controllers/PartController'); 

const Transaction = require('../models/Transaction'); // <-- Panggil Transaksi Header Model
const TransactionDetail = require('../models/TransactionDetail');
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

// ===================================
// ROUTE EDIT SUKU CADANG
// ===================================

// Route 4: GET /parts/edit/:id - Menampilkan FORM Edit Suku Cadang
router.get('/parts/edit/:id', async (req, res) => {
    try {
        const part = await Part.findById(req.params.id);

        if (!part) {
            return res.status(404).send('Suku Cadang tidak ditemukan.');
        }

        res.render('parts/edit', {
            title: 'Edit Suku Cadang',
            activePage: 'parts',
            part: part // Kirim data suku cadang yang akan diedit ke view
        });

    } catch (error) {
        res.status(500).send('Terjadi kesalahan saat mengambil data: ' + error.message);
    }
});

// Route 5: POST /parts/edit/:id - Menangani pengiriman data update dari form
router.post('/parts/edit/:id', async (req, res) => {
    try {
        // Kita akan memanfaatkan fungsi updatePart dari PartController,
        // namun kita akan memanggilnya secara langsung tanpa mengirim res.json()
        
        const partId = req.params.id;
        const updatedData = req.body;

        const part = await Part.findByIdAndUpdate(partId, updatedData, {
            new: true, // Kembalikan dokumen yang diperbarui
            runValidators: true // Jalankan validasi skema
        });

        if (!part) {
            return res.status(404).send('Suku Cadang tidak ditemukan untuk diupdate.');
        }

        // Jika berhasil, redirect kembali ke daftar
        res.redirect('/parts'); 
        
    } catch (error) {
        // Tangani error validasi (misalnya kode unik duplikat)
        console.error("Error saat update dari Form:", error.message);
        res.status(400).send(`Update Gagal: ${error.message}. <a href="/parts">Kembali ke Daftar</a>`);
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

const TransactionController = require('../controllers/TransactionController'); 
const { processTransactionLogic } = TransactionController; // <-- Asumsi Anda mengekspor Logic

// Route 7: GET /transactions/add - Menampilkan FORM Transaksi Baru
router.get('/transactions/add', async (req, res) => {
    try {
        // Ambil semua suku cadang yang stoknya > 0
        const parts = await Part.find({ stock: { $gt: 0 } }).select('name code sellingPrice'); 
        // Ambil semua jasa servis
        const services = await Service.find({}).select('serviceName serviceCode price');
        
        res.render('transactions/add', {
            title: 'Buat Transaksi Baru',
            activePage: 'transactions',
            parts: parts,
            services: services
        });
    } catch (error) {
        res.status(500).send('Error saat menyiapkan form transaksi: ' + error.message);
    }
});

// Route 8: POST /transactions/add - Menangani pengiriman data transaksi
router.post('/transactions/add', async (req, res) => {
    // Data JSON dari klien sudah di-parse oleh middleware Express, tapi itemDetails masih string JSON
    
    try {
        // Parsing itemDetails dari string JSON ke objek/array
        req.body.itemDetails = JSON.parse(req.body.itemDetails);
        
        await processTransactionLogic(req.body); // <-- Panggil fungsi Logic, TIDAK MENGIRIM RESPONSE

        // Jika berhasil (logic selesai), LAKUKAN REDIRECT
        res.redirect('/transactions');

    } catch (error) {
        // Jika ada error (misalnya stok kurang/validasi gagal)
        console.error("Error Transaksi dari Form:", error.message);
        // Tangani error dengan menampilkan ulang form
        // Untuk saat ini, kita kirim pesan error sederhana:
        res.status(400).send(`Transaksi Gagal (Error Validasi/Stok): ${error.message}. <a href="/transactions/add">Kembali ke Form</a>`);
    }
});

module.exports = router;