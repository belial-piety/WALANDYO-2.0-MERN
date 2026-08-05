const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Branch = require('../models/Branch');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

exports.getDailyOverview = asyncHandler(async (req, res, next) => {
  const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch._id;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const matchStage = {
    status: 'completed',
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  };

  if (branchId) {
    matchStage.branch = new (require('mongoose').Types.ObjectId)(branchId);
  }

  const [salesAgg] = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  const invFilter = { currentStock: { $lte: '$minLevel' } };
  const lowStockCount = await Inventory.countDocuments({
    $expr: { $lte: ['$currentStock', '$minLevel'] },
    ...(branchId ? { branch: branchId } : {}),
  });

  const activeBranchesCount = await Branch.countDocuments({ isActive: true });

  // Sales by branch today
  const salesByBranch = await Order.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: startOfDay, $lte: endOfDay } } },
    {
      $group: {
        _id: '$branch',
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'branches',
        localField: '_id',
        foreignField: '_id',
        as: 'branchInfo',
      },
    },
    { $unwind: '$branchInfo' },
    {
      $project: {
        branchId: '$_id',
        branchName: '$branchInfo.name',
        revenue: 1,
        orders: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      todayRevenue: salesAgg ? salesAgg.totalRevenue : 0,
      todayOrders: salesAgg ? salesAgg.orderCount : 0,
      lowStockCount,
      activeBranchesCount,
      salesByBranch,
    },
  });
});

exports.getBranchPerformance = asyncHandler(async (req, res, next) => {
  const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch._id;
  const { dateFrom, dateTo } = req.query;

  const matchStage = { status: 'completed' };
  if (branchId) {
    matchStage.branch = new (require('mongoose').Types.ObjectId)(branchId);
  }

  if (dateFrom || dateTo) {
    matchStage.createdAt = {};
    if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const dTo = new Date(dateTo);
      dTo.setHours(23, 59, 59, 999);
      matchStage.createdAt.$lte = dTo;
    }
  }

  const [totalsAgg] = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  const topItems = await Order.aggregate([
    { $match: matchStage },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.menuItem',
        itemName: { $first: '$items.itemName' },
        quantitySold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { quantitySold: -1 } },
    { $limit: 10 },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalRevenue: totalsAgg ? totalsAgg.totalRevenue : 0,
      totalOrders: totalsAgg ? totalsAgg.totalOrders : 0,
      topItems,
    },
  });
});
