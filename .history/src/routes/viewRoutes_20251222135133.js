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

        // Ambil semua user yang role-nya adalah pelanggan/user
        const users = await User.find({ 
            role: { $in: ['user', 'customer'] } 
        }).sort({ name: 1 });

        // DEBUG: Cek di terminal apakah field 'nickname' atau 'name' ada isinya
        console.log("Daftar Pelanggan:", users.map(u => u.name || u.nickname));

        res.render('transactions/add', { 
            title: 'Buat Transaksi Baru', 
            parts, 
            services, 
            mechanics, 
            users, // Mengirim data user ke EJS
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
        const parts = await Part.find({}).sort({ name: 1 });
        res.render('parts/list', { 
            title: 'Daftar Suku Cadang', 
            parts, 
            user: req.user, 
            activePage: 'parts' 
        });
    } catch (error) {
        res.status(500).send("Error memuat daftar suku cadang");
    }
});

// Form Tambah Suku Cadang (Menghilangkan error 404 saat klik tombol hijau)
router.get('/parts/add', protect, restrictTo('admin'), (req, res) => {
    res.render('parts/add', { 
        title: 'Tambah Suku Cadang Baru', 
        user: req.user, 
        activePage: 'parts' 
    });
});
// 1. Tampilan Daftar Jasa
// src/routes/viewRoutes.js
router.get('/services', protect, async (req, res) => {
    try {
        // Ambil data jasa dari database
        const services = await Service.find({ isPart: false }).sort({ code: 1 });
        
        // Kirim data ke file views/services/index.ejs
        res.render('services/index', { 
            title: 'Daftar Jasa Servis', 
            services: services, 
            user: req.user, 
            activePage: 'services' 
        });
    } catch (error) {
        res.status(500).send("Gagal memuat halaman jasa");
    }
});
// 2. Tampilan Form Tambah (Mencegah 404 saat buka halaman)
router.get('/services/add', protect, restrictTo('admin'), (req, res) => {
    res.render('services/add', { 
        title: 'Tambah Jasa Servis Baru', 
        user: req.user, 
        activePage: 'services' 
    });
});
// Menampilkan halaman edit/detail jasa servis
router.get('/services/edit/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        // Cari data jasa berdasarkan ID dari URL
        const service = await Service.findById(req.params.id);
        
        if (!service) {
            return res.status(404).send("Jasa servis tidak ditemukan");
        }

        res.render('services/edit', { 
            title: 'Edit Jasa Servis', 
            service: service, 
            user: req.user, 
            activePage: 'services' 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error mengakses detail jasa");
    }
});
// List User (Admin Only)
router.get('/users', protect, restrictTo('admin'), async (req, res) => {
    try {
        const users = await User.find({});
        res.render('users/list', { title: 'Manajemen User', users, user: req.user, activePage: 'users' });
    } catch (error) { res.status(500).send(error.message); }
});

module.exports = router;