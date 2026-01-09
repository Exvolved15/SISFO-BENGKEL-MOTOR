const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');

// ==================================================================
// 1. IMPORT MODEL
// ==================================================================
const Part = require('../models/Part'); 
const Service = require('../models/Service'); 
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const User = require('../models/User');
const Job = require('../models/Job');

// ==================================================================
// A. ROUTE DASHBOARD
// ==================================================================

// Dashboard Admin
router.get('/admin/dashboard', protect, restrictTo('admin'), async (req, res) => {
    try {
        const lowStockParts = await Part.find({ stock: { $lte: 5 } }); 
        const recentJobs = await Job.find().sort({ createdAt: -1 }).limit(5);
        
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            user: req.user,
            parts: lowStockParts,
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
        const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(10);
        const mechanics = await User.find({ role: 'mekanik' }); 

        res.render('kasir/dashboard', {
            title: 'Dashboard Kasir',
            user: req.user,
            transactions: transactions || [],
            mechanics: mechanics || [], 
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Terjadi kesalahan pada server");
    }
});

// Dashboard Pelanggan
router.get('/customer/dashboard', protect, restrictTo('customer', 'user'), async (req, res) => {
    try {
        const transactions = await Transaction.find({ customer: req.user._id }).sort({ createdAt: -1 });
        const jobs = await Job.find({ customerId: req.user._id }).populate('mechanicId');

        res.render('customer/dashboard', { 
            title: 'Dashboard Pelanggan',
            user: req.user,
            transactions: transactions || [],
            jobs: jobs || [],
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat halaman");
    }
});

// ==================================================================
// D. ROUTE TRANSAKSI (BAGIAN YANG DIPERBAIKI)
// ==================================================================

// 1. List Riwayat Transaksi
router.get('/transactions', protect, restrictTo('admin', 'kasir'), async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
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

// 2. Form Buat Transaksi Baru (FIXED: Menambahkan Variabel 'users')
router.get('/transactions/add', protect, restrictTo('admin', 'kasir'), async (req, res) => {
    try {
        const parts = await Part.find({}); 
        const services = await Service.find({});
        const mechanics = await User.find({ role: 'mekanik' });

        // PERBAIKAN: Ambil semua user yang BUKAN admin/kasir/mekanik agar lebih aman
        const users = await User.find({ 
            role: { $in: ['user', 'customer', 'pelanggan'] } 
        }).sort({ name: 1 });

        // Log untuk memastikan data ada di terminal
        console.log(`Sistem menemukan ${users.length} akun pelanggan.`);

        res.render('transactions/add', { 
            title: 'Buat Transaksi Baru', 
            parts, 
            services, 
            mechanics, 
            users, // Data ini dikirim ke EJS
            user: req.user,
            activePage: 'transactions'
        });

    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
});

// 3. Cetak Struk
router.get('/transactions/print/:id', protect, async (req, res) => {
    try {
        const transactionId = req.params.id;
        const transaction = await Transaction.findById(transactionId);
        
        if (!transaction) return res.status(404).send("Data Transaksi tidak ditemukan.");

        const details = await TransactionDetail.find({ transactionId: transactionId });

        res.render('transactions/receipt', { 
            title: `Struk - ${transaction.invoiceNumber}`,
            transaction: transaction, 
            details: details || [], 
            layout: false 
        });
    } catch (error) {
        res.status(500).send("Terjadi kesalahan pada server saat memproses struk.");
    }
});

// ==========================================
// RUTE MANAJEMEN DATA LAINNYA
// ==========================================

// List Suku Cadang
router.get('/parts', protect, async (req, res) => {
    try {
        const parts = await Part.find({});
        res.render('parts/list', { title: 'Daftar Suku Cadang', parts, user: req.user, activePage: 'parts' });
    } catch (error) { res.status(500).send(error.message); }
});

// List Jasa
router.get('/services', protect, async (req, res) => {
    try {
        const services = await Service.find({});
        res.render('services/index', { title: 'Daftar Jasa Servis', services, user: req.user, activePage: 'services' });
    } catch (error) { res.status(500).send(error.message); }
});

// List User (Admin Only)
router.get('/users', protect, restrictTo('admin'), async (req, res) => {
    try {
        const users = await User.find({});
        res.render('users/list', { title: 'Manajemen User', users, user: req.user, activePage: 'users' });
    } catch (error) { res.status(500).send(error.message); }
});

module.exports = router;