// sisfo-bengkel-baru/src/controllers/ServiceController.js

const Service = require('../models/Service');

// Fungsi untuk mengambil semua jasa
const getAllServices = async (req, res) => {
    try {
        const services = await Service.find({});
        res.status(200).json({ success: true, count: services.length, data: services });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Fungsi untuk menambahkan jasa baru
const createService = async (req, res) => {
    try {
        const service = await Service.create(req.body); 
        // Jika dipanggil dari API (Postman), kirim JSON
        if (req.originalUrl.includes('/api/services')) {
             return res.status(201).json({ success: true, data: service });
        }
        // Jika dipanggil dari form (viewRoutes), lanjut ke middleware berikutnya/redirect
        return service; 

    } catch (error) {
        // Jika ada error validasi Mongoose, kita akan tangkap di sini
        if (req.originalUrl.includes('/api/services')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        // Jika dari form, kita akan tangani error ini di viewRoutes (nanti kita perbaiki)
        throw error;
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