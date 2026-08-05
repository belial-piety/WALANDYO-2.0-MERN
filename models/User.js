const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT u.*, b.name AS branch_name
       FROM users u
       LEFT JOIN branches b ON b.id = u.branch_id
       WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  // Staff Directory listing: user, username, role, assigned branch
  async list() {
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.username, u.role, u.branch_id, u.is_active,
              b.name AS branch_name
       FROM users u
       LEFT JOIN branches b ON b.id = u.branch_id
       ORDER BY u.full_name ASC`
    );
    return rows;
  },

  async create({ full_name, username, password, role, branch_id }) {
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (full_name, username, password_hash, role, branch_id)
       VALUES (?, ?, ?, ?, ?)`,
      [full_name, username, password_hash, role, branch_id || null]
    );
    return result.insertId;
  },

  async setActive(id, isActive) {
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
  },

  async verifyPassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
  },
};

module.exports = User;
