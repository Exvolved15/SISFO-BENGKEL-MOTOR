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
    getServiceById,
    updateService,
    deleteService
} = serviceController; 
// CATATAN PENTING: Pastikan semua nama fungsi di atas (getServices, createService, dll.)
// telah didefinisikan dan diekspor dengan nama yang sama di ServiceController.js

// Terapkan Middleware protect ke semua rute di file ini
router.use(protect); 

// --- Rute Dasar: /api/services ---
router.route('/')
    // 1. GET /api/services (Melihat semua item. Akses: Semua yang login)
    .get(getServices) 
    
    // 2. POST /api/services (Membuat item baru. Akses: Admin, Kasir)
    .post(restrictTo('admin', 'kasir'), createService);

// --- Rute Detail: /api/services/:id ---
router.route('/:id')
    // 3. GET /api/services/:id (Melihat detail item. Akses: Semua yang login)
    .get(getServiceById) 
    
    // 4. PUT /api/services/:id (Mengubah item. Akses: Admin, Kasir)
    .put(restrictTo('admin', 'kasir'), updateService) 
    
    // 5. DELETE /api/services/:id (Menghapus item. Akses: Hanya Admin)
    .delete(restrictTo('admin'), deleteService); 

module.exports = router;