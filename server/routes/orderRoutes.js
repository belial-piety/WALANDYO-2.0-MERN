const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, restrictTo, restrictBranch } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', restrictTo('admin', 'manager', 'cashier'), restrictBranch, orderController.getOrders);
router.post('/', restrictTo('admin', 'manager', 'cashier'), restrictBranch, orderController.createOrder);
router.get('/:id', restrictTo('admin', 'manager', 'cashier'), orderController.getOrderById);
router.post('/:id/void', restrictTo('admin', 'manager', 'cashier'), orderController.voidOrder);
router.post('/:id/reprint', restrictTo('admin', 'manager', 'cashier'), orderController.reprintOrder);
router.get('/:id/audit', restrictTo('admin', 'manager', 'cashier'), orderController.getOrderAudit);

module.exports = router;
