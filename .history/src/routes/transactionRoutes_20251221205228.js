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
        // 1. Update Transaksi jadi selesai
        const trx = await Transaction.findByIdAndUpdate(req.params.id, { status: 'completed' });
        
        // 2. Cari Job terkait transaksi ini dan selesaikan
        const job = await Job.findOneAndUpdate(
            { transactionId: req.params.id }, 
            { status: 'completed' }
        );

        // 3. Update status MEKANIK agar jadi 'nganggur' kembali
        if (job && job.mechanicId) {
            await User.findByIdAndUpdate(job.mechanicId, { 
                status: 'nganggur', 
                currentJob: null 
            });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;