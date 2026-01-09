const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { 
    getMyJobs, 
    updateJobStatus, 
    getMekanikJobs,
    getJobs, 
    createJob,
    addServiceItem 
} = require('../controllers/JobController');
const { printReceipt } = require('../controllers/JobController');

// --- RUTE MEKANIK ---
// Rute untuk menampilkan View Dashboard Mekanik (Redirect tujuan login)
router.route('/mekanik/jobs') 
    .get(protect, restrictTo('mekanik'), getMekanikJobs);

// API untuk mendapatkan data pekerjaan milik mekanik login
router.route('/mine') 
    .get(protect, restrictTo('mekanik'), getMyJobs);

// API untuk mekanik update status (misal: in_progress ke completed)
router.route('/:id/status')
    .put(protect, restrictTo('mekanik'), updateJobStatus); 

// API untuk mekanik menambah suku cadang/jasa ke pengerjaan
router.route('/add-item')
    .post(protect, restrictTo('mekanik', 'kasir'), addServiceItem);

// --- RUTE KASIR/ADMIN ---
router.route('/')
    .get(protect, restrictTo('admin', 'kasir'), getJobs) 
    .post(protect, restrictTo('admin', 'kasir'), createJob);

module.exports = router;