/**
 * Middleware for checking if user is authenticated
 */
module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.session.user) {
      return next();
    }
    req.flash('error_msg', 'Please log in to access this resource');
    res.redirect('/login');
  },
  
  ensureGuest: (req, res, next) => {
    if (!req.session.user) {
      return next();
    }
    res.redirect('/');
  }
};
