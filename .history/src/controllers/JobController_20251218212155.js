const Job = require('../models/Job');
const Service = require('../models/Service');
const User = require('../models/User');

// --- FUNGSI UTILITAS: Generate Nomor Invoice ---
const generateInvoiceNumber = async () => {
    const today = new Date();
    const dateString = today.getFullYear().toString() + 
                       (today.getMonth() + 1).toString().padStart(2, '0') + 
                       today.getDate().toString().padStart(2, '0');
    
    const lastJob = await Job.findOne({ 
        invoiceNumber: { $regex: new RegExp(`INV-${dateString}`, 'i') } 
    }).sort({ createdAt: -1 });

    let counter = 1;
    if (lastJob && lastJob.invoiceNumber) {
        const parts = lastJob.invoiceNumber.split('-');
        const lastCounter = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastCounter)) counter = lastCounter + 1;
    }

    return `INV-${dateString}-${counter.toString().padStart(3, '0')}`;
};

// --- 1. Ambil Semua Job (Untuk Admin/Kasir) ---
const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find()
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 2. Dashboard Mekanik (Halaman View) ---
const getMekanikJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ 
            assignedTo: req.user._id,
            status: { $ne: 'completed' } 
        }).sort({ createdAt: -1 });

        res.render('mekanik/jobList', {
            title: 'Daftar Tugas Saya',
            jobs,
            user: req.user,
            activePage: 'jobs'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat halaman pengerjaan.");
    }
};

// --- 3. Buat Job Baru (Oleh Kasir) ---
// Ganti fungsi createJob Anda dengan logika yang lebih aman:
const createJob = async (req, res) => {
    try {
        // Log req.body untuk debugging (cek di terminal)
        console.log("Data diterima:", req.body);

        const { 
            customerName, // Pastikan EJS mengirim ini
            vehicleLicense, 
            assignedTo, 
            notes, 
            totalAmount, 
            itemDetails 
        } = req.body;

        // Validasi Manual untuk mencegah Error 'not defined'
        if (!customerName || !vehicleLicense) {
            return res.status(400).send("Gagal: Nama pelanggan dan Plat Nomor wajib diisi.");
        }

        const invoiceNumber = await generateInvoiceNumber();
        
        const newJob = await Job.create({
            invoiceNumber,
            customer: { name: customerName }, // Simpan ke sub-document 'customer'
            vehicleLicense,
            description: notes,
            assignedTo: assignedTo || null,
            transactionDetails: itemDetails || [],
            totalAmount: totalAmount || 0,
            status: 'pending'
        });

        res.status(201).json({ success: true, transactionId: newJob._id });
    } catch (error) {
        console.error("Detail Error:", error);
        res.status(500).send("Transaksi Gagal: " + error.message);
    }
};

// --- 4. Update Status (Oleh Mekanik) ---
const updateJobStatus = async (req, res) => {
    const { id } = req.params; 
    const { status } = req.body; 

    try {
        const job = await Job.findByIdAndUpdate(id, { 
            status: status,
            completedAt: status === 'completed' ? new Date() : null 
        }, { new: true });

        if (!job) return res.status(404).json({ success: false, message: 'Pekerjaan tidak ditemukan.' });

        res.status(200).json({ success: true, message: `Status menjadi ${status}`, data: job });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 5. Tambah Item Manual (Oleh Mekanik) ---
const addServiceItem = async (req, res) => {
    const { jobId, serviceId, quantity } = req.body;
    try {
        const job = await Job.findById(jobId);
        const item = await Service.findById(serviceId);

        if (!job || !item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });

        const qty = parseInt(quantity);
        if (item.isPart) {
            if (item.stock < qty) return res.status(400).json({ success: false, message: 'Stok tidak cukup.' });
            item.stock -= qty;
            await item.save();
        }

        job.transactionDetails.push({
            item: serviceId,
            name: item.name,
            price: item.price || 0,
            quantity: qty,
            subtotal: (item.price || 0) * qty
        });

        job.totalAmount = job.transactionDetails.reduce((acc, curr) => acc + curr.subtotal, 0);
        await job.save();
        res.status(200).json({ success: true, message: 'Item ditambahkan.', data: job });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 6. Cetak Resi ---
const printReceipt = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('assignedTo', 'name');
        if (!job) return res.status(404).send('Data tidak ditemukan');
        res.render('kasir/receipt', { layout: false, transaction: job });
    } catch (error) {
        res.status(500).send('Kesalahan cetak.');
    }
};

const getMyJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ assignedTo: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteJob = async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        res.redirect('/admin/dashboard'); 
    } catch (error) {
        res.status(500).send("Gagal hapus.");
    }
};

module.exports = { 
    getJobs, getMekanikJobs, getMyJobs, createJob, 
    updateJobStatus, addServiceItem, deleteJob, printReceipt 
};