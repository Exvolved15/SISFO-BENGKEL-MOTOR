// src/controllers/JobController.js

const Job = require('../models/Job'); // Asumsi ada model Job
const User = require('../models/User');    // <--- TAMBAHKAN BARIS INI
const Service = require('../models/Service'); // <--- PASTIKAN INI JUGA ADA


exports.createJob = async (req, res) => {
    try {
        // Logika pembuatan job Anda di sini...
        // Error terjadi di baris yang menggunakan variabel 'User'
        
        // Contoh baris yang mungkin menyebabkan error:
        // const mekanik = await User.findById(req.body.assignedTo); 

        // ...
        
        res.status(201).json({
            success: true,
            message: 'Job berhasil dibuat',
            data: newJob
        });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find().populate('assignedTo', 'name email');
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        console.error('Error fetching all jobs:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMekanikJobs = async (req, res) => {
    try {
        const mekanikId = req.user._id; 
        const assignedJobs = await Job.find({ 
            assignedTo: mekanikId,
            status: { $in: ['pending', 'in_progress'] }
        }).populate('customer');

        res.render('mekanik/jobList', { 
            title: 'Daftar Pekerjaan', 
            jobs: assignedJobs,
            user: req.user 
        });
    } catch (error) {
        console.error('Error fetching mekanik jobs:', error);
        res.status(500).send('Gagal memuat halaman pekerjaan mekanik.');
    }
};


const getMyJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ assignedTo: req.user._id })
                             .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        console.error('Gagal mengambil pekerjaan mekanik:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pekerjaan.' });
    }
};



const updateJobStatus = async (req, res) => {
    // ID pekerjaan diambil dari URL parameter
    const { id } = req.params; 
    // Status baru dari body request (misalnya { status: 'completed' })
    const { status } = req.body; 
    
    // ID user yang sedang login (didapat dari protect middleware)
    const mekanikId = req.user._id;

    // Status yang valid untuk Mekanik (misalnya: in_progress, completed)
    const validStatuses = ['in_progress', 'completed'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Status yang diberikan tidak valid.' 
        });
    }

    try {
        // 1. Cari pekerjaan dan pastikan ditugaskan kepada Mekanik ini
        const job = await Job.findOne({ 
            _id: id, 
            assignedTo: mekanikId // KRITIS: Memastikan Mekanik hanya bisa update job mereka
        });

        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pekerjaan tidak ditemukan atau bukan tugas Anda.' 
            });
        }

        // 2. Update status
        job.status = status;
        
        // Jika status selesai, catat waktu penyelesaian
        if (status === 'completed' && !job.completedAt) {
            job.completedAt = new Date();
        }

        await job.save();

        res.status(200).json({ 
            success: true, 
            message: `Status pekerjaan ${id} berhasil diperbarui menjadi ${status}.`,
            data: job
        });

    } catch (error) {
        console.error('Error updating job status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal memperbarui status pekerjaan.' 
        });
    }
};

// @deskripsi: Membuat pekerjaan (job) baru
// @rute: POST /api/jobs
const createJob = async (req, res) => {
    const { 
        customerName, 
        customerPhone, 
        vehicleModel, 
        licensePlate, 
        serviceDetails, 
        assignedToUid // Gunakan ID atau UID sesuai data dari frontend
    } = req.body;

    try {
        // Cari Mekanik. Jika frontend kirim _id MongoDB, gunakan findById. 
        // Jika kirim UID Firebase, gunakan findOne.
        const assignedMekanik = await User.findOne({ 
            $or: [{ uid: assignedToUid }, { _id: assignedToUid }], 
            role: 'mekanik' 
        });

        if (!assignedMekanik) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mekanik yang ditugaskan tidak valid atau tidak ditemukan.' 
            });
        }

        const newJob = await Job.create({
            customer: {
                name: customerName,
                phone: customerPhone,
            },
            vehicle: {
                model: vehicleModel,
                licensePlate: licensePlate,
            },
            serviceDetails: serviceDetails,
            assignedTo: assignedMekanik._id,
            status: 'pending',
            createdBy: req.user._id, 
        });

        res.status(201).json({ 
            success: true, 
            message: 'Pekerjaan baru berhasil dibuat.',
            data: newJob
        });

    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal membuat pekerjaan: ' + error.message 
        });
    }
};

// Controller Transaksi/Job (Misalnya: addSparePartToJob, addServiceItem)

const addServiceItem = async (req, res) => {
    const { jobId, serviceId, quantity } = req.body; // <--- HANYA AMBIL INI

    if (!jobId || !serviceId || !quantity) {
         return res.status(400).json({ success: false, message: 'ID Job, ID Item, dan Kuantitas wajib diisi.' });
    }

    try {
        // 1. Cari Pekerjaan
        const job = await Job.findById(jobId);
        if (!job) {
             return res.status(404).json({ success: false, message: 'Pekerjaan tidak ditemukan.' });
        }
        
        // 2. Cari Item (Service/Part)
        const item = await Service.findById(serviceId); // Asumsi Anda menggunakan model Service
        if (!item) {
             return res.status(404).json({ success: false, message: 'Suku cadang/Jasa tidak ditemukan.' });
        }

        // 3. Update Stok (Jika itu Suku Cadang)
        if (item.isPart) {
            if (item.stock < quantity) {
                return res.status(400).json({ success: false, message: `Stok ${item.name} tidak mencukupi. Stok tersedia: ${item.stock}.` });
            }
            // Kurangi stok
            item.stock -= quantity;
            await item.save();
        }

        // 4. Tambahkan item ke array transaksi Job
        job.transactionDetails.push({
            item: serviceId, // Simpan reference ID item
            name: item.name,
            price: item.price,
            quantity: quantity,
            subtotal: item.price * quantity,
        });

        // Simpan perubahan Job
        await job.save();

        res.status(200).json({ success: true, message: 'Suku cadang berhasil ditambahkan ke pekerjaan.', data: job });

    } catch (error) {
        console.error('Error saat menambah item ke job:', error);
        // Hapus log error kustom yang menyesatkan (jika itu yang menyebabkan 'customerName is not defined')
        res.status(500).json({ success: false, message: 'Gagal memproses transaksi: ' + error.message });
    }
};

// Pastikan semua didefinisikan atau diambil dari exports.namaFungsi
module.exports = {
    getMekanikJobs: exports.getMekanikJobs, // Ambil yang diekspor di atas
    getMyJobs,
    updateJobStatus,
    getJobs, 
    createJob,
    addServiceItem 
};