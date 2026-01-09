const Job = require('../models/Job');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// ==================================================================
// 1. MENAMPILKAN DASHBOARD MEKANIK
// ==================================================================
exports.getMechanicDashboard = async (req, res) => {
    try {
        const mechanicId = req.user._id;

        // Ambil antrean pekerjaan yang belum ada mekaniknya
        const pendingJobs = await Job.find({ status: 'pending' }).sort({ createdAt: -1 });
        
        // Ambil pekerjaan yang sedang dikerjakan atau sudah selesai oleh mekanik ini
        const historyJobs = await Job.find({ 
            mechanicId: mechanicId 
        }).sort({ updatedAt: -1 });

        // Filter untuk variabel spesifik di EJS agar tidak error
        const activeJob = historyJobs.find(j => j.status === 'on_progress');
        const completedJobs = historyJobs.filter(j => j.status === 'completed');

        res.render('mechanic/dashboard', {
            title: 'Dashboard Mekanik',
            user: req.user,
            pendingJobs,
            historyJobs,   // Digunakan untuk logika filter di baris atas EJS
            activeJob,     // Untuk panel pekerjaan berjalan
            completedJobs, // Untuk tabel riwayat
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Gagal memuat dashboard: " + error.message);
    }
};

// ==================================================================
// 2. MEKANIK MENGAMBIL PEKERJAAN (SINKRON NAMA & ID)
// ==================================================================
exports.takeJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const mechanicId = req.user._id;
        const mechanicName = req.user.name;

        // Validasi: Cek apakah mekanik masih punya pekerjaan yang belum selesai
        const hasActiveJob = await Job.findOne({ mechanicId, status: 'on_progress' });
        if (hasActiveJob) {
            return res.status(400).send("Anda masih memiliki pekerjaan yang belum diselesaikan!");
        }

        // Update Job: Isi ID dan Nama Mekanik secara sinkron
        await Job.findByIdAndUpdate(jobId, {
            mechanicId: mechanicId,
            mechanicName: mechanicName, // Menyimpan nama agar sinkron di detail transaksi
            status: 'on_progress',
            startedAt: new Date()
        });

        res.redirect('/mechanic/dashboard');
    } catch (error) {
        console.error("Gagal ambil job:", error);
        res.status(500).send("Gagal mengambil pekerjaan: " + error.message);
    }
};

// ==================================================================
// 3. MENYELESAIKAN PEKERJAAN (SINKRON KE TRANSAKSI)
// ==================================================================
exports.finishJob = async (req, res) => {
    try {
        const jobId = req.params.id;

        const updatedJob = await Job.findByIdAndUpdate(
            jobId, 
            { 
                status: 'completed',
                completedAt: new Date() 
            },
            { new: true }
        );

        if (!updatedJob) {
            return res.status(404).json({ success: false, message: 'Pekerjaan tidak ditemukan' });
        }

        // SINKRONISASI: Jika pekerjaan terhubung ke transaksi, update status transaksi
        if (updatedJob.transactionId) {
            await Transaction.findByIdAndUpdate(updatedJob.transactionId, { 
                status: 'completed' 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Pekerjaan berhasil diselesaikan.' 
        });
    } catch (error) {
        console.error("Finish Job Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================================================================
// 4. DETAIL PEKERJAAN (READ-ONLY UNTUK MEKANIK)
// ==================================================================
exports.getJobDetail = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).send("Data tidak ditemukan");

        res.render('jobs/detail', {
            title: 'Detail Pekerjaan',
            job,
            user: req.user,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
};