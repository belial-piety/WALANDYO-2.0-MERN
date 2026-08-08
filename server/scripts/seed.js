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

// ---- Realistic demo-data helpers ----
function randomStock() {
  const r = Math.random();
  if (r < 0.08) return 0; // out of stock
  if (r < 0.25) return 1 + Math.floor(Math.random() * 9); // low stock (1-9, <= minLevel)
  return 15 + Math.floor(Math.random() * 85); // normal/plentiful (15-99)
}

function randomPayment() {
  const r = Math.random();
  if (r < 0.65) return 'cash';
  if (r < 0.85) return 'gcash';
  return 'card';
}

const VOID_REASONS = [
  'Customer cancelled',
  'Wrong item ordered',
  'Duplicate entry',
  'Customer changed mind',
];

const usedOrderNumbers = new Set();
function genOrderNumber(date) {
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate()
  ).padStart(2, '0')}`;
  let num;
  do {
    num = Math.floor(1000 + Math.random() * 9000);
  } while (usedOrderNumbers.has(`ORD-${dateStr}-${num}`));
  usedOrderNumbers.add(`ORD-${dateStr}-${num}`);
  return `ORD-${dateStr}-${num}`;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

  // 2. Seed Users
  const salt = await bcrypt.genSalt(10);

const branchSlugs = {
    'Marikina (Main)': 'marikina',
    'Angono': 'angono',
    'Mayamot, Antipolo': 'mayamot',
    'Penafrancia, Antipolo': 'penafrancia',
    'Angono Food Truck': 'angono_food_truck',
  };

const userDocs = [
    {
      fullName: 'Marjorie Comia',
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', salt),
      role: 'admin',
      branch: null,
    },
  ];

  // Create Manager, Cashier, and Inventory demo accounts for every branch.
  const branchRoleNames = {
    manager: {
      Marikina: 'Vicky Barberona',
      Angono: 'Angono Manager',
      Mayamot: 'Mayamot Manager',
      Penafrancia: 'Penafrancia Manager',
      'Angono Food Truck': 'Food Truck Manager',
    },
    cashier: {
      Marikina: 'Nicole (Marikina)',
      Angono: 'Angono Cashier',
      Mayamot: 'Mayamot Cashier',
      Penafrancia: 'Penafrancia Cashier',
      'Angono Food Truck': 'Food Truck Cashier',
    },
    inventory: {
      Marikina: 'Marga Brillantes',
      Angono: 'Angono Inventory',
      Mayamot: 'Mayamot Inventory',
      Penafrancia: 'Penafrancia Inventory',
      'Angono Food Truck': 'Food Truck Inventory',
    },
  };

  const rolePasswords = {
    manager: 'manager123',
    cashier: 'cashier123',
    inventory: 'inventory123',
  };

  for (const branch of branches) {
    for (const role of ['manager', 'cashier', 'inventory']) {
const slug = branchSlugs[branch.name];
      userDocs.push({
        fullName: branchRoleNames[role][branch.name] || `${role} (${branch.name})`,
        username: `${role}_${slug}`,
        passwordHash: await bcrypt.hash(rolePasswords[role], salt),
        role,
        branch: branch._id,
      });
    }
  }

  const users = await User.insertMany(userDocs);
  console.log(`[Seed] Seeded ${users.length} user accounts.`);

  // 3. Seed Categories
  const categoryNames = ['Silog Meals', 'Pares & Bulalo', 'Beverages', 'Add-ons', 'Lutong Bahay'];
  const categories = await Promise.all(
    categoryNames.map((name) => Category.create({ name }))
  );
  console.log(`[Seed] Seeded ${categories.length} categories.`);

  const getCatId = (catName) => categories.find((c) => c.name === catName)._id;

  // 4. Seed Menu Items
  const menuImageMap = {
    Tapsilog: '/images/Tapsilog.jpg',
    Porksilog: '/images/Porkchop.jpg',
    Hotsilog: '/images/Hakdog.jpg',
    Bangsilog: null,
    Longsilog: '/images/Longsilog.jpg',
    Chicksilog: '/images/Chickensilog.jpg',
    Bacsilog: '/images/Bacsilog.jpg',
    Embosilog: '/images/Embosilog.jpg',
    Hamsilog: '/images/Hamsilog.jpg',
    Tosilog: '/images/Tosilog.jpg',
    'Beef Pares': '/images/Pares Mami.jpg',
    'Beef Mami': '/images/Beef Mami.jpg',
    Bulalo: '/images/Bulalo.jpg',
    Hungarian: '/images/Hungarian.jpg',
    Liempo: '/images/Liempo.jpg',
    Shanghai: '/images/shanghai.jpg',
    Sisig: '/images/Sisig.jpg',
    'Bottled Water': null,
    'Coke in Can': null,
    'Iced Tea': null,
    'Extra Rice': null,
    'Extra Egg': null,
  };

  const rawMenuItems = [
    { name: 'Tapsilog', category: getCatId('Silog Meals'), price: 99 },
    { name: 'Porksilog', category: getCatId('Silog Meals'), price: 89 },
    { name: 'Hotsilog', category: getCatId('Silog Meals'), price: 69 },
    { name: 'Bangsilog', category: getCatId('Silog Meals'), price: 99 },
    { name: 'Longsilog', category: getCatId('Silog Meals'), price: 79 },
    { name: 'Chicksilog', category: getCatId('Silog Meals'), price: 89 },
    { name: 'Bacsilog', category: getCatId('Silog Meals'), price: 89 },
    { name: 'Embosilog', category: getCatId('Silog Meals'), price: 99 },
    { name: 'Hamsilog', category: getCatId('Silog Meals'), price: 89 },
    { name: 'Tosilog', category: getCatId('Silog Meals'), price: 89 },
    { name: 'Beef Pares', category: getCatId('Pares & Bulalo'), price: 109 },
    { name: 'Beef Mami', category: getCatId('Pares & Bulalo'), price: 99 },
    { name: 'Bulalo', category: getCatId('Pares & Bulalo'), price: 149 },
    { name: 'Hungarian', category: getCatId('Lutong Bahay'), price: 79 },
    { name: 'Liempo', category: getCatId('Lutong Bahay'), price: 129 },
    { name: 'Shanghai', category: getCatId('Lutong Bahay'), price: 99 },
    { name: 'Sisig', category: getCatId('Lutong Bahay'), price: 119 },
    { name: 'Bottled Water', category: getCatId('Beverages'), price: 20 },
    { name: 'Coke in Can', category: getCatId('Beverages'), price: 25 },
    { name: 'Iced Tea', category: getCatId('Beverages'), price: 29 },
    { name: 'Extra Rice', category: getCatId('Add-ons'), price: 20 },
    { name: 'Extra Egg', category: getCatId('Add-ons'), price: 15 },
  ];

  const menuItemDocs = rawMenuItems.map((item) => ({
    ...item,
    imageUrl: menuImageMap[item.name] || null,
  }));

  const menuItems = await MenuItem.insertMany(menuItemDocs);
  console.log(`[Seed] Seeded ${menuItems.length} menu items.`);

// 5. Seed Inventory for each (MenuItem, Branch) combination
  // Use a realistic distribution: ~8% out of stock, ~17% low (<= minLevel),
  // and the rest normal/plentiful. minLevel varies slightly per branch.
  const inventoryDocs = [];
  for (const item of menuItems) {
    for (const branch of branches) {
      const isFoodTruck = branch.type === 'food_truck';
      inventoryDocs.push({
        menuItem: item._id,
        branch: branch._id,
        currentStock: randomStock(),
        // Food truck keeps a lower minimum (smaller carrying capacity)
        minLevel: isFoodTruck ? 5 : 10,
        unit: 'pcs',
      });
    }
  }
const inventories = await Inventory.insertMany(inventoryDocs);
  console.log(`[Seed] Seeded ${inventories.length} inventory records.`);

  // 5b. Create low-stock / out-of-stock notifications for realistic alerting
  const notificationDocs = [];
  for (const inv of inventories) {
    const menuItem = menuItems.find((m) => m._id.toString() === inv.menuItem.toString());
    if (inv.currentStock <= inv.minLevel) {
      notificationDocs.push({
        branch: inv.branch,
        inventory: inv._id,
        menuItem: inv.menuItem,
        message:
          inv.currentStock === 0
            ? `${menuItem.name} is out of stock.`
            : `${menuItem.name} is running low (${inv.currentStock} left).`,
        type: inv.currentStock === 0 ? 'out_of_stock' : 'low_stock',
        isRead: Math.random() < 0.3,
        readAt: null,
        readBy: null,
      });
    }
  }
  await Notification.insertMany(notificationDocs);
  console.log(`[Seed] Seeded ${notificationDocs.length} stock notifications.`);

  // 6. Generate realistic order history for EVERY branch over the last ~30 days.
  //    Reports aggregate from the orders collection, so this also populates the
  //    daily overview (revenue/orders/sales-by-branch) and branch performance
  //    (top items) automatically.
  const branchVolume = {
    'Marikina (Main)': { min: 18, max: 32 },
    Angono: { min: 12, max: 22 },
    'Mayamot, Antipolo': { min: 14, max: 24 },
    'Penafrancia, Antipolo': { min: 10, max: 20 },
    'Angono Food Truck': { min: 6, max: 14 },
  };

  const orderDocs = [];
  const stockMovementDocs = [];
  const auditLogDocs = [];

  const branchCashiers = {};
  for (const branch of branches) {
    const cashier = users.find((u) => u.username === `cashier_${branchSlugs[branch.name]}`);
    branchCashiers[branch._id.toString()] = cashier;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const branch of branches) {
    const volume = branchVolume[branch.name] || { min: 10, max: 20 };
    const cashier = branchCashiers[branch._id.toString()];

    for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
      const day = new Date(todayStart);
      day.setDate(day.getDate() - daysAgo);

      // Slightly busier on weekends (Fri/Sat/Sun)
      const dow = day.getDay();
      const weekendBoost = dow === 0 || dow === 5 || dow === 6 ? 1.3 : 1;
      const ordersToday = Math.round(
        (volume.min + Math.random() * (volume.max - volume.min)) * weekendBoost
      );

      for (let i = 0; i < ordersToday; i++) {
        // Random timestamp within business hours (7 AM - 9 PM)
        const ts = new Date(day);
        const hour = 7 + Math.floor(Math.random() * 14);
        ts.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0);

        // 1-4 items per order
        const numItems = 1 + Math.floor(Math.random() * 4);
        const chosenItems = [];
        const usedIdx = new Set();
        for (let k = 0; k < numItems; k++) {
          let idx;
          do {
            idx = Math.floor(Math.random() * menuItems.length);
          } while (usedIdx.has(idx));
          usedIdx.add(idx);
          chosenItems.push(menuItems[idx]);
        }

        const orderItems = [];
        let subtotal = 0;
        for (const mi of chosenItems) {
          const qty = 1 + Math.floor(Math.random() * 3);
          const lineTotal = mi.price * qty;
          subtotal += lineTotal;
          orderItems.push({
            menuItem: mi._id,
            itemName: mi.name,
            quantity: qty,
            unitPrice: mi.price,
            lineTotal,
          });
        }

        const tax = 0;
        const total = subtotal;

        // ~5% of orders are voided
        const isVoided = Math.random() < 0.05;
        const payment = randomPayment();
        const orderId = new mongoose.Types.ObjectId();

        orderDocs.push({
          _id: orderId,
          orderNumber: genOrderNumber(ts),
          branch: branch._id,
          cashier: cashier._id,
          cashierNameSnap: cashier.fullName,
          status: isVoided ? 'voided' : 'completed',
          paymentMethod: payment,
          items: orderItems,
          subtotal,
          tax,
          total,
          voidReason: isVoided ? pickRandom(VOID_REASONS) : null,
          voidedAt: isVoided ? new Date(ts.getTime() + 30 * 60 * 1000) : null,
          voidedBy: isVoided ? cashier._id : null,
          createdAt: ts,
          updatedAt: ts,
        });

        auditLogDocs.push(
          {
            order: orderId,
            action: 'created',
            notes: `Order created via POS (${payment.toUpperCase()})`,
            staff: cashier._id,
            staffNameSnap: cashier.fullName,
            createdAt: ts,
          }
        );

        if (isVoided) {
          auditLogDocs.push({
            order: orderId,
            action: 'voided',
            notes: `Voided by ${cashier.fullName}: ${pickRandom(VOID_REASONS)}`,
            staff: cashier._id,
            staffNameSnap: cashier.fullName,
            createdAt: new Date(ts.getTime() + 30 * 60 * 1000),
          });
        }

        // Stock movement records to keep inventory ledger consistent
        for (const oi of orderItems) {
          const inv = inventories.find(
            (iv) =>
              iv.menuItem.toString() === oi.menuItem.toString() &&
              iv.branch.toString() === branch._id.toString()
          );
          if (inv) {
            stockMovementDocs.push({
              inventory: inv._id,
              branch: branch._id,
              menuItem: oi.menuItem,
              changeQty: isVoided ? oi.quantity : -oi.quantity,
              type: isVoided ? 'void_restore' : 'sale',
              referenceOrder: orderId,
              createdBy: cashier._id,
              notes: isVoided
                ? `Void Order #${orderDocs[orderDocs.length - 1].orderNumber}`
                : `Sale - Order #${orderDocs[orderDocs.length - 1].orderNumber}`,
              createdAt: ts,
            });
          }
        }
      }
    }
  }

  await Order.insertMany(orderDocs);
  await StockMovement.insertMany(stockMovementDocs);
  await OrderAuditLog.insertMany(auditLogDocs);

  console.log(
    `[Seed] Seeded ${orderDocs.length} orders, ${stockMovementDocs.length} stock movements, ${auditLogDocs.length} audit logs.`
  );
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
