const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Job = require('../models/Job');

// Dashboard Utama Mekanik
router.get('/mechanic/dashboard', protect, restrictTo('mekanik'), async (req, res) => {
    try {
        // Ambil kerjaan yang belum ada mekaniknya
        const pendingJobs = await Job.find({ status: 'pending' }).sort({ createdAt: -1 });
        
        // Ambil riwayat kerjaan yang sedang jalan atau selesai
        const historyJobs = await Job.find({ status: { $ne: 'pending' } })
                                     .populate('assignedTo', 'name')
                                     .sort({ updatedAt: -1 }).limit(10);

        // FIX: Menggunakan folder 'mechanic' dan file 'dashboard'
        res.render('mechanic/dashboard', { 
            title: 'Dashboard Mekanik', 
            pendingJobs, 
            historyJobs,
            user: req.user,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard: " + error.message);
    }
});

module.exports = router;