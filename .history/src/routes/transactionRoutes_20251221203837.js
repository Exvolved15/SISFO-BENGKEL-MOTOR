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
router.patch('/update-status/:id', async (req, res) => {
    try {
        const { status } = req.body;
        
        // Update di koleksi Transaction
        const updatedTrx = await Transaction.findByIdAndUpdate(
            req.params.id, 
            { status: status }, 
            { new: true }
        );

        if (!updatedTrx) {
            return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
        }

        // Update di koleksi Job agar sinkron
        // Mencari job yang memiliki ID transaksi yang sama
        await Job.findOneAndUpdate(
            { transactionId: req.params.id }, 
            { status: status }
        );

        res.json({ success: true, data: updatedTrx });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});   

module.exports = router;