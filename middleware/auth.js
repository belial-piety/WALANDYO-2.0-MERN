const Notification = require('../models/Notification');

// Blocks access unless a user is logged in.
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// Blocks access unless the logged-in user's role is in the allowed list.
// Usage: requireRole('admin', 'manager')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).render('errors/403', {
        title: 'Access denied',
        layout: 'main',
      });
    }
    next();
  };
}

// Makes the current user + unread notification count available to every
// view (for the sidebar footer and the topbar bell), without every
// controller having to fetch it manually.
async function attachViewLocals(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  if (req.session.user) {
    // Admins see alerts system-wide; everyone else sees their own branch.
    const branchScope = req.session.user.role === 'admin' ? null : req.session.user.branch_id;
    try {
      res.locals.unreadNotifCount = await Notification.unreadCount(branchScope);
    } catch (err) {
      res.locals.unreadNotifCount = 0;
    }
  }
  next();
}

module.exports = { requireAuth, requireRole, attachViewLocals };
