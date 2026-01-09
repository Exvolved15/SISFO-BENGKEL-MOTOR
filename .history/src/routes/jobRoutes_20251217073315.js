// src/routes/jobRoutes.js

const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');

// HANYA SATU IMPOR BERSIH DARI CONTROLLER
const { 
    getMyJobs, 
    updateJobStatus, 
    getMekanikJobs, // Sekarang sudah tersedia
    getJobs, 
    createJob // Tambahkan semua fungsi yang Anda gunakan di routes
} = require('../controllers/JobController');
// PASTIKAN FUNGSI DI BARIS 29 DIIMPOR DI SINI
const { fungsiYangHilang } = require('../controllers/JobController');
const jobController = require('../controllers/JobController');
const Job = require('../models/Job'); // Pastikan model Job diimpor
const { getMekanikJobs, getJobs, createJob } = require('../controllers/JobController'); // Asumsi impor

exports.getJobs = async (req, res) => { 
    try {
        const jobs = await Job.find().populate('assignedTo');
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Line 13: Rute untuk Mekanik melihat pekerjaan yang ditugaskan kepada mereka
router.route('/mine') 
    .get(protect, restrictTo('mekanik'), getMyJobs);

// Line 17: Rute untuk Mekanik mengupdate status pekerjaan mereka
router.route('/:id/status')
    .put(protect, restrictTo('mekanik'), updateJobStatus); 

// Line 21: Rute Mekanik Dashboard (View, jika ini digunakan untuk render EJS)
router.route('/mekanik/jobs') 
    .get(protect, restrictTo('mekanik'), getMekanikJobs);

// Line 25: Rute Umum (misalnya untuk Kasir/Admin)
router.route('/jobs')
    .get(protect, restrictTo('admin', 'kasir'), getJobs)
    .post(protect, restrictTo('admin', 'kasir'), createJob);

// Line 30
module.exports = router;