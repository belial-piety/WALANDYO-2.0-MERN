const pool = require('../config/db');

const MenuItem = {
  // Menu Management page: full list with category names
  async list() {
    const [rows] = await pool.query(
      `SELECT mi.*, c.name AS category_name
       FROM menu_items mi
       LEFT JOIN categories c ON c.id = mi.category_id
       ORDER BY c.name ASC, mi.name ASC`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // Counter page: available items for a branch, with that branch's live stock
  async listForCounter(branchId) {
    const [rows] = await pool.query(
      `SELECT mi.id, mi.name, mi.price, mi.image_url, c.name AS category_name,
              COALESCE(i.current_stock, 0) AS current_stock
       FROM menu_items mi
       LEFT JOIN categories c ON c.id = mi.category_id
       LEFT JOIN inventory i ON i.menu_item_id = mi.id AND i.branch_id = ?
       WHERE mi.is_available = 1
       ORDER BY c.name ASC, mi.name ASC`,
      [branchId]
    );
    return rows;
  },

  async create({ name, category_id, price, image_url, is_available }) {
    const [result] = await pool.query(
      `INSERT INTO menu_items (name, category_id, price, image_url, is_available)
       VALUES (?, ?, ?, ?, ?)`,
      [name, category_id || null, price, image_url || null, is_available ? 1 : 0]
    );
    return result.insertId;
  },

  async update(id, { name, category_id, price, image_url, is_available }) {
    await pool.query(
      `UPDATE menu_items SET name = ?, category_id = ?, price = ?, image_url = ?, is_available = ?
       WHERE id = ?`,
      [name, category_id || null, price, image_url || null, is_available ? 1 : 0, id]
    );
  },

  async remove(id) {
    await pool.query('DELETE FROM menu_items WHERE id = ?', [id]);
  },
};

module.exports = MenuItem;
