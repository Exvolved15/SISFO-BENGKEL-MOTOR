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

// 1. RUTE PUBLIK (HOME & ABOUT)
const { trackStatusPublic } = require('../controllers/TransactionController');
router.get('/track-status', trackStatusPublic);

// FIX: Menambahkan pengambilan data staff agar Overview di Index Sinkron
router.get('/', async (req, res) => {
    try {
        if (req.cookies.jwt || req.user) return res.redirect('/dashboard-redirect');
        
        // SINKRONISASI: Ambil data staff lengkap (bio & status ditambahkan)
        const staff = await User.find({ 
            role: { $in: ['admin', 'kasir', 'mekanik'] } 
        }).select('name role profileImage status bio').lean();

        res.render('index', { 
            title: 'Overview Sisfo Bengkel', 
            activePage: 'home',
            staffList: staff,
            error: req.query.error || null
        });
    } catch (error) {
        res.render('index', { 
            title: 'Overview Sisfo Bengkel', 
            activePage: 'home',
            staffList: [], 
            error: "Gagal memuat data staff."
        });
    }
});

router.get('/about', (req, res) => {
    res.render('about', { title: 'Tentang Kami', activePage: 'about' });
});

// DASHBOARD REDIRECT
router.get('/dashboard-redirect', protect, (req, res) => {
    const role = req.user.role;
    if (role === 'admin') return res.redirect('/admin/dashboard');
    if (role === 'kasir') return res.redirect('/kasir/dashboard');
    if (role === 'mekanik') return res.redirect('/mechanic/dashboard');
    return res.redirect('/customer/dashboard');
});
// 2. DASHBOARD MEKANIK (SINKRONISASI JOB)
router.get('/mechanic/dashboard', protect, restrictTo('mekanik', 'admin'), async (req, res) => {
    try {
        // Cari Job berdasarkan ID mekanik yang sedang login
        const historyJobs = await Job.find({ mechanicId: req.user._id }).sort({ createdAt: -1 });
        res.render('mechanic/dashboard', {
            title: 'Dashboard Mekanik',
            user: req.user,
            historyJobs: historyJobs, 
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard mekanik");
    }
});

// 3. DASHBOARD PELANGGAN (SINKRONISASI UNIT)
router.get('/customer/dashboard', protect, async (req, res) => {
    try {
        // Cari Job berdasarkan ID pelanggan yang sedang login
        const myJobs = await Job.find({ customerId: req.user._id }).sort({ createdAt: -1 });
        res.render('customer/dashboard', {
            title: 'Dashboard Saya',
            user: req.user,
            myJobs: myJobs,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Error memuat dashboard pelanggan");
    }
});

// ... (Rute Admin & Kasir tetap sama seperti sebelumnya)

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