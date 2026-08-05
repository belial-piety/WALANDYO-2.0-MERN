const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin', 'manager', 'cashier'));

router.get('/', ordersController.showOrders);
router.get('/:id', ordersController.showReceipt);
router.post('/:id/void', ordersController.voidOrder);
router.post('/:id/reprint', ordersController.reprint);

module.exports = router;
