const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const MongoStore = require('connect-mongo');

// Import routes
const authRoutes = require('./routes/authRoutes');
const busRoutes = require('./routes/busRoutes');
const routeRoutes = require('./routes/routeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import DB Config
const connectDB = require('./config/db');

// Initialize app
const app = express();

// Connect to MongoDB
connectDB();

// EJS Setup
app.set('view engine', 'ejs');

// Body parser middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Method override middleware
app.use(methodOverride('_method'));

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'vexeresecretsession',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
      mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/vexere-clone',
      ttl: 14 * 24 * 60 * 60 // = 14 days
    }),
    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days in milliseconds
    }
  })
);

// Flash messages
app.use(flash());

// Global variables middleware
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.user || null;
  res.locals.isAdmin = req.session.isAdmin || false;
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/buses', busRoutes);
app.use('/routes', routeRoutes);
app.use('/bookings', bookingRoutes);
app.use('/admin', adminRoutes);

// Home route
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Vexere Clone - Bus Ticket Booking'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error/404', {
    title: '404 - Page Not Found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error/500', {
    title: '500 - Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
