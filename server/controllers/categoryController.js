const Category = require('../models/Category');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

exports.getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find().sort({ name: 1 });
  res.status(200).json({
    success: true,
    data: categories,
  });
});

exports.createCategory = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    throw new AppError('Category name is required', 400);
  }

  const category = await Category.create({ name: name.trim() });
  res.status(201).json({
    success: true,
    data: category,
  });
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    throw new AppError('Category name is required', 400);
  }

  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  category.name = name.trim();
  await category.save();

  res.status(200).json({
    success: true,
    data: category,
  });
});
