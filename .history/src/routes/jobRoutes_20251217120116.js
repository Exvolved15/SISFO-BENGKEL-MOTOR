// src/routes/jobRoutes.js

const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');

// --- IMPOR FUNGSI CONTROLLER YANG DIBUTUHKAN ---
// Pastikan semua fungsi ini telah didefinisikan dan diekspor di JobController.js
const { 
    getMyJobs, 
    updateJobStatus, 
    getMekanikJobs,
    getJobs, 
    createJob,
    addServiceItem // <--- FUNGSI YANG HILANG, KINI DIIMPOR
} = require('../controllers/JobController');

// --- RUTE MEKANIK ---

// Rute 1: Mekanik melihat pekerjaan yang ditugaskan (GET /api/jobs/mine)
router.route('/mine') 
    .get(protect, restrictTo('mekanik'), getMyJobs);

// Rute 2: Mekanik mengupdate status pekerjaan (PUT /api/jobs/:id/status)
router.route('/:id/status')
    .put(protect, restrictTo('mekanik'), updateJobStatus); 

// Rute 3: Rute Mekanik Dashboard (Jika diperlukan untuk view rendering)
router.route('/mekanik/jobs') 
    .get(protect, restrictTo('mekanik'), getMekanikJobs);


// --- RUTE KASIR/ADMIN ---

// Rute 4: CRUD Pekerjaan Dasar (GET All, POST Create)
// Rute: /api/jobs/
router.route('/')
    // GET /api/jobs/ (Lihat semua pekerjaan)
    .get(protect, restrictTo('admin', 'kasir'), getJobs) 
    // POST /api/jobs/ (Buat pekerjaan baru)
    .post(protect, restrictTo('admin', 'kasir'), createJob);

// Rute 5: Rute Transaksi (Menambah item/suku cadang ke pekerjaan)
// Rute: /api/jobs/add-item
router.route('/add-item')
    .post(protect, restrictTo('kasir'), addServiceItem); // <--- KINI addServiceItem TERDEFINISI

module.exports = router;