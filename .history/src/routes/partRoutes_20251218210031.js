const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Rute untuk menambah Suku Cadang secara manual oleh Admin
// src/routes/partRoutes.js
router.post('/add', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { name, code, price, stock } = req.body;
        
        // Pastikan field 'name' yang digunakan, bukan 'serviceName' atau 'customerName'
        await Service.create({
            name,
            code,
            price: parseFloat(price),
            stock: parseInt(stock) || 0,
            isPart: true
        });

        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error("Detail Error Suku Cadang:", error);
        res.status(400).send("Gagal Menambah Suku Cadang: " + error.message);
    }
});
module.exports = router;