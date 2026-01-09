const express = require('express');
const router = express.Router();
const Job = require('../models/Job'); // PENTING: Import model Job
const { protect, restrictTo } = require('../middleware/authMiddleware'); 

// Dashboard Mekanik (Halaman View)
router.get('/jobs', protect, restrictTo('mekanik'), async (req, res) => {
    try {
        // PERBAIKAN: Gunakan model Job, bukan Transaction
        const jobs = await Job.find({ 
            assignedTo: req.user._id,
            status: { $ne: 'completed' } // Opsional: Hanya tampilkan yg belum selesai
        }).sort({ createdAt: -1 });

        res.render('mekanik/jobList', {
            title: 'Daftar Tugas Saya',
            jobs: jobs,
            user: req.user,
            activePage: 'jobs'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Gagal memuat daftar tugas.");
    }
});

module.exports = router;