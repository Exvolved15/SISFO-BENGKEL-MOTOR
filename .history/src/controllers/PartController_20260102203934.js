// [LOKASI]: src/controllers/PartController.js
const Part = require('../models/Part');

// ------------------------------------
// 1. Fungsi READ (GET ALL)
// ------------------------------------
const getAllParts = async (req, res) => {
    try {
        const parts = await Part.find({}).sort({ name: 1 });
        if (req.headers.accept && req.headers.accept.includes('text/html')) {
            return res.render('parts/list', { 
                title: 'Daftar Suku Cadang', 
                parts, 
                user: req.user, 
                activePage: 'parts' 
            });
        }
        res.json({ success: true, data: parts });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
// ------------------------------------
// 2. Fungsi CREATE (API & VIEW)
// ------------------------------------

// Untuk request dari API (JSON)
const createPartApi = async (req, res) => {
    try {
        const part = await Part.create(req.body);
        res.status(201).json({ success: true, data: part });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Untuk request dari Form (EJS) - SINKRON DENGAN IMAGEURL
const createPartView = async (req, res) => {
    try {
        const { name, code, purchasePrice, price, stock, supplier, imageUrl } = req.body;
        const newPart = new Part({
            name,
            code: code.toUpperCase(),
            purchasePrice: parseFloat(purchasePrice) || 0,
            sellingPrice: parseFloat(price) || 0,
            stock: parseInt(stock) || 0,
            supplier: supplier || '-',
            imageUrl: imageUrl || ''
        });
        await newPart.save();
        res.redirect('/parts?success=Berhasil+ditambahkan');
    } catch (error) {
        res.redirect(`/parts/add?error=${encodeURIComponent(error.message)}`);
    }
};
// ------------------------------------
// 3. Fungsi UPDATE & EDIT PAGE
// ------------------------------------
const getEditPage = async (req, res) => {
    const part = await Part.findById(req.params.id);
    res.render('parts/edit', { title: 'Edit Suku Cadang', part, user: req.user, activePage: 'parts' });
};


const updatePart = async (req, res) => {
    try {
        const { id } = req.params;
        // TANGKAP SEMUA: Pastikan 'sellingPrice' dan 'imageUrl' ada di sini
        const { name, code, stock, purchasePrice, sellingPrice, supplier, imageUrl } = req.body;

        await Part.findByIdAndUpdate(id, {
            name,
            code: code.toUpperCase(),
            stock: parseInt(stock),
            purchasePrice: parseFloat(purchasePrice),
            sellingPrice: parseFloat(sellingPrice), // Gunakan sellingPrice sesuai input EJS
            supplier,
            imageUrl: imageUrl.trim() // Simpan URL Gambar
        }, { new: true });
        
        res.redirect('/parts?success=Data+dan+Gambar+Berhasil+Diupdate');
    } catch (error) {
        res.redirect(`/parts?error=${encodeURIComponent(error.message)}`);
    }
};

// ------------------------------------
// 4. Fungsi DELETE
// ------------------------------------
const deletePart = async (req, res) => {
    try {
        await Part.findByIdAndDelete(req.params.id);
        res.redirect('/parts?delete=success');
    } catch (error) {
        res.status(500).send("Gagal menghapus data: " + error.message);
    }
};

// =====================================
// EXPORTS SINKRON (Sesuai dengan nama fungsi)
// =====================================
module.exports = { getAllParts, createPartView, getEditPage, updatePart, deletePart: async (req, res) => {
    await Part.findByIdAndDelete(req.params.id);
    res.redirect('/parts?delete=success');
}};