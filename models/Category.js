const pool = require('../config/db');

const Category = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return rows;
  },

  async findOrCreate(name) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE name = ?', [name]);
    if (rows[0]) return rows[0].id;
    const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
    return result.insertId;
  },
};

module.exports = Category;
