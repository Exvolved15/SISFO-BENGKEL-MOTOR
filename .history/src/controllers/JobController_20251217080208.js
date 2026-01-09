// src/controllers/JobController.js

const Job = require('../models/Job'); // Asumsi ada model Job

exports.getMekanikJobs = async (req, res) => {
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
        res.status(500).send('Gagal memuat pekerjaan mekanik.');
    }
};

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

// @deskripsi: Update status pekerjaan (Misal: dari 'In Progress' ke 'Completed')
// @rute: PUT /api/jobs/:id/status
const updateJobStatus = async (req, res) => {
    // ID pekerjaan diambil dari URL parameter
    const { id } = req.params; 
    // Status baru dari body request (misalnya { status: 'completed' })
    const { status } = req.body; 
    
    // ID user yang sedang login (didapat dari protect middleware)
    const mekanikId = req.user._id;

    // Status yang valid untuk Mekanik (misalnya: in_progress, completed)
    const validStatuses = ['in_progress', 'completed'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Status yang diberikan tidak valid.' 
        });
    }

    try {
        // 1. Cari pekerjaan dan pastikan ditugaskan kepada Mekanik ini
        const job = await Job.findOne({ 
            _id: id, 
            assignedTo: mekanikId // KRITIS: Memastikan Mekanik hanya bisa update job mereka
        });

        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pekerjaan tidak ditemukan atau bukan tugas Anda.' 
            });
        }

        // 2. Update status
        job.status = status;
        
        // Jika status selesai, catat waktu penyelesaian
        if (status === 'completed' && !job.completedAt) {
            job.completedAt = new Date();
        }

        await job.save();

        res.status(200).json({ 
            success: true, 
            message: `Status pekerjaan ${id} berhasil diperbarui menjadi ${status}.`,
            data: job
        });

    } catch (error) {
        console.error('Error updating job status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal memperbarui status pekerjaan.' 
        });
    }
};

const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find().populate('assignedTo');
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        console.error('Error fetching all jobs:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const createJob = async (req, res) => {
    try {
        res.status(201).json({ 
            success: true, 
            message: 'Job created successfully (Placeholder)' 
        });
    } catch (error) {
        console.error('Error creating job:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};



// Pastikan semua didefinisikan atau diambil dari exports.namaFungsi
module.exports = {
    getMekanikJobs: exports.getMekanikJobs, // Ambil yang diekspor di atas
    getMyJobs,
    updateJobStatus,
    getJobs, 
    createJob 
};