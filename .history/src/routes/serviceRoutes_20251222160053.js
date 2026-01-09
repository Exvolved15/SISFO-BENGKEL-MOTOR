const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const serviceController = require('../controllers/ServiceController'); 
const { protect, restrictTo } = require('../middleware/authMiddleware');

// 1. Ambil Semua Jasa (API)
router.get('/', protect, async (req, res) => {
    try {
        const services = await Service.find({ isPart: false });
        res.status(200).json({ success: true, data: services });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Proses Tambah Jasa Baru (POST)
// src/routes/serviceRoutes.js

router.post('/add', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { name, code, price } = req.body;
        
        await Service.create({
            name,
            code,
            price: parseFloat(price),
            isPart: false // Membedakan jasa dengan suku cadang
        });

        // Setelah simpan, arahkan kembali ke rute tampilan (bukan rute API)
        res.redirect('/services'); 
    } catch (error) {
        res.status(400).send("Gagal: " + error.message);
    }
});
// Rute Index (Contoh baris 30-an)
router.get('/', protect, serviceController.getAllServices);

// Rute Edit (Baris 38 yang menyebabkan error)
// Pastikan serviceController.getEditPage TIDAK undefined
router.get('/:id/edit', protect, restrictTo('admin'), serviceController.getEditPage);

// Rute Update
router.put('/:id', protect, restrictTo('admin'), serviceController.updateService);
module.exports = router; // WAJIB ADA