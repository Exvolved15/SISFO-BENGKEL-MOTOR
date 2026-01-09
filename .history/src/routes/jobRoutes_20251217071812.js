// src/routes/jobRoutes.js

const express = require('express');
const router = express.Router();
// Pastikan JobController diimpor
const { getMyJobs, updateJobStatus } = require('../controllers/JobController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
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
// Rute yang hanya diakses Mekanik untuk melihat pekerjaan mereka
router.route('/mine')
    .get(protect, restrictTo('mekanik'), getMyJobs);// HANYA MEKANIK

// Rute untuk Mekanik mengupdate status pekerjaan mereka
router.route('/:id/status')
    .put(protect, restrictTo('mekanik'), updateJobStatus); // HANYA MEKANIK

router.route('/mekanik/jobs') 
    .get(protect, restrictTo('mekanik'), getMekanikJobs); // <--- getMekanikJobs SANGAT MUNGKIN UNDEFINED

    module.exports = router;