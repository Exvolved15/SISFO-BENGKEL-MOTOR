// sisfo-bengkel-baru/src/controllers/ServiceController.js

const Service = require('../models/Service'); 

// --- TAMBAHKAN DEFINISI INI (jika belum ada) ---
exports.createService = async (req, res) => {
    try {
        const { name, price, stock, isPart, code } = req.body;
        
        const newService = await Service.create({
            name,
            price: parseFloat(price),
            stock: isPart === 'true' || isPart === true ? parseInt(stock) : 0,
            isPart: isPart === 'true' || isPart === true,
            code: code || `SVC-${Date.now()}`
        });

        res.status(201).json({ success: true, data: newService });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
// 2. READ All Services/Parts
const getServices = async (req, res) => {
    try {
        // Logika untuk mengambil semua suku cadang/jasa
        // const services = await Service.find().sort('name');
        res.status(200).json({ success: true, message: 'Daftar layanan dimuat (Placeholder)' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memuat layanan.' });
    }
};

// --- DEFINISIKAN getServiceById ---
const getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        
        if (!service) {
            return res.status(404).json({ success: false, message: 'Item tidak ditemukan.' });
        }
        
        res.status(200).json({ success: true, data: service });
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat item.' });
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


// ------------------------------------

module.exports = {
    getServices,
    createService,
    getServiceById,
    updateService, // <-- Export fungsi baru
    deleteService // <-- Export fungsi baru
};