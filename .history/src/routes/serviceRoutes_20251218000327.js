// sisfo-bengkel-baru/src/routes/serviceRoutes.js

const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Impor controller yang berisi semua fungsi CRUD
const serviceController = require('../controllers/ServiceController'); 

const router = express.Router();

// Lakukan destructuring fungsi dari controller agar kode rute lebih bersih
const { 
    getServices, 
    createService, 
    getServiceById, // PASTIKAN ADA DI SINI
    deleteService 
} = require('../controllers/ServiceController');// CATATAN PENTING: Pastikan semua nama fungsi di atas (getServices, createService, dll.)
// telah didefinisikan dan diekspor dengan nama yang sama di ServiceController.js

// Terapkan Middleware protect ke semua rute di file ini
router.use(protect); 

// --- Rute Dasar: /api/services ---
// Rute untuk koleksi
router.route('/')
    .get(getServices)
    .post(createService);

// Rute untuk spesifik ID (Baris 30 yang error)
router.route('/:id')
    .get(getServiceById) // Sekarang sudah terdefinisi
    .delete(deleteService);

module.exports = router;