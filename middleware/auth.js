// Middleware to require authenticated user session
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error', 'Please log in to access this page.');
  return res.redirect('/login');
};

// Middleware to redirect already logged in users away from login/register
const redirectIfAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    if (role === 'admin') return res.redirect('/admin/dashboard');
    if (role === 'trainer') return res.redirect('/trainer/dashboard');
    if (role === 'member') return res.redirect('/member/dashboard');
  }
  next();
};

module.exports = {
  requireAuth,
  redirectIfAuth
};
