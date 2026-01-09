// src/routes/mekanikViewRoutes.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Job = require('../models/Job');

router.get('/mechanic/dashboard', protect, restrictTo('mekanik'), async (req, res) => {
    try {
        // Ambil data untuk antrean (pending)
        const pendingJobs = await Job.find({ status: 'pending' }).sort({ createdAt: -1 });
        
        // Ambil data untuk riwayat/proses (on_progress & completed)
        const historyJobs = await Job.find({ status: { $ne: 'pending' } })
                                     .populate('mechanicId', 'name') // Gunakan field yang sesuai di skema
                                     .sort({ updatedAt: -1 }).limit(10);

        // Render ke folder 'mechanic' (BUKAN 'mekanik')
        res.render('mechanic/dashboard', { 
            title: 'Dashboard Mekanik', 
            pendingJobs, 
            historyJobs,
            user: req.user,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Error memuat dashboard: " + error.message);
    }
});

module.exports = router;