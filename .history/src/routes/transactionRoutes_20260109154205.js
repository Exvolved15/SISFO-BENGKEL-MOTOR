const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/TransactionController');
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Rute Utama API
router.get('/', protect, restrictTo('admin', 'kasir'), transactionController.getAllTransactions);
router.post('/', protect, restrictTo('admin', 'kasir'), transactionController.createTransaction);

// FIX: RUTE PRINT UNTUK SEMUA (Admin, Kasir, Customer)
// Menghapus restrictTo agar customer bisa akses resinya sendiri
router.get('/print/:identifier', protect, async (req, res) => {
    try {
        const { identifier } = req.params;
        let transaction;

        // Cek apakah identifier adalah MongoDB ID atau Invoice String
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            transaction = await Transaction.findById(identifier);
        } else {
            transaction = await Transaction.findOne({ invoiceNumber: identifier });
        }
        
        if (!transaction) {
            return res.status(404).render('404', { title: 'Nota Tidak Ditemukan', user: req.user });
        }

        // Ambil rincian (parts/jasa)
        const details = await TransactionDetail.find({ invoiceNumber: transaction.invoiceNumber });

        res.render('transactions/receipt', { 
            layout: false, 
            transaction,
            details: details || [] 
        });
    } catch (error) {
        console.error("Print Error:", error);
        res.status(500).send('Terjadi kesalahan sistem.');
    }
});

// Update Status
router.patch('/update-status/:id', protect, restrictTo('admin', 'kasir'), transactionController.updateStatus || async (req, res) => {
    try {
        const trx = await Transaction.findByIdAndUpdate(req.params.id, { $set: { status: 'completed' } }, { new: true });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;