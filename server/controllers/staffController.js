const User = require('../models/User');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().populate('branch').sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: users,
  });
});

exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate('branch');
  if (!user) throw new AppError('User not found', 404);

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.createUser = asyncHandler(async (req, res, next) => {
  const { fullName, username, password, role, branchId } = req.body;

  if (!fullName || !username || !password || !role) {
    throw new AppError('Full name, username, password, and role are required', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const existing = await User.findOne({ username: username.toLowerCase().trim() });
  if (existing) {
    throw new AppError('Username is already taken', 400);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    fullName: fullName.trim(),
    username: username.toLowerCase().trim(),
    passwordHash,
    role,
    branch: role === 'admin' ? null : branchId || null,
  });

  const populatedUser = await User.findById(user._id).populate('branch');

  res.status(201).json({
    success: true,
    data: populatedUser,
  });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  const { fullName, role, branchId, password } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  if (fullName) user.fullName = fullName.trim();
  if (role) user.role = role;
  if (role === 'admin') {
    user.branch = null;
  } else if (branchId !== undefined) {
    user.branch = branchId || null;
  }

  if (password && password.trim().length >= 6) {
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password.trim(), salt);
  }

  await user.save();
  const updated = await User.findById(user._id).populate('branch');

  res.status(200).json({
    success: true,
    data: updated,
  });
});

exports.toggleUserStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError('You cannot deactivate your own account', 400);
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    data: user,
  });
});
