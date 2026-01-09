const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Job = require('../models/Job');

router.get('/mechanic/dashboard', protect, restrictTo('mekanik', 'admin'), async (req, res) => {
    try {
        const Job = require('../models/Job'); // Pastikan model diimport
        const pendingJobs = await Job.find({ status: 'pending' }).sort({ createdAt: -1 });
        const historyJobs = await Job.find({ status: { $ne: 'pending' } })
                                     .populate('mechanicId', 'name')
                                     .sort({ updatedAt: -1 }).limit(10);

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