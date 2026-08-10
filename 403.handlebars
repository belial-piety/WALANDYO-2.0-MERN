const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.walandyo_auth) {
    token = req.cookies.walandyo_auth;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.AUTH_SECRET || 'walandyo_dev_secret_key_change_in_prod'
    );

    const currentUser = await User.findById(decoded.id).populate('branch');
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (!currentUser.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact an admin.', 401));
    }

    req.user = currentUser;
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

const restrictBranch = (req, res, next) => {
  const requestedBranchId =
    req.query.branchId ||
    req.body.branchId ||
    req.params.branchId ||
    req.headers['x-branch-id'];

  if (req.user.role === 'admin') {
    req.branchId = requestedBranchId || (req.user.branch ? req.user.branch._id : null);
    return next();
  }

  if (!req.user.branch) {
    return next(new AppError('User is not assigned to any branch.', 403));
  }

  const userBranchId = req.user.branch._id.toString();

  if (requestedBranchId && requestedBranchId.toString() !== userBranchId) {
    return next(
      new AppError('Unauthorized: You can only access your assigned branch data.', 403)
    );
  }

  req.branchId = userBranchId;
  next();
};

module.exports = { protect, restrictTo, restrictBranch };
