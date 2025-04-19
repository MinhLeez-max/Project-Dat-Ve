/**
 * Phần mềm trung gian để kiểm tra xem người dùng có phải là quản trị viên hay không
 */
module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.session.user) {
      return next();
    }
    req.flash('error_msg', 'Please log in to access tVui lòng đăng nhập để truy cập tài nguyên nàyhis resource');
    res.redirect('/login');
  },
  
  ensureGuest: (req, res, next) => {
    if (!req.session.user) {
      return next();
    }
    res.redirect('/');
  }
};
