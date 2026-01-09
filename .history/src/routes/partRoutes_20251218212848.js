const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Rute: POST /api/parts/add
router.post('/add', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { name, code, price, stock } = req.body;

        // Validasi input dasar
        if (!name || !code || !price) {
            return res.status(400).send("Gagal: Nama, Kode, dan Harga wajib diisi.");
        }

        // Simpan sebagai Suku Cadang
        await Service.create({
            name,
            code,
            price: parseFloat(price),
            stock: parseInt(stock) || 0,
            isPart: true // Menandakan ini barang/spare-part
        });

        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error("Error Part Management:", error);
        res.status(400).send("Tambah Suku Cadang Gagal: " + error.message);
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