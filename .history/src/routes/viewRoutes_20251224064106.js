const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');

// IMPORT MODEL
const Part = require('../models/Part'); 
const Service = require('../models/Service'); 
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const Motor = require('../models/Motor');
const User = require('../models/User');
const Job = require('../models/Job');

// 1. RUTE PUBLIK
const { trackStatusPublic } = require('../controllers/TransactionController');
router.get('/track-status', trackStatusPublic);

router.get('/', (req, res) => {
    if (req.cookies.jwt || req.user) return res.redirect('/dashboard-redirect');
    res.render('index', { title: 'Overview Sisfo Bengkel', activePage: 'home' });
});

router.get('/about', (req, res) => {
    res.render('about', { title: 'Tentang Kami', activePage: 'about' });
});

router.get('/dashboard-redirect', protect, (req, res) => {
    const role = req.user.role;
    if (role === 'admin') return res.redirect('/admin/dashboard');
    if (role === 'kasir') return res.redirect('/kasir/dashboard');
    if (role === 'mekanik') return res.redirect('/mechanic/dashboard');
    return res.redirect('/customer/dashboard');
});

// 2. DASHBOARD ADMIN
router.get('/admin/dashboard', protect, restrictTo('admin'), async (req, res) => {
    try {
        const lowStockParts = await Part.find({ stock: { $lte: 5 } }); 
        const recentJobs = await Job.find().sort({ createdAt: -1 }).limit(5);
        const users = await User.find({}).sort({ role: 1 }); 
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            user: req.user,
            parts: lowStockParts,
            transactions: recentJobs,
            users: users,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard: " + error.message);
    }
});

// 3. DASHBOARD KASIR
router.get('/kasir/dashboard', protect, restrictTo('kasir', 'admin'), async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(10);
        const mechanics = await User.find({ role: 'mekanik' }).sort({ department: 1 }); 
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

// Dashboard Mekanik
router.get('/mechanic/dashboard', protect, restrictTo('mekanik', 'admin'), async (req, res) => {
    try {
        const historyJobs = await Job.find({ mechanicId: req.user._id }).sort({ createdAt: -1 });
        res.render('mechanic/dashboard', {
            title: 'Dashboard Mekanik',
            user: req.user,
            historyJobs: historyJobs, 
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard");
    }
});

// Dashboard Pelanggan
router.get('/customer/dashboard', protect, async (req, res) => {
    try {
        // Cari Job berdasarkan field customerId yang kita set di TransactionController tadi
        const myJobs = await Job.find({ customerId: req.user._id }).sort({ createdAt: -1 });
        res.render('customer/dashboard', {
            title: 'Dashboard Saya',
            user: req.user,
            myJobs: myJobs,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Error");
    }
});

// 6. MANAJEMEN DATA (TRANSAKSI, PARTS, USERS)
router.get('/transactions', protect, restrictTo('admin', 'kasir'), async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
        res.render('transactions/list', { title: 'Riwayat Transaksi', transactions, user: req.user, activePage: 'transactions' });
    } catch (error) { res.status(500).send("Gagal memuat riwayat transaksi"); }
});

router.get('/transactions/add', protect, restrictTo('admin', 'kasir'), async (req, res) => {
    try {
        const parts = await Part.find({ stock: { $gt: 0 } }); 
        const services = await Service.find({});
        const motors = await Motor.find().sort({ brand: 1 });
        const mechanics = await User.find({ role: 'mekanik' }).sort({ department: 1 });
        const users = await User.find({ role: { $in: ['user', 'customer'] } }).sort({ name: 1 });
        res.render('transactions/add', { title: 'Buat Transaksi Baru', parts, services, motors, mechanics, users, user: req.user, activePage: 'transactions' });
    } catch (error) { res.status(500).send("Error: " + error.message); }
});

router.get('/transactions/detail/:id', protect, async (req, res) => {
    try {
        const header = await Transaction.findById(req.params.id);
        const details = await TransactionDetail.find({ transactionId: header._id });
        res.render('transactions/detail', { title: 'Detail Transaksi', header, details: details || [], user: req.user, activePage: 'transactions' });
    } catch (error) { res.status(500).send("Error memuat detail"); }
});

router.get('/parts', protect, async (req, res) => {
    try {
        const parts = await Part.find({}).sort({ name: 1 });
        res.render('parts/list', { title: 'Daftar Suku Cadang', parts, user: req.user, activePage: 'parts' });
    } catch (error) { res.status(500).send("Error memuat data parts"); }
});

router.get('/users', protect, restrictTo('admin'), async (req, res) => {
    try {
        const users = await User.find({}).sort({ role: 1 });
        res.render('users/list', { title: 'Manajemen User', users, user: req.user, activePage: 'users' });
    } catch (error) { res.status(500).send(error.message); }
});
router.get('/users/edit/:id', protect, async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).send("User tidak ditemukan");
        
        res.render('users/edit', {
            title: 'Pengaturan Akun',
            targetUser: targetUser,
            user: req.user,
            activePage: 'profile'
        });
    } catch (error) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;