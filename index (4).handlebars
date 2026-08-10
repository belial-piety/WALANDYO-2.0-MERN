const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect, restrictTo, restrictBranch } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', restrictTo('admin', 'manager', 'inventory'), restrictBranch, inventoryController.getInventory);
router.get('/:id', restrictTo('admin', 'manager', 'inventory'), inventoryController.getInventoryById);
router.post('/:id/restock', restrictTo('admin', 'manager', 'inventory'), inventoryController.restockItem);
router.post('/:id/deduct', restrictTo('admin', 'manager', 'inventory'), inventoryController.deductItem);
router.patch('/:id/min-level', restrictTo('admin', 'manager', 'inventory'), inventoryController.updateMinLevel);
router.get('/:id/movements', restrictTo('admin', 'manager', 'inventory'), inventoryController.getStockMovements);

module.exports = router;
