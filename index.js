const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin', 'manager'));

router.get('/', reportsController.showReports);

module.exports = router;
