// sisfo-bengkel-baru/src/routes/viewRoutes.js

// src/routes/viewRoutes.js

const express = require('express');
const router = express.Router();

// PENTING: Pastikan semua Model di-require di sini HANYA SEKALI
const Part = require('../models/Part'); 
const Service = require('../models/Service'); 
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // <-- Import proteksi
 // <-- Panggil User Model


// --- PANGGIL CONTROLLER SEKALI SAJA ---
const PartController = require('../controllers/PartController'); 
const { createPartView, updatePart } = PartController;


const { getAllTransactions } = require('../controllers/TransactionController'); // <-- Import Controller Transaksi
const { createService } = require('../controllers/ServiceController'); // Panggil createService
// Import PartController untuk logika POST dari form
const { createPart } = require('../controllers/PartController'); // <-- Import createPart

// Route 1: GET /parts - Menampilkan daftar suku cadang
router.get('/parts', protect, async (req, res) => { // <-- TAMBAHKAN PROTECT
    try {
        const parts = await Part.find({});
        res.render('parts/list', { 
            title: 'Daftar Suku Cadang',
            parts: parts,
            activePage: 'parts' 
        });
    } catch (error) {
        res.status(500).send('Terjadi kesalahan saat mengambil data: ' + error.message);
    }
});

// Route 2: GET /parts/add - Menampilkan FORM Tambah Suku Cadang
router.get('/parts/add', protect, async (req, res) => { // <-- TAMBAHKAN PROTECT
    res.render('parts/add', {
        title: 'Tambah Suku Cadang',
        activePage: 'parts',
        errors: null // Kirim objek errors kosong untuk menghindari error di view
    });
});

// Route 3: POST /parts/add - Menangani pengiriman data dari form
router.post('/parts/add', protect, async (req, res) => { // <-- TAMBAHKAN PROTECT
    // ... (deklarasi oldData) ...

    try {
        // ... (parsing itemDetails) ...
        
        const result = await processTransactionLogic(req.body); // <-- Simpan hasil logic
        
        // Jika Logic BERHASIL: Redirect ke halaman detail transaksi yang baru
        return res.redirect(`/transactions/${result.transaction._id}`); // <-- Redirect ke Detail ID baru!
    } catch (error) {
        // Jika ada error (Validasi, Stok, dll.), kita akan mengirim respons di sini:
        console.error("Error Transaksi dari Form:", error.message);
        // INI ADALAH RESPON PERTAMA JIKA ERROR:
        res.status(400).send(`Transaksi Gagal (Error Validasi/Stok): ${error.message}. <a href="/transactions/add">Kembali ke Form</a>`);
    }
});



// ===================================
// ROUTE EDIT SUKU CADANG
// ===================================

// Route 4: GET /parts/edit/:id - Menampilkan FORM Edit Suku Cadang
router.get('/parts/edit/:id', async (req, res) => {
    try {
        const part = await Part.findById(req.params.id);

        if (!part) {
            return res.status(404).send('Suku Cadang tidak ditemukan.');
        }

        res.render('parts/edit', {
            title: 'Edit Suku Cadang',
            activePage: 'parts',
            part: part // Kirim data suku cadang yang akan diedit ke view
        });

    } catch (error) {
        res.status(500).send('Terjadi kesalahan saat mengambil data: ' + error.message);
    }
});

// Route 5: POST /parts/edit/:id - Menangani pengiriman data update dari form
router.post('/parts/edit/:id', async (req, res) => {
    try {
        // Kita akan memanfaatkan fungsi updatePart dari PartController,
        // namun kita akan memanggilnya secara langsung tanpa mengirim res.json()
        
        const partId = req.params.id;
        const updatedData = req.body;

        const part = await Part.findByIdAndUpdate(partId, updatedData, {
            new: true, // Kembalikan dokumen yang diperbarui
            runValidators: true // Jalankan validasi skema
        });

        if (!part) {
            return res.status(404).send('Suku Cadang tidak ditemukan untuk diupdate.');
        }

        // Jika berhasil, redirect kembali ke daftar
        res.redirect('/parts'); 
        
    } catch (error) {
        // Tangani error validasi (misalnya kode unik duplikat)
        console.error("Error saat update dari Form:", error.message);
        res.status(400).send(`Update Gagal: ${error.message}. <a href="/parts">Kembali ke Daftar</a>`);
    }
});

// ===================================
// ROUTE TRANSAKSI
// ===================================

