const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer'); // Pastikan install multer
const path = require('path');

// Konfigurasi Multer untuk Foto Profil
const storage = multer.diskStorage({
    destination: 'public/uploads/profile/',
    filename: (req, file, cb) => {
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// RUTE API (Prefix: /api/auth)
router.post('/verify-token', authController.verifyToken);
router.post('/register', authController.register);
router.get('/profile', protect, authController.getProfile);

// TAMBAHKAN RUTE INI: Agar form di EJS bisa masuk
router.post('/update-profile/:id', protect, upload.single('profileImage'), authController.updateProfile);

router.get('/', protect, authController.getAllUsers);

module.exports = router;