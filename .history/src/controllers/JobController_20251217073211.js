// src/controllers/JobController.js

const Job = require('../models/Job'); // Asumsi ada model Job

exports.getMekanikJobs = async (req, res) => {
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
        res.status(500).send('Gagal memuat pekerjaan mekanik.');
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
    // ... logic update status (placeholder) ...
    res.status(200).json({ success: true, message: 'Status updated (placeholder)' });
};

const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find().populate('assignedTo');
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        console.error('Error fetching all jobs:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const createJob = async (req, res) => {
    try {
        res.status(201).json({ 
            success: true, 
            message: 'Job created successfully (Placeholder)' 
        });
    } catch (error) {
        console.error('Error creating job:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Pastikan semua didefinisikan atau diambil dari exports.namaFungsi
module.exports = {
    getMekanikJobs: exports.getMekanikJobs, // Ambil yang diekspor di atas
    getMyJobs,
    updateJobStatus,
    getJobs, 
    createJob 
};