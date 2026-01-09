// src/routes/mekanikViewRoutes.js

const express = require('express');
const router = express.Router();
// Import controller dan middleware
const { getMyJobs } = require('../controllers/JobController'); 
const { protect, restrictTo } = require('../middleware/authMiddleware'); 

// Dashboard Mekanik (halaman daftar pekerjaan)
// Rute Dashboard Mekanik
router.get('/jobs', 
    protect, 
    restrictTo('mekanik'), 
    async (req, res) => {
        try {
            // PASTIKAN PATH FILE EJS INI BENAR
            res.render('mekanik/mekanikDashboard', { 
                title: 'Pekerjaan Saya',
                user: req.user, // Pastikan req.user ada
            });
        } catch (error) {
            console.error('Gagal memuat dashboard Mekanik:', error);
            // ...
        }
    }
);
module.exports = router;