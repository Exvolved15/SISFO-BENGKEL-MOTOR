const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');

// IMPORT MODELS
const Part = require('../models/Part'); 
const Service = require('../models/Service'); 
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const User = require('../models/User');
const Job = require('../models/Job');

// ==========================================
// A. DASHBOARD ROUTES (ADMIN, KASIR, MEKANIK)
// ==========================================

// Dashboard Admin - Menampilkan Kotak Manajemen & Stok Kritis
router.get('/admin/dashboard', protect, restrictTo('admin'), async (req, res) => {
    try {
        const parts = await Part.find({ stock: { $lte: 5 } }).limit(5); // Peringatan stok
        const recentJobs = await Job.find().sort({ createdAt: -1 }).limit(5); // Riwayat transaksi terakhir
        
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            user: req.user,
            parts, 
            transactions: recentJobs,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard: " + error.message);
    }
});

// Dashboard Kasir
router.get('/kasir/dashboard', protect, restrictTo('kasir', 'admin'), async (req, res) => {
    try {
        const history = await Job.find().sort({ createdAt: -1 }).limit(10);
        res.render('kasir/dashboard', {
            title: 'Dashboard Kasir',
            user: req.user,
            transactions: history, 
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard: " + error.message);
    }
});

// Dashboard Mekanik - Sinkron dengan JobController
router.get('/mechanic/dashboard', protect, restrictTo('mekanik'), async (req, res) => {
    try {
        // Job yang tersedia untuk diambil (status pending)
        const pendingJobs = await Job.find({ status: 'pending' }).sort({ createdAt: -1 });
        // Riwayat job yang sedang diproses atau selesai oleh semua mekanik
        const historyJobs = await Job.find({ status: { $ne: 'pending' } })
                                     .populate('assignedTo', 'name')
                                     .sort({ updatedAt: -1 }).limit(10);

        res.render('mechanic/dashboard', { 
            title: 'Dashboard Mekanik', 
            pendingJobs, 
            historyJobs,
            user: req.user,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard mekanik: " + error.message);
    }
});

// ==========================================
// B. TRANSAKSI & NAVIGASI (Sesuai Permintaan)
// ==========================================

// List Riwayat Transaksi
router.get('/transactions', protect, restrictTo('admin', 'kasir'), async (req, res) => {
    try {
        const transactions = await Job.find().sort({ createdAt: -1 });
        res.render('transactions/list', {
            title: 'Riwayat Transaksi',
            transactions,
            user: req.user,
            activePage: 'transactions'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat riwayat transaksi");
    }
});

// Form Transaksi Baru
router.get('/transactions/add', protect, restrictTo('admin', 'kasir'), async (req, res) => {
    try {
        const parts = await Part.find({ stock: { $gt: 0 } }); 
        const services = await Service.find({});
        const mechanics = await User.find({ role: 'mekanik' });

        res.render('transactions/add', { 
            title: 'Buat Transaksi Baru', 
            parts, 
            services, 
            mechanics, 
            user: req.user,
            activePage: 'transactions'
        });
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
});

module.exports = router;