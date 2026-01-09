// [LOKASI]: src/controllers/ServiceController.js
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

const createService = async (req, res) => {
    try {
        const { name, code, price, description, isPart } = req.body;
        if (!name || !code) {
            throw new Error('Nama dan Kode Jasa tidak boleh kosong');
        }
        const newService = await Service.create({
            name,
            code,
            price: parseFloat(price),
            description,
            isPart: isPart === 'true' || isPart === true,
            stock: 0 
        });
        res.redirect('/services'); 
    } catch (error) {
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

// TAMBAHKAN: Fungsi menampilkan halaman edit
const getEditPage = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).send("Jasa servis tidak ditemukan");

        res.render('services/edit', { 
            title: 'Edit Jasa Servis', 
            service: service, 
            user: req.user,
            activePage: 'services' 
        });
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
};

// TAMBAHKAN: Fungsi memproses update
const updateService = async (req, res) => {
    try {
        const { name, code, price, description } = req.body;
        
        // Gunakan { new: true } agar Mongoose mengembalikan data terbaru jika perlu log
        await Service.findByIdAndUpdate(req.params.id, {
            name,
            code: code.toUpperCase(), // Pastikan kode selalu besar
            price: parseFloat(price),
            description: description || '' // Pastikan string kosong jika tidak diisi
        }, { runValidators: true });

        res.redirect('/services?success=Jasa+berhasil+diperbarui'); 
    } catch (error) {
        console.error("Update Service Error:", error.message);
        res.status(400).send("Gagal update: " + error.message);
    }
};


const getAllServices = async (req, res) => {
    try {
        const services = await Service.find().sort({ name: 1 });
        res.render('services/list', { 
            title: 'Daftar Jasa Layanan',
            services, 
            user: req.user, 
            activePage: 'services' 
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        res.redirect('/services?delete=success');
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getServices,
    createService,
    getServiceById,
    getEditPage,    
    updateService,
    getAllServices,
    deleteService
};