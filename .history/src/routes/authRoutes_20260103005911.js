const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const { protect } = require('../middleware/authMiddleware');

// ==========================================
// RUTE API AUTH (Prefix: /api/auth)
// ==========================================

// 1. Proses Verifikasi Token dari Firebase (Login Utama)
// Gunakan authController.verifyToken agar merujuk ke fungsi di controller
router.post('/verify-token', authController.verifyToken);

// 2. Proses Register User Baru
router.post('/register', authController.register);

// 3. Login View Helper (Jika diperlukan untuk API)
router.post('/login', authController.login);

// 4. Profile User (API) - Membutuhkan token sesi
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);

// 5. List User (Admin Only)
router.get('/', protect, authController.getAllUsers);

// 6. Proses Logout
router.get('/logout', authController.logout);

module.exports = router;