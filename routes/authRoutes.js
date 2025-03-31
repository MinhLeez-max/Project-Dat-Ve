const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { ensureGuest, ensureAuthenticated } = require('../middleware/auth');

// Register
router.get('/register', ensureGuest, authController.getRegister);
router.post('/register', ensureGuest, authController.register);

// Login
router.get('/login', ensureGuest, authController.getLogin);
router.post('/login', ensureGuest, authController.login);

// Logout
router.get('/logout', ensureAuthenticated, authController.logout);

module.exports = router;
