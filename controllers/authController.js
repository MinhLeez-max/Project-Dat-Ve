const User = require('../models/User');
const bcrypt = require('bcryptjs');

module.exports = {
  // Render register page
  getRegister: (req, res) => {
    res.render('auth/register', {
      title: 'Register'
    });
  },

  // Handle user registration
  register: async (req, res) => {
    try {
      const { name, email, phone, password, password2 } = req.body;
      const errors = [];

      // Check required fields
      if (!name || !email || !phone || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
      }

      // Check passwords match
      if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
      }

      // Check password length
      if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
      }

      // Valid phone number
      if (!/^\d{10,11}$/.test(phone)) {
        errors.push({ msg: 'Please provide a valid phone number' });
      }

      if (errors.length > 0) {
        return res.render('auth/register', {
          title: 'Register',
          errors,
          name,
          email,
          phone
        });
      }

      // Check if user exists
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        errors.push({ msg: 'Email is already registered' });
        return res.render('auth/register', {
          title: 'Register',
          errors,
          name,
          email,
          phone
        });
      }

      // Create new user
      const newUser = new User({
        name,
        email,
        phone,
        password
      });

      // Save user to DB
      await newUser.save();

      req.flash('success_msg', 'You are now registered and can log in');
      res.redirect('/login');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Server error during registration');
      res.redirect('/register');
    }
  },

  // Render login page
  getLogin: (req, res) => {
    res.render('auth/login', {
      title: 'Login'
    });
  },

  // Handle user login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate inputs
      if (!email || !password) {
        req.flash('error_msg', 'Please provide email and password');
        return res.redirect('/login');
      }

      // Find user
      const user = await User.findOne({ email });
      
      if (!user) {
        req.flash('error_msg', 'Invalid email or password');
        return res.redirect('/login');
      }

      // Match password
      const isMatch = await user.matchPassword(password);
      
      if (!isMatch) {
        req.flash('error_msg', 'Invalid email or password');
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
      if (user.role === 'admin') {
        req.session.isAdmin = true;
        return res.redirect('/admin/dashboard');
      }
      
      req.session.isAdmin = false;
      res.redirect('/');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Server error during login');
      res.redirect('/login');
    }
  },

  // Handle user logout
  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.redirect('/');
      }
      res.redirect('/login');
    });
  }
};
