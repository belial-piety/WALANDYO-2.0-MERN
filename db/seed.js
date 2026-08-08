// Seeds the database with demo branches, categories, menu items,
// per-branch inventory, and one login per role.
// Run with: npm run seed  (after schema.sql has been applied)

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const BRANCHES = [
  { name: 'Marikina (Main)', type: 'branch', address: 'J.P. Rizal, Marikina City' },
  { name: 'Angono', type: 'branch', address: 'Angono, Rizal' },
  { name: 'Mayamot, Antipolo', type: 'branch', address: 'Mayamot, Antipolo City' },
  { name: 'Penafrancia, Antipolo', type: 'branch', address: 'Penafrancia, Antipolo City' },
  { name: 'Angono Food Truck', type: 'food_truck', address: 'Mobile - Angono area' },
];

const CATEGORIES = ['Silog Meals', 'Pares & Bulalo', 'Beverages', 'Add-ons', 'Lutong Bahay'];

// [name, category, price]
const MENU_ITEMS = [
  ['Tapsilog', 'Silog Meals', 99],
  ['Porksilog', 'Silog Meals', 89],
  ['Hotsilog', 'Silog Meals', 69],
  ['Bangsilog', 'Silog Meals', 99],
  ['Longsilog', 'Silog Meals', 79],
  ['Chicksilog', 'Silog Meals', 89],
  ['Bacsilog', 'Silog Meals', 89],
  ['Embosilog', 'Silog Meals', 99],
  ['Hamsilog', 'Silog Meals', 89],
  ['Tosilog', 'Silog Meals', 89],
  ['Beef Pares', 'Pares & Bulalo', 109],
  ['Beef Mami', 'Pares & Bulalo', 99],
  ['Bulalo', 'Pares & Bulalo', 149],
  ['Hungarian', 'Lutong Bahay', 79],
  ['Liempo', 'Lutong Bahay', 129],
  ['Shanghai', 'Lutong Bahay', 99],
  ['Sisig', 'Lutong Bahay', 119],
  ['Bottled Water', 'Beverages', 20],
  ['Coke in Can', 'Beverages', 25],
  ['Iced Tea', 'Beverages', 29],
  ['Extra Rice', 'Add-ons', 20],
  ['Extra Egg', 'Add-ons', 15],
];

const USERS = [
  { full_name: 'Marjorie Comia', username: 'admin', password: 'admin123', role: 'admin', branch_id: null },
  { full_name: 'Vicky Barberona', username: 'manager1', password: 'manager123', role: 'manager', branch_id: 1 },
  { full_name: 'Nicole (Marikina)', username: 'cashier1', password: 'cashier123', role: 'cashier', branch_id: 1 },
  { full_name: 'Marga Brillantes', username: 'inventory1', password: 'inventory123', role: 'inventory', branch_id: 1 },
];

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log('Seeding branches...');
    const branchIds = [];
    for (const b of BRANCHES) {
      const [result] = await conn.query(
        'INSERT INTO branches (name, type, address) VALUES (?, ?, ?)',
        [b.name, b.type, b.address]
      );
      branchIds.push(result.insertId);
    }

    console.log('Seeding categories...');
    const categoryIds = {};
    for (const name of CATEGORIES) {
      const [result] = await conn.query('INSERT INTO categories (name) VALUES (?)', [name]);
      categoryIds[name] = result.insertId;
    }

    console.log('Seeding menu items + per-branch inventory...');
    for (const [name, category, price] of MENU_ITEMS) {
      const [result] = await conn.query(
        'INSERT INTO menu_items (name, category_id, price, is_available) VALUES (?, ?, ?, 1)',
        [name, categoryIds[category], price]
      );
      const menuItemId = result.insertId;

      for (const branchId of branchIds) {
        const startingStock = 20 + Math.floor(Math.random() * 30); // 20-49
        await conn.query(
          'INSERT INTO inventory (menu_item_id, branch_id, current_stock, min_level, unit) VALUES (?, ?, ?, ?, ?)',
          [menuItemId, branchId, startingStock, 10, 'pcs']
        );
      }
    }

    console.log('Seeding users...');
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      await conn.query(
        'INSERT INTO users (full_name, username, password_hash, role, branch_id) VALUES (?, ?, ?, ?, ?)',
        [u.full_name, u.username, hash, u.role, u.branch_id]
      );
    }

    console.log('\nSeed complete. Demo logins (username / password):');
    for (const u of USERS) {
      console.log(`  ${u.role.padEnd(10)} ${u.username} / ${u.password}`);
    }
  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
