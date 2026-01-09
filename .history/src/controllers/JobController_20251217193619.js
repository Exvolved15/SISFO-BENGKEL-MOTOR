const Job = require('../models/Job'); 
const User = require('../models/User'); 
const Service = require('../models/Service'); 

// 1. Ambil Semua Job (Admin/Kasir)
const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find().populate('assignedTo', 'name email').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Dashboard Mekanik (Render View)
const getMekanikJobs = async (req, res) => {
    try {
        const mekanikId = req.user._id; 
        const assignedJobs = await Job.find({ 
            assignedTo: mekanikId,
            status: { $in: ['pending', 'in_progress'] }
        }).populate('customer');

        // TAMBAHKAN activePage AGAR NAVBAR TIDAK ERROR
        res.render('mekanik/jobList', { 
            title: 'Daftar Pekerjaan', 
            jobs: assignedJobs,
            user: req.user,           // Kirim data user untuk profil di navbar
            activePage: 'mekanik'     // Kirim activePage agar navbar bisa merender status aktif
        });
    } catch (error) {
        console.error('Error fetching mekanik jobs:', error);
        res.status(500).send('Gagal memuat halaman pekerjaan mekanik.');
    }
};

// 3. API My Jobs (JSON)
const getMyJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ assignedTo: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Buat Job Baru (Kasir mendaftarkan antrean)
// src/controllers/JobController.js

const createJob = async (req, res) => {
    try {
        const { 
            customerName, 
            vehicleLicense, 
            assignedTo, 
            notes, 
            totalAmount, 
            itemDetails // Data dari frontend (TRANSACTION_ITEMS)
        } = req.body;

        // Map data dari frontend ke format schema
        const mappedDetails = itemDetails.map(item => ({
            item: item.itemId,
            name: item.name || "Item", // Pastikan nama item dikirim dari frontend
            price: item.pricePerUnit,
            quantity: item.quantity,
            subtotal: item.pricePerUnit * item.quantity
        }));

        const newJob = new Job({
            jobTitle: `Servis Kendaraan - ${vehicleLicense}`,
            description: notes,
            assignedTo: assignedTo,
            vehicleLicense: vehicleLicense,
            transactionDetails: mappedDetails, // DISIMPAN DI SINI
            totalAmount: totalAmount,
            status: 'pending'
        });

        await newJob.save();
        res.status(201).json({ success: true, data: newJob });
    } catch (error) {
        console.error("Error Create Job:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Update Status (Mekanik)
const updateJobStatus = async (req, res) => {
    const { id } = req.params; 
    const { status } = req.body; 
    const mekanikId = req.user._id;

    try {
        const job = await Job.findOne({ _id: id, assignedTo: mekanikId });

        if (!job) {
            return res.status(404).json({ success: false, message: 'Pekerjaan tidak ditemukan.' });
        }

        job.status = status; // misal: 'completed'
        if (status === 'completed') {
            job.completedAt = new Date();
        }

        await job.save();
        res.status(200).json({ success: true, message: 'Pekerjaan selesai!', data: job });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. Tambah Item/Suku Cadang (Mekanik mengisi detail kerja)
const addServiceItem = async (req, res) => {
    const { jobId, serviceId, quantity } = req.body;

    try {
        const job = await Job.findById(jobId);
        const item = await Service.findById(serviceId);

        if (!job || !item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });

        // Hitung harga dan subtotal
        const price = item.price || item.sellingPrice || 0;
        const subtotal = price * parseInt(quantity);

        // Masukkan ke array transactionDetails
        job.transactionDetails.push({
            item: serviceId,
            name: item.name || item.serviceName,
            price: price,
            quantity: parseInt(quantity),
            subtotal: subtotal
        });

        // Update Total Biaya Keseluruhan
        job.totalAmount = job.transactionDetails.reduce((acc, curr) => acc + curr.subtotal, 0);

        await job.save();
        res.status(200).json({ success: true, message: 'Item berhasil ditambahkan.', data: job });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const printReceipt = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('assignedTo');
        
        if (!job) return res.status(404).send('Data tidak ditemukan');

        res.render('kasir/receipt', { 
            layout: false, // Jangan gunakan main layout agar rapi saat diprint
            job 
        });
    } catch (error) {
        res.status(500).send('Terjadi kesalahan saat mencetak.');
    }
};

module.exports = { getJobs, getMekanikJobs, getMyJobs, createJob, updateJobStatus, addServiceItem, printReceipt };