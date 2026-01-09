// src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { registerUser, getAllUsers } = require('../controllers/UserController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); 
const userController = require('../controllers/UserController'); // Import controller baru
// Rute untuk manajemen user (Hanya Admin)
router.use(protect, restrictTo('admin'));

router.route('/')
    .get(userController.getAllUsers)  // GET /api/users
    .post(userController.createUser); // POST /api/users (Membuat Karyawan Baru)

router.route('/:id')
    .put(userController.updateUser)    // PUT /api/users/:id
    .delete(userController.deleteUser); // DELETE /api/users/:id

module.exports = router;