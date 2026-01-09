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
const Motor = require('../models/Motor');
const User = require('../models/User');
const Job = require('../models/Job');

// ==================================================================
// 2. RUTE PUBLIK (OVERVIEW)
// ==================================================================
router.get('/', (req, res) => {
    // Jika user sudah login, redirect otomatis ke dashboard masing-masing
    if (req.cookies.jwt || req.user) {
        return res.redirect('/dashboard-redirect');
    }
    res.render('index', { 
        title: 'Overview Sisfo Bengkel',
        user: null,
        activePage: 'home'
    });
});

router.get('/about', (req, res) => {
    res.render('about', { 
        title: 'Tentang Sisfo Bengkel',
        activePage: 'about',
        user: res.locals.user || null // Agar navbar tetap konsisten
    });
});

// Helper rute untuk menentukan dashboard berdasarkan role
router.get('/dashboard-redirect', protect, (req, res) => {
    const role = req.user.role;
    if (role === 'admin') return res.redirect('/admin/dashboard');
    if (role === 'kasir') return res.redirect('/kasir/dashboard');
    if (role === 'mekanik') return res.redirect('/mechanic/dashboard');
    return res.redirect('/customer/dashboard');
});

// ==================================================================
// 3. RUTE DASHBOARD (TERPROTEKSI)
// ==================================================================

// Dashboard Admin
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

// Dashboard Kasir
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
        // Cari pekerjaan aktif milik mekanik ini
        const activeJob = await Job.findOne({ 
            mechanicId: req.user._id, 
            status: 'on_progress' 
        });

        // Cari riwayat selesai milik mekanik ini
        const historyJobs = await Job.find({ 
            mechanicId: req.user._id, 
            status: 'completed' 
        }).sort({ updatedAt: -1 });

        res.render('mechanic/dashboard', {
            title: 'Dashboard Mekanik',
            user: req.user,
            activeJob: activeJob,
            historyJobs: historyJobs,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard mekanik");
    }
});

// Dashboard Pelanggan
router.get('/customer/dashboard', protect, async (req, res) => {
    try {
        const myJobs = await Job.find({ customer: req.user._id }).sort({ createdAt: -1 });
        res.render('customer/dashboard', {
            title: 'Dashboard Saya',
            user: req.user,
            myJobs: myJobs,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard pelanggan");
    }
});

// ==================================================================
// 4. MANAJEMEN TRANSAKSI & JOB
// ==================================================================

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

router.get('/transactions/add', protect, restrictTo('admin', 'kasir'), async (req, res) => {
    try {
        const parts = await Part.find({ stock: { $gt: 0 } }); 
        const services = await Service.find({});
        const motors = await Motor.find().sort({ brand: 1 });
        const mechanics = await User.find({ role: 'mekanik' }).sort({ department: 1 });
        const users = await User.find({ role: { $in: ['user', 'customer'] } }).sort({ name: 1 });

        res.render('transactions/add', { 
            title: 'Buat Transaksi Baru', 
            parts, 
            services, 
            motors, 
            mechanics, 
            users, 
            user: req.user,
            activePage: 'transactions'
        });
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
});

router.get('/transactions/detail/:id', protect, async (req, res) => {
    try {
        const header = await Transaction.findById(req.params.id);
        if (!header) return res.status(404).send("Transaksi tidak ditemukan");
        const details = await TransactionDetail.find({ transactionId: header._id });

        res.render('transactions/detail', { 
            title: 'Detail Transaksi',
            header,
            details: details || [],
            user: req.user,
            activePage: 'transactions'
        });
    } catch (error) {
        res.status(500).send("Error memuat detail");
    }
});

router.get('/jobs/detail/:id', protect, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).send("Data pekerjaan tidak ditemukan");
        res.render('jobs/detail', {
            title: 'Detail Pekerjaan',
            job,
            user: req.user,
            activePage: 'dashboard'
        });
    } catch (err) {
        res.status(500).send("Error memuat detail pekerjaan");
    }
});

router.get('/transactions/print/:id', protect, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).send("Data tidak ditemukan.");
        const details = await TransactionDetail.find({ transactionId: transaction._id });
        res.render('transactions/receipt', { 
            title: `Struk - ${transaction.invoiceNumber}`,
            transaction, 
            details: details || [], 
            layout: false 
        });
    } catch (error) {
        res.status(500).send("Terjadi kesalahan pada server.");
    }
});

// ==================================================================
// 5. MANAJEMEN USER & PROFILE
// ==================================================================

router.get('/users', protect, restrictTo('admin'), async (req, res) => {
    try {
        const users = await User.find({}).sort({ role: 1 });
        res.render('users/list', { 
            title: 'Manajemen User', 
            users, 
            user: req.user, 
            activePage: 'users' 
        });
    } catch (error) { 
        res.status(500).send(error.message); 
    }
});

router.get('/users/edit/:id', protect, async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
            return res.status(403).send("Akses Ditolak: Anda hanya bisa mengedit profil sendiri.");
        }
        res.render('users/edit', {
            title: 'Edit Profil',
            targetUser,
            user: req.user,
            activePage: 'profile'
        });
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
});

// ==================================================================
// 6. MANAJEMEN INVENTORI (PARTS & SERVICES)
// ==================================================================

router.get('/parts', protect, async (req, res) => {
    try {
        const parts = await Part.find({}).sort({ name: 1 });
        res.render('parts/list', { title: 'Daftar Suku Cadang', parts, user: req.user, activePage: 'parts' });
    } catch (error) { res.status(500).send("Error memuat data parts"); }
});

router.get('/parts/add', protect, restrictTo('admin'), (req, res) => {
    res.render('parts/add', { title: 'Tambah Suku Cadang', user: req.user, activePage: 'parts' });
});

router.get('/services', protect, async (req, res) => {
    try {
        const services = await Service.find({ isPart: false }).sort({ code: 1 });
        res.render('services/index', { title: 'Daftar Jasa', services, user: req.user, activePage: 'services' });
    } catch (error) { res.status(500).send("Gagal memuat data jasa"); }
});

router.get('/services/add', protect, restrictTo('admin'), (req, res) => {
    res.render('services/add', { title: 'Tambah Jasa', user: req.user, activePage: 'services' });
});

router.get('/services/edit/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        res.render('services/edit', { title: 'Edit Jasa', service, user: req.user, activePage: 'services' });
    } catch (error) { res.status(500).send("Error memuat data jasa"); }
});

module.exports = router;