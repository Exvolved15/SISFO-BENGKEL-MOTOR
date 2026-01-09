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

// Untuk request dari Form (EJS) - SINKRON DENGAN IMAGEURL
const createPartView = async (req, res) => {
    try {
        // 1. Tangkap semua data (Sinkronkan 'price' ke 'sellingPrice' dan ambil 'imageUrl')
        const { name, code, purchasePrice, price, stock, supplier, imageUrl } = req.body;

        // 2. Mapping ke Model Mongoose
        const newPart = new Part({
            name: name,
            code: code.toUpperCase(),
            purchasePrice: parseFloat(purchasePrice) || 0,
            sellingPrice: parseFloat(price) || 0,
            stock: parseInt(stock) || 0,
            supplier: supplier || '-',
            imageUrl: imageUrl || '' // <--- Pastikan imageUrl tersimpan saat tambah data
        });

        await newPart.save();
        res.redirect('/parts?success=Suku+cadang+berhasil+ditambahkan');

    } catch (error) {
        console.error("Validation Error:", error.message);
        res.redirect(`/parts/add?error=${encodeURIComponent(error.message)}`);
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
        const { id } = req.params;
        // Tangkap 'sellingPrice' dari form edit (di form edit atribut name-nya biasanya sellingPrice)
        const { name, code, stock, purchasePrice, sellingPrice, supplier, imageUrl } = req.body;

        const updatedData = {
            name,
            code: code.toUpperCase(),
            stock: parseInt(stock),
            purchasePrice: parseFloat(purchasePrice),
            sellingPrice: parseFloat(sellingPrice),
            supplier,
            imageUrl // <--- UPDATE IMAGEURL KE DATABASE
        };

        await Part.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
        
        res.redirect('/parts?success=Data+berhasil+diperbarui');
    } catch (error) {
        console.error("Update Error:", error.message);
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
// EXPORTS SINKRON (Sesuai dengan nama fungsi)
// =====================================
module.exports = {
    getAllParts,
    createPartApi,
    createPartView,
    getEditPage,
    updatePart,
    deletePart
};