const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', branchController.getBranches);
router.get('/:id', branchController.getBranchById);
router.post('/', restrictTo('admin'), branchController.createBranch);
router.patch('/:id', restrictTo('admin'), branchController.updateBranch);
router.patch('/:id/status', restrictTo('admin'), branchController.toggleBranchStatus);

module.exports = router;
