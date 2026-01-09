const express = require('express');
const router = express.Router();
const Job = require('../models/Job'); // Pastikan model diimport
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Dashboard Mekanik (Halaman View)
// TAMBAHKAN 'async' di bawah ini
router.get('/jobs', protect, restrictTo('mekanik'), async (req, res) => {
    try {
        // Query ini membutuhkan async karena menggunakan await
        const jobs = await Job.find({ 
            assignedTo: req.user._id,
            status: { $ne: 'completed' } 
        }).sort({ createdAt: -1 });

        res.render('mekanik/jobList', {
            title: 'Daftar Tugas Saya',
            jobs: jobs,
            user: req.user,
            activePage: 'jobs'
        });
    } catch (error) {
        console.error("Error Mekanik View:", error);
        res.status(500).send("Gagal memuat daftar tugas.");
    }
});

module.exports = router;