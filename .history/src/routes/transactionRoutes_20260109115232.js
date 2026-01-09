const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/TransactionController');
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail'); // Pastikan model ini ada
const Job = require('../models/Job');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Rute Utama API / Data
router.get('/', protect, restrictTo('admin', 'kasir'), transactionController.getAllTransactions);
router.post('/', protect, restrictTo('admin', 'kasir'), transactionController.createTransaction);

// Rute Detail & Print
router.get('/print/:id', protect, restrictTo('admin', 'kasir'), transactionController.printReceipt);
router.get('/:id/detail', protect, restrictTo('admin', 'kasir'), transactionController.getTransaction);
router.get('/:id', protect, restrictTo('admin', 'kasir'), transactionController.getTransaction);

// Rute untuk Cetak/Preview Struk
router.get('/print/:invoice', async (req, res) => {
    try {
        const { invoice } = req.params;
        
        // 1. Cari data transaksi utama
        const transaction = await Transaction.findOne({ invoiceNumber: invoice });
        
        if (!transaction) {
            return res.status(404).send('Nota tidak ditemukan di database.');
        }

        // 2. Cari rincian item (suku cadang & jasa) yang terhubung dengan invoice ini
        const details = await TransactionDetail.find({ invoiceNumber: invoice });

        // 3. Render receipt.ejs (Tanpa Layout Utama)
        res.render('transactions/receipt', { 
            layout: false, 
            transaction,
            details: details || [] 
        });
    } catch (error) {
        console.error("Print Error:", error);
        res.status(500).send('Terjadi kesalahan saat memproses nota.');
    }
});

// Update Status (Manual Patch)
router.patch('/update-status/:id', protect, restrictTo('admin', 'kasir'), async (req, res) => {
    try {
        const transactionId = req.params.id;
        const trx = await Transaction.findByIdAndUpdate(
            transactionId, 
            { $set: { status: 'completed' } }, 
            { new: true }
        );
        if (!trx) return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });

        await Job.findOneAndUpdate(
            { transactionId: transactionId },
            { $set: { status: 'completed' } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;