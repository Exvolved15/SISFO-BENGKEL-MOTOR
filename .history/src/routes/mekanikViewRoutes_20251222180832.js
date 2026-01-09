const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Job = require('../models/Job');

router.get('/mechanic/dashboard', protect, async (req, res) => {
    try {
        const mechanicId = req.user._id;

        // Ambil antrean & riwayat
        const pendingJobs = await Job.find({ status: 'pending' }).sort({ createdAt: -1 });
        const historyJobs = await Job.find({ mechanicId: mechanicId }).sort({ updatedAt: -1 });

        res.render('mechanic/dashboard', {
            title: 'Dashboard Mekanik',
            user: req.user,
            pendingJobs,
            historyJobs, // Variabel ini akan digunakan EJS untuk mencari activeJob
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard mekanik");
    }
});

module.exports = router;