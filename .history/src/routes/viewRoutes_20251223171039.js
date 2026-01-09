const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Job = require('../models/Job');
const Transaction = require('../models/Transaction');
const Part = require('../models/Part');
const User = require('../models/User');

// DASHBOARD MEKANIK (Filter: mechanicId)
router.get('/mechanic/dashboard', protect, restrictTo('mekanik', 'admin'), async (req, res) => {
    try {
        const activeJob = await Job.findOne({ mechanicId: req.user._id, status: 'on_progress' });
        const historyJobs = await Job.find({ mechanicId: req.user._id, status: 'completed' }).sort({ updatedAt: -1 });
        const pendingJobs = await Job.find({ mechanicId: req.user._id, status: 'pending' }).sort({ createdAt: -1 });

        res.render('mechanic/dashboard', {
            title: 'Dashboard Mekanik',
            user: req.user,
            activeJob,
            historyJobs,
            pendingJobs,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard mekanik");
    }
});

// DASHBOARD PELANGGAN (Filter: customerId)
router.get('/customer/dashboard', protect, async (req, res) => {
    try {
        const myJobs = await Job.find({ customerId: req.user._id }).sort({ createdAt: -1 });
        res.render('customer/dashboard', {
            title: 'Dashboard Saya',
            user: req.user,
            myJobs,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard pelanggan");
    }
});

// ROUTE LAINNYA (Admin & Kasir)
router.get('/admin/dashboard', protect, restrictTo('admin'), async (req, res) => {
    const lowStockParts = await Part.find({ stock: { $lte: 5 } });
    const recentJobs = await Job.find().sort({ createdAt: -1 }).limit(5);
    res.render('admin/dashboard', { title: 'Admin Dashboard', user: req.user, parts: lowStockParts, transactions: recentJobs, activePage: 'dashboard' });
});

router.get('/kasir/dashboard', protect, restrictTo('kasir', 'admin'), async (req, res) => {
    const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(10);
    const mechanics = await User.find({ role: 'mekanik' });
    res.render('kasir/dashboard', { title: 'Dashboard Kasir', user: req.user, transactions, mechanics, activePage: 'dashboard' });
});

module.exports = router;