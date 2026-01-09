const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Rute untuk menambah Suku Cadang secara manual oleh Admin
router.post('/add', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { name, code, price, stock } = req.body;
        
        // Buat data baru di koleksi services dengan flag isPart: true
        await Service.create({
            name,
            code,
            price: parseFloat(price),
            stock: parseInt(stock),
            isPart: true
        });

        res.redirect('/admin/dashboard');
    } catch (error) {
        res.status(400).send("Tambah Suku Cadang Gagal: " + error.message);
    }
});

module.exports = router;