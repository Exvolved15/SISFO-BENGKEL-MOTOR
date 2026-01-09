// sisfo-bengkel-baru/src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const { registerUserApi, loginUser, getAllUsers } = require('../controllers/AuthController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // <-- Import middleware

router.post('/register', registerUserApi); // Kita akan ganti registerUser dengan logic API
router.post('/login', loginUser);

// Route baru untuk mengambil daftar user. Hanya Admin yang boleh akses.
router.route('/users')
    .get(protect, restrictTo('admin'), getAllUsers); // <-- Hanya ADMIN yang boleh GET

module.exports = router;