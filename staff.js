const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin', 'manager', 'inventory'));

router.get('/', notificationsController.showNotifications);
router.post('/:id/read', notificationsController.markRead);
router.post('/mark-all-read', notificationsController.markAllRead);

module.exports = router;
