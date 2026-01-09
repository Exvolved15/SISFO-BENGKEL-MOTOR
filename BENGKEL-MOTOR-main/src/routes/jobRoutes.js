const express = require('express');
const router = express.Router();
const jobController = require('../controllers/JobController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/mechanic/dashboard', protect, restrictTo('mekanik', 'admin'), jobController.getMechanicDashboard);
router.post('/take-job/:id', protect, restrictTo('mekanik', 'admin'), jobController.takeJob);
router.patch('/update-status/:id', protect, jobController.updateJobStatus);
router.post('/finish/:id', protect, restrictTo('mekanik', 'admin'), jobController.finishJob); 

module.exports = router;