const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');

// ==================================================================
// 1. IMPORT MODEL (HANYA SEKALI DI SINI)
// ==================================================================
const Part = require('../models/Part'); 
const Service = require('../models/Service'); 
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const User = require('../models/User');
const Job = require('../models/Job');

// ==================================================================
// 2. IMPORT CONTROLLER LOGIC (JIKA DIPERLUKAN)
// ==================================================================
// Kita import TransactionController untuk jaga-jaga, tapi view biasanya handle render saja
const TransactionController = require('../controllers/TransactionController');


// ==================================================================
// A. ROUTE DASHBOARD (ADMIN & KASIR)
// ==================================================================

// Dashboard Admin
router.get('/admin/dashboard', protect, restrictTo('admin'), async (req, res) => {
    try {
        // Ambil barang yang stoknya 5 atau kurang
        const lowStockParts = await Part.find({ stock: { $lte: 5 } }); 
        const recentJobs = await Job.find().sort({ createdAt: -1 }).limit(5);
        
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            user: req.user,
            parts: lowStockParts, // Data untuk tabel stok kritis
            transactions: recentJobs,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard: " + error.message);
    }
});

// 1. Data User (Admin Only)
router.get('/users', protect, restrictTo('admin'), async (req, res) => {
    try {   
    const users = await User.find({});
    res.render('users/list', { title: 'Manajemen User', users, user: req.user, activePage: 'users' });
    } catch (error) { res.status(500).send("Error: " + error.message); }
});

// 2. Suku Cadang
router.get('/parts', protect, async (req, res) => {
    try {
        const parts = await Part.find({}); // Pastikan variabel 'parts' dikirim
        res.render('parts/list', { title: 'Daftar Suku Cadang', parts, user: req.user, activePage: 'parts' });
    } catch (error) { res.status(500).send("Error: " + error.message); }
});

// 3. Jasa Servis
router.get('/services', protect, async (req, res) => {
    try {
        const services = await Service.find({});
    res.render('services/index', { title: 'Daftar Jasa Servis', services, user: req.user, activePage: 'services' });
    } catch (error) { res.status(500).send("Error: " + error.message); }
});

// 4. Riwayat Transaksi
router.get('/transactions', protect, restrictTo('admin', 'kasir'), async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.render('transactions/list', { title: 'Riwayat Transaksi', transactions, user: req.user, activePage: 'transactions' });
    } catch (error) { res.status(500).send("Error: " + error.message); }
});

