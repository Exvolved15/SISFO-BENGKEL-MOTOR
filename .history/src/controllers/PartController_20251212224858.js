// sisfo-bengkel-baru/src/controllers/PartController.js

const Part = require('../models/Part'); // Panggil Model Suku Cadang

// @deskripsi: Mengambil semua suku cadang
// @rute: GET /api/parts
// @akses: Public (sementara)
const getAllParts = async (req, res) => {
    try {
        const parts = await Part.find({}); // Ambil semua dokumen dari koleksi Part
        res.status(200).json({ success: true, count: parts.length, data: parts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @deskripsi: Menambahkan suku cadang baru
// @rute: POST /api/parts
// @akses: Private (Admin/Kasir)
const createPart = async (req, res) => {
    try {
        // Data dari body request (misalnya: nama, code, stock, price)
        const part = await Part.create(req.body); 
        res.status(201).json({ success: true, data: part });
    } catch (error) {
        // Mongoose error handling (misalnya data kurang/tidak valid)
        res.status(400).json({ success: false, message: error.message });
    }
};

// @deskripsi: Mengambil suku cadang berdasarkan ID
// @rute: GET /api/parts/:id
// @akses: Public (sementara)
const getPartById = async (req, res) => {
    try {
        const part = await Part.findById(req.params.id);

        if (!part) {
            return res.status(404).json({ success: false, message: 'Suku Cadang tidak ditemukan' });
        }
        
        res.status(200).json({ success: true, data: part });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllParts,
    createPart,
    getPartById,
};