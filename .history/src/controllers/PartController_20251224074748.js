// sisfo-bengkel-baru/src/controllers/PartController.js

const Part = require('../models/Part');

// --- Fungsi READ (GET ALL) ---
const getAllParts = async (req, res) => {
    try {
        const parts = await Part.find({});
        res.status(200).json({ success: true, data: parts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Fungsi CREATE (VIEW version - FIX HARGA BELI) ---
const createPartView = async (req, res, next) => {
    try {
        // Ambil data dari req.body
        const { name, code, purchasePrice, price, stock, supplier } = req.body;

        // Simpan ke database menggunakan skema Part
        await Part.create({
            name,
            code,
            purchasePrice: parseFloat(purchasePrice) || 0, // FIX: Tangkap purchasePrice
            price: parseFloat(price) || 0,                 // Harga Jual
            stock: parseInt(stock) || 0,
            supplier: supplier || '-'
        }); 

        next(); // Lanjut ke redirect di router
    } catch (error) {
        console.error("Error Simpan Part:", error.message);
        // REDIRECT dengan parameter error agar muncul Pop-up SweetAlert di frontend
        res.redirect(`/parts/add?error=${encodeURIComponent(error.message)}`);
    }
};

// --- Fungsi CREATE (API version) ---
const createPartApi = async (req, res) => {
    try {
        const part = await Part.create(req.body); 
        res.status(201).json({ success: true, data: part });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// --- Logika UPDATE (PUT) ---
const updatePart = async (req, res) => {
    try {
        const { name, code, purchasePrice, price, stock } = req.body;
        const updatedPart = await Part.findByIdAndUpdate(req.params.id, {
            name,
            code,
            purchasePrice: parseFloat(purchasePrice),
            price: parseFloat(price),
            stock: parseInt(stock) || 0
        }, { new: true, runValidators: true });

        if (!updatedPart) return res.status(404).send("Data tidak ditemukan.");
        res.redirect('/parts');
    } catch (error) {
        res.status(400).send("Gagal update: " + error.message);
    }
};

// --- Fungsi DELETE ---
const deletePart = async (req, res) => {
    try {
        await Part.findByIdAndDelete(req.params.id);
        res.redirect('/parts?delete=success');
    } catch (error) {
        res.status(500).send("Error hapus: " + error.message);
    }
}

module.exports = {
    getAllParts,
    createPartView,  
    createPartApi,
    getEditPage: async (req, res) => {
        const part = await Part.findById(req.params.id);
        res.render('parts/edit', { title: 'Edit Suku Cadang', part, activePage: 'parts' });
    },
    updatePart,
    deletePart
};