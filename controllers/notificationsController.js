const Notification = require('../models/Notification');

exports.showNotifications = async (req, res) => {
  const user = req.session.user;
  const branchScope = user.role === 'admin' ? Number(req.query.branch_id) || null : user.branch_id;

  const notifications = await Notification.listUnread(branchScope);
  res.render('notifications/index', {
    title: 'Notifications',
    active: 'notifications',
    notifications,
  });
};

exports.markRead = async (req, res) => {
  await Notification.markRead(req.params.id);
  res.redirect('/notifications');
};

exports.markAllRead = async (req, res) => {
  const user = req.session.user;
  const branchScope = user.role === 'admin' ? null : user.branch_id;
  await Notification.markAllRead(branchScope);
  res.redirect('/notifications');
};
