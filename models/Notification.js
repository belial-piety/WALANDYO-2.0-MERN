const pool = require('../config/db');

const Notification = {
  // Create a low-stock alert, but avoid spamming duplicates: only create
  // one unread alert per inventory item at a time.
  async createLowStockAlert(conn, { branchId, inventoryId, itemName, currentStock, minLevel }) {
    const [existing] = await conn.query(
      'SELECT id FROM notifications WHERE inventory_id = ? AND is_read = 0',
      [inventoryId]
    );
    if (existing.length > 0) return;

    const message =
      currentStock <= 0
        ? `${itemName} is OUT OF STOCK.`
        : `${itemName} is running low (${currentStock} left, min ${minLevel}).`;

    await conn.query(
      'INSERT INTO notifications (branch_id, inventory_id, message) VALUES (?, ?, ?)',
      [branchId, inventoryId, message]
    );
  },

  async listUnread(branchId) {
    let sql = `
      SELECT n.*, b.name AS branch_name
      FROM notifications n
      JOIN branches b ON b.id = n.branch_id
      WHERE n.is_read = 0
    `;
    const params = [];
    if (branchId) {
      sql += ' AND n.branch_id = ?';
      params.push(branchId);
    }
    sql += ' ORDER BY n.created_at DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async unreadCount(branchId) {
    let sql = 'SELECT COUNT(*) AS cnt FROM notifications WHERE is_read = 0';
    const params = [];
    if (branchId) {
      sql += ' AND branch_id = ?';
      params.push(branchId);
    }
    const [rows] = await pool.query(sql, params);
    return rows[0].cnt;
  },

  async markRead(id) {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  },

  async markAllRead(branchId) {
    let sql = 'UPDATE notifications SET is_read = 1 WHERE is_read = 0';
    const params = [];
    if (branchId) {
      sql += ' AND branch_id = ?';
      params.push(branchId);
    }
    await pool.query(sql, params);
  },
};

module.exports = Notification;
