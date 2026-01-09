// src/routes/transactionRoutes.js

const express = require('express');
const router = express.Router();
// Asumsikan Anda punya controller dan fungsi ini
const { 
    getAllTransactions, 
    createTransactionApi, // <-- INI HARUS SESUAI DENGAN EXPORT
    getTransaction,
    addDetail,           // <-- Pastikan ini diekspor atau hapus jika belum ada
    printReceipt         // <-- Pastikan ini diekspor atau hapus jika belum ada
} = require('../controllers/TransactionController'); 
const transactionController = require('../controllers/TransactionController');
const { protect, restrictTo } = require('../middleware/authMiddleware');


// Rute yang bisa diakses Admin dan Kasir
router.route('/')
    .get(protect, restrictTo('admin'), getAllTransactions) 
    .post(protect, restrictTo('admin', 'kasir'), transactionController.createTransactionApi); // <-- Gunakan nama yang benar
    
router.route('/:id')
    // Admin dan Kasir bisa melihat detail transaksi
    .get(protect, restrictTo('admin', 'kasir'), getTransaction);

// Menambahkan Detail Transaksi dan Cetak Resi
// Ini adalah fungsionalitas yang harus diakses Kasir dan Admin
router.route('/:id/detail')
    .post(protect, restrictTo('admin', 'kasir'), addDetail); // Admin & Kasir tambah detail

router.route('/:id/receipt')
    .get(protect, restrictTo('admin', 'kasir'), printReceipt); // Admin & Kasir cetak resi

module.exports = router;