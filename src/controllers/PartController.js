// [LOKASI]: src/controllers/PartController.js
const Part = require('../models/Part');

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

const createPartView = async (req, res) => {
    try {
        const { name, code, purchasePrice, price, stock, supplier } = req.body;
        
        // Mapping Model
        const newPartData = {
            name,
            code: code.toUpperCase(),
            purchasePrice: parseFloat(purchasePrice),
            sellingPrice: parseFloat(price),
            stock: parseInt(stock) || 0,
            supplier: supplier || '-'
        };

        // TAMBAH: Jika ada file upload
        if (req.file) {
            newPartData.imageUrl = `/uploads/parts/${req.file.filename}`;
        }

        const newPart = new Part(newPartData);
        await newPart.save();
        
        res.redirect('/parts?success=Suku+cadang+berhasil+ditambahkan');
    } catch (error) {
        res.redirect(`/parts/add?error=${encodeURIComponent(error.message)}`);
    }
};

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
        let updateData = { name, code, purchasePrice, sellingPrice, stock, supplier };

        // Pastikan path gambar masuk ke objek updateData
        if (req.file) {
            updateData.imageUrl = `/uploads/parts/${req.file.filename}`;
        } else if (req.body.imageUrl) {
            updateData.imageUrl = req.body.imageUrl;
        }

        await Part.findByIdAndUpdate(req.params.id, updateData);
        res.redirect('/parts?success=Updated');
    } catch (error) {
        res.redirect('/parts?error=' + error.message);
    }
};

const deletePart = async (req, res) => {
    try {
        await Part.findByIdAndDelete(req.params.id);
        res.redirect('/parts?delete=success');
    } catch (error) {
        res.status(500).send("Gagal menghapus data: " + error.message);
    }
};

module.exports = {
    getAllParts,
    createPartView,
    getEditPage,
    updatePart,
    deletePart
};