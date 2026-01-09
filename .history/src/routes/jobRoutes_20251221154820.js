const express = require('express');
const router = express.Router();
const jobController = require('../controllers/JobController'); // Pastikan path benar
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Dashboard Utama Mekanik
// ERROR SEBELUMNYA: Mungkin memanggil fungsi yang undefined
router.get('/mechanic/dashboard', protect, restrictTo('mekanik'), jobController.getMechanicDashboard);

// Aksi Mekanik
router.post('/jobs/take-job/:id', protect, restrictTo('mekanik'), jobController.takeJob);
router.post('/jobs/finish/:id', protect, restrictTo('mekanik'), jobController.finishJob);

module.exports = router;