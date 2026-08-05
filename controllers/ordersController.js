const Order = require('../models/Order');
const Branch = require('../models/Branch');

exports.showOrders = async (req, res) => {
  const user = req.session.user;
  const branches = await Branch.list();

  // Non-admins only ever see their own branch's history.
  const branchId = user.role === 'admin' ? Number(req.query.branch_id) || null : user.branch_id;

  const orders = await Order.list({ branchId });

  res.render('orders/index', {
    title: 'Order History',
    active: 'orders',
    branches,
    selectedBranchId: branchId,
    lockBranch: user.role !== 'admin',
    orders,
  });
};

exports.showReceipt = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).render('errors/404', { title: 'Not found' });
  res.render('orders/receipt', {
    layout: false,
    title: `Order #${order.id}`,
    order,
  });
};

exports.voidOrder = async (req, res) => {
  try {
    await Order.voidOrder(req.params.id, req.session.user.id, req.body.reason);
    res.redirect('/orders');
  } catch (err) {
    res.status(400).render('errors/404', { title: 'Could not void order', message: err.message });
  }
};

exports.reprint = async (req, res) => {
  await Order.logReprint(req.params.id, req.session.user.id);
  res.redirect(`/orders/${req.params.id}`);
};
