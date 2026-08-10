const express = require('express');
const router = express.Router();
const branchesController = require('../controllers/branchesController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin'));

router.get('/', branchesController.showBranches);
router.post('/', branchesController.createBranch);
router.put('/:id', branchesController.updateBranch);
router.post('/:id/toggle', branchesController.toggleActive);

module.exports = router;
