// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { protect, restrictTo } = require('../middleware/authMiddleware');



// Tampilkan Daftar User
router.get('/', protect, restrictTo('admin'), userController.getAllUsers);
router.post('/', protect, restrictTo('admin'), userController.createUser);

// Tampilkan Halaman Edit (Penyebab 404 jika tidak ada)
router.get('/edit/:id', protect, restrictTo('admin'), userController.getEditUserPage);

// Proses Update User
router.post('/update/:id', protect, restrictTo('admin'), userController.updateUser);

// Rute khusus untuk update profil (nama, departemen, dan foto)
router.post('/update-profile/:id', protect, userController.updateUserProfile);

// Hapus User
router.post('/delete/:id', protect, restrictTo('admin'), userController.deleteUser);

module.exports = router;