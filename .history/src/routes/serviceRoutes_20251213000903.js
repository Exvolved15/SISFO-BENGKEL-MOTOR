// sisfo-bengkel-baru/src/routes/serviceRoutes.js

const express = require('express');
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

// API routes untuk detail, update, dan delete berdasarkan ID
router.route('/:id')
    .put(updateService)   // <-- Tambahkan
    .delete(deleteService); // <-- Tambahkan

module.exports = router;