// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const { loginUser, getAllUsers, getProfile, updateProfile } = require('../controllers/AuthController'); // <-- Import fungsi baru
const { protect, restrictTo } = require('../middleware/authMiddleware');

// router.post('/register', registerUserApi); // <-- BARIS INI KEMUNGKINAN BESAR PENYEBABNYA, HAPUS ATAU KOMENTARI!

router.post('/login', loginUser);

router.route('/users')
    .get(protect, restrictTo('admin'), getAllUsers); 

// --- ROUTE PROFILE USER YANG SEDANG LOGIN ---
router.route('/profile')
    .get(protect, getProfile)
    .put(protect, updateProfile); // PUT untuk update

module.exports = router;