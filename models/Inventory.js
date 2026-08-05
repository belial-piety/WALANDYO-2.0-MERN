const pool = require('../config/db');

const Inventory = {
  // Stock page: all items across all branches (or filtered to one branch)
  async list(branchId) {
    let sql = `
      SELECT i.id, i.current_stock, i.min_level, i.unit, i.updated_at,
             mi.id AS menu_item_id, mi.name AS item_name,
             b.id AS branch_id, b.name AS branch_name
      FROM inventory i
      JOIN menu_items mi ON mi.id = i.menu_item_id
      JOIN branches b ON b.id = i.branch_id
    `;
    const params = [];
    if (branchId) {
      sql += ' WHERE i.branch_id = ?';
      params.push(branchId);
    }
    sql += ' ORDER BY b.name ASC, mi.name ASC';
    const [rows] = await pool.query(sql, params);
    return rows.map((r) => ({
      ...r,
      status: r.current_stock <= 0 ? 'out_of_stock' : r.current_stock <= r.min_level ? 'low' : 'ok',
    }));
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM inventory WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByItemAndBranch(menuItemId, branchId) {
    const [rows] = await pool.query(
      'SELECT * FROM inventory WHERE menu_item_id = ? AND branch_id = ?',
      [menuItemId, branchId]
    );
    return rows[0] || null;
  },

  // Used by Order.create() inside a transaction: deduct stock for a sale.
  // Throws if there isn't enough stock.
  async deductForSale(conn, { menuItemId, branchId, quantity, orderId, userId }) {
    const [rows] = await conn.query(
      'SELECT * FROM inventory WHERE menu_item_id = ? AND branch_id = ? FOR UPDATE',
      [menuItemId, branchId]
    );
    const inv = rows[0];
    if (!inv) throw new Error(`No inventory record for item ${menuItemId} at branch ${branchId}`);
    if (inv.current_stock < quantity) {
      throw new Error(`Insufficient stock for this item (have ${inv.current_stock}, need ${quantity})`);
    }

    const newStock = inv.current_stock - quantity;
    await conn.query('UPDATE inventory SET current_stock = ? WHERE id = ?', [newStock, inv.id]);
    await conn.query(
      `INSERT INTO stock_movements (inventory_id, change_qty, type, reference_order_id, created_by)
       VALUES (?, ?, 'sale', ?, ?)`,
      [inv.id, -quantity, orderId, userId]
    );

    return { inventoryId: inv.id, newStock, minLevel: inv.min_level, branchId: inv.branch_id };
  },

  // Used when a completed order is voided: give the stock back.
  async restoreFromVoid(conn, { menuItemId, branchId, quantity, orderId, userId }) {
    const [rows] = await conn.query(
      'SELECT * FROM inventory WHERE menu_item_id = ? AND branch_id = ? FOR UPDATE',
      [menuItemId, branchId]
    );
    const inv = rows[0];
    if (!inv) return;
    const newStock = inv.current_stock + quantity;
    await conn.query('UPDATE inventory SET current_stock = ? WHERE id = ?', [newStock, inv.id]);
    await conn.query(
      `INSERT INTO stock_movements (inventory_id, change_qty, type, reference_order_id, created_by)
       VALUES (?, ?, 'void_restore', ?, ?)`,
      [inv.id, quantity, orderId, userId]
    );
  },

  // Inventory Clerk: encode a delivery / manual restock
  async restock(inventoryId, quantity, userId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query('SELECT * FROM inventory WHERE id = ? FOR UPDATE', [inventoryId]);
      const inv = rows[0];
      if (!inv) throw new Error('Inventory record not found');
      const newStock = inv.current_stock + quantity;
      await conn.query('UPDATE inventory SET current_stock = ? WHERE id = ?', [newStock, inventoryId]);
      await conn.query(
        `INSERT INTO stock_movements (inventory_id, change_qty, type, created_by)
         VALUES (?, ?, 'restock', ?)`,
        [inventoryId, quantity, userId]
      );
      await conn.commit();
      return newStock;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async updateMinLevel(inventoryId, minLevel) {
    await pool.query('UPDATE inventory SET min_level = ? WHERE id = ?', [minLevel, inventoryId]);
  },

  async lowStockCount(branchId) {
    let sql = 'SELECT COUNT(*) AS cnt FROM inventory WHERE current_stock <= min_level';
    const params = [];
    if (branchId) {
      sql += ' AND branch_id = ?';
      params.push(branchId);
    }
    const [rows] = await pool.query(sql, params);
    return rows[0].cnt;
  },
};

module.exports = Inventory;
