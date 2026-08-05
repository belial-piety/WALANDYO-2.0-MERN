const Inventory = require('../models/Inventory');
const Branch = require('../models/Branch');

exports.showInventory = async (req, res) => {
  const user = req.session.user;
  const branches = await Branch.list();

  const branchId =
    user.role === 'admin' || user.role === 'manager'
      ? Number(req.query.branch_id) || null
      : user.branch_id;

  const items = await Inventory.list(branchId);

  res.render('inventory/index', {
    title: 'Inventory',
    active: 'inventory',
    branches,
    selectedBranchId: branchId,
    lockBranch: user.role === 'cashier' || user.role === 'inventory',
    items,
  });
};

exports.restock = async (req, res) => {
  const { quantity } = req.body;
  await Inventory.restock(req.params.id, Number(quantity), req.session.user.id);
  res.redirect('back');
};

exports.updateMinLevel = async (req, res) => {
  const { min_level } = req.body;
  await Inventory.updateMinLevel(req.params.id, Number(min_level));
  res.redirect('back');
};
