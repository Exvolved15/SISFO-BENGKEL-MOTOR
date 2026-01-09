const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Rute: POST /api/parts/add (atau /parts/add sesuai server.js)
router.post('/add', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { name, code, price, stock } = req.body;

        // Validasi agar tidak Bad Request: Nama, Kode, dan Harga wajib ada
        if (!name || !code || !price) {
            return res.status(400).json({ 
                success: false, 
                message: "Data Nama, Kode, dan Harga harus diisi!" 
            });
        }

        await Service.create({
            name,
            code,
            price: parseFloat(price),
            stock: parseInt(stock) || 0,
            isPart: true // Menandakan ini adalah barang
        });

        res.redirect('/admin/dashboard'); // Kembali ke dashboard setelah sukses
    } catch (error) {
        console.error(error);
        res.status(400).send("Gagal menambah data: " + error.message);
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