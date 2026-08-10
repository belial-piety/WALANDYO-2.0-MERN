const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin', 'manager'));

router.get('/', menuController.showMenu);
router.post('/', menuController.createItem);
router.put('/:id', menuController.updateItem);
router.delete('/:id', menuController.deleteItem);

module.exports = router;
