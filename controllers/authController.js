const User = require('../models/User');

exports.showLogin = (req, res) => {
  if (req.session.user) return res.redirect('/counter');
  res.render('auth/login', {
    layout: false,
    title: 'Log in',
    error: req.session.flashError,
  });
  req.session.flashError = null;
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findByUsername(username);

  const invalid = !user || !user.is_active || !(await User.verifyPassword(password, user.password_hash));
  if (invalid) {
    req.session.flashError = 'Incorrect username or password.';
    return res.redirect('/login');
  }

  req.session.user = {
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    role: user.role,
    branch_id: user.branch_id,
  };

  res.redirect('/counter');
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
};
