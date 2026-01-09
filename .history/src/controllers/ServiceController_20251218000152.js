// src/controllers/ServiceController.js
const Service = require('../models/Service');

// @desc    Mengambil semua layanan (Jasa & Suku Cadang)
const getServices = async (req, res) => {
    try {
        const services = await Service.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: services });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Membuat layanan baru (Fungsi yang tadi Error)
const createService = async (req, res) => {
    try {
        const { name, code, price, stock, isPart } = req.body;

        // Validasi dasar
        if (!name || !code || !price) {
            return res.status(400).json({ success: false, message: 'Nama, Kode, dan Harga wajib diisi' });
        }

        const newService = await Service.create({
            name,
            code,
            price: parseFloat(price),
            stock: isPart === 'true' || isPart === true ? parseInt(stock) : 0,
            isPart: isPart === 'true' || isPart === true
        });

        res.status(201).json({ success: true, data: newService });
    } catch (error) {
        // Cek jika error karena kode duplikat
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Kode sudah digunakan' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        }
        res.status(200).json({ success: true, data: service });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Menghapus layanan
const deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        res.status(200).json({ success: true, message: 'Data berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Pastikan semua fungsi diekspor dengan benar
module.exports = {
    getServices,
    createService,
    deleteService
};