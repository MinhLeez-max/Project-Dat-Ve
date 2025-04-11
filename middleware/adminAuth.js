/**
 * Middleware for checking if user is an admin
 */
module.exports = {
    ensureAdmin: (req, res, next) => {
      if (req.session.user && req.session.isAdmin) {
        return next();
      }
      req.flash('error_msg', 'You must be an admin to access this resource');
      res.redirect('/');
    }
  };
  