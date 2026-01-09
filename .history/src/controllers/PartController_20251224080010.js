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
// [LOKASI]: src/controllers/PartController.js

const createPartView = async (req, res, next) => {
    try {
        const { name, code, purchasePrice, price, stock, supplier } = req.body;

        // Validasi di level controller sebelum masuk ke database
        if (!purchasePrice) {
            return res.redirect(`/parts/add?error=${encodeURIComponent("Harga beli wajib diisi!")}`);
        }

        await Part.create({
            name,
            code,
            purchasePrice: parseFloat(purchasePrice), // Menjamin tipe data Number
            price: parseFloat(price),
            stock: parseInt(stock) || 0,
            supplier: supplier || '-'
        }); 

        next(); // Lanjut ke redirect sukses di router
    } catch (error) {
        console.error("Error Simpan Part:", error.message);
        // Kirim error ke URL agar ditangkap Pop-up SweetAlert
        res.redirect(`/parts/add?error=${encodeURIComponent(error.message)}`);
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