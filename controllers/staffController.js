const User = require('../models/User');
const Branch = require('../models/Branch');

exports.showStaff = async (req, res) => {
  const [staff, branches] = await Promise.all([User.list(), Branch.listActive()]);
  res.render('staff/index', {
    title: 'Staff Directory',
    active: 'staff',
    staff,
    branches,
    error: req.session.flashError,
  });
  req.session.flashError = null;
};

exports.createStaff = async (req, res) => {
  const { full_name, username, password, role, branch_id } = req.body;

  const existing = await User.findByUsername(username);
  if (existing) {
    req.session.flashError = `Username "${username}" is already taken.`;
    return res.redirect('/staff');
  }

  await User.create({
    full_name,
    username,
    password,
    role,
    branch_id: branch_id ? Number(branch_id) : null,
  });
  res.redirect('/staff');
};

exports.toggleActive = async (req, res) => {
  const user = await User.findById(req.params.id);
  await User.setActive(req.params.id, !user.is_active);
  res.redirect('/staff');
};
