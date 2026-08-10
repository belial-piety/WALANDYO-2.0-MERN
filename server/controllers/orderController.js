const Order = require('../models/Order');
const OrderAuditLog = require('../models/OrderAuditLog');
const orderService = require('../services/orderService');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const assertOrderAccess = (req, order) => {
  if (req.user.role === 'admin') return;

  if (!req.user.branch) {
    throw new AppError('User is not assigned to any branch.', 403);
  }

  const orderBranchId = order.branch?._id ? order.branch._id.toString() : order.branch.toString();
  const userBranchId = req.user.branch._id.toString();

  if (orderBranchId !== userBranchId) {
    throw new AppError('Unauthorized access to this branch order', 403);
  }
};

exports.getOrders = asyncHandler(async (req, res, next) => {
  const { branchId, status, paymentMethod, dateFrom, dateTo, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1 } = req.query;

  const currentPage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const pageSize = 25;
  const filter = {};

  // Branch isolation: non-admin users are always locked to their assigned branch.
  // Admins see all branches by default, or may explicitly filter by branchId.
  if (req.user.role !== 'admin') {
    if (!req.user.branch) {
      throw new AppError('User is not assigned to any branch.', 403);
    }
    filter.branch = req.user.branch._id;
  } else if (branchId && branchId !== 'all') {
    filter.branch = branchId;
  }

  if (status) filter.status = status;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  if (dateFrom || dateTo) {
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    if (fromDate && Number.isNaN(fromDate.getTime())) throw new AppError('Invalid start date/time.', 400);
    if (toDate && Number.isNaN(toDate.getTime())) throw new AppError('Invalid end date/time.', 400);
    if (fromDate && toDate && fromDate > toDate) {
      throw new AppError('Start date/time cannot be after end date/time.', 400);
    }

    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = fromDate;
    if (toDate) {
      // Date-only filters mean the end of that day. datetime-local values are exact.
      if (!String(dateTo).includes('T')) toDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDate;
    }
  }

  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { cashierNameSnap: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (currentPage - 1) * pageSize;

  const allowedSortFields = {
    createdAt: 'createdAt',
    orderNumber: 'orderNumber',
    cashier: 'cashierNameSnap',
    total: 'total',
    paymentMethod: 'paymentMethod',
    status: 'status',
  };
  const sortField = allowedSortFields[sortBy] || 'createdAt';
  const sortDirection = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortDirection, _id: -1 };

  const ordersQuery = Order.find(filter)
    .populate('branch')
    .populate('cashier', 'fullName username')
    .populate('voidedBy', 'fullName username')
    .sort(sort)
    .skip(skip)
    .limit(pageSize);

  // Case-insensitive alphabetical ordering for string fields.
  if (['orderNumber', 'cashierNameSnap', 'paymentMethod', 'status'].includes(sortField)) {
    ordersQuery.collation({ locale: 'en', strength: 2, numericOrdering: true });
  }

  const [orders, totalCount] = await Promise.all([
    ordersQuery,
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: orders,
    meta: {
      totalCount,
      page: currentPage,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  });
});

exports.createOrder = asyncHandler(async (req, res, next) => {
  // restrictBranch resolves and validates the effective branch for this request.
  const branchId = req.branchId;

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

  assertOrderAccess(req, order);

  res.status(200).json({
    success: true,
    data: order,
  });
});

exports.voidOrder = asyncHandler(async (req, res, next) => {
  const { voidReason } = req.body;

  const existingOrder = await Order.findById(req.params.id);
  if (!existingOrder) throw new AppError('Order not found', 404);
  assertOrderAccess(req, existingOrder);

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
  assertOrderAccess(req, order);

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
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  assertOrderAccess(req, order);

  const logs = await OrderAuditLog.find({ order: req.params.id })
    .populate('staff', 'fullName username')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: logs,
  });
});
