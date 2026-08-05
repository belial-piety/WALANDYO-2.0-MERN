const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const Inventory = require('../models/Inventory');
const inventoryService = require('../services/inventoryService');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

exports.getMenuItems = asyncHandler(async (req, res, next) => {
  const { category, search, available } = req.query;
  const filter = { isArchived: false };

  if (category) filter.category = category;
  if (available !== undefined) filter.isAvailable = available === 'true';
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const items = await MenuItem.find(filter).populate('category').sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: items,
  });
});

exports.getMenuItemById = asyncHandler(async (req, res, next) => {
  const item = await MenuItem.findById(req.params.id).populate('category');
  if (!item || item.isArchived) throw new AppError('Menu item not found', 404);

  res.status(200).json({
    success: true,
    data: item,
  });
});

exports.createMenuItem = asyncHandler(async (req, res, next) => {
  let { name, categoryId, categoryName, price, imageUrl, isAvailable } = req.body;

  if (!name || !name.trim()) throw new AppError('Name is required', 400);
  if (price === undefined || price < 0) throw new AppError('Valid price is required', 400);

  let categoryDoc;
  if (categoryId) {
    categoryDoc = await Category.findById(categoryId);
  } else if (categoryName && categoryName.trim()) {
    categoryDoc = await Category.findOne({ normalizedName: categoryName.toLowerCase().trim() });
    if (!categoryDoc) {
      categoryDoc = await Category.create({ name: categoryName.trim() });
    }
  }

  if (!categoryDoc) {
    throw new AppError('Please select or create a valid category', 400);
  }

  const menuItem = await MenuItem.create({
    name: name.trim(),
    category: categoryDoc._id,
    price: Number(price),
    imageUrl: imageUrl ? imageUrl.trim() : null,
    isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
  });

  // Automatically initialize inventory across all active branches
  await inventoryService.ensureBranchInventoryForMenuItem(menuItem);

  const populated = await MenuItem.findById(menuItem._id).populate('category');

  res.status(201).json({
    success: true,
    data: populated,
  });
});

exports.updateMenuItem = asyncHandler(async (req, res, next) => {
  const { name, categoryId, price, imageUrl, isAvailable } = req.body;

  const menuItem = await MenuItem.findById(req.params.id);
  if (!menuItem || menuItem.isArchived) throw new AppError('Menu item not found', 404);

  if (name) menuItem.name = name.trim();
  if (categoryId) menuItem.category = categoryId;
  if (price !== undefined) menuItem.price = Number(price);
  if (imageUrl !== undefined) menuItem.imageUrl = imageUrl ? imageUrl.trim() : null;
  if (isAvailable !== undefined) menuItem.isAvailable = Boolean(isAvailable);

  await menuItem.save();
  const populated = await MenuItem.findById(menuItem._id).populate('category');

  res.status(200).json({
    success: true,
    data: populated,
  });
});

exports.archiveMenuItem = asyncHandler(async (req, res, next) => {
  const menuItem = await MenuItem.findById(req.params.id);
  if (!menuItem || menuItem.isArchived) throw new AppError('Menu item not found', 404);

  menuItem.isArchived = true;
  menuItem.isAvailable = false;
  await menuItem.save();

  res.status(200).json({
    success: true,
    message: 'Menu item archived successfully',
    data: menuItem,
  });
});

exports.getPosCatalog = asyncHandler(async (req, res, next) => {
  const branchId = req.branchId;
  if (!branchId) throw new AppError('Branch ID is required for POS catalog', 400);

  const menuItems = await MenuItem.find({ isArchived: false, isAvailable: true })
    .populate('category')
    .sort({ name: 1 });

  const inventoryList = await Inventory.find({ branch: branchId });
  const stockMap = new Map();
  inventoryList.forEach((inv) => {
    stockMap.set(inv.menuItem.toString(), inv.currentStock);
  });

  const catalog = menuItems.map((item) => {
    const stock = stockMap.get(item._id.toString()) ?? 0;
    return {
      _id: item._id,
      name: item.name,
      category: item.category ? item.category.name : 'Uncategorized',
      categoryId: item.category ? item.category._id : null,
      price: item.price,
      imageUrl: item.imageUrl,
      currentStock: stock,
      canSell: stock > 0,
    };
  });

  res.status(200).json({
    success: true,
    data: catalog,
  });
});
