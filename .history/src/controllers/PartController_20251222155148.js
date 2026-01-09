// sisfo-bengkel-baru/src/controllers/PartController.js

const Part = require('../models/Part');



// ------------------------------------
// 1. Fungsi READ (GET ALL)
// ------------------------------------
const getAllParts = async (req, res) => { // <-- PASTIKAN INI ADA
    try {
        // ... kode ...
    } catch (error) {
        // ... kode ...
    }
};

const addPartManually = async (req, res) => {
    try {
        const { name, code, price, stock, isPart } = req.body;

        // Validasi agar tidak Bad Request
        if (!name || !code || !price) {
            return res.status(400).json({ 
                success: false, 
                message: "Data Nama, Kode, dan Harga harus diisi!" 
            });
        }

        const newService = await Service.create({
            name,
            code,
            price: parseFloat(price),
            stock: parseInt(stock) || 0,
            isPart: isPart === 'true' || isPart === true,
            description: req.body.description || ""
        });

        // Jika berhasil, arahkan kembali ke dashboard admin
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.status(400).send("Gagal menambah data: " + error.message);
    }
};

// ------------------------------------
// 2. Fungsi CREATE (POST)
// ------------------------------------
const createPart = async (req, res) => {
    // ... logic pembuatan suku cadang ...
    // Pastikan fungsi ini ada isinya (meskipun hanya placeholder)
    res.status(201).json({ success: true, message: 'Suku cadang berhasil ditambahkan.' });
};

// ------------------------------------
// 3. Fungsi READ (GET BY ID)
// ------------------------------------
const getPartById = async (req, res) => { // <-- PASTIKAN INI ADA
    try {
        // ... kode ...
    } catch (error) {
        // ... kode ...
    }
};

// ------------------------------------
/exports.getEditPage = async (req, res) => {
    try {
        const part = await Part.findById(req.params.id);
        if (!part) return res.status(404).send("Suku cadang tidak ditemukan");

        res.render('parts/edit', { 
            title: 'Edit Suku Cadang', 
            part: part, 
            activePage: 'parts' 
        });
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
};

// --- LOGIKA UPDATE (PUT) ---
const updatePart = async (req, res) => {
    try {
        const { name, code, price, stock } = req.body;
        
        const updatedPart = await Part.findByIdAndUpdate(req.params.id, {
            name,
            code,
            price: parseFloat(price),
            sellingPrice: parseFloat(price),
            stock: parseInt(stock) || 0
        }, { new: true, runValidators: true });

        if (!updatedPart) return res.status(404).send("Data tidak ditemukan.");

        // Setelah update berhasil, redirect kembali ke daftar suku cadang
        res.redirect('/parts');
    } catch (error) {
        res.status(400).send("Gagal update: " + error.message);
    }
};

// ------------------------------------
// 5. Fungsi DELETE
// ------------------------------------
const deletePart = async (req, res) => { // <-- PASTIKAN INI ADA
    try {
        // ... kode ...
    } catch (error) {
        // ... kode ...
    }
};

// @deskripsi: Menambahkan suku cadang baru (digunakan oleh API)
// @rute: POST /api/parts
// @akses: Private (Admin/Kasir)
const createPartApi = async (req, res) => { // <-- Ubah nama fungsi ini menjadi API
    try {
        const part = await Part.create(req.body); 
        res.status(201).json({ success: true, data: part });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @deskripsi: Logic untuk menambahkan suku cadang (digunakan oleh ViewRoutes)
const createPartView = async (req, res, next) => {
    try {
        await Part.create(req.body); 
        // Jika berhasil, panggil next() agar lanjut ke middleware berikutnya (redirect)
        next(); 
    } catch (error) {
        // Jika error validasi, kita akan tangani di sini 
        // Untuk sekarang, kita hanya log error dan biarkan request hang (kita perbaiki ini nanti)
        console.error("Error saat menyimpan dari Form:", error.message);
        res.status(500).send('Error Validasi: Data tidak lengkap atau tidak valid.'); // <-- Minimal kirim error response
    }
};


module.exports = {
    getAllParts,
    createPart,
    createPartApi,    // <-- Eksport API version
    createPartView,   // <-- Eksport VIEW version
    getPartById,
    updatePart,
    deletePart,
};