const express = require('express');
const router = express.Router();

const { 
    getJobs, 
    createJob, 
    getMyJobs, 
    updateJobStatus, 
    addServiceItem, 
    getMekanikJobs 
} = require('../controllers/JobController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// --- RUTE MEKANIK ---
// API untuk mendapatkan data JSON pekerjaan milik mekanik login
router.get('/mine', protect, restrictTo('mekanik'), getMyJobs);

// API untuk mekanik update status
router.put('/:id/status', protect, restrictTo('mekanik'), updateJobStatus); 

// API untuk mekanik menambah suku cadang
router.post('/add-item', protect, restrictTo('mekanik', 'kasir'), addServiceItem);

// --- RUTE KASIR/ADMIN ---
router.route('/')
    .get(protect, restrictTo('admin', 'kasir'), getJobs) 
    .post(protect, restrictTo('admin', 'kasir'), createJob);

module.exports = router;