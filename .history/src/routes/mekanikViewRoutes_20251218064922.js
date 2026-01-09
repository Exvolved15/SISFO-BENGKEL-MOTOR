// src/routes/mekanikViewRoutes.js

const express = require('express');
const router = express.Router();
// Import controller dan middleware
const { getMyJobs } = require('../controllers/JobController'); 
const { protect, restrictTo } = require('../middleware/authMiddleware'); 

// Dashboard Mekanik (halaman daftar pekerjaan)
// Rute Dashboard Mekanik
router.get('/jobs', protect, restrictTo('mekanik'), async (req, res) => {
    try {
        // Cari tugas (Job/Transaction) berdasarkan ID mekanik yang sedang login
        const jobs = await Transaction.find({ assignedTo: req.user._id }).sort({ createdAt: -1 });

        res.render('mekanik/jobList', {
            title: 'Daftar Tugas Saya',
            jobs: jobs,
            user: req.user,
            activePage: 'jobs'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat daftar tugas.");
    }
});
module.exports = router;