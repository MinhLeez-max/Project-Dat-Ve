const { Route, Bus } = require('../models');

module.exports = {
  // Lấy tất cả tuyến đường
  getAllRoutes: async (req, res) => {
    try {
      const routes = await Route.find({});
      res.render('admin/routes', {
        title: 'Quản lý tuyến đường',
        routes
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi tải dữ liệu tuyến đường');
      res.redirect('/admin/dashboard');
    }
  },

  // Hiển thị form thêm tuyến đường
  getAddRoute: (req, res) => {
    res.render('admin/routes', {
      title: 'Thêm tuyến đường mới',
      addRoute: true
    });
  },

  // Thêm tuyến đường mới
  addRoute: async (req, res) => {
    try {
      const { departureCity, arrivalCity, distance, estimatedDuration } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!departureCity || !arrivalCity || !distance || !estimatedDuration) {
        req.flash('error_msg', 'Vui lòng điền đầy đủ thông tin');
        return res.redirect('/admin/routes/add');
      }

      // Kiểm tra tuyến đường đã tồn tại
      const existingRoute = await Route.findOne({
        departureCity,
        arrivalCity
      });

      if (existingRoute) {
        req.flash('error_msg', 'Tuyến đường này đã tồn tại');
        return res.redirect('/admin/routes/add');
      }

      // Tạo tuyến đường mới
      const newRoute = new Route({
        departureCity,
        arrivalCity,
        distance,
        estimatedDuration
      });
      await newRoute.save();

      req.flash('success_msg', 'Thêm tuyến đường mới thành công');
      res.redirect('/admin/routes');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi thêm tuyến đường mới');
      res.redirect('/admin/routes');
    }
  },

  // Lấy thông tin tuyến đường theo ID
  getRoute: async (req, res) => {
    try {
      const route = await Route.findById(req.params.id);

      if (!route) {
        req.flash('error_msg', 'Không tìm thấy tuyến đường');
        return res.redirect('/admin/routes');
      }

      res.render('admin/routes', {
        title: 'Chỉnh sửa tuyến đường',
        route,
        editRoute: true
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi tải thông tin tuyến đường');
      res.redirect('/admin/routes');
    }
  },

  // Cập nhật thông tin tuyến đường
  updateRoute: async (req, res) => {
    try {
      const { departureCity, arrivalCity, distance, estimatedDuration } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!departureCity || !arrivalCity || !distance || !estimatedDuration) {
        req.flash('error_msg', 'Vui lòng điền đầy đủ thông tin');
        return res.redirect(`/admin/routes/${req.params.id}`);
      }

      // Tìm tuyến đường
      const route = await Route.findById(req.params.id);

      if (!route) {
        req.flash('error_msg', 'Không tìm thấy tuyến đường');
        return res.redirect('/admin/routes');
      }

      // Cập nhật thông tin tuyến đường
      route.departureCity = departureCity;
      route.arrivalCity = arrivalCity;
      route.distance = distance;
      route.estimatedDuration = estimatedDuration;
      await route.save();

      req.flash('success_msg', 'Cập nhật tuyến đường thành công');
      res.redirect('/admin/routes');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi cập nhật tuyến đường');
      res.redirect('/admin/routes');
    }
  },

  // Xóa tuyến đường
  deleteRoute: async (req, res) => {
    try {
      // Kiểm tra nếu tuyến đường có xe đang chạy
      const buses = await Bus.find({ routeId: req.params.id });

      if (buses.length > 0) {
        req.flash('error_msg', 'Không thể xóa tuyến đường có xe đang chạy. Vui lòng xóa xe trước.');
        return res.redirect('/admin/routes');
      }

      // Xóa tuyến đường
      await Route.findByIdAndDelete(req.params.id);

      req.flash('success_msg', 'Xóa tuyến đường thành công');
      res.redirect('/admin/routes');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi xóa tuyến đường');
      res.redirect('/admin/routes');
    }
  },

  // Lấy danh sách các thành phố duy nhất để gợi ý tìm kiếm
  getUniqueCities: async (req, res) => {
    try {
      const routes = await Route.find({}, 'departureCity arrivalCity');

      const cities = new Set();
      routes.forEach(route => {
        cities.add(route.departureCity);
        cities.add(route.arrivalCity);
      });

      res.json([...cities]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }
};