const express = require('express');
const router = express.Router();
const counterController = require('../controllers/counterController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin', 'manager', 'cashier'));

router.get('/', counterController.showCounter);
router.post('/charge', counterController.charge);

module.exports = router;
