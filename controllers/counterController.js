const Branch = require('../models/Branch');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

const TAX_RATE = Number(process.env.TAX_RATE || 0);

exports.showCounter = async (req, res) => {
  const branches = await Branch.listActive();

  // Cashiers/managers/inventory clerks are pinned to their assigned branch;
  // admins can switch branches via the selector.
  const user = req.session.user;
  const selectedBranchId = user.branch_id || Number(req.query.branch_id) || branches[0]?.id || null;

  const menuItems = selectedBranchId ? await MenuItem.listForCounter(selectedBranchId) : [];

  res.render('counter/index', {
    title: 'POS Counter',
    active: 'counter',
    branches,
    selectedBranchId,
    lockBranch: !!user.branch_id, // non-admins can't switch
    menuItems,
    taxRate: TAX_RATE,
  });
};

exports.charge = async (req, res) => {
  try {
    const { branch_id, payment_method, items } = req.body;
    const parsedItems = JSON.parse(items);

    if (!branch_id || !payment_method || !parsedItems || parsedItems.length === 0) {
      return res.status(400).json({ error: 'Missing branch, payment method, or cart items.' });
    }

    const orderId = await Order.create({
      branchId: Number(branch_id),
      cashierId: req.session.user.id,
      paymentMethod: payment_method,
      items: parsedItems,
      taxRate: TAX_RATE,
    });

    res.json({ success: true, orderId, receiptUrl: `/orders/${orderId}` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
