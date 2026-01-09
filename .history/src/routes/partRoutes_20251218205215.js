const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Rute untuk menambah Suku Cadang secara manual oleh Admin
router.post('/add', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { name, code, price, stock } = req.body;
        
        // Pastikan field 'name' terisi (bukan serviceName)
        await Service.create({
            name,
            code,
            price: parseFloat(price),
            stock: parseInt(stock) || 0,
            isPart: true
        });

        res.redirect('/admin/dashboard');
    } catch (error) {
        // Jika error duplicate key serviceName, informasikan ke user
        console.error("Error Detail:", error);
        res.status(400).send("Gagal: " + (error.code === 11000 ? "Kode part sudah ada!" : error.message));
    }
});

module.exports = router;