const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const partController = require('../controllers/PartController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Rute: POST /api/parts/add (atau /parts/add sesuai server.js)
// src/routes/partRoutes.js
router.post('/add', protect, restrictTo('admin'), partController.createPart)=> {
    try {
        const { name, code, price, stock } = req.body;

        if (!name || !code || !price) {
            return res.status(400).send("Gagal: Nama, Kode, dan Harga wajib diisi.");
        }

        await Service.create({
            name,
            code,
            price: parseFloat(price),
            stock: parseInt(stock) || 0,
            isPart: true 
        });

        res.redirect('/admin/dashboard');
    } catch (error) {
        // Jika masih error duplicate, tampilkan pesan yang ramah
        if (error.code === 11000) {
            return res.status(400).send("Gagal: Kode Suku Cadang '" + req.body.code + "' sudah ada di database!");
        }
        res.status(500).send("Error: " + error.message);
    }
});

// Rute untuk update stok dari tombol +/- di dashboard
router.post('/update-stock/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { adjustment } = req.body; // Terima 1 atau -1
        const part = await Service.findById(req.params.id);
        
        if (part) {
            part.stock += parseInt(adjustment);
            // Jangan biarkan stok negatif
            if (part.stock < 0) part.stock = 0;
            await part.save();
        }
        res.redirect('/admin/dashboard');
    } catch (error) {
        res.status(500).send("Gagal update stok");
    }
});

module.exports = router;