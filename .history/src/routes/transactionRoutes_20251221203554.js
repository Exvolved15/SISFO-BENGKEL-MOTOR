const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/TransactionController');
const Job = require('../models/Job');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// 1. Rute Utama (/api/transactions)
router.route('/')
    // GET: Ambil semua transaksi (Admin & Kasir boleh lihat)
    .get(protect, restrictTo('admin', 'kasir'), transactionController.getAllTransactions) 
    // POST: Buat transaksi baru (Admin & Kasir)
    .post(protect, restrictTo('admin', 'kasir'), transactionController.createTransactionApi);

// 2. Rute Detail per ID (/api/transactions/:id)
router.route('/:id')
    // GET: Lihat 1 transaksi spesifik
    .get(protect, restrictTo('admin', 'kasir'), transactionController.getTransaction);

// 3. Rute Tambahan (Detail & Resi)
router.route('/:id/detail')
    .post(protect, restrictTo('admin', 'kasir'), transactionController.addDetail);

router.route('/:id/receipt')
    .get(protect, restrictTo('admin', 'kasir'), transactionController.printReceipt);

module.exports = router;