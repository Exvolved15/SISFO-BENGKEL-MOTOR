// src/routes/partRoutes.js

const express = require('express');
const router = express.Router();
const Part = require('../models/Part');
const partController = require('../controllers/PartController'); // Import controller (menggunakan p kecil)
const { protect, restrictTo } = require('../middleware/authMiddleware');

// RUTE TAMPILAN
router.get('/:id/edit', protect, restrictTo('admin'), partController.getEditPage);

// RUTE PROSES
router.post('/add', protect, restrictTo('admin'), partController.createPartView);
router.put('/:id', protect, restrictTo('admin'), partController.updatePart);

// [LOKASI]: src/routes/partRoutes.js

// Update stok cepat dari dashboard
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