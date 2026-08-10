const Branch = require('../models/Branch');
const inventoryService = require('../services/inventoryService');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

exports.getBranches = asyncHandler(async (req, res, next) => {
  const query = {};
  if (req.user.role !== 'admin') {
    query._id = req.user.branch._id;
  }

  const branches = await Branch.find(query).sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: branches,
  });
});

exports.getBranchById = asyncHandler(async (req, res, next) => {
  const branch = await Branch.findById(req.params.id);
  if (!branch) throw new AppError('Branch not found', 404);

  res.status(200).json({
    success: true,
    data: branch,
  });
});

exports.createBranch = asyncHandler(async (req, res, next) => {
  const { name, type, address } = req.body;

  if (!name || !name.trim()) {
    throw new AppError('Branch name is required', 400);
  }

  const branch = await Branch.create({
    name: name.trim(),
    type: type || 'branch',
    address: address ? address.trim() : '',
  });

  // Initialize inventory records for all active menu items for this new branch
  await inventoryService.ensureMenuItemInventoryForBranch(branch);

  res.status(201).json({
    success: true,
    data: branch,
  });
});

exports.updateBranch = asyncHandler(async (req, res, next) => {
  const { name, type, address } = req.body;

  const branch = await Branch.findById(req.params.id);
  if (!branch) throw new AppError('Branch not found', 404);

  if (name) branch.name = name.trim();
  if (type) branch.type = type;
  if (address !== undefined) branch.address = address.trim();

  await branch.save();

  res.status(200).json({
    success: true,
    data: branch,
  });
});

exports.toggleBranchStatus = asyncHandler(async (req, res, next) => {
  const branch = await Branch.findById(req.params.id);
  if (!branch) throw new AppError('Branch not found', 404);

  branch.isActive = !branch.isActive;
  await branch.save();

  res.status(200).json({
    success: true,
    data: branch,
  });
});
