const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');

// IMPORT MODEL
const Part = require('../models/Part'); 
const Service = require('../models/Service'); 
const PartController = require('../controllers/PartController');
const ServiceController = require('../controllers/ServiceController');
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const Motor = require('../models/Motor');
const User = require('../models/User');
const Job = require('../models/Job');

// 1. RUTE PUBLIK (HOME)
const { trackStatusPublic } = require('../controllers/TransactionController');
router.get('/track-status', trackStatusPublic);


// [LOKASI]: src/routes/viewRoutes.js

router.get('/', async (req, res) => {
    try {
        // FIX REDIRECT: Jika ada token atau user, paksa masuk ke dashboard-redirect
        if (req.cookies.jwt || req.cookies.token || req.user) {
            return res.redirect('/dashboard-redirect');
        }
        
        // Ambil data staff untuk tamu (guest) yang belum login
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

// 4. DASHBOARD MEKANIK
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

// 5. DASHBOARD PELANGGAN
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

// 6. MANAJEMEN DATA (Mencegah 404 pada tombol-tombol dashboard)

// --- MANAJEMEN DATA PARTS ---

// 1. Tampilkan Halaman Daftar
router.get('/parts', protect, async (req, res) => {
    try {
        const parts = await Part.find({}).sort({ name: 1 });
        res.render('parts/list', { 
            title: 'Daftar Suku Cadang', 
            parts, 
            user: req.user, 
            activePage: 'parts',
            error: req.query.error || null,
            success: req.query.success || null 
        });
    } catch (error) { res.status(500).send("Error"); }
});

// 2. Tampilkan Halaman Form Tambah
// Rute Tampilan Form
router.get('/parts/add', protect, restrictTo('admin'), (req, res) => {
    res.render('parts/add', { 
        title: 'Tambah Barang', 
        user: req.user, 
        activePage: 'parts',
        error: req.query.error || null 
    });
});

// 3. Aksi Simpan Data (Pemicu 404 jika baris ini hilang)
router.post('/api/parts/add', protect, restrictTo('admin'), PartController.createPartView, (req, res) => {
    res.redirect('/parts?success=Data+berhasil+disimpan');
});

// 4. Aksi Hapus
router.delete('/api/parts/delete/:id', protect, restrictTo('admin'), PartController.deletePart);

// Services (Jasa)
router.get('/services', protect, async (req, res) => {
    try {
        const services = await Service.find({}).sort({ name: 1 });
        res.render('services/list', { title: 'Daftar Jasa', services, user: req.user, activePage: 'services' });
    } catch (error) { res.status(500).send("Error memuat data jasa"); }
});

router.get('/services/add', protect, restrictTo('admin'), (req, res) => {
    res.render('services/add', { title: 'Tambah Jasa', user: req.user, activePage: 'services' });
});

// Rute Hapus Jasa (Gunakan ID yang konsisten)
router.delete('/api/services/delete/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        await Service.findByIdAndDelete(req.params.id);
        res.redirect('/services?delete=success'); // Kembali ke daftar jasa
    } catch (error) {
        res.status(500).send("Gagal menghapus jasa: " + error.message);
    }
});

// Transactions
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

// Users
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

module.exports = router;