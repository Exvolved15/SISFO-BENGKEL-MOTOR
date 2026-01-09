// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const { login, verifyToken, logout } = require('../controllers/AuthController');
// const { protect } = require('../middleware/authMiddleware'); // Pastikan ini tidak diimpor jika hanya dipakai di sini

// Rute Login Halaman View
router.get('/login', login); 

// Rute Verifikasi Token (Login API)
// PASTIKAN TIDAK ADA PROTECT DI SINI!
router.post('/verify-token', verifyToken); 

// Rute Logout
router.get('/logout', logout); 

module.exports = router;