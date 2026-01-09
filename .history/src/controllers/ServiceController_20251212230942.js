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

// ... Tambahkan fungsi updateService dan deleteService (opsional) ...

module.exports = {
    getAllServices,
    createService
};