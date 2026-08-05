const Report = require('../models/Report');
const Branch = require('../models/Branch');

exports.showReports = async (req, res) => {
  const user = req.session.user;
  const branches = await Branch.list();

  // Managers are scoped to their own branch; admins can view all or filter.
  const overviewBranchId = user.role === 'manager' ? user.branch_id : Number(req.query.branch_id) || null;
  const overview = await Report.dailyOverview(overviewBranchId);

  const perfBranchId = Number(req.query.perf_branch_id) || (user.role === 'manager' ? user.branch_id : null);
  const performance = perfBranchId ? await Report.branchPerformance(perfBranchId) : null;

  res.render('reports/index', {
    title: 'Business Reports',
    active: 'reports',
    branches,
    overview,
    overviewBranchId,
    lockBranch: user.role === 'manager',
    performance,
    perfBranchId,
    today: new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }),
  });
};
