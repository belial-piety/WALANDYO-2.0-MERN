const mongoose = require('mongoose');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Branch = require('../models/Branch');
const StockMovement = require('../models/StockMovement');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const MANILA_OFFSET = '+08:00';

function toObjectId(value, label = 'branch') {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label} id`, 400);
  }
  return new mongoose.Types.ObjectId(value);
}

function getBranchScope(req) {
  if (req.user.role !== 'admin') {
    if (!req.user.branch) throw new AppError('Manager is not assigned to a branch.', 403);
    return req.user.branch._id;
  }

  const requested = req.query.branchId;
  if (!requested || requested === 'all') return null;
  return toObjectId(requested);
}

function getDateRange(req) {
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setHours(0, 0, 0, 0);
  defaultFrom.setDate(defaultFrom.getDate() - 6);

  const from = req.query.dateFrom ? new Date(`${req.query.dateFrom}T00:00:00+08:00`) : defaultFrom;
  const to = req.query.dateTo ? new Date(`${req.query.dateTo}T23:59:59.999+08:00`) : new Date(now);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new AppError('Invalid report date range.', 400);
  }
  if (from > to) throw new AppError('Start date cannot be later than end date.', 400);

  const durationMs = to.getTime() - from.getTime() + 1;
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - durationMs + 1);

  return { from, to, previousFrom, previousTo };
}

function pctChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

exports.getDailyOverview = asyncHandler(async (req, res) => {
  const branchId = getBranchScope(req);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const matchStage = {
    status: 'completed',
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  };
  if (branchId) matchStage.branch = branchId;

  const [salesAgg] = await Order.aggregate([
    { $match: matchStage },
    { $group: { _id: null, totalRevenue: { $sum: '$total' }, orderCount: { $sum: 1 } } },
  ]);

  const lowStockCount = await Inventory.countDocuments({
    $expr: { $lte: ['$currentStock', '$minLevel'] },
    ...(branchId ? { branch: branchId } : {}),
  });

  const activeBranchesCount = await Branch.countDocuments({ isActive: true });

  const salesByBranch = await Order.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: startOfDay, $lte: endOfDay } } },
    { $group: { _id: '$branch', revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    { $lookup: { from: 'branches', localField: '_id', foreignField: '_id', as: 'branchInfo' } },
    { $unwind: '$branchInfo' },
    { $project: { branchId: '$_id', branchName: '$branchInfo.name', revenue: 1, orders: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      todayRevenue: salesAgg?.totalRevenue || 0,
      todayOrders: salesAgg?.orderCount || 0,
      lowStockCount,
      activeBranchesCount,
      salesByBranch: req.user.role === 'admin' ? salesByBranch : salesByBranch.filter((b) => b.branchId.toString() === branchId.toString()),
    },
  });
});

exports.getBranchPerformance = asyncHandler(async (req, res) => {
  const branchId = getBranchScope(req);
  const { from, to } = getDateRange(req);
  const matchStage = { status: 'completed', createdAt: { $gte: from, $lte: to } };
  if (branchId) matchStage.branch = branchId;

  const [totalsAgg] = await Order.aggregate([
    { $match: matchStage },
    { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalOrders: { $sum: 1 } } },
  ]);

  const topItems = await Order.aggregate([
    { $match: matchStage },
    { $unwind: '$items' },
    { $group: { _id: '$items.menuItem', itemName: { $first: '$items.itemName' }, quantitySold: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.lineTotal' } } },
    { $sort: { quantitySold: -1, totalRevenue: -1 } },
    { $limit: 10 },
  ]);

  res.status(200).json({ success: true, data: { totalRevenue: totalsAgg?.totalRevenue || 0, totalOrders: totalsAgg?.totalOrders || 0, topItems } });
});

exports.getSalesAnalytics = asyncHandler(async (req, res) => {
  const branchId = getBranchScope(req);
  const { from, to, previousFrom, previousTo } = getDateRange(req);

  const branchFilter = branchId ? { branch: branchId } : {};
  const completedMatch = { status: 'completed', createdAt: { $gte: from, $lte: to }, ...branchFilter };
  const previousMatch = { status: 'completed', createdAt: { $gte: previousFrom, $lte: previousTo }, ...branchFilter };
  const allOrdersMatch = { createdAt: { $gte: from, $lte: to }, ...branchFilter };

  const [
    [summary],
    [previousSummary],
    voidCount,
    salesTrend,
    paymentBreakdown,
    productPerformance,
    hourlySales,
    cashierPerformance,
    inventorySummary,
    movementSummary,
    categoryPerformance,
  ] = await Promise.all([
    Order.aggregate([
      { $match: completedMatch },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 }, avgOrderValue: { $avg: '$total' } } },
    ]),
    Order.aggregate([
      { $match: previousMatch },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 }, avgOrderValue: { $avg: '$total' } } },
    ]),
    Order.countDocuments({ ...allOrdersMatch, status: 'voided' }),
    Order.aggregate([
      { $match: completedMatch },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: MANILA_OFFSET } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', revenue: 1, orders: 1 } },
    ]),
    Order.aggregate([
      { $match: completedMatch },
      { $group: { _id: '$paymentMethod', revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $project: { _id: 0, paymentMethod: '$_id', revenue: 1, orders: 1 } },
    ]),
    Order.aggregate([
      { $match: completedMatch },
      { $unwind: '$items' },
      { $group: { _id: '$items.menuItem', itemName: { $first: '$items.itemName' }, quantitySold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
      { $sort: { quantitySold: -1, revenue: -1 } },
      { $project: { _id: 0, menuItemId: '$_id', itemName: 1, quantitySold: 1, revenue: 1 } },
    ]),
    Order.aggregate([
      { $match: completedMatch },
      { $group: { _id: { $hour: { date: '$createdAt', timezone: MANILA_OFFSET } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, hour: '$_id', revenue: 1, orders: 1 } },
    ]),
    Order.aggregate([
      { $match: completedMatch },
      { $group: { _id: '$cashier', cashierName: { $first: '$cashierNameSnap' }, revenue: { $sum: '$total' }, orders: { $sum: 1 }, avgOrderValue: { $avg: '$total' } } },
      { $sort: { revenue: -1 } },
      { $project: { _id: 0, cashierId: '$_id', cashierName: 1, revenue: 1, orders: 1, avgOrderValue: 1 } },
    ]),
    Inventory.aggregate([
      { $match: branchFilter },
      { $group: {
        _id: null,
        itemCount: { $sum: 1 },
        totalUnits: { $sum: '$currentStock' },
        lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$currentStock', 0] }, { $lte: ['$currentStock', '$minLevel'] }] }, 1, 0] } },
        outOfStock: { $sum: { $cond: [{ $lte: ['$currentStock', 0] }, 1, 0] } },
      } },
    ]),
    StockMovement.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, ...branchFilter } },
      { $group: { _id: '$type', netQty: { $sum: '$changeQty' }, movementCount: { $sum: 1 }, deductedQty: { $sum: { $cond: [{ $lt: ['$changeQty', 0] }, { $abs: '$changeQty' }, 0] } }, addedQty: { $sum: { $cond: [{ $gt: ['$changeQty', 0] }, '$changeQty', 0] } } } },
      { $project: { _id: 0, type: '$_id', netQty: 1, movementCount: 1, deductedQty: 1, addedQty: 1 } },
    ]),
    Order.aggregate([
      { $match: completedMatch },
      { $unwind: '$items' },
      { $lookup: { from: 'menuitems', localField: 'items.menuItem', foreignField: '_id', as: 'menuInfo' } },
      { $unwind: { path: '$menuInfo', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'categories', localField: 'menuInfo.category', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] }, revenue: { $sum: '$items.lineTotal' }, quantitySold: { $sum: '$items.quantity' } } },
      { $sort: { revenue: -1 } },
      { $project: { _id: 0, category: '$_id', revenue: 1, quantitySold: 1 } },
    ]),
  ]);

  let branchPerformance = [];
  if (req.user.role === 'admin') {
    branchPerformance = await Order.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: '$branch', revenue: { $sum: '$total' }, orders: { $sum: 1 }, avgOrderValue: { $avg: '$total' } } },
      { $lookup: { from: 'branches', localField: '_id', foreignField: '_id', as: 'branchInfo' } },
      { $unwind: '$branchInfo' },
      { $sort: { revenue: -1 } },
      { $project: { _id: 0, branchId: '$_id', branchName: '$branchInfo.name', revenue: 1, orders: 1, avgOrderValue: 1 } },
    ]);
  }

  const totals = summary || { revenue: 0, orders: 0, avgOrderValue: 0 };
  const previous = previousSummary || { revenue: 0, orders: 0, avgOrderValue: 0 };
  const totalTransactions = totals.orders + voidCount;
  const voidRate = totalTransactions ? (voidCount / totalTransactions) * 100 : 0;

  const topItems = productPerformance.slice(0, 10);
  const bottomItems = [...productPerformance]
    .sort((a, b) => a.quantitySold - b.quantitySold || a.revenue - b.revenue)
    .slice(0, 10);

  const peakHour = hourlySales.length
    ? hourlySales.reduce((best, row) => (row.revenue > best.revenue ? row : best), hourlySales[0])
    : null;

  const movements = movementSummary.reduce((acc, row) => {
    acc[row.type] = row;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      scope: {
        role: req.user.role,
        branchId: branchId || null,
        branchName: req.user.role === 'manager' ? req.user.branch?.name : null,
        dateFrom: from,
        dateTo: to,
      },
      summary: {
        revenue: totals.revenue || 0,
        orders: totals.orders || 0,
        avgOrderValue: totals.avgOrderValue || 0,
        voidedOrders: voidCount,
        voidRate,
        revenueChangePct: pctChange(totals.revenue || 0, previous.revenue || 0),
        orderChangePct: pctChange(totals.orders || 0, previous.orders || 0),
        avgOrderChangePct: pctChange(totals.avgOrderValue || 0, previous.avgOrderValue || 0),
      },
      salesTrend,
      paymentBreakdown,
      topItems,
      bottomItems,
      hourlySales,
      peakHour,
      cashierPerformance,
      categoryPerformance,
      inventory: inventorySummary[0] || { itemCount: 0, totalUnits: 0, lowStock: 0, outOfStock: 0 },
      stockMovements: {
        salesUnits: movements.sale?.deductedQty || 0,
        restockedUnits: movements.restock?.addedQty || 0,
        manualDeductions: movements.adjustment?.deductedQty || 0,
        manualAdds: movements.adjustment?.addedQty || 0,
        voidRestoredUnits: movements.void_restore?.addedQty || 0,
      },
      branchPerformance,
    },
  });
});
