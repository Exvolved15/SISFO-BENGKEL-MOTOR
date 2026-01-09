// src/routes/mekanikViewRoutes.js

const express = require('express');
const router = express.Router();
// Import controller dan middleware
const { getMyJobs } = require('../controllers/JobController'); 
const { protect, restrictTo } = require('../middleware/authMiddleware'); 

// Dashboard Mekanik (halaman daftar pekerjaan)
router.get('/jobs', 
    protect, 
    restrictTo('mekanik'), 
    async (req, res) => {
        try {
            // Kita akan panggil fungsi getMyJobs dari Controller (tanpa respons JSON)
            // Lógica mengambil jobs akan berada di controller atau di view, tapi kita pisahkan agar rapi
            
            // Contoh sederhana: Render view
            res.render('mekanik/mekanikDashboard', { 
                title: 'Pekerjaan Saya',
                user: req.user, // Kirim data user untuk header/sidebar
            });
        } catch (error) {
            console.error('Gagal memuat dashboard Mekanik:', error);
            res.status(500).render('error/500', { message: 'Gagal memuat data pekerjaan.' });
        }
    }
);

module.exports = router;