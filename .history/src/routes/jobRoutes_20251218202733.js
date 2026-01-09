const express = require('express');
const router = express.Router();
const jobController = require('../controllers/JobController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// API Khusus Mekanik
router.get('/mine', protect, restrictTo('mekanik'), jobController.getMyJobs);
router.put('/:id/status', protect, restrictTo('mekanik'), jobController.updateJobStatus);
router.post('/add-item', protect, restrictTo('mekanik'), jobController.addServiceItem);

// API Admin/Kasir
router.route('/')
    .get(protect, restrictTo('admin', 'kasir'), jobController.getJobs)
    .post(protect, restrictTo('admin', 'kasir'), jobController.createJob);

router.delete('/:id', protect, restrictTo('admin'), jobController.deleteJob);

module.exports = router;