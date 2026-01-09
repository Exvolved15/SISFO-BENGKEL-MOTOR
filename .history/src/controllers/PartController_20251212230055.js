// sisfo-bengkel-baru/src/controllers/PartController.js

const Part = require('../models/Part');

// ... (getAllParts, createPart, getPartById tetap sama) ...

// @deskripsi: Memperbarui suku cadang berdasarkan ID
// @rute: PUT /api/parts/:id
// @akses: Private (Admin/Kasir)
const updatePart = async (req, res) => {
    try {
        const part = await Part.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Mengembalikan dokumen yang sudah diperbarui
            runValidators: true // Menjalankan validasi skema saat update
        });

        if (!part) {
            return res.status(404).json({ success: false, message: 'Suku Cadang tidak ditemukan' });
        }

        res.status(200).json({ success: true, data: part });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @deskripsi: Menghapus suku cadang berdasarkan ID
// @rute: DELETE /api/parts/:id
// @akses: Private (Admin/Kasir)
const deletePart = async (req, res) => {
    try {
        const part = await Part.findByIdAndDelete(req.params.id);

        if (!part) {
            return res.status(404).json({ success: false, message: 'Suku Cadang tidak ditemukan' });
        }

        res.status(200).json({ success: true, message: 'Suku Cadang berhasil dihapus', data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllParts,
    createPart,
    getPartById,
    updatePart, // <-- Export fungsi baru
    deletePart  // <-- Export fungsi baru
};