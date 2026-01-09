// sisfo-bengkel-baru/src/routes/serviceRoutes.js

const express = require('express');
const router = express.Router();
const { 
    getAllServices, 
    createService 
} = require('../controllers/ServiceController'); 

// API routes untuk Jasa Servis
router.route('/')
    .get(getAllServices)
    .post(createService);

module.exports = router;