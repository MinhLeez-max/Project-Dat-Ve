const { User } = require('../models/index');
const bcrypt = require('bcryptjs');

module.exports = {
  // Render register page
  getRegister: (req, res) => {
    res.render('auth/register', {
      title: 'Đăng Ký'
    });
  },

  // Handle user registration
  register: async (req, res) => {
    try {
      const { name, email, phone, password, password2 } = req.body;
      const errors = [];

      // Check required fields
      if (!name || !email || !phone || !password || !password2) {
        errors.push({ msg: 'Vui lòng điền đầy đủ thông tin' });
      }

      // Check passwords match
      if (password !== password2) {
        errors.push({ msg: 'Mật khẩu không khớp' });
      }

      // Check password length
      if (password.length < 6) {
        errors.push({ msg: 'Mật khẩu phải có ít nhất 6 ký tự' });
      }

      // Valid phone number
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

      // Check if user exists
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

      // Create new user - password hashed by mongoose middleware
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

  // Render login page
  getLogin: (req, res) => {
    res.render('auth/login', {
      title: 'Đăng Nhập'
    });
  },

  // Handle user login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate inputs
      if (!email || !password) {
        req.flash('error_msg', 'Vui lòng nhập email và mật khẩu');
        return res.redirect('/login');
      }

      // Find user
      const user = await User.findOne({ email });
      
      if (!user) {
        req.flash('error_msg', 'Email hoặc mật khẩu không chính xác');
        return res.redirect('/login');
      }

      // Match password
      const isMatch = await user.matchPassword(password);
      
      console.log('Email:', email);
      console.log('User:', user);
      console.log('Password match:', isMatch);

      if (!isMatch) {
        req.flash('error_msg', 'Email hoặc mật khẩu không chính xác');
        return res.redirect('/login');
      }

      // Set session
      req.session.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      };
      
      // Check if admin
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

  // Handle user logout
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
