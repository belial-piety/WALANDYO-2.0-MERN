const Notification = require('../models/Notification');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

exports.getNotifications = asyncHandler(async (req, res, next) => {
  const filter = {};

  if (req.user.role !== 'admin') {
    filter.branch = req.user.branch._id;
  } else if (req.query.branchId) {
    filter.branch = req.query.branchId;
  }

  const notifications = await Notification.find(filter)
    .populate('branch')
    .populate('menuItem')
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json({
    success: true,
    data: notifications,
  });
});

exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const filter = { isRead: false };

  if (req.user.role !== 'admin') {
    filter.branch = req.user.branch ? req.user.branch._id : null;
  } else if (req.query.branchId) {
    filter.branch = req.query.branchId;
  }

  const count = await Notification.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: { count },
  });
});

exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notif = await Notification.findById(req.params.id);
  if (!notif) throw new AppError('Notification not found', 404);

  if (req.user.role !== 'admin' && notif.branch.toString() !== req.user.branch._id.toString()) {
    throw new AppError('Unauthorized', 403);
  }

  notif.isRead = true;
  notif.readAt = new Date();
  notif.readBy = req.user._id;
  await notif.save();

  res.status(200).json({
    success: true,
    data: notif,
  });
});

exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  const filter = { isRead: false };

  if (req.user.role !== 'admin') {
    filter.branch = req.user.branch._id;
  } else if (req.body.branchId) {
    filter.branch = req.body.branchId;
  }

  await Notification.updateMany(filter, {
    $set: {
      isRead: true,
      readAt: new Date(),
      readBy: req.user._id,
    },
  });

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});
