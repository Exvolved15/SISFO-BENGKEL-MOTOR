// src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { getAllUsers, createUser } = require('../controllers/UserController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); 
const userController = require('../controllers/UserController'); // Import controller baru
// Rute untuk manajemen user (Hanya Admin)
router.use(protect, restrictTo('admin'));

router.route('/')
    .get(userController.getAllUsers)  // GET /api/users
    .post(userController.createUser); // POST /api/users (Membuat Karyawan Baru)

    router.route('/:id') // Baris 15 (Asumsi)
    .put(userController.updateUser)    // <--- INI ADALAH FUNGSI YANG UNDEFINED (Baris 16)
    .delete(userController.deleteUser);

module.exports = router;