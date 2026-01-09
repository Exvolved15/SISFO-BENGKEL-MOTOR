// sisfo-bengkel-baru/src/routes/partRoutes.js


const express = require('express');
const router = express.Router();
const { getAllParts, createPart, getPart, updatePart, deletePart } = require('../controllers/PartController');
// Import protect dan restrictTo
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, restrictTo('admin'), getAllParts) // HANYA ADMIN
    .post(protect, restrictTo('admin'), createPart); // HANYA ADMIN

router.route('/:id')
    .get(protect, restrictTo('admin'), getPart) // HANYA ADMIN
    .put(protect, restrictTo('admin'), updatePart) // HANYA ADMIN
    .delete(protect, restrictTo('admin'), deletePart); // HANYA ADMIN

module.exports = router;