const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect, restrictTo('admin', 'manager'));

router.get('/daily-overview', reportController.getDailyOverview);
router.get('/branch-performance', reportController.getBranchPerformance);

module.exports = router;
