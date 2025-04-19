const { User } = require('../models/index');
const bcrypt = require('bcryptjs');

module.exports = {
  // Hiển thị trang đăng ký
  getRegister: (req, res) => {
    res.render('auth/register', {
      title: 'Đăng Ký'
    });
  },

  // Xử lý đăng ký người dùng
  register: async (req, res) => {
    try {
      const { name, email, phone, password, password2 } = req.body;
      const errors = [];

      // Kiểm tra các trường bắt buộc
      if (!name || !email || !phone || !password || !password2) {
        errors.push({ msg: 'Vui lòng điền đầy đủ thông tin' });
      }

      // Kiểm tra mật khẩu khớp
      if (password !== password2) {
        errors.push({ msg: 'Mật khẩu không khớp' });
      }

      // Kiểm tra độ dài mật khẩu
      if (password.length < 6) {
        errors.push({ msg: 'Mật khẩu phải có ít nhất 6 ký tự' });
      }

      // Kiểm tra số điện thoại hợp lệ
      if (!/^\d{10,11}$/.test(phone)) {
        errors.push({ msg: 'Vui lòng nhập số điện thoại hợp lệ' });
      }

      if (errors.length > 0) {
        return res.render('auth/register', {
          title: 'Đăng Ký',
          errors,
          name,
          email,
          phone
        });
      }

      // Kiểm tra email đã tồn tại
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        errors.push({ msg: 'Email này đã được đăng ký' });
        return res.render('auth/register', {
          title: 'Đăng Ký',
          errors,
          name,
          email,
          phone
        });
      }

      // Tạo người dùng mới - mật khẩu được mã hóa bởi middleware của mongoose
      const newUser = new User({
        name,
        email,
        phone,
        password
      });
      
      await newUser.save();

      req.flash('success_msg', 'Bạn đã đăng ký thành công và có thể đăng nhập ngay bây giờ');
      res.redirect('/login');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi máy chủ trong quá trình đăng ký');
      res.redirect('/register');
    }
  },

  // Hiển thị trang đăng nhập
  getLogin: (req, res) => {
    res.render('auth/login', {
      title: 'Đăng Nhập'
    });
  },

  // Xử lý đăng nhập người dùng
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Kiểm tra đầu vào
      if (!email || !password) {
        req.flash('error_msg', 'Vui lòng nhập email và mật khẩu');
        return res.redirect('/login');
      }

      // Tìm người dùng
      const user = await User.findOne({ email });
      
      if (!user) {
        req.flash('error_msg', 'Email hoặc mật khẩu không chính xác');
        return res.redirect('/login');
      }

      // Kiểm tra mật khẩu
      const isMatch = await user.matchPassword(password);
      
      console.log('Email:', email);
      console.log('User:', user);
      console.log('Password match:', isMatch);

      if (!isMatch) {
        req.flash('error_msg', 'Email hoặc mật khẩu không chính xác');
        return res.redirect('/login');
      }

      // Thiết lập phiên đăng nhập
      req.session.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      };
      
      // Kiểm tra nếu là admin
      if (user.isAdmin) {
        req.session.isAdmin = true;
        return res.redirect('/admin/dashboard');
      }
      
      req.session.isAdmin = false;
      res.redirect('/');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi máy chủ trong quá trình đăng nhập');
      res.redirect('/login');
    }
  },

  // Xử lý đăng xuất người dùng
  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Lỗi hủy phiên:', err);
        return res.redirect('/');
      }
      res.redirect('/login');
    });
  }
};