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
// src/controllers/ServiceController.js

const createService = async (req, res) => {
    try {
        // Ambil data dari body (pastikan name pada input HTML sesuai)
        const { name, code, price, description, isPart } = req.body;

        // Validasi manual tambahan jika perlu sebelum masuk ke skema
        if (!name || !code) {
            throw new Error('Nama dan Kode Jasa tidak boleh kosong');
        }

        const newService = await Service.create({
            name,
            code,
            price: parseFloat(price),
            description,
            isPart: isPart === 'true' || isPart === true, // Default false untuk Jasa
            stock: 0 // Jasa biasanya tidak memiliki stok
        });

        // Jika berhasil, arahkan kembali ke daftar atau kirim JSON sukses
        res.redirect('/services'); 
    } catch (error) {
        // Error validation Mongoose akan ditangkap di sini
        res.status(400).send(`Tambah Jasa Gagal: ${error.message}. <a href="/services/add">Kembali ke Form</a>`);
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
    getServiceById,
    deleteService
};