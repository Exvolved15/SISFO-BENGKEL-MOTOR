// sisfo-bengkel-baru/src/routes/partRoutes.js

const express = require('express');
const router = express.Router();
const { 
    getAllParts, 
    createPartApi,  // <-- Gunakan versi API
    getPartById,
    updatePart,
    deletePart
} = require('../controllers/PartController'); 

// Route utama untuk mengambil semua (GET) dan membuat baru (POST)
router.route('/')
    .get(getAllParts)
    .post(createPartApi); // <-- Pastikan pakai createPartApi
// ...

// Route untuk detail (GET), update (PUT), dan hapus (DELETE) berdasarkan ID
router.route('/:id')
    .get(getPartById)
    .put(updatePart)   // <-- Tambahkan route PUT
    .delete(deletePart); // <-- Tambahkan route DELETE

module.exports = router;