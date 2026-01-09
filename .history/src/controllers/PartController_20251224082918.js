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
        res.status(200).json({ success: true, data: parts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
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

// Untuk request dari Form (EJS) - FIX HARGA BELI & JUAL
// [LOKASI]: src/controllers/PartController.js

const createPartView = async (req, res) => {
    try {
        const { name, code, purchasePrice, price, stock, supplier } = req.body;

        // Validasi awal agar tidak memicu 500 dari Mongoose
        if (!purchasePrice || !price) {
            return res.redirect(`/parts/add?error=${encodeURIComponent("Harga Beli dan Jual wajib diisi!")}`);
        }

        await Part.create({
            name,
            code: code.toUpperCase(),
            stock: parseInt(stock) || 0,
            purchasePrice: parseFloat(purchasePrice),
            sellingPrice: parseFloat(price), // Mapping field 'price' ke 'sellingPrice'
            supplier: supplier || '-'
        });

        res.redirect('/parts?success=Suku+cadang+berhasil+ditambahkan');
    } catch (error) {
        let msg = error.message;
        if (error.code === 11000) msg = "Kode atau Nama Part sudah ada!";
        res.redirect(`/parts/add?error=${encodeURIComponent(msg)}`);
    }
};
// ------------------------------------
// 3. Fungsi UPDATE & EDIT PAGE
// ------------------------------------
const getEditPage = async (req, res) => {
    try {
        const part = await Part.findById(req.params.id);
        if (!part) return res.status(404).send("Suku cadang tidak ditemukan");

        res.render('parts/edit', { 
            title: 'Edit Suku Cadang', 
            part: part, 
            user: req.user,
            activePage: 'parts' 
        });
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
};

const updatePart = async (req, res) => {
    try {
        const { name, code, purchasePrice, sellingPrice, stock, supplier } = req.body;
        
        const updatedPart = await Part.findByIdAndUpdate(req.params.id, {
            name,
            code: code.toUpperCase(),
            purchasePrice: parseFloat(purchasePrice),
            sellingPrice: parseFloat(sellingPrice),
            stock: parseInt(stock) || 0,
            supplier: supplier || '-'
        }, { new: true, runValidators: true });

        if (!updatedPart) return res.status(404).send("Data tidak ditemukan.");
        res.redirect('/parts?success=Data+berhasil+diperbarui');
    } catch (error) {
        res.redirect(`/api/parts/${req.params.id}/edit?error=${encodeURIComponent(error.message)}`);
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
// EXPORTS (Sesuai dengan nama fungsi di atas)
// =====================================
module.exports = {
    getAllParts,
    createPartApi: async (req, res) => { /* Placeholder API */ },
    createPartView,
    getEditPage: async (req, res) => {
        const part = await Part.findById(req.params.id);
        res.render('parts/edit', { title: 'Edit Suku Cadang', part, user: req.user, activePage: 'parts' });
    },
    updatePart,
    deletePart
};