const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const { protect } = require('../middleware/authMiddleware');

// RUTE API (Hanya POST/PUT/DELETE)

// 1. Proses Verifikasi Token (Login)
router.post('/verify-token', authController.verifyToken);

// 2. Proses Register User Baru

router.post('/login', authController.login);
// Ini yang sebelumnya error karena namanya beda. Sekarang pakai 'register'
router.post('/register', authController.register);

// 3. Profile User (API)
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);

// 4. List User (Admin Only)
router.get('/', protect, authController.getAllUsers);

module.exports = router;