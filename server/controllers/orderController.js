const Order = require('../models/Order');
const OrderAuditLog = require('../models/OrderAuditLog');
const orderService = require('../services/orderService');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

exports.getOrders = asyncHandler(async (req, res, next) => {
  const { branchId, status, paymentMethod, dateFrom, dateTo, search, page = 1, limit = 20 } = req.query;

  const filter = {};

  if (req.user.role !== 'admin') {
    filter.branch = req.user.branch._id;
  } else if (branchId) {
    filter.branch = branchId;
  }

  if (status) filter.status = status;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const dTo = new Date(dateTo);
      dTo.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = dTo;
    }
  }

  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { cashierNameSnap: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, totalCount] = await Promise.all([
    Order.find(filter)
      .populate('branch')
      .populate('cashier', 'fullName username')
      .populate('voidedBy', 'fullName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: orders,
    meta: {
      totalCount,
      page: Number(page),
      totalPages: Math.ceil(totalCount / Number(limit)),
    },
  });
});

exports.createOrder = asyncHandler(async (req, res, next) => {
  const branchId = req.user.role === 'admin' ? req.body.branchId : req.user.branch._id;

  const order = await orderService.createOrder({
    branchId,
    cashierId: req.user._id,
    cashierName: req.user.fullName,
    paymentMethod: req.body.paymentMethod,
    items: req.body.items,
  });

  const populated = await Order.findById(order._id)
    .populate('branch')
    .populate('cashier', 'fullName username');

  res.status(201).json({
    success: true,
    data: populated,
  });
});

exports.getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('branch')
    .populate('cashier', 'fullName username')
    .populate('voidedBy', 'fullName username');

  if (!order) throw new AppError('Order not found', 404);

  if (req.user.role !== 'admin' && order.branch._id.toString() !== req.user.branch._id.toString()) {
    throw new AppError('Unauthorized access to this branch order', 403);
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

exports.voidOrder = asyncHandler(async (req, res, next) => {
  const { voidReason } = req.body;

  const voided = await orderService.voidOrder(req.params.id, voidReason, req.user);
  const populated = await Order.findById(voided._id)
    .populate('branch')
    .populate('cashier', 'fullName username')
    .populate('voidedBy', 'fullName username');

  res.status(200).json({
    success: true,
    data: populated,
  });
});

exports.reprintOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  await OrderAuditLog.create({
    order: order._id,
    action: 'reprinted',
    notes: `Receipt reprinted by ${req.user.fullName}`,
    staff: req.user._id,
    staffNameSnap: req.user.fullName,
  });

  res.status(200).json({
    success: true,
    message: 'Reprint logged',
  });
});

exports.getOrderAudit = asyncHandler(async (req, res, next) => {
  const logs = await OrderAuditLog.find({ order: req.params.id })
    .populate('staff', 'fullName username')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: logs,
  });
});
