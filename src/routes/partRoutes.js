// [LOKASI]: src/routes/partRoutes.js
const express = require('express');
const router = express.Router();
const partController = require('../controllers/PartController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Konfigurasi Multer untuk Spare Parts
const storage = multer.diskStorage({
    destination: 'public/uploads/parts/',
    filename: (req, file, cb) => {
        cb(null, 'part-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// --- RUTE TAMPILAN ---
router.get('/:id/edit', protect, restrictTo('admin'), partController.getEditPage);

// --- RUTE PROSES ---
// Tambahkan upload.single('partImage') pada rute POST dan PUT
router.post('/add', protect, restrictTo('admin'), upload.single('partImage'), partController.createPartView);
router.put('/:id', protect, restrictTo('admin'), upload.single('partImage'), partController.updatePart);

// Update stok cepat
router.post('/update-stock/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { adjustment } = req.body;
        const part = await Part.findById(req.params.id);
        if (part) {
            part.stock += parseInt(adjustment);
            if (part.stock < 0) part.stock = 0;
            await part.save(); // Ini akan memicu plugin sync Firebase di server.js Anda
        }
        // Redirect kembali ke dashboard agar angka langsung update
        res.redirect('/admin/dashboard?success=Stok+berhasil+diperbarui');
    } catch (error) {
        res.redirect('/admin/dashboard?error=Gagal+update+stok');
    }
});

module.exports = router;