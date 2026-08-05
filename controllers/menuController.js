const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const Inventory = require('../models/Inventory');
const Branch = require('../models/Branch');
const pool = require('../config/db');

exports.showMenu = async (req, res) => {
  const [items, categories] = await Promise.all([MenuItem.list(), Category.list()]);
  res.render('menu/index', {
    title: 'Menu Management',
    active: 'menu',
    items,
    categories,
  });
};

exports.createItem = async (req, res) => {
  const { name, price, category_id, new_category, image_url, is_available } = req.body;

  let categoryId = category_id ? Number(category_id) : null;
  if (new_category && new_category.trim()) {
    categoryId = await Category.findOrCreate(new_category.trim());
  }

  const menuItemId = await MenuItem.create({
    name,
    category_id: categoryId,
    price: Number(price),
    image_url,
    is_available: is_available === 'on',
  });

  // A menu item is only sellable at the counter once it has an inventory
  // row per branch, so create one (starting at 0 stock) for every branch.
  const branches = await Branch.listActive();
  for (const branch of branches) {
    await pool.query(
      `INSERT INTO inventory (menu_item_id, branch_id, current_stock, min_level)
       VALUES (?, ?, 0, 10)`,
      [menuItemId, branch.id]
    );
  }

  res.redirect('/menu');
};

exports.updateItem = async (req, res) => {
  const { name, price, category_id, new_category, image_url, is_available } = req.body;

  let categoryId = category_id ? Number(category_id) : null;
  if (new_category && new_category.trim()) {
    categoryId = await Category.findOrCreate(new_category.trim());
  }

  await MenuItem.update(req.params.id, {
    name,
    category_id: categoryId,
    price: Number(price),
    image_url,
    is_available: is_available === 'on',
  });
  res.redirect('/menu');
};

exports.deleteItem = async (req, res) => {
  await MenuItem.remove(req.params.id);
  res.redirect('/menu');
};