// Route 6: GET /transactions - Menampilkan daftar riwayat transaksi
// @desc    Halaman Riwayat Transaksi (Admin & Kasir)
router.get('/transactions', protect, restrictTo('admin', 'kasir'), async (req, res) => {
    try {
        // Mengambil semua transaksi, diurutkan dari yang terbaru
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

const TransactionController = require('../controllers/TransactionController'); 
const { processTransactionLogic } = TransactionController; // <-- Asumsi Anda mengekspor Logic

// src/routes/viewRoutes.js
router.get('/transactions/add', protect, async (req, res) => {
    try {
        const allItems = await Service.find({}); // Ambil dari koleksi Service
        const mekaniks = await User.find({ role: 'mekanik' });

        res.render('transactions/add', {
            title: 'Buat Transaksi Baru',
            // Pastikan filter isPart sesuai dengan data di MongoDB Anda
            parts: allItems.filter(item => item.isPart === true),
            services: allItems.filter(item => item.isPart === false),
            mekaniks,
            user: req.user,
            activePage: 'transactions'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat data");
    }
});
// ===================================
// ROUTE DETAIL TRANSAKSI
// ===================================

// Route 9: GET /transactions/:id - Menampilkan Detail Transaksi
router.get('/transactions/:id', protect, async (req, res) => { // <-- TAMBAHKAN PROTECT
    try {
        const transactionId = req.params.id;
        
        // 1. Ambil Header Transaksi
        const header = await Transaction.findById(transactionId);

        if (!header) {
            return res.status(404).send('Transaksi tidak ditemukan.');
        }

        // 2. Ambil Detail Item Transaksi berdasarkan transactionId
        const details = await TransactionDetail.find({ transactionId: transactionId });

        res.render('transactions/detail', { // render file views/transactions/detail.ejs
            title: `Detail Transaksi: ${header.invoiceNumber}`,
            activePage: 'transactions',
            header: header,
            details: details
        });

    } catch (error) {
        res.status(500).send('Terjadi kesalahan saat mengambil detail transaksi: ' + error.message);
    }
});

// ===================================
// ROUTE JASA SERVIS (VIEW CRUD)
// ===================================

router.get('/services', protect, async (req, res) => {
    try {
        // Pastikan model Service dipanggil
        const allServices = await Service.find({ isPart: false }); 
        
        res.render('services/index', {
            title: 'Daftar Jasa Servis',
            services: allServices, // Pastikan variabel ini 'services'
            user: req.user,
            activePage: 'services'
        });

    } catch (error) {
        // Ini sering menjadi biang keladinya. 
        console.error("ERROR GENERATING /services:", error.message);
        res.status(500).send('Error saat mengambil data Jasa Servis: ' + error.message); 
        // Tambahkan baris di atas untuk melihat error di browser
    }
});

// Route 10: GET /services/add - Menampilkan FORM Tambah Jasa Servis
router.get('/services/add', (req, res) => {
    res.render('services/add', {
        title: 'Tambah Jasa Servis',
        activePage: 'services'
    });
});

// Route 11: POST /services/add - Menangani pengiriman data dari form
router.post('/services/add', async (req, res) => {
    try {
        // Kita gunakan createService, yang kita modifikasi untuk return data jika berhasil
        await Service.create(req.body); 
        res.redirect('/services'); 
    } catch (error) {
        console.error("Error saat menyimpan Jasa Servis:", error.message);
        res.status(400).send(`Tambah Jasa Gagal: ${error.message}. <a href="/services/add">Kembali ke Form</a>`);
    }
});

// Route 12: GET /services/edit/:id - Menampilkan FORM Edit Jasa Servis
router.get('/services/edit/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).send('Jasa Servis tidak ditemukan.');
        }

        res.render('services/edit', {
            title: 'Edit Jasa Servis',
            activePage: 'services',
            service: service 
        });

    } catch (error) {
        res.status(500).send('Terjadi kesalahan saat mengambil data: ' + error.message);
    }
});

// Route 13: POST /services/edit/:id - Menangani pengiriman data update
router.post('/services/edit/:id', async (req, res) => {
    try {
        const serviceId = req.params.id;
        const updatedData = req.body;

        const service = await Service.findByIdAndUpdate(serviceId, updatedData, {
            new: true, 
            runValidators: true 
        });

        if (!service) {
            return res.status(404).send('Jasa Servis tidak ditemukan untuk diupdate.');
        }

        res.redirect('/services'); 
        
    } catch (error) {
        console.error("Error saat update Jasa Servis:", error.message);
        res.status(400).send(`Update Jasa Gagal: ${error.message}. <a href="/services">Kembali ke Daftar</a>`);
    }
});

// Route 14: DELETE /services/delete/:id - Menghapus jasa servis
router.delete('/services/delete/:id', async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) {
            return res.status(404).send('Jasa Servis tidak ditemukan');
        }
        res.redirect('/services'); 
    } catch (error) {
        res.status(500).send('Terjadi kesalahan saat menghapus data: ' + error.message);
    }
});

