const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/TransactionController');
const Transaction = require('../models/Transaction');
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
        // Cari data transaksi berdasarkan nomor invoice
        const data = await Transaction.findOne({ invoiceNumber: invoice });

        if (!data) {
            return res.status(404).send('Data transaksi tidak ditemukan');
        }

        // Render file EJS khusus struk (tanpa navbar/footer main layout)
        res.render('transactions/print', { 
            layout: false, // Penting: Jangan pakai main layout agar rapi saat diprint
            transaction: data 
        });
    } catch (error) {
        res.status(500).send('Terjadi kesalahan server');
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