// sisfo-bengkel-baru/src/routes/partRoutes.js

const express = require('express');
const router = express.Router();
const { 
    getAllParts, 
    createPart, 
    getPartById 
} = require('../controllers/PartController'); // Panggil fungsi dari Controller

// Route utama untuk mengambil semua (GET) dan membuat baru (POST)
router.route('/')
    .get(getAllParts)
    .post(createPart);

// Route untuk detail (GET) berdasarkan ID
router.route('/:id')
    .get(getPartById);
    // Kita akan tambahkan .put (Update) dan .delete (Hapus) nanti

module.exports = router;