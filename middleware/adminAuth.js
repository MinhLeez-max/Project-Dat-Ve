/**
 * Phần mềm trung gian để kiểm tra xem người dùng có phải là quản trị viên hay không
 */
module.exports = {
    ensureAdmin: (req, res, next) => {
      if (req.session.user && req.session.isAdmin) {
        return next();
      }
      req.flash('error_msg', 'Bạn phải là quản trị viên để truy cập tài nguyên này');
      res.redirect('/');
    }
  };
  