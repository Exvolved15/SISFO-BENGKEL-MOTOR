// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
// Hapus 'registerUserApi' jika Anda tidak mengekspornya lagi dari AuthController.js
// ATAU pastikan nama fungsi yang Anda import SAMA PERSIS dengan yang di-export
const { loginUser, getAllUsers } = require('../controllers/AuthController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); 

// router.post('/register', registerUserApi); // <-- BARIS INI KEMUNGKINAN BESAR PENYEBABNYA, HAPUS ATAU KOMENTARI!

router.post('/login', loginUser);

router.route('/users')
    .get(protect, restrictTo('admin'), getAllUsers); 

module.exports = router;