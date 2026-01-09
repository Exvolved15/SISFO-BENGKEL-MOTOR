// src/controllers/JobController.js

const Job = require('../models/Job'); // Asumsi ada model Job


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