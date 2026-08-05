const Branch = require('../models/Branch');

exports.showBranches = async (req, res) => {
  const branches = await Branch.list();
  res.render('branches/index', {
    title: 'Branches & Locations',
    active: 'branches',
    branches,
  });
};

exports.createBranch = async (req, res) => {
  const { name, type, address } = req.body;
  await Branch.create({ name, type, address });
  res.redirect('/branches');
};

exports.updateBranch = async (req, res) => {
  const { name, type, address } = req.body;
  await Branch.update(req.params.id, { name, type, address });
  res.redirect('/branches');
};

exports.toggleActive = async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  await Branch.setActive(req.params.id, !branch.is_active);
  res.redirect('/branches');
};
