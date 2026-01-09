const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');

// RUTE TAMPILAN (Hanya GET)

// 1. Halaman Login
router.get('/login', authController.login);

// 2. Halaman Register
// Pastikan fungsi 'registerView' sudah ditambahkan di controller (Langkah 1)
router.get('/register', authController.registerView);

// 3. Logout (Redirect)
router.get('/logout', authController.logout);

module.exports = router;