// src/routes/authRoutes.js

// Fungsi untuk menampilkan halaman login
exports.login = (req, res) => {
    // Pastikan req.query digunakan jika Anda ingin menampilkan pesan sukses register
    res.render('login', { title: 'Login', query: req.query }); 
};

const express = require('express');
const router = express.Router();
// Pastikan hanya fungsi yang diekspor dari AuthController yang diimpor
const { verifyToken, getAllUsers, getProfile, updateProfile } = require('../controllers/AuthController'); // <-- PASTIKAN getProfile dan updateProfile ADA di sini!
//const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/login', login);
// ROUTE VERIFIKASI BARU (Menggantikan POST /login API)
router.post('/verify-token', verifyToken);

// ... (ROUTE LAMA POST /login dihapus atau diganti) ...

router.route('/users')
    .get(protect, restrictTo('admin'), getAllUsers);
// --- ROUTE PROFILE USER YANG SEDANG LOGIN ---
router.route('/profile')
    .get(protect, getProfile)
    .put(protect, updateProfile); // PUT untuk update

    router.get('/logout', logout); 

    module.exports = router;