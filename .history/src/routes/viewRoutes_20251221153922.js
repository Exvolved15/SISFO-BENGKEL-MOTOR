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

// A. DASHBOARD ROUTES
router.get('/admin/dashboard', protect, restrictTo('admin'), async (req, res) => {
    try {
        const parts = await Part.find({ stock: { $lte: 5 } }).limit(5);
        const recentJobs = await Job.find().sort({ createdAt: -1 }).limit(5);
        
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

// B. PARTS MANAGEMENT
router.get('/parts', protect, async (req, res) => {
    try {
        const parts = await Part.find({});
        res.render('parts/list', { 
            title: 'Daftar Suku Cadang',
            parts,
            activePage: 'parts',
            user: req.user
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

router.get('/parts/add', protect, restrictTo('admin'), (req, res) => {
    res.render('parts/add', {
        title: 'Tambah Suku Cadang',
        activePage: 'parts',
        user: req.user,
        errors: null
    });
});

router.post('/parts/add', protect, restrictTo('admin'), async (req, res) => {
    try {
        await Part.create({
            name: req.body.name,
            code: req.body.code,
            price: parseInt(req.body.price),
            stock: parseInt(req.body.stock),
            description: req.body.description,
            isPart: true 
        });
        res.redirect('/parts');
    } catch (error) {
        res.render('parts/add', {
            title: 'Tambah Suku Cadang',
            activePage: 'parts',
            user: req.user,
            errors: { message: error.message }
        });
    }
});

// C. SERVICES MANAGEMENT
router.get('/services', protect, async (req, res) => {
    try {
        const services = await Service.find({});
        res.render('services/index', {
            title: 'Daftar Jasa Servis',
            services,
            user: req.user,
            activePage: 'services'
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

// D. TRANSACTIONS & JOBS
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

// E. USERS MANAGEMENT
router.get('/users', protect, restrictTo('admin'), async (req, res) => {
    try {
        const users = await User.find({});
        res.render('users/list', { 
            title: 'Manajemen User',
            users,
            user: req.user,
            activePage: 'users'
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

module.exports = router;