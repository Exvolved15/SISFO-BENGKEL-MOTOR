// src/routes/jobRoutes.js

const express = require('express');
const router = express.Router();
// Pastikan JobController diimpor
const { getMyJobs, updateJobStatus } = require('../controllers/JobController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); 

// Rute yang hanya diakses Mekanik untuk melihat pekerjaan mereka
router.route('/mine')
    .get(protect, restrictTo('mekanik'), getMyJobs); // HANYA MEKANIK

// Rute untuk Mekanik mengupdate status pekerjaan mereka
router.route('/:id/status')
    .put(protect, restrictTo('mekanik'), updateJobStatus); // HANYA MEKANIK

module.exports = router;