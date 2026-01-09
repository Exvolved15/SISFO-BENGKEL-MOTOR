const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Job = require('../models/Job');

// [LOKASI]: src/routes/mekanikViewRoutes.js

// [LOKASI]: src/routes/mekanikViewRoutes.js Baris 16

router.get('/mechanic/dashboard', protect, async (req, res) => {
    try {
        const mechanicId = req.user._id;

        const pendingJobs = await Job.find({ status: 'pending' }).sort({ createdAt: -1 });
        const historyJobs = await Job.find({ mechanicId: mechanicId }).sort({ updatedAt: -1 });

        res.render('mechanic/dashboard', {
            title: 'Dashboard Mekanik',
            user: req.user,
            pendingJobs: pendingJobs || [],
            historyJobs: historyJobs || [], // Pastikan ini tidak null/undefined
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat data dashboard.");
    }
});

module.exports = router;