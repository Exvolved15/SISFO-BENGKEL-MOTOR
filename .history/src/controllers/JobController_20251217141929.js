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
 * @desc    Mengambil pekerjaan yang ditugaskan ke mekanik (Render View)
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
 * @desc    Membuat pekerjaan (job) baru (Kasir)
 * @route   POST /api/jobs
 */
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
 * @desc    Mengambil pekerjaan yang ditugaskan ke mekanik (Render View)
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
 * @desc    Membuat pekerjaan (job) baru (Kasir)
 * @route   POST /api/jobs
 */
const createJob = async (req, res) => {
    const { 
        customerName, 
        customerPhone, 
        vehicleModel, 
        licensePlate, 
        serviceDetails, 
        assignedToUid // Gunakan ID atau UID sesuai data dari frontend
    } = req.body;

    try {
        // Cari Mekanik. Jika frontend kirim _id MongoDB, gunakan findById. 
        // Jika kirim UID Firebase, gunakan findOne.
        const assignedMekanik = await User.findOne({ 
            $or: [{ uid: assignedToUid }, { _id: assignedToUid }], 
            role: 'mekanik' 
        });

        if (!assignedMekanik) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mekanik yang ditugaskan tidak valid atau tidak ditemukan.' 
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
            serviceDetails: serviceDetails,
            assignedTo: assignedMekanik._id,
            status: 'pending',
            createdBy: req.user._id, 
        });

        res.status(201).json({ 
            success: true, 
            message: 'Pekerjaan baru berhasil dibuat.',
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
        res.status(500).json({ success: false, message: 'Gagal memperbarui status.' });
    }
};

/**
 * @desc    Menambah Suku Cadang/Jasa ke dalam Job yang sudah ada
 * @route   POST /api/jobs/add-item
 */
const addServiceItem = async (req, res) => {
    const { jobId, serviceId, quantity } = req.body;

    if (!jobId || !serviceId || !quantity) {
         return res.status(400).json({ success: false, message: 'Data tidak lengkap.' });
    }

    try {
        const job = await Job.findById(jobId);
        const item = await Service.findById(serviceId);

        if (!job || !item) {
             return res.status(404).json({ success: false, message: 'Pekerjaan atau Item tidak ditemukan.' });
        }

        // Cek Stok jika item adalah Suku Cadang
        if (item.isPart) {
            if (item.stock < quantity) {
                return res.status(400).json({ success: false, message: 'Stok tidak mencukupi.' });
            }
            item.stock -= quantity;
            await item.save();
        }

        job.transactionDetails.push({
            item: serviceId,
            name: item.name || item.serviceName,
            price: item.price || item.sellingPrice,
            quantity: quantity,
            subtotal: (item.price || item.sellingPrice) * quantity,
        });

        await job.save();
        res.status(200).json({ success: true, message: 'Item berhasil ditambahkan.', data: job });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Ekspor semua fungsi dengan konsisten
module.exports = {
    getJobs,
    getMekanikJobs,
    getMyJobs,
    createJob,
    updateJobStatus,
    addServiceItem
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
        res.status(500).json({ success: false, message: 'Gagal memperbarui status.' });
    }
};

/**
 * @desc    Menambah Suku Cadang/Jasa ke dalam Job yang sudah ada
 * @route   POST /api/jobs/add-item
 */
const addServiceItem = async (req, res) => {
    const { jobId, serviceId, quantity } = req.body;

    if (!jobId || !serviceId || !quantity) {
         return res.status(400).json({ success: false, message: 'Data tidak lengkap.' });
    }

    try {
        const job = await Job.findById(jobId);
        const item = await Service.findById(serviceId);

        if (!job || !item) {
             return res.status(404).json({ success: false, message: 'Pekerjaan atau Item tidak ditemukan.' });
        }

        // Cek Stok jika item adalah Suku Cadang
        if (item.isPart) {
            if (item.stock < quantity) {
                return res.status(400).json({ success: false, message: 'Stok tidak mencukupi.' });
            }
            item.stock -= quantity;
            await item.save();
        }

        job.transactionDetails.push({
            item: serviceId,
            name: item.name || item.serviceName,
            price: item.price || item.sellingPrice,
            quantity: quantity,
            subtotal: (item.price || item.sellingPrice) * quantity,
        });

        await job.save();
        res.status(200).json({ success: true, message: 'Item berhasil ditambahkan.', data: job });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Ekspor semua fungsi dengan konsisten
module.exports = {
    getJobs,
    getMekanikJobs,
    getMyJobs,
    createJob,
    updateJobStatus,
    addServiceItem // Pastikan fungsi ini yang dipanggil Mekanik tadi ada
};