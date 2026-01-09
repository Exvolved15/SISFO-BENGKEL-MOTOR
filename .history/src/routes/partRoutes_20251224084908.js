// src/routes/partRoutes.js

const express = require('express');
const router = express.Router();
const Part = require('../models/Part');
const partController = require('../controllers/PartController'); // Import controller
const { protect, restrictTo } = require('../middleware/authMiddleware');

// --- RUTE TAMPILAN (VIEW) ---
// Perbaikan: Tambahkan rute GET untuk menampilkan halaman edit agar tidak 404
router.get('/:id/edit', protect, restrictTo('admin'), partController.getEditPage);

// --- RUTE PROSES (API/ACTION) ---
router.post('/add', PartController.createPartView);

// Rute untuk memproses update data (Gunakan PUT)
router.put('/:id', protect, restrictTo('admin'), partController.updatePart);

// Update stok cepat dari dashboard
router.post('/update-stock/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { adjustment } = req.body;
        const part = await Part.findById(req.params.id);
        if (part) {
            part.stock += parseInt(adjustment);
            if (part.stock < 0) part.stock = 0;
            await part.save();
        }
        res.redirect('/admin/dashboard');
    } catch (error) {
        res.status(500).send("Gagal memperbarui stok.");
    }
});

module.exports = router;