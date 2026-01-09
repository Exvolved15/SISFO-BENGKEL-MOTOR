// src/controllers/JobController.js

const Job = require('../models/Job'); // Asumsi ada model Job

exports.getMekanikJobs = async (req, res) => {
    try {
        // Ambil User ID Mekanik dari sesi/token
        const mekanikId = req.user._id; 
        
        // Asumsi model Job memiliki field assignedTo (reference ke User ID Mekanik)
        const assignedJobs = await Job.find({ 
            assignedTo: mekanikId,
            status: { $in: ['pending', 'in_progress'] } // Pekerjaan yang masih aktif
        }).populate('customer'); // Jika ada relasi dengan customer

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

// @deskripsi: Mengambil semua pekerjaan yang ditugaskan kepada user yang sedang login (Mekanik)
// @rute: GET /api/jobs/mine
const getMyJobs = async (req, res) => {
    try {
        // req.user._id berasal dari JWT yang sudah diverifikasi di middleware protect
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
    // ... logic update status (hanya boleh dilakukan oleh Mekanik yang bersangkutan) ...
};

module.exports = {
    getMyJobs,
    updateJobStatus,
    // ... fungsi lain untuk manajemen job (jika ada)
};