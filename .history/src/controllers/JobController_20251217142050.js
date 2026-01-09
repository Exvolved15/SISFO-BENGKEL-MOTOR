// src/controllers/JobController.js

const Job = require('../models/Job'); 
const User = require('../models/User'); 
const Service = require('../models/Service'); 

/**
 * @desc    Mengambil semua daftar pekerjaan (Admin/Kasir)
 * @route   GET /api/jobs
 */
const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find().populate('assignedTo', 'name email');
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        console.error('Error fetching all jobs:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Mengambil pekerjaan yang ditugaskan ke mekanik (Render View Dashboard)
 * @route   GET /jobs/mekanik
 */
const getMekanikJobs = async (req, res) => {
    try {
        const mekanikId = req.user._id; 
        const assignedJobs = await Job.find({ 
            assignedTo: mekanikId,
            status: { $in: ['pending', 'in_progress'] }
        }).populate('customer');

        res.render('mekanik/jobList', { 
            title: 'Daftar Pekerjaan', 
            jobs: assignedJobs,
            user: req.user 
        });
    } catch (error) {
        console.error('Error fetching mekanik jobs:', error);
        res.status(500).send('Gagal memuat halaman pekerjaan mekanik.');
    }
};

/**
 * @desc    API untuk mekanik mengambil daftar pekerjaannya sendiri (JSON)
 */
const getMyJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ assignedTo: req.user._id })
                             .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        console.error('Gagal mengambil pekerjaan mekanik:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pekerjaan.' });
    }
};

/**
 * @desc    Membuat pendaftaran antrean baru (Kasir)
 * @route   POST /api/jobs
 */
const createJob = async (req, res) => {
    const { 
        customerName, 
        customerPhone, 
        vehicleModel, 
        licensePlate, 
        assignedTo // Ini harus berisi ID Mekanik dari Dropdown
    } = req.body;

    try {
        // Validasi Mekanik di Database
        const assignedMekanik = await User.findById(assignedTo);

        if (!assignedMekanik || assignedMekanik.role !== 'mekanik') {
            return res.status(400).json({ 
                success: false, 
                message: 'Mekanik yang dipilih tidak valid.' 
            });
        }

        const newJob = await Job.create({
            customer: {
                name: customerName,
                phone: customerPhone,
            },
            vehicle: {
                model: vehicleModel,
                licensePlate: licensePlate,
            },
            assignedTo: assignedMekanik._id,
            status: 'pending',
            createdBy: req.user._id, 
        });

        res.status(201).json({ 
            success: true, 
            message: 'Antrean berhasil dibuat.',
            data: newJob
        });

    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal membuat pekerjaan: ' + error.message 
        });
    }
};

/**
 * @desc    Update status pekerjaan oleh Mekanik
 * @route   PUT /api/jobs/:id/status
 */
const updateJobStatus = async (req, res) => {
    const { id } = req.params; 
    const { status } = req.body; 
    const mekanikId = req.user._id;
    const validStatuses = ['in_progress', 'completed'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    }

    try {
        const job = await Job.findOne({ _id: id, assignedTo: mekanikId });

        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pekerjaan tidak ditemukan atau bukan milik Anda.' 
            });
        }

        job.status = status;
        if (status === 'completed' && !job.completedAt) {
            job.completedAt = new Date();
        }

        await job.save();
        res.status(200).json({ success: true, message: 'Status diperbarui.', data: job });

    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui status.' });
    }
};

/**
 * @desc    Mekanik menambah Suku Cadang/Jasa ke dalam Job
 * @route   POST /api/jobs/add-item
 */
const addServiceItem = async (req, res) => {
    const { jobId, serviceId, quantity } = req.body;

    if (!jobId || !serviceId || !quantity) {
         return res.status(400).json({ success: false, message: 'Data tidak lengkap (Job ID, Item ID, atau Qty kosong).' });
    }

    try {
        const job = await Job.findById(jobId);
        const item = await Service.findById(serviceId);

        if (!job || !item) {
             return res.status(404).json({ success: false, message: 'Pekerjaan atau Item tidak ditemukan.' });
        }

        // Logika Pengurangan Stok jika item adalah Suku Cadang
        if (item.isPart || item.stock !== undefined) {
            if (item.stock < quantity) {
                return res.status(400).json({ success: false, message: 'Stok barang tidak mencukupi.' });
            }
            item.stock -= quantity;
            await item.save();
        }

        // Masukkan ke detail transaksi di dalam Job
        job.transactionDetails.push({
            item: serviceId,
            name: item.name || item.serviceName,
            price: item.price || item.sellingPrice || 0,
            quantity: quantity,
            subtotal: (item.price || item.sellingPrice || 0) * quantity,
        });

        await job.save();
        res.status(200).json({ success: true, message: 'Item berhasil ditambahkan ke pekerjaan.', data: job });

    } catch (error) {
        console.error('Add item error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Ekspor semua fungsi secara konsisten
module.exports = {
    getJobs,
    getMekanikJobs,
    getMyJobs,
    createJob,
    updateJobStatus,
    addServiceItem
};