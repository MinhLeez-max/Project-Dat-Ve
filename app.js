const express = require("express");
const session = require("express-session");
const path = require("path");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const expressLayouts = require('express-ejs-layouts');

// Import routes
const authRoutes = require("./routes/authRoutes");
const busRoutes = require("./routes/busRoutes");
const routeRoutes = require("./routes/routeRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Import DB Config
const { connectDB } = require("./config/database");
const { syncModels } = require("./models/index");

// Initialize app
const app = express();

// Connect to PostgreSQL
connectDB().then(() => {
  // Sync models with database
  syncModels();
});

// EJS Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

// Body parser middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Method override middleware
app.use(methodOverride("_method"));

// Static folder
app.use(express.static(path.join(__dirname, "public")));

// Initialize session storage
const pgSession = require('connect-pg-simple')(session);
const { pool, initSessionTable } = require('./session-init');

// Create session table
initSessionTable();

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "vexeresecretsession",
    resave: false,
    saveUninitialized: false,
    store: new pgSession({
      pool,
      tableName: 'session',    // Use a separate table for sessions
      createTableIfMissing: true
    }),
    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
    },
  }),
);

// Flash messages
app.use(flash());

// Global variables middleware
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.session.user || null;
  res.locals.isAdmin = req.session.isAdmin || false;
  next();
});

// Routes
app.use("/", authRoutes);
app.use("/buses", busRoutes);
app.use("/routes", routeRoutes);
app.use("/bookings", bookingRoutes);
app.use("/admin", adminRoutes);

// Route for all bus routes
app.get("/all-routes", require('./controllers/busController').getAllRoutesAndBuses);

// Home route
app.get("/", async (req, res) => {
  try {
    // Get popular routes from database
    const { Route } = require('./models/index');
    const routes = await Route.findAll({
      limit: 3,
      order: [['createdAt', 'DESC']]
    });
    
    res.render("index", {
      title: "Vexere Clone - Bus Ticket Booking",
      popularRoutes: routes
    });
  } catch (err) {
    console.error(err);
    res.render("index", {
      title: "Vexere Clone - Bus Ticket Booking",
      popularRoutes: []
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render("error/404", {
    title: "404 - Page Not Found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error/500", {
    title: "500 - Server Error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
