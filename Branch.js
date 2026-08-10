require('dotenv').config();
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');

let dbInstance = null;
let dbPromise = null;

async function getDb() {
  if (dbInstance) return dbInstance;
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQL = await initSqlJs();
      const db = new SQL.Database();

      db.create_function('CURDATE', () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });

      // Initialize schema
      db.exec(`
        CREATE TABLE IF NOT EXISTS branches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'branch',
          address TEXT DEFAULT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL,
          branch_id INTEGER DEFAULT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS menu_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category_id INTEGER DEFAULT NULL,
          price REAL NOT NULL DEFAULT 0.00,
          image_url TEXT DEFAULT NULL,
          is_available INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          menu_item_id INTEGER NOT NULL,
          branch_id INTEGER NOT NULL,
          current_stock INTEGER NOT NULL DEFAULT 0,
          min_level INTEGER NOT NULL DEFAULT 5,
          unit TEXT NOT NULL DEFAULT 'pcs',
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(menu_item_id, branch_id)
        );

        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          branch_id INTEGER NOT NULL,
          cashier_id INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'completed',
          payment_method TEXT NOT NULL,
          subtotal REAL NOT NULL,
          tax REAL NOT NULL DEFAULT 0.00,
          total REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          menu_item_id INTEGER NOT NULL,
          item_name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price REAL NOT NULL,
          line_total REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS order_audit_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          notes TEXT DEFAULT NULL,
          staff_id INTEGER DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS stock_movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inventory_id INTEGER NOT NULL,
          change_qty INTEGER NOT NULL,
          type TEXT NOT NULL,
          reference_order_id INTEGER DEFAULT NULL,
          created_by INTEGER DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          branch_id INTEGER NOT NULL,
          inventory_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          is_read INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed data if branches table is empty
      const check = db.exec('SELECT COUNT(*) FROM branches');
      if (check[0].values[0][0] === 0) {
        seedData(db);
      }

      dbInstance = db;
      return db;
    })();
  }
  return dbPromise;
}

function seedData(db) {
  const BRANCHES = [
    { name: 'Marikina (Main)', type: 'branch', address: 'J.P. Rizal, Marikina City' },
    { name: 'Angono', type: 'branch', address: 'Angono, Rizal' },
    { name: 'Mayamot, Antipolo', type: 'branch', address: 'Mayamot, Antipolo City' },
    { name: 'Penafrancia, Antipolo', type: 'branch', address: 'Penafrancia, Antipolo City' },
    { name: 'Angono Food Truck', type: 'food_truck', address: 'Mobile - Angono area' },
  ];

  const CATEGORIES = ['Silog Meals', 'Pares & Bulalo', 'Beverages', 'Add-ons'];

  const MENU_ITEMS = [
    ['Tapsilog', 'Silog Meals', 99],
    ['Porksilog', 'Silog Meals', 89],
    ['Hotsilog', 'Silog Meals', 69],
    ['Bangsilog', 'Silog Meals', 99],
    ['Longsilog', 'Silog Meals', 79],
    ['Chicksilog', 'Silog Meals', 89],
    ['Beef Pares', 'Pares & Bulalo', 109],
    ['Bulalo', 'Pares & Bulalo', 149],
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

  const branchIds = [];
  for (const b of BRANCHES) {
    db.run('INSERT INTO branches (name, type, address) VALUES (?, ?, ?)', [b.name, b.type, b.address]);
    const res = db.exec('SELECT last_insert_rowid()');
    branchIds.push(res[0].values[0][0]);
  }

  const categoryIds = {};
  for (const name of CATEGORIES) {
    db.run('INSERT INTO categories (name) VALUES (?)', [name]);
    const res = db.exec('SELECT last_insert_rowid()');
    categoryIds[name] = res[0].values[0][0];
  }

  for (const [name, category, price] of MENU_ITEMS) {
    db.run('INSERT INTO menu_items (name, category_id, price, is_available) VALUES (?, ?, ?, 1)', [
      name,
      categoryIds[category],
      price,
    ]);
    const res = db.exec('SELECT last_insert_rowid()');
    const menuItemId = res[0].values[0][0];

    for (const branchId of branchIds) {
      const startingStock = 20 + Math.floor(Math.random() * 30);
      db.run(
        'INSERT INTO inventory (menu_item_id, branch_id, current_stock, min_level, unit) VALUES (?, ?, ?, ?, ?)',
        [menuItemId, branchId, startingStock, 10, 'pcs']
      );
    }
  }

  for (const u of USERS) {
    const hash = bcrypt.hashSync(u.password, 10);
    db.run(
      'INSERT INTO users (full_name, username, password_hash, role, branch_id) VALUES (?, ?, ?, ?, ?)',
      [u.full_name, u.username, hash, u.role, u.branch_id]
    );
  }
}

async function runQuery(sql, params = []) {
  const db = await getDb();
  let cleanedSql = sql.replace(/FOR UPDATE/gi, '').trim();

  const isSelect = /^\s*(SELECT|WITH|PRAGMA|EXPLAIN)/i.test(cleanedSql);
  const cleanParams = (Array.isArray(params) ? params : [params]).map((p) =>
    typeof p === 'boolean' ? (p ? 1 : 0) : p === undefined ? null : p
  );

  if (isSelect) {
    const stmt = db.prepare(cleanedSql);
    if (cleanParams.length > 0) {
      stmt.bind(cleanParams);
    }
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return [rows, null];
  } else {
    if (cleanParams.length > 0) {
      db.run(cleanedSql, cleanParams);
    } else {
      db.run(cleanedSql);
    }
    const res = db.exec('SELECT last_insert_rowid() AS id');
    const insertId = res && res[0] && res[0].values && res[0].values[0] ? res[0].values[0][0] : 0;
    const affectedRows = db.getRowsModified();
    return [{ insertId, affectedRows }, null];
  }
}

const pool = {
  async query(sql, params) {
    return runQuery(sql, params);
  },
  async execute(sql, params) {
    return runQuery(sql, params);
  },
  async getConnection() {
    return {
      async query(sql, params) {
        return runQuery(sql, params);
      },
      async execute(sql, params) {
        return runQuery(sql, params);
      },
      async beginTransaction() {
        const db = await getDb();
        db.exec('BEGIN TRANSACTION');
      },
      async commit() {
        const db = await getDb();
        db.exec('COMMIT');
      },
      async rollback() {
        const db = await getDb();
        try {
          db.exec('ROLLBACK');
        } catch (e) {
          // ignore rollback errors if no transaction active
        }
      },
      release() {},
    };
  },
};

module.exports = pool;
