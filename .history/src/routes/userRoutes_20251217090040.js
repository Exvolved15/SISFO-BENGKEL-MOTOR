// src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { registerUser, getAllUsers } = require('../controllers/UserController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); 
const userController = require('../controllers/UserController'); // Import controller baru
// Rute untuk manajemen user (Hanya Admin)
router.route('/register')
    .post(protect, restrictTo('admin'), registerUser); // Admin mendaftarkan user baru

router.route('/')
    .get(protect, restrictTo('admin'), getAllUsers); // Admin melihat daftar user

module.exports = router;