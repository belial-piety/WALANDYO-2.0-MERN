const pool = require('../config/db');
const Inventory = require('./Inventory');
const Notification = require('./Notification');

const Order = {
  // items: [{ menu_item_id, name, price, quantity }]
  // Runs as a single DB transaction: insert order + order_items,
  // deduct inventory per line, log stock movements, and fire a
  // low-stock notification if any item crosses its min_level.
  async create({ branchId, cashierId, paymentMethod, items, taxRate = 0 }) {
    if (!items || items.length === 0) throw new Error('Cannot charge an empty order.');

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
      const tax = +(subtotal * taxRate).toFixed(2);
      const total = +(subtotal + tax).toFixed(2);

      const [orderResult] = await conn.query(
        `INSERT INTO orders (branch_id, cashier_id, status, payment_method, subtotal, tax, total)
         VALUES (?, ?, 'completed', ?, ?, ?, ?)`,
        [branchId, cashierId, paymentMethod, subtotal, tax, total]
      );
      const orderId = orderResult.insertId;

      for (const item of items) {
        const lineTotal = +(item.price * item.quantity).toFixed(2);
        await conn.query(
          `INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, line_total)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.menu_item_id, item.name, item.quantity, item.price, lineTotal]
        );

        const { inventoryId, newStock, minLevel, branchId: bId } = await Inventory.deductForSale(conn, {
          menuItemId: item.menu_item_id,
          branchId,
          quantity: item.quantity,
          orderId,
          userId: cashierId,
        });

        if (newStock <= minLevel) {
          await Notification.createLowStockAlert(conn, {
            branchId: bId,
            inventoryId,
            itemName: item.name,
            currentStock: newStock,
            minLevel,
          });
        }
      }

      await conn.query(
        `INSERT INTO order_audit_log (order_id, action, staff_id) VALUES (?, 'created', ?)`,
        [orderId, cashierId]
      );

      await conn.commit();
      return orderId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Order History page, optionally filtered by branch
  async list({ branchId, limit = 100 } = {}) {
    let sql = `
      SELECT o.*, b.name AS branch_name, u.full_name AS cashier_name,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
      FROM orders o
      JOIN branches b ON b.id = o.branch_id
      JOIN users u ON u.id = o.cashier_id
    `;
    const params = [];
    if (branchId) {
      sql += ' WHERE o.branch_id = ?';
      params.push(branchId);
    }
    sql += ' ORDER BY o.created_at DESC LIMIT ?';
    params.push(limit);
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findById(id) {
    const [orders] = await pool.query(
      `SELECT o.*, b.name AS branch_name, u.full_name AS cashier_name
       FROM orders o
       JOIN branches b ON b.id = o.branch_id
       JOIN users u ON u.id = o.cashier_id
       WHERE o.id = ?`,
      [id]
    );
    const order = orders[0];
    if (!order) return null;

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    order.items = items;
    return order;
  },

  // Change-order handling: void a completed order, restore stock, log why.
  async voidOrder(orderId, staffId, reason) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [orders] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]);
      const order = orders[0];
      if (!order) throw new Error('Order not found');
      if (order.status === 'voided') throw new Error('Order is already voided');

      const [items] = await conn.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of items) {
        await Inventory.restoreFromVoid(conn, {
          menuItemId: item.menu_item_id,
          branchId: order.branch_id,
          quantity: item.quantity,
          orderId,
          userId: staffId,
        });
      }

      await conn.query("UPDATE orders SET status = 'voided' WHERE id = ?", [orderId]);
      await conn.query(
        `INSERT INTO order_audit_log (order_id, action, notes, staff_id) VALUES (?, 'voided', ?, ?)`,
        [orderId, reason || null, staffId]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async logReprint(orderId, staffId) {
    await pool.query(
      `INSERT INTO order_audit_log (order_id, action, staff_id) VALUES (?, 'reprinted', ?)`,
      [orderId, staffId]
    );
  },
};

module.exports = Order;
