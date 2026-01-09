// [LOKASI]: src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');

router.post('/login', authController.loginAPI); // Harus arahkan ke loginAPI
router.post('/register', authController.register);
router.post('/verify-token', authController.verifyToken);

module.exports = router;