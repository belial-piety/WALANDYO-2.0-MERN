const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Branch = require('../models/Branch');
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const StockMovement = require('../models/StockMovement');
const OrderAuditLog = require('../models/OrderAuditLog');
const Notification = require('../models/Notification');
const { connectDB, closeDB } = require('../config/db');

async function seed() {
  console.log('[Seed] Starting database seed...');
  await connectDB();

  // Clear existing collections
  await Promise.all([
    Branch.deleteMany({}),
    User.deleteMany({}),
    Category.deleteMany({}),
    MenuItem.deleteMany({}),
    Inventory.deleteMany({}),
    Order.deleteMany({}),
    StockMovement.deleteMany({}),
    OrderAuditLog.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log('[Seed] Cleared existing data.');

  // 1. Seed Branches
  const branchDocs = [
    { name: 'Marikina (Main)', type: 'branch', address: 'J.P. Rizal, Marikina City' },
    { name: 'Angono', type: 'branch', address: 'Angono, Rizal' },
    { name: 'Mayamot, Antipolo', type: 'branch', address: 'Mayamot, Antipolo City' },
    { name: 'Penafrancia, Antipolo', type: 'branch', address: 'Penafrancia, Antipolo City' },
    { name: 'Angono Food Truck', type: 'food_truck', address: 'Mobile - Angono area' },
  ];
  const branches = await Branch.insertMany(branchDocs);
  console.log(`[Seed] Seeded ${branches.length} branches.`);

  const marikinaBranch = branches.find((b) => b.name === 'Marikina (Main)');

  // 2. Seed Users
  const salt = await bcrypt.genSalt(10);
  const userDocs = [
    {
      fullName: 'Marjorie Comia',
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', salt),
      role: 'admin',
      branch: null,
    },
    {
      fullName: 'Vicky Barberona',
      username: 'manager1',
      passwordHash: await bcrypt.hash('manager123', salt),
      role: 'manager',
      branch: marikinaBranch._id,
    },
    {
      fullName: 'Nicole (Marikina)',
      username: 'cashier1',
      passwordHash: await bcrypt.hash('cashier123', salt),
      role: 'cashier',
      branch: marikinaBranch._id,
    },
    {
      fullName: 'Marga Brillantes',
      username: 'inventory1',
      passwordHash: await bcrypt.hash('inventory123', salt),
      role: 'inventory',
      branch: marikinaBranch._id,
    },
  ];
  const users = await User.insertMany(userDocs);
  console.log(`[Seed] Seeded ${users.length} user accounts.`);

  // 3. Seed Categories
  const categoryNames = ['Silog Meals', 'Pares & Bulalo', 'Beverages', 'Add-ons'];
  const categories = await Promise.all(
    categoryNames.map((name) => Category.create({ name }))
  );
  console.log(`[Seed] Seeded ${categories.length} categories.`);

  const getCatId = (catName) => categories.find((c) => c.name === catName)._id;

  // 4. Seed Menu Items
  const menuItemDocs = [
    { name: 'Tapsilog', category: getCatId('Silog Meals'), price: 99 },
    { name: 'Porksilog', category: getCatId('Silog Meals'), price: 89 },
    { name: 'Hotsilog', category: getCatId('Silog Meals'), price: 69 },
    { name: 'Bangsilog', category: getCatId('Silog Meals'), price: 99 },
    { name: 'Longsilog', category: getCatId('Silog Meals'), price: 79 },
    { name: 'Chicksilog', category: getCatId('Silog Meals'), price: 89 },
    { name: 'Beef Pares', category: getCatId('Pares & Bulalo'), price: 109 },
    { name: 'Bulalo', category: getCatId('Pares & Bulalo'), price: 149 },
    { name: 'Bottled Water', category: getCatId('Beverages'), price: 20 },
    { name: 'Coke in Can', category: getCatId('Beverages'), price: 25 },
    { name: 'Iced Tea', category: getCatId('Beverages'), price: 29 },
    { name: 'Extra Rice', category: getCatId('Add-ons'), price: 20 },
    { name: 'Extra Egg', category: getCatId('Add-ons'), price: 15 },
  ];

  const menuItems = await MenuItem.insertMany(menuItemDocs);
  console.log(`[Seed] Seeded ${menuItems.length} menu items.`);

  // 5. Seed Inventory for each (MenuItem, Branch) combination
  const inventoryDocs = [];
  for (const item of menuItems) {
    for (const branch of branches) {
      const stock = 20 + Math.floor(Math.random() * 30);
      inventoryDocs.push({
        menuItem: item._id,
        branch: branch._id,
        currentStock: stock,
        minLevel: 10,
        unit: 'pcs',
      });
    }
  }
  const inventories = await Inventory.insertMany(inventoryDocs);
  console.log(`[Seed] Seeded ${inventories.length} inventory records.`);

  // 6. Create a sample initial completed order for testing
  const cashier = users.find((u) => u.username === 'cashier1');
  const tapsilog = menuItems.find((i) => i.name === 'Tapsilog');
  const icedTea = menuItems.find((i) => i.name === 'Iced Tea');

  const sampleOrder = await Order.create({
    orderNumber: 'ORD-20260804-1001',
    branch: marikinaBranch._id,
    cashier: cashier._id,
    cashierNameSnap: cashier.fullName,
    status: 'completed',
    paymentMethod: 'cash',
    items: [
      { menuItem: tapsilog._id, itemName: tapsilog.name, quantity: 2, unitPrice: 99, lineTotal: 198 },
      { menuItem: icedTea._id, itemName: icedTea.name, quantity: 2, unitPrice: 29, lineTotal: 58 },
    ],
    subtotal: 256,
    tax: 0,
    total: 256,
  });

  await OrderAuditLog.create({
    order: sampleOrder._id,
    action: 'created',
    notes: 'Sample seed order created',
    staff: cashier._id,
    staffNameSnap: cashier.fullName,
  });

  console.log('[Seed] Sample order seeded.');
  console.log('[Seed] Seeding completed successfully!');

  if (require.main === module) {
    await closeDB();
  }
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('[Seed Error]', err);
    process.exit(1);
  });
}

module.exports = seed;
