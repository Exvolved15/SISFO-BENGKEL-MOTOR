const express = require('express');
const router = express.Router();
const Part = require('../models/Part'); // Gunakan Model Part
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Rute: POST /api/parts/add
router.post('/add', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { name, code, price, stock } = req.body;

        if (!name || !code || !price) {
            return res.status(400).send("Gagal: Nama, Kode, dan Harga wajib diisi.");
        }

        // Simpan ke koleksi 'parts'
        await Part.create({
            name,
            code,
            price: parseFloat(price),
            sellingPrice: parseFloat(price), // Pastikan field sesuai schema
            stock: parseInt(stock) || 0
        });

        res.redirect('/parts'); // Redirect ke daftar suku cadang
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).send("Gagal: Kode Suku Cadang '" + req.body.code + "' sudah ada!");
        }
        res.status(500).send("Error: " + error.message);
    }
});

// Update stok cepat dari dashboard
router.post('/update-stock/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { adjustment } = req.body; // Menerima nilai 1 atau -1
        const part = await Part.findById(req.params.id);
        
        if (part) {
            part.stock += parseInt(adjustment);
            // Validasi agar stok tidak negatif
            if (part.stock < 0) part.stock = 0;
            await part.save();
        }
        
        // Redirect kembali ke dashboard admin setelah update
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error("Update Stock Error:", error.message);
        res.status(500).send("Gagal memperbarui stok.");
    }
});

module.exports = router;