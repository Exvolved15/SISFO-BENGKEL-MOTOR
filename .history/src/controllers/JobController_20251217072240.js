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
// --- TAMBAHKAN DEFINISI FUNGSI getJobs DI SINI ---
const getJobs = async (req, res) => {
    try {
        // Logika untuk mengambil semua pekerjaan (biasanya untuk Admin/Kasir)
        const jobs = await Job.find().populate('assignedTo');
        // Atau logika untuk merender halaman view Kasir
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        console.error('Error fetching all jobs:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }

};

module.exports = {
    getMekanikJobs: exports.getMekanikJobs, // Ambil yang didefinisikan di atas
    getMyJobs,
    updateJobStatus,
    getJobs, // Tambahkan fungsi yang diperlukan routes lain
    createJob // Tambahkan fungsi yang diperlukan routes lain
};