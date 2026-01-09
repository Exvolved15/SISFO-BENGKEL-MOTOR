// sisfo-bengkel-baru/src/controllers/ServiceController.js

const Service = require('../models/Service'); 

// 1. CREATE Service/Part
exports.createService = async (req, res) => {
    try {
        const newService = await Service.create(req.body);
        res.status(201).json({ success: true, data: newService });
    } catch (error) {
        // Tangani error duplikasi kode atau validasi
        res.status(400).json({ success: false, message: 'Gagal membuat item: ' + error.message });
    }
};

// 2. READ All Services/Parts
exports.getServices = async (req, res) => {
    try {
        // Hanya tampilkan yang stoknya > 0 jika diakses Kasir/Mekanik (opsional)
        const services = await Service.find().sort('name'); 
        res.status(200).json({ success: true, data: services });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @deskripsi: Memperbarui jasa servis
const updateService = async (req, res) => {
    try {
        const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!service) {
            return res.status(404).json({ success: false, message: 'Jasa Servis tidak ditemukan' });
        }

        res.status(200).json({ success: true, data: service });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @deskripsi: Menghapus jasa servis
const deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);

        if (!service) {
            return res.status(404).json({ success: false, message: 'Jasa Servis tidak ditemukan' });
        }

        res.status(200).json({ success: true, message: 'Jasa Servis berhasil dihapus', data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllServices,
    createService,
    updateService, // <-- Export fungsi baru
    deleteService // <-- Export fungsi baru
};