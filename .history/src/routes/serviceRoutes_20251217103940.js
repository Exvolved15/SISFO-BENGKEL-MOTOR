// sisfo-bengkel-baru/src/routes/serviceRoutes.js

const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const serviceController = require('../controllers/ServiceController');
const router = express.Router();
const { 
    getAllServices, 
    createService,
    updateService, // <-- Panggil
    deleteService  // <-- Panggil
} = require('../controllers/ServiceController'); 

// API routes untuk daftar semua (GET) dan buat baru (POST)
router.route('/')
    .get(getAllServices)
    .post(createService);

    router.route('/:id') 
    .get(serviceController.getServiceById)

// API routes untuk detail, update, dan delete berdasarkan ID
router.route('/:id')
    .put(updateService)   // <-- Tambahkan
    .delete(deleteService); // <-- Tambahkan

router.use(protect); 

    router.route('/')
        // GET /api/services (Untuk Kasir/Mekanik memilih suku cadang)
        .get(serviceController.getServices) 
        // POST /api/services (Hanya untuk Admin/Kasir menambah inventaris baru)
        .post(restrictTo('admin', 'kasir'), serviceController.createService);

module.exports = router;