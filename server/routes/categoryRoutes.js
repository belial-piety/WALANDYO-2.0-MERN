const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', categoryController.getCategories);
router.post('/', restrictTo('admin', 'manager'), categoryController.createCategory);
router.patch('/:id', restrictTo('admin', 'manager'), categoryController.updateCategory);

module.exports = router;