// Dashboard Kasir
router.get('/kasir/dashboard', protect, restrictTo('kasir', 'admin'), async (req, res) => {
    try {
        // 1. Ambil data Transaksi terbaru
        const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(10);

        // 2. Ambil data User yang rolenya mekanik untuk status card
        // SESUAIKAN: role 'mekanik' atau 'mechanic' sesuai database Anda
        const mechanics = await User.find({ role: 'mekanik' }); 

        // 3. Render dengan mengirimkan variabel mechanics
        res.render('kasir/dashboard', {
            title: 'Dashboard Kasir',
            user: req.user,
            transactions: transactions || [],
            mechanics: mechanics || [], // INI KUNCINYA AGAR TIDAK ERROR
            activePage: 'dashboard'
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).send("Terjadi kesalahan pada server");
    }
});


// src/routes/viewRoutes.js
router.get('/customer/dashboard', protect, restrictTo('customer', 'user'), async (req, res) => {
    try {
        // Cari transaksi berdasarkan ID user yang login
        const transactions = await Transaction.find({ customer: req.user._id }).sort({ createdAt: -1 });

        // Cari status pengerjaan kendaraan
        const jobs = await Job.find({ customerId: req.user._id }).populate('mechanicId');

        res.render('customer/dashboard', {
            title: 'Dashboard Pelanggan',
            user: req.user,
            transactions: transactions || [],
            jobs: jobs || [],
            activePage: 'dashboard'
        });
    } catch (error) {
        console.error("Dashboard Pelanggan Error:", error);
        res.status(500).send("Gagal memuat dashboard");
    }
});

// ==================================================================
// B. ROUTE MANAJEMEN SUKU CADANG (PARTS)
// ==================================================================

// 1. List Parts
router.get('/parts', protect, async (req, res) => {
    try {
        const parts = await Part.find({});
        res.render('parts/list', { 
            title: 'Daftar Suku Cadang',
            parts: parts,
            activePage: 'parts',
            user: req.user
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

// 2. Form Tambah Part
router.get('/parts/add', protect, (req, res) => {
    res.render('parts/add', {
        title: 'Tambah Suku Cadang',
        activePage: 'parts',
        user: req.user,
        errors: null
    });
});

// 3. Proses Tambah Part (POST Form Biasa)
router.post('/parts/add', protect, restrictTo('admin'), async (req, res) => {
    try {
        // Menggunakan model Part secara eksplisit
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
// 4. Form Edit Part
router.get('/parts/edit/:id', protect, async (req, res) => {
    try {
        const part = await Part.findById(req.params.id);
        if (!part) return res.status(404).send('Suku Cadang tidak ditemukan.');

        res.render('parts/edit', {
            title: 'Edit Suku Cadang',
            activePage: 'parts',
            part: part,
            user: req.user
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

// 5. Proses Edit Part
router.post('/parts/edit/:id', protect, async (req, res) => {
    try {
        await Part.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
        res.redirect('/parts');
    } catch (error) {
        res.status(400).send(`Update Gagal: ${error.message}. <a href="/parts">Kembali</a>`);
    }
});


// ==================================================================
// C. ROUTE JASA SERVIS (SERVICES)
// ==================================================================

// 1. List Services
router.get('/services', protect, async (req, res) => {
    try {
        const services = await Service.find({});
        res.render('services/index', {
            title: 'Daftar Jasa Servis',
            services: services,
            user: req.user,
            activePage: 'services'
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

// 2. Form Tambah Service
router.get('/services/add', protect, (req, res) => {
    res.render('services/add', {
        title: 'Tambah Jasa Servis',
        activePage: 'services',
        user: req.user
    });
});

// 3. Proses Tambah Service
router.post('/services/add', protect, async (req, res) => {
    try {
        await Service.create(req.body);
        res.redirect('/services');
    } catch (error) {
        res.status(400).send(`Gagal: ${error.message}`);
    }
});

// 4. Form Edit Service
router.get('/services/edit/:id', protect, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        res.render('services/edit', {
            title: 'Edit Jasa Servis',
            activePage: 'services',
            service: service,
            user: req.user
        });
    } catch (error) {
        res.status(404).send('Service tidak ditemukan');
    }
});

// 5. Proses Edit Service
router.post('/services/edit/:id', protect, async (req, res) => {
    try {
        await Service.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/services');
    } catch (error) {
        res.status(400).send(`Update Gagal: ${error.message}`);
    }
});

// ==========================================
// RUTE HAPUS (DELETE)
// ==========================================

// 1. HAPUS SUKU CADANG (PART)
router.post('/parts/delete/:id', protect, async (req, res) => {
    try {
        await Part.findByIdAndDelete(req.params.id);
        console.log(`🗑️ Suku Cadang ID ${req.params.id} dihapus.`);
        res.redirect('/parts');
    } catch (error) {
        console.error("Gagal hapus part:", error);
        res.status(500).send("Gagal menghapus data: " + error.message);
    }
});

// 2. HAPUS JASA SERVIS (SERVICE)
router.post('/services/delete/:id', protect, async (req, res) => {
    try {
        await Service.findByIdAndDelete(req.params.id);
        console.log(`🗑️ Jasa Servis ID ${req.params.id} dihapus.`);
        res.redirect('/services');
    } catch (error) {
        console.error("Gagal hapus service:", error);
        res.status(500).send("Gagal menghapus data: " + error.message);
    }
});

// 3. HAPUS USER (Opsional)
router.post('/users/delete/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/users');
    } catch (error) {
        res.status(500).send("Gagal menghapus user");
    }
});

// ==================================================================
// D. ROUTE TRANSAKSI (TRANSACTIONS) -- PENTING!
// ==================================================================

// 1. List Riwayat Transaksi
router.get('/transactions', protect, restrictTo('admin', 'kasir'), async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
        res.render('transactions/list', {
            title: 'Riwayat Transaksi',
            transactions,
            user: req.user, // Pastikan user dikirim untuk pengecekan role di view
            activePage: 'transactions'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat riwayat transaksi");
    }
});
// 2. Form Buat Transaksi Baru (FIXED MECHANICS ERROR)
// src/routes/viewRoutes.js

router.get('/transactions/add', protect, async (req, res) => {
    try {
        console.log("-----------------------------------------");
        console.log("🔍 DEBUGGING HALAMAN TRANSAKSI");
        
        // 1. Cek Koneksi Part
        // HAPUS filter { stock: { $gt: 0 } } sementara untuk mengetes apakah data ada
        const parts = await Part.find({}); 
        console.log(`📦 JUMLAH PARTS DITEMUKAN: ${parts.length}`);
        if (parts.length > 0) {
            console.log("   Contoh Part:", parts[0].name, "| Stok:", parts[0].stock);
        }

        // 2. Cek Koneksi Service
        const services = await Service.find({});
        console.log(`🛠 JUMLAH SERVICES DITEMUKAN: ${services.length}`);

        // 3. Cek Koneksi Mekanik
        const mechanics = await User.find({ role: 'mekanik' });
        console.log(`👨‍🔧 JUMLAH MEKANIK DITEMUKAN: ${mechanics.length}`);

        console.log("-----------------------------------------");

        res.render('transactions/add', { 
            title: 'Buat Transaksi Baru', 
            parts: parts, 
            services: services, 
            mechanics: mechanics, 
            user: req.user,
            activePage: 'transactions'
        });

    } catch (error) {
        console.error("❌ ERROR FATAL:", error);
        res.status(500).send("Error: " + error.message);
    }
});

// ==========================================
// RUTE CETAK STRUK (SINKRON DENGAN RIWAYAT)
// ==========================================

router.get('/transactions/print/:id', protect, async (req, res) => {
    try {
        const transactionId = req.params.id;

        // 1. Ambil data Header (Invoice, Grand Total, Pelanggan)
        const transaction = await Transaction.findById(transactionId);
        
        if (!transaction) {
            return res.status(404).send("Data Transaksi tidak ditemukan di database.");
        }

        // 2. Ambil data Rincian Item (Ini yang sangat penting agar diskon muncul)
        // Kita mencari semua item yang memiliki transactionId yang sama
        const details = await TransactionDetail.find({ transactionId: transactionId });

        // 3. Render ke halaman receipt.ejs yang sudah kita fix-kan tadi
        res.render('transactions/receipt', { 
            title: `Struk - ${transaction.invoiceNumber}`,
            transaction: transaction, 
            details: details || [], // Kirim array kosong jika tidak ada detail
            layout: false // Layout false agar tampilan struk tidak berantakan oleh navbar
        });

    } catch (error) {
        console.error("Gagal cetak:", error);
        res.status(500).send("Terjadi kesalahan pada server saat memproses struk.");
    }
});
// 4. Cetak Resi (Berdasarkan Job ID atau Transaction ID tergantung implementasi)
router.get('/transactions/print/:id', protect, async (req, res) => {
    try {
        const Job = require('../models/Job');
        // Cari data transaksi berdasarkan ID
        const transaction = await Job.findById(req.params.id); 
        
        if (!transaction) return res.status(404).send("Transaksi tidak ditemukan.");

        // Render dengan layout false agar hanya menampilkan struk
        res.render('transactions/print', { 
            title: 'Cetak Resi',
            trx: transaction,
            layout: false 
        });
    } catch (error) {
        res.status(500).send("Gagal memuat halaman cetak: " + error.message);
    }
});


// ==================================================================
// E. ROUTE USER & PROFILE
// ==================================================================

// 1. List Users (Admin Only)
router.get('/users', protect, restrictTo('admin'), async (req, res) => {
    try {
        const users = await User.find({});
        res.render('users/list', { 
            title: 'Manajemen User',
            users: users,
            user: req.user,
            activePage: 'users'
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

// 2. Edit Profile Form
router.get('/profile', protect, (req, res) => {
    res.render('profile/edit', {
        title: 'Edit Profil Saya',
        activePage: 'profile',
        user: req.user,
        errors: null,
        successMessage: req.query.success ? 'Profil berhasil diperbarui!' : null
    });
});

// 3. Proses Update Profile
router.post('/profile', protect, async (req, res) => {
    try {
        const { name, email, currentPassword, newPassword } = req.body;
        const user = req.user;

        // Update basic info
        user.name = name || user.name;
        user.email = email || user.email;

        // Update password jika diisi
        if (newPassword) {
             // Logic cek password lama dll bisa ditaruh di sini atau di model
             user.password = newPassword; 
        }
        
        await user.save();
        res.redirect('/profile?success=true');
    } catch (error) {
        res.render('profile/edit', {
            title: 'Edit Profil Saya',
            activePage: 'profile',
            user: req.user,
            errors: { general: error.message },
            successMessage: null
        });
    }
});

module.exports = router;