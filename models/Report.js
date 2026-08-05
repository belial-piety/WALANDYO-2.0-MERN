const pool = require('../config/db');

const Report = {
  // Business Reports > Daily Overview cards + sales-by-branch table
  async dailyOverview(branchId) {
    const branchFilter = branchId ? 'AND o.branch_id = ?' : '';
    const params = branchId ? [branchId] : [];

    const [[todaySales]] = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total
       FROM orders o
       WHERE status = 'completed' AND DATE(created_at) = CURDATE() ${branchFilter}`,
      params
    );

    const [[todayOrders]] = await pool.query(
      `SELECT COUNT(*) AS cnt
       FROM orders o
       WHERE status = 'completed' AND DATE(created_at) = CURDATE() ${branchFilter}`,
      params
    );

    const lowStockFilter = branchId ? 'AND branch_id = ?' : '';
    const [[lowStock]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM inventory WHERE current_stock <= min_level ${lowStockFilter}`,
      params
    );

    const [[activeBranches]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM branches WHERE is_active = 1`
    );

    const [salesByBranch] = await pool.query(
      `SELECT b.id, b.name, COALESCE(SUM(o.total), 0) AS revenue, COUNT(o.id) AS order_count
       FROM branches b
       LEFT JOIN orders o ON o.branch_id = b.id AND o.status = 'completed' AND DATE(o.created_at) = CURDATE()
       ${branchId ? 'WHERE b.id = ?' : ''}
       GROUP BY b.id, b.name
       ORDER BY revenue DESC`,
      params
    );

    const totalRevenue = salesByBranch.reduce((sum, r) => sum + Number(r.revenue), 0);

    return {
      todaySales: Number(todaySales.total),
      todayOrders: todayOrders.cnt,
      lowStockAlerts: lowStock.cnt,
      activeBranches: activeBranches.cnt,
      salesByBranch,
      totalRevenue,
    };
  },

  // Business Reports > Branch Performance: top items for one branch
  async branchPerformance(branchId) {
    const [topItems] = await pool.query(
      `SELECT oi.item_name, SUM(oi.quantity) AS qty_sold, SUM(oi.line_total) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.branch_id = ? AND o.status = 'completed'
       GROUP BY oi.item_name
       ORDER BY revenue DESC
       LIMIT 10`,
      [branchId]
    );

    const [[totals]] = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS order_count
       FROM orders WHERE branch_id = ? AND status = 'completed'`,
      [branchId]
    );

    return { topItems, revenue: Number(totals.revenue), orderCount: totals.order_count };
  },
};

module.exports = Report;
