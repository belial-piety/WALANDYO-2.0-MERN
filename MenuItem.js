const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin'));

router.get('/', staffController.showStaff);
router.post('/', staffController.createStaff);
router.post('/:id/toggle', staffController.toggleActive);

module.exports = router;
