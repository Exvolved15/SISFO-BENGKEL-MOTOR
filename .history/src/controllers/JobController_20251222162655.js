const Job = require('../models/Job');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
// Menampilkan Dashboard Mekanik (Antrean & Riwayat)
// src/controllers/JobController.js

exports.getMechanicDashboard = async (req, res) => {
    try {
        const mechanicId = req.user._id;

        // 1. Ambil antrean baru (masih pending)
        const pendingJobs = await Job.find({ status: 'pending' }).sort({ createdAt: -1 });

        // 2. Ambil pekerjaan aktif yang sedang dikerjakan mekanik ini
        const activeJobs = await Job.find({ 
            status: 'on_progress', 
            mechanicId: mechanicId 
        }).sort({ updatedAt: -1 });

        // 3. Ambil RIWAYAT pekerjaan yang sudah SELESAI oleh mekanik ini
        const completedJobs = await Job.find({ 
            status: 'completed', 
            mechanicId: mechanicId 
        }).sort({ completedAt: -1 }).limit(10); // Ambil 10 terakhir

        
        const historyJobs = await Job.find({ 
            mechanicId: mechanicId,
            status: { $in: ['on_progress', 'completed'] } 
        }).sort({ updatedAt: -1 });

        // Pisahkan data untuk Riwayat
        const completedJobs = historyJobs.filter(j => j.status === 'completed');

        res.render('mechanic/dashboard', {
            title: 'Dashboard Mekanik',
            user: req.user,
            pendingJobs,
            historyJobs,    // Berikan variabel ini agar dashboard.ejs baris 96 tidak error
            completedJobs,  // Untuk tabel riwayat di bawah
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard: " + error.message);
    }
};

// Mekanik mengambil pekerjaan
exports.takeJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const mechanicId = req.user._id;

        // Update Job: Isi mechanicId dan ubah status
        await Job.findByIdAndUpdate(jobId, {
            mechanicId: req.user._id, // Field tambahan untuk populate
            assignedTo: req.user._id, // Field lama
            status: 'on_progress'
        });

        // REDIRECT: Arahkan kembali ke dashboard yang sudah jalan
        res.redirect('/mechanic/dashboard');
    } catch (error) {
        console.error("Gagal ambil job:", error);
        res.status(500).send("Gagal mengambil pekerjaan: " + error.message);
    }
};

// Update status menjadi selesai
exports.finishJob = async (req, res) => {
    try {
        const jobId = req.params.id;

        // 1. Update status Job menjadi 'completed'
        const updatedJob = await Job.findByIdAndUpdate(
            jobId, 
            { 
                status: 'completed',
                completedAt: new Date() 
            },
            { new: true }
        );

        if (!updatedJob) {
            return res.status(404).json({ success: false, message: 'Job tidak ditemukan' });
        }

        // 2. SINKRONISASI: Update Tabel Transaction agar Pelanggan & Kasir melihat 'Selesai'
        if (updatedJob.transactionId) {
            await Transaction.findByIdAndUpdate(updatedJob.transactionId, { 
                status: 'completed' 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Pekerjaan dan Transaksi berhasil diselesaikan.' 
        });
    } catch (error) {
        console.error("Finish Job Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
