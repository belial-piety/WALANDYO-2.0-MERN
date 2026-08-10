const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin', 'manager', 'inventory'));

router.get('/', inventoryController.showInventory);
router.post('/:id/restock', requireRole('admin', 'inventory'), inventoryController.restock);
router.put('/:id/min-level', requireRole('admin', 'manager'), inventoryController.updateMinLevel);

module.exports = router;
