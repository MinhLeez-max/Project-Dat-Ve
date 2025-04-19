require('dotenv').config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

// Import các route
const authRoutes = require("./routes/authRoutes");
const busRoutes = require("./routes/busRoutes");
const routeRoutes = require("./routes/routeRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Import cấu hình cơ sở dữ liệu
const connectDB = require("./config/database");

// Khởi tạo ứng dụng
const app = express();

// Kết nối MongoDB
(async () => {
  try {
    await connectDB();
    console.log("Kết nối MongoDB thành công.");
  } catch (err) {
    console.error("Không thể kết nối tới MongoDB:", err.message);
    process.exit(1); // Dừng ứng dụng nếu không kết nối được
  }
})();

// Cấu hình EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

// Middleware xử lý body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Middleware ghi đè phương thức HTTP
app.use(methodOverride("_method"));

// Thư mục tĩnh
app.use(express.static(path.join(__dirname, "public")));

// Middleware phiên làm việc với MongoDB
app.use(
  session({
    secret: process.env.SESSION_SECRET || "doandatvesecretsession",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/project',
      collectionName: 'sessions'
    }),
    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 ngày
    },
  })
);

// Thông báo flash
app.use(flash());

// Middleware biến toàn cục
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.session.user || null;
  res.locals.isAdmin = req.session.isAdmin || false;
  next();
});

// Định tuyến
app.use("/", authRoutes);
app.use("/buses", busRoutes);
app.use("/routes", routeRoutes);
app.use("/bookings", bookingRoutes);
app.use("/admin", adminRoutes);

// Route hiển thị tất cả các tuyến xe
app.get("/all-routes", require('./controllers/busController').getAllRoutesAndBuses);

// Route trang chủ
app.get("/", async (req, res) => {
  try {
    // Lấy các tuyến đường phổ biến từ cơ sở dữ liệu
    const { Route } = require('./models/index');
    const routes = await Route.find().sort({ createdAt: -1 }).limit(3);
    
    res.render("index", {
      title: "Vexere Clone - Đặt Vé Xe",
      popularRoutes: routes
    });
  } catch (err) {
    console.error(err);
    res.render("index", {
      title: "Vexere Clone - Đặt Vé Xe",
      popularRoutes: []
    });
  }
});

// Xử lý lỗi 404
app.use((req, res) => {
  res.status(404).render("error/404", {
    title: "404 - Không Tìm Thấy Trang",
  });
});

// Xử lý lỗi 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error/500", {
    title: "500 - Lỗi Máy Chủ",
  });
});

// Khởi động máy chủ
const PORT = process.env.PORT || 8000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Máy chủ đang chạy trên cổng ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Cổng ${PORT} đã được sử dụng. Vui lòng sử dụng cổng khác.`);
    process.exit(1);
  } else {
    console.error(err);
  }
});