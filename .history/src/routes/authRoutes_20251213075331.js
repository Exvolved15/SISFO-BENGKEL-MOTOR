// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
// Pastikan hanya fungsi yang diekspor dari AuthController yang diimpor
const { verifyToken, getAllUsers } = require('../controllers/AuthController'); // <-- Import verifyToken
const { protect, restrictTo } = require('../middleware/authMiddleware'); 

// ROUTE VERIFIKASI BARU (Menggantikan POST /login API)
router.post('/verify-token', verifyToken);

// ... (ROUTE LAMA POST /login dihapus atau diganti) ...

router.route('/users')
    .get(protect, restrictTo('admin'), getAllUsers);
// --- ROUTE PROFILE USER YANG SEDANG LOGIN ---
router.route('/profile')
    .get(protect, getProfile)
    .put(protect, updateProfile); // PUT untuk update

module.exports = router;