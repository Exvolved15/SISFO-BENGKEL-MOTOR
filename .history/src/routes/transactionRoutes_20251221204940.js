const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/TransactionController');
const Transaction = require('../models/Transaction');
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

// Rute Update Status
router.patch('/update-status/:id', protect, async (req, res) => {
    try {
        // 1. Update status di koleksi Transaction menjadi 'completed'
        const updatedTrx = await Transaction.findByIdAndUpdate(
            req.params.id, 
            { status: 'completed' }, 
            { new: true }
        );

        if (!updatedTrx) {
            return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
        }

        // 2. PERBAIKAN: Update status di koleksi Job agar mekanik kembali 'nganggur'
        // Kita mencari Job yang mereferensikan transactionId ini
        await Job.findOneAndUpdate(
            { transactionId: req.params.id }, 
            { status: 'completed' }
        );

        res.json({ success: true, message: "Status berhasil diperbarui" });
    } catch (err) {
        console.error("Update Status Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;