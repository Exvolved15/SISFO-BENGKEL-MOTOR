// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();

// Pastikan Anda mengimpor SEMUA fungsi yang diperlukan (login dan logout hilang)
const { 
    login,           // <--- TAMBAHKAN INI
    verifyToken, 
    getAllUsers, 
    getProfile, 
    updateProfile, 
    logout           // <--- TAMBAHKAN INI
} = require('../controllers/AuthController'); 
const { protect, restrictTo } = require('../middleware/authMiddleware'); // <--- PASTIKAN INI TIDAK DIKOMEN LAGI

router.get('/login', login); // Sekarang 'login' sudah terdefinisi
router.post('/verify-token', verifyToken);

router.route('/users')
    .get(protect, restrictTo('admin'), getAllUsers);
    
// --- ROUTE PROFILE USER YANG SEDANG LOGIN ---
router.route('/profile')
    .get(protect, getProfile)
    .put(protect, updateProfile); 

router.get('/logout', logout); // Sekarang 'logout' sudah terdefinisi

module.exports = router;