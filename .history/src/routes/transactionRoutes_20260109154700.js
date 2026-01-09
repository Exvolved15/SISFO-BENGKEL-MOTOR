const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/TransactionController');
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const Job = require('../models/Job');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// --- RUTE DATA API (Khusus Staff) ---
router.get('/', protect, restrictTo('admin', 'kasir'), transactionController.getAllTransactions);
router.post('/', protect, restrictTo('admin', 'kasir'), transactionController.createTransaction);

// --- RUTE PRINT (Dapat diakses Admin, Kasir, dan Customer) ---
// Perbaikan: Menghapus duplikasi dan menambahkan role 'customer'
router.get('/print/:identifier', protect, restrictTo('admin', 'kasir', 'customer'), async (req, res) => {
    try {
        const { identifier } = req.params;
        
        // Cari berdasarkan Invoice Number ATAU ID (Mencegah 404 jika salah satu yang dikirim)
        let transaction = await Transaction.findOne({ invoiceNumber: identifier });
        if (!transaction) {
            // Jika tidak ditemukan lewat invoice, coba cari lewat MongoDB ID
            if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
                transaction = await Transaction.findById(identifier);
            }
        }
        
        if (!transaction) {
            return res.status(404).send('Nota tidak ditemukan di database.');
        }

        // Cari detail item berdasarkan invoice number dari transaksi yang ditemukan
        const details = await TransactionDetail.find({ invoiceNumber: transaction.invoiceNumber });

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

// --- RUTE DETAIL LAINNYA ---
router.get('/:id/detail', protect, restrictTo('admin', 'kasir'), transactionController.getTransaction);
router.get('/:id', protect, restrictTo('admin', 'kasir'), transactionController.getTransaction);

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