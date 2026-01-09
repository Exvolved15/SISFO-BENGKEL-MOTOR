const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/TransactionController');
const Transaction = require('../models/Transaction');
const Job = require('../models/Job');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// ==========================================
// 1. RUTE UTAMA (/api/transactions)
// ==========================================
router.route('/')
    // GET: Ambil semua transaksi (Admin & Kasir)
    .get(protect, restrictTo('admin', 'kasir'), transactionController.getAllTransactions) 
    // POST: Buat transaksi baru & Hubungkan ke ID Pelanggan
    .post(protect, restrictTo('admin', 'kasir'), transactionController.createTransactionApi);

// ==========================================
// 2. RUTE DETAIL & UPDATE (/api/transactions/:id)
// ==========================================
router.route('/:id')
    // GET: Lihat detail transaksi spesifik
    .get(protect, restrictTo('admin', 'kasir'), transactionController.getTransaction);

// Rute Update Status (Sinkronisasi Kasir, Mekanik, & Pelanggan)
router.patch('/update-status/:id', protect, restrictTo('admin', 'kasir'), async (req, res) => {
    try {
        const transactionId = req.params.id;

        // 1. Update Tabel Transaksi
        const trx = await Transaction.findByIdAndUpdate(
            transactionId, 
            { $set: { status: 'completed' } }, 
            { new: true }
        );

        if (!trx) return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });

        // 2. Update Tabel Job Mekanik agar sinkron
        await Job.findOneAndUpdate(
            { transactionId: transactionId },
            { $set: { status: 'completed' } }
        );

        // Setelah ini, dashboard pelanggan otomatis menampilkan status 'Selesai'
        res.json({ success: true, message: "Status transaksi dan pengerjaan berhasil diperbarui" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 3. RUTE CETAK & LAINNYA
// ==========================================
router.route('/:id/receipt')
    .get(protect, restrictTo('admin', 'kasir'), transactionController.printReceipt);

// Rute addDetail jika diimplementasikan di controller
router.post('/:id/detail', protect, restrictTo('admin', 'kasir'), transactionController.addDetail);

module.exports = router;