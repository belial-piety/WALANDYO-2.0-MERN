const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.AUTH_SECRET || 'walandyo_dev_secret_key_change_in_prod',
    { expiresIn: `${process.env.COOKIE_MAX_AGE_HOURS || 8}h` }
  );

  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.COOKIE_MAX_AGE_HOURS || 8) * 3600 * 1000
    ),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };

  user.passwordHash = undefined;

  res.cookie('walandyo_auth', token, cookieOptions).status(statusCode).json({
    success: true,
    data: {
      token,
      user,
    },
  });
};

exports.login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError('Please provide both username and password.', 400));
  }

  const user = await User.findOne({ username: username.toLowerCase().trim() })
    .select('+passwordHash')
    .populate('branch');

  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Incorrect username or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Contact admin.', 401));
  }

  sendTokenResponse(user, 200, res);
});

exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('walandyo_auth', 'none', {
    expires: new Date(Date.now() + 5000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
    message: 'Logged out successfully.',
  });
});

exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('branch');
  res.status(200).json({
    success: true,
    data: user,
  });
});