// ===================================
// ROUTE MANAJEMEN USER
// ===================================

// Route 15: GET /users - Menampilkan daftar user terdaftar
router.get('/users', protect, restrictTo('admin'), async (req, res) => {
    try {
        const users = await User.find({});
        res.render('users/list', { 
            title: 'Manajemen User',
            users: users,   // Data untuk tabel
            user: req.user,  // Data user yang sedang login (PENTING!)
            activePage: 'users'
        });

    } catch (error) {
        console.error("ERROR GENERATING /users:", error.message);
        res.status(500).send('Error saat mengambil data user: ' + error.message);
    }
});

// ===================================
// ROUTE PROFILE
// ===================================

// Route 16: GET /profile - Menampilkan Form Edit Profil
router.get('/profile', protect, async (req, res) => {
    // Data user sudah tersedia di req.user dari middleware protect
    res.render('profile/edit', {
        title: 'Edit Profil Saya',
        activePage: 'profile',
        user: req.user, // Kirim data user yang sedang login
        errors: null,
        successMessage: null
    });
});

// Route 17: POST /profile - Menangani Update Profil
router.post('/profile', protect, async (req, res) => {
    try {
        // Kita simulasikan panggilan ke updateProfile API, tetapi dengan redirect
        // Daripada memanggil API, kita akan memanggil logic secara langsung di sini.
        
        const { name, email, currentPassword, newPassword } = req.body;
        const user = req.user; // User saat ini dari token

        // Cek apakah ada perubahan email
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                 throw new Error('Email sudah digunakan oleh akun lain.');
            }
        }

        // Update data
        user.name = name || user.name;
        user.email = email || user.email;

        if (newPassword) {
            if (!currentPassword || !(await user.matchPassword(currentPassword))) {
                throw new Error('Password lama tidak valid.');
            }
             if (newPassword.length < 6) {
                 throw new Error('Password baru minimal 6 karakter.');
            }
            user.password = newPassword; // Mongoose hashing middleware akan bekerja
        }
        
        await user.save();

        // Redirect ke profile dengan pesan sukses
        return res.redirect('/profile?success=true');

    } catch (error) {
        let errorMessage = error.message;
        
        // Render ulang form dengan error
        res.render('profile/edit', {
            title: 'Edit Profil Saya',
            activePage: 'profile',
            user: req.user, 
            errors: { general: errorMessage },
            successMessage: null
        });
    }
});

// @desc    Dashboard Admin
router.get('/admin/dashboard', protect, restrictTo('admin'), async (req, res) => {
    try {
        // Anda bisa mengambil data statistik di sini jika perlu
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            user: req.user,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard admin");
    }
});

// @desc    Dashboard Kasir
// @desc    Dashboard Kasir
router.get('/kasir/dashboard', protect, restrictTo('kasir', 'admin'), async (req, res) => {
    try {
        // Ambil semua transaksi tanpa filter status agar riwayat tetap muncul
        // Limit 5 atau 10 agar dashboard tidak terlalu panjang
        const transactions = await Transaction.find().sort({createdAt: -1}).limit(5);
        res.render('kasir/dashboard', {
            user: req.user,
            title: 'Dashboard Kasir'
            transactions, // Data ini yang akan ditampilkan di tabel bawah
            activePage: 'dashboard'
        });
    } catch (error) {
        console.error("Error Dashboard:", error);
        res.status(500).send("Gagal memuat riwayat transaksi di dashboard");
    }
});
// @desc    Halaman Print/Download Resi
router.get('/transactions/print/:id', protect, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        // Jika Anda memiliki model TransactionDetail terpisah:
        // const details = await TransactionDetail.find({ transactionId: req.params.id });

        if (!transaction) return res.status(404).send('Transaksi tidak ditemukan');

        res.render('transactions/receipt', {
            layout: false, // Penting: Agar tidak muncul navbar saat diprint
            transaction,
            // details, 
            title: `Resi_${transaction.invoiceNumber}`
        });
    } catch (error) {
        res.status(500).send("Gagal memproses resi");
    }
});
module.exports = router;