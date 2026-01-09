// [LOKASI]: src/routes/viewRoutes.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');

const Part = require('../models/Part'); 
const Service = require('../models/Service'); 
const PartController = require('../controllers/PartController');
const ServiceController = require('../controllers/ServiceController');
const TransactionController = require('../controllers/TransactionController');
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const Motor = require('../models/Motor');
const User = require('../models/User');
const Job = require('../models/Job');

const { trackStatusPublic } = require('../controllers/TransactionController');

router.get('/', async (req, res) => {
    try {
        if (req.cookies.jwt || req.cookies.token || req.user) {
            return res.redirect('/dashboard-redirect');
        }
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
        res.render('index', { title: 'Overview', staffList: [], activePage: 'home', error: null });
    }
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

router.get('/admin/dashboard', protect, restrictTo('admin'), async (req, res) => {
    try {
        const allParts = await Part.find({}); 
        const recentJobs = await Job.find().sort({ createdAt: -1 }).limit(5);
        const users = await User.find({}).sort({ role: 1 }); 

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            user: req.user,
            parts: allParts,
            transactions: recentJobs,
            users: users,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard: " + error.message);
    }
});

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

router.get('/customer/dashboard', protect, async (req, res) => {
    try {
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

// --- MANAJEMEN DATA PARTS ---
router.get('/parts', protect, PartController.getAllParts);

router.get('/parts/add', protect, restrictTo('admin'), (req, res) => {
    res.render('parts/add', { 
        title: 'Tambah Barang', 
        user: req.user, 
        activePage: 'parts',
        error: req.query.error || null 
    });
});

router.post('/api/parts/add', protect, restrictTo('admin'), PartController.createPartView);

// FIX: Gunakan PartController (P Besar) sesuai import di line 8
router.get('/parts/:id/edit', protect, restrictTo('admin'), PartController.getEditPage);

router.delete('/api/parts/delete/:id', protect, restrictTo('admin'), PartController.deletePart);

// --- SERVICES ---
router.get('/services', protect, async (req, res) => {
    try {
        const services = await Service.find({}).sort({ name: 1 });
        res.render('services/list', { title: 'Daftar Jasa', services, user: req.user, activePage: 'services' });
    } catch (error) { res.status(500).send("Error memuat data jasa"); }
});

// TAMBAHKAN: Rute View Edit Jasa
router.get('/services/:id/edit', protect, restrictTo('admin'), ServiceController.getEditPage);

// TAMBAHKAN: Rute API Update Jasa
router.put('/api/services/:id', protect, restrictTo('admin'), ServiceController.updateService);

router.delete('/api/services/delete/:id', protect, restrictTo('admin'), ServiceController.deleteService);

// --- TRANSACTIONS ---
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

// --- USERS ---
router.get('/users', protect, restrictTo('admin'), async (req, res) => {
    try {
        const users = await User.find({}).sort({ role: 1 });
        res.render('users/list', { title: 'Manajemen User', users, user: req.user, activePage: 'users' });
    } catch (error) { res.status(500).send(error.message); }
});

router.get('/register', protect, restrictTo('admin'), (req, res) => {
    res.render('auth/register', { title: 'Registrasi Staf Baru', user: req.user, activePage: 'users' });
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
        res.status(500).send("Server Error: " + error.message);
    }
});

router.get('/admin/report', protect, restrictTo('admin'), TransactionController.getProfitReport);
router.get('/admin/report/export', protect, restrictTo('admin'), TransactionController.exportProfitToExcel);

router.get('/customer/booking', protect, (req, res) => {
    res.render('customer/booking', { 
        title: 'Booking Service Online', 
        user: req.user,
        activePage: 'booking' 
    });
});

module.exports = router;