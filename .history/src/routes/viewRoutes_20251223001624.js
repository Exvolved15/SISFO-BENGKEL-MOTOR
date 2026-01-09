// [LOKASI]: src/routes/viewRoutes.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Job = require('../models/Job');
const Part = require('../models/Part');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// DASHBOARD ADMIN
router.get('/admin/dashboard', restrictTo('admin'), async (req, res) => {
    const lowStockParts = await Part.find({ stock: { $lte: 5 } });
    const users = await User.find({}).sort({ role: 1 });
    res.render('admin/dashboard', { title: 'Admin Dashboard', parts: lowStockParts, users, activePage: 'dashboard' });
});

// DASHBOARD MEKANIK (FIXED: Riwayat Terpusat)
router.get('/mechanic/dashboard', restrictTo('mekanik', 'admin'), async (req, res) => {
    try {
        const activeJob = await Job.findOne({ mechanicId: req.user._id, status: 'on_progress' });
        const historyJobs = await Job.find({ mechanicId: req.user._id }).sort({ updatedAt: -1 });
        
        res.render('mechanic/dashboard', {
            title: 'Dashboard Mekanik',
            activeJob,
            historyJobs, // Digunakan untuk filter pending & completed di EJS
            activePage: 'dashboard'
        });
    } catch (err) {
        res.status(500).send("Gagal memuat dashboard");
    }
});

// DETAIL TRANSAKSI (Read-Only untuk semua role yang berhak)
router.get('/transactions/detail/:id', async (req, res) => {
    const header = await Transaction.findById(req.params.id);
    const details = await require('../models/TransactionDetail').find({ transactionId: req.params.id });
    res.render('transactions/detail', { title: 'Detail Transaksi', header, details, activePage: 'transactions' });
});

module.exports = router;