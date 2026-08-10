const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const inventoryService = require('../services/inventoryService');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

exports.getInventory = asyncHandler(async (req, res, next) => {
  const branchId = req.branchId;
  const { status, category, search } = req.query;

  if (!branchId) throw new AppError('Branch is required to view inventory', 400);

  const filter = { branch: branchId };

  const inventoryList = await Inventory.find(filter)
    .populate({
      path: 'menuItem',
      populate: { path: 'category' },
    })
    .populate('branch');

  let filtered = inventoryList.filter((inv) => inv.menuItem && !inv.menuItem.isArchived);

  if (category) {
    filtered = filtered.filter(
      (inv) => inv.menuItem.category && inv.menuItem.category._id.toString() === category
    );
  }

  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter((inv) => inv.menuItem.name.toLowerCase().includes(term));
  }

  if (status) {
    filtered = filtered.filter((inv) => inv.status === status);
  }

  res.status(200).json({
    success: true,
    data: filtered,
  });
});

exports.getInventoryById = asyncHandler(async (req, res, next) => {
  const inv = await Inventory.findById(req.params.id)
    .populate({
      path: 'menuItem',
      populate: { path: 'category' },
    })
    .populate('branch');

  if (!inv) throw new AppError('Inventory record not found', 404);

  res.status(200).json({
    success: true,
    data: inv,
  });
});

exports.restockItem = asyncHandler(async (req, res, next) => {
  const { quantity, notes } = req.body;
  const inv = await inventoryService.restockInventory(
    req.params.id,
    quantity,
    req.user._id,
    notes
  );

  res.status(200).json({
    success: true,
    data: inv,
  });
});

exports.deductItem = asyncHandler(async (req, res, next) => {
  const { quantity, notes } = req.body;
  const inv = await inventoryService.deductInventory(
    req.params.id,
    quantity,
    req.user._id,
    notes
  );

  res.status(200).json({
    success: true,
    data: inv,
  });
});

exports.updateMinLevel = asyncHandler(async (req, res, next) => {
  const { minLevel } = req.body;
  const inv = await inventoryService.updateMinLevel(req.params.id, minLevel);

  res.status(200).json({
    success: true,
    data: inv,
  });
});

exports.getStockMovements = asyncHandler(async (req, res, next) => {
  const invId = req.params.id;
  const movements = await StockMovement.find({ inventory: invId })
    .populate('createdBy', 'fullName username')
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({
    success: true,
    data: movements,
  });
});
