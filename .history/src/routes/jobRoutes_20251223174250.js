// src/routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/JobController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Dashboard Utama
router.get('/mechanic/dashboard', protect, restrictTo('mekanik'), jobController.getMechanicDashboard);

// Aksi Ambil Job (Pastikan POST)
router.post('/take-job/:id', protect, restrictTo('mekanik', 'admin'), jobController.takeJob);

// Rute untuk mekanik mengubah status (PENTING)
router.patch('/update-status/:id', protect, jobController.updateJobStatus);

// Aksi Selesaikan Job (Pastikan POST)
router.post('/finish/:id', protect, restrictTo('mekanik', 'admin'), jobController.finishJob); 

module.exports = router;