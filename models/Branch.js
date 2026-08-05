const pool = require('../config/db');

const Branch = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM branches ORDER BY type ASC, name ASC');
    return rows;
  },

  async listActive() {
    const [rows] = await pool.query(
      'SELECT * FROM branches WHERE is_active = 1 ORDER BY type ASC, name ASC'
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM branches WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ name, type, address }) {
    const [result] = await pool.query(
      'INSERT INTO branches (name, type, address) VALUES (?, ?, ?)',
      [name, type, address || null]
    );
    return result.insertId;
  },

  async update(id, { name, type, address }) {
    await pool.query('UPDATE branches SET name = ?, type = ?, address = ? WHERE id = ?', [
      name,
      type,
      address || null,
      id,
    ]);
  },

  async setActive(id, isActive) {
    await pool.query('UPDATE branches SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
  },
};

module.exports = Branch;
