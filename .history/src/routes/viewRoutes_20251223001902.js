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
// A. ROUTE DASHBOARD (SINKRONISASI DEPARTMENT & JOB)
// ==================================================================

// Dashboard Admin
// [LOKASI]: src/routes/viewRoutes.js

router.get('/admin/dashboard', protect, restrictTo('admin'), async (req, res) => {
    try {
        // Ambil suku cadang yang stoknya menipis
        const lowStockParts = await Part.find({ stock: { $lte: 5 } }); 
        
        // Ambil pekerjaan terbaru
        const recentJobs = await Job.find().sort({ createdAt: -1 }).limit(5);
        
        // FIX: Ambil semua data user untuk statistik tim
        const users = await User.find({}).sort({ role: 1 }); 

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            user: req.user,
            parts: lowStockParts,
            transactions: recentJobs,
            users: users, // WAJIB DIKIRIM ke EJS
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard: " + error.message);
    }
});

// Dashboard Kasir
router.get('/kasir/dashboard', protect, restrictTo('kasir', 'admin'), async (req, res) => {
    try {
        // Ambil transaksi hari ini
        const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(10);
        // Ambil mekanik lengkap dengan field department
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

// Dashboard Mekanik (FIXED: Menambahkan historyJobs)
// [LOKASI]: src/routes/viewRoutes.js

// Dashboard Mekanik
router.get('/mechanic/dashboard', protect, restrictTo('mekanik', 'admin'), async (req, res) => {
    try {
        // Cari pekerjaan yang SEDANG dikerjakan oleh mekanik ini (berdasarkan ID)
        const activeJob = await Job.findOne({ 
            mechanicId: req.user._id, 
            status: 'on_progress' 
        });

        // Cari riwayat pekerjaan yang SUDAH SELESAI oleh mekanik ini
        const historyJobs = await Job.find({ 
            mechanicId: req.user._id, 
            status: 'completed' 
        }).sort({ updatedAt: -1 });

        res.render('mechanic/dashboard', {
            title: 'Dashboard Mekanik',
            user: req.user,
            activeJob: activeJob, // Mengirim satu job aktif
            historyJobs: historyJobs, // Mengirim daftar riwayat
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard");
    }
});
// Dashboard Pelanggan
router.get('/customer/dashboard', protect, async (req, res) => {
    try {
        // Ambil riwayat servis berdasarkan ID user yang sedang login
        // Pastikan variabelnya bernama 'myJobs' agar cocok dengan EJS
        const myJobs = await Job.find({ customer: req.user._id }).sort({ createdAt: -1 });

        res.render('customer/dashboard', {
            title: 'Dashboard Saya',
            user: req.user,
            myJobs: myJobs, // <--- INI KUNCINYA (Harus dikirim ke view)
            activePage: 'dashboard'
        });
    } catch (error) {
        console.error("Customer Dashboard Error:", error);
        res.status(500).send("Gagal memuat dashboard");
    }
});

// ==================================================================
// B. ROUTE TRANSAKSI (SINKRONISASI MOTOR & PELANGGAN)
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

// 2. Form Buat Transaksi Baru (SINKRONISASI MOTORS)
router.get('/transactions/add', protect, restrictTo('admin', 'kasir'), async (req, res) => {
    try {
        const parts = await Part.find({ stock: { $gt: 0 } }); 
        const services = await Service.find({});
        const motors = await Motor.find().sort({ brand: 1 }); // Fix: Dropdown Motor
        const mechanics = await User.find({ role: 'mekanik' }).sort({ department: 1 });
        const users = await User.find({ role: { $in: ['user', 'customer'] } }).sort({ name: 1 });

        res.render('transactions/add', { 
            title: 'Buat Transaksi Baru', 
            parts, 
            services, 
            motors, // Dikirim agar tidak ReferenceError
            mechanics, 
            users, 
            user: req.user,
            activePage: 'transactions'
        });
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
});

// 3. Detail Transaksi (FIX: Mencegah 404 & Undefined)
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

// Menambahkan rute Detail Job untuk Mekanik (Read-Only)
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

// 4. Cetak Struk
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
// C. ROUTE MANAJEMEN USER (SINKRONISASI DEPARTMENT)
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

// Form Edit User (Menambahkan Department)
router.get('/users/edit/:id', protect, async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        
        // Proteksi tambahan: User non-admin hanya bisa edit dirinya sendiri
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
            return res.render('error/403', { title: 'Akses Ditolak', user: req.user });
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
// D. ROUTE SUKU CADANG & JASA
// ==================================================================

router.get('/parts', protect, async (req, res) => {
    try {
        const parts = await Part.find({}).sort({ name: 1 });
        res.render('parts/list', { title: 'Daftar Suku Cadang', parts, user: req.user, activePage: 'parts' });
    } catch (error) { res.status(500).send("Error"); }
});

router.get('/parts/add', protect, restrictTo('admin'), (req, res) => {
    res.render('parts/add', { title: 'Tambah Suku Cadang', user: req.user, activePage: 'parts' });
});

router.get('/services', protect, async (req, res) => {
    try {
        const services = await Service.find({ isPart: false }).sort({ code: 1 });
        res.render('services/index', { title: 'Daftar Jasa', services, user: req.user, activePage: 'services' });
    } catch (error) { res.status(500).send("Gagal"); }
});

router.get('/services/add', protect, restrictTo('admin'), (req, res) => {
    res.render('services/add', { title: 'Tambah Jasa', user: req.user, activePage: 'services' });
});

router.get('/services/edit/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        res.render('services/edit', { title: 'Edit Jasa', service, user: req.user, activePage: 'services' });
    } catch (error) { res.status(500).send("Error"); }
});

module.exports = router;