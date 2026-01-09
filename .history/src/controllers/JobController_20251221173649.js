const Job = require('../models/Job');
const User = require('../models/User');

// Menampilkan Dashboard Mekanik (Antrean & Riwayat)
// src/controllers/JobController.js

exports.getMechanicDashboard = async (req, res) => {
    try {
        // Ambil pekerjaan yang belum diambil (pending)
        const pendingJobs = await Job.find({ status: 'pending' }).sort({ createdAt: -1 });

        // Ambil riwayat/pekerjaan aktif (bukan pending)
        const historyJobs = await Job.find({ status: { $ne: 'pending' } })
            .populate('mechanicId', 'name')
            .sort({ updatedAt: -1 })
            .limit(10);

        res.render('mechanic/dashboard', {
            title: 'Dashboard Mekanik',
            user: req.user,
            pendingJobs,
            historyJobs,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard: " + error.message);
    }
};

// Mekanik mengambil pekerjaan
exports.takeJob = async (req, res) => {
    try {
        await Job.findByIdAndUpdate(req.params.id, {
            mechanicId: req.user._id,
            status: 'on_progress'
        });
        res.redirect('/mechanic/dashboard');
    } catch (error) {
        res.status(500).send("Gagal mengambil pekerjaan: " + error.message);
    }
};

// Update status menjadi selesai
exports.finishJob = async (req, res) => {
    try {
        await Job.findByIdAndUpdate(req.params.id, {
            status: 'completed',
            completedAt: new Date()
        });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};