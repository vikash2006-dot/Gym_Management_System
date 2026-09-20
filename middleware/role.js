// Role-based access control middleware
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.flash('error', 'Please log in to continue.');
      return res.redirect('/login');
    }

    const userRole = req.session.user.role;
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Unauthorized role
    req.flash('error', 'Access denied. You do not have permission to view this resource.');
    
    // Redirect to the appropriate dashboard
    if (userRole === 'admin') return res.redirect('/admin/dashboard');
    if (userRole === 'trainer') return res.redirect('/trainer/dashboard');
    if (userRole === 'member') return res.redirect('/member/dashboard');

    return res.status(403).render('auth/login', {
      title: 'Access Denied',
      error: 'Access denied: insufficient permissions.'
    });
  };
};

module.exports = {
  requireRole
};
