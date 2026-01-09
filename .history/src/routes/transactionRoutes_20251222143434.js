const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/TransactionController');
const Transaction = require('../models/Transaction');
const Job = require('../models/Job');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, restrictTo('admin', 'kasir'), transactionController.getAllTransactions) 
    .post(protect, restrictTo('admin', 'kasir'), transactionController.createTransactionApi);

router.route('/:id')
    .get(protect, restrictTo('admin', 'kasir'), transactionController.getTransaction);

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

router.route('/:id/receipt').get(protect, restrictTo('admin', 'kasir'), transactionController.printReceipt);
router.get('/:id/detail', protect, restrictTo('admin', 'kasir'), transactionController.getTransaction);

// WAJIB ADA BARIS INI
module.exports = router;