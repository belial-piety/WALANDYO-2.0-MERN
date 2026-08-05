const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { protect, restrictTo, restrictBranch } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/pos-catalog', restrictTo('admin', 'manager', 'cashier'), restrictBranch, menuController.getPosCatalog);
router.get('/', menuController.getMenuItems);
router.get('/:id', menuController.getMenuItemById);
router.post('/', restrictTo('admin', 'manager'), menuController.createMenuItem);
router.patch('/:id', restrictTo('admin', 'manager'), menuController.updateMenuItem);
router.delete('/:id', restrictTo('admin', 'manager'), menuController.archiveMenuItem);

module.exports = router;
