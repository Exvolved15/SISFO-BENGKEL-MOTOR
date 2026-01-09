const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
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
router.post('/add', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { name, code, price } = req.body;
        
        await Service.create({
            name,
            code,
            price: parseFloat(price),
            isPart: false
        });

        res.redirect('/services'); // Redirect ke halaman daftar jasa
    } catch (error) {
        res.status(400).send("Gagal menambah jasa: " + error.message);
    }
});

module.exports = router; // WAJIB ADA