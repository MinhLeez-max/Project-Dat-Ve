const { Route, Bus } = require('../models');

module.exports = {
  // Get all routes
  getAllRoutes: async (req, res) => {
    try {
      const routes = await Route.findAll({
        order: [['departureCity', 'ASC']]
      });
      
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

  // Render add route form
  getAddRoute: (req, res) => {
    res.render('admin/routes', {
      title: 'Thêm tuyến đường mới',
      addRoute: true
    });
  },

  // Add new route
  addRoute: async (req, res) => {
    try {
      const { departureCity, arrivalCity, distance, estimatedDuration } = req.body;
      
      // Validate input
      if (!departureCity || !arrivalCity || !distance || !estimatedDuration) {
        req.flash('error_msg', 'Vui lòng điền đầy đủ thông tin');
        return res.redirect('/admin/routes/add');
      }

      // Check if route already exists
      const existingRoute = await Route.findOne({ 
        where: {
          departureCity: departureCity,
          arrivalCity: arrivalCity
        }
      });

      if (existingRoute) {
        req.flash('error_msg', 'Tuyến đường này đã tồn tại');
        return res.redirect('/admin/routes/add');
      }

      // Create and save new route
      await Route.create({
        departureCity,
        arrivalCity,
        distance,
        estimatedDuration
      });
      
      req.flash('success_msg', 'Thêm tuyến đường mới thành công');
      res.redirect('/admin/routes');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi thêm tuyến đường mới');
      res.redirect('/admin/routes');
    }
  },

  // Get route by ID
  getRoute: async (req, res) => {
    try {
      const route = await Route.findByPk(req.params.id);
      
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

  // Update route
  updateRoute: async (req, res) => {
    try {
      const { departureCity, arrivalCity, distance, estimatedDuration } = req.body;
      
      // Validate input
      if (!departureCity || !arrivalCity || !distance || !estimatedDuration) {
        req.flash('error_msg', 'Vui lòng điền đầy đủ thông tin');
        return res.redirect(`/admin/routes/${req.params.id}`);
      }

      // Find route
      const route = await Route.findByPk(req.params.id);
      
      if (!route) {
        req.flash('error_msg', 'Không tìm thấy tuyến đường');
        return res.redirect('/admin/routes');
      }
      
      // Update route
      await route.update({
        departureCity,
        arrivalCity,
        distance,
        estimatedDuration
      });
      
      req.flash('success_msg', 'Cập nhật tuyến đường thành công');
      res.redirect('/admin/routes');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi cập nhật tuyến đường');
      res.redirect('/admin/routes');
    }
  },

  // Delete route
  deleteRoute: async (req, res) => {
    try {
      // Check if route is being used by any buses
      const buses = await Bus.findAll({ 
        where: { routeId: req.params.id }
      });
      
      if (buses.length > 0) {
        req.flash('error_msg', 'Không thể xóa tuyến đường có xe đang chạy. Vui lòng xóa xe trước.');
        return res.redirect('/admin/routes');
      }
      
      // Find and delete route
      const route = await Route.findByPk(req.params.id);
      
      if (!route) {
        req.flash('error_msg', 'Không tìm thấy tuyến đường');
        return res.redirect('/admin/routes');
      }
      
      await route.destroy();
      
      req.flash('success_msg', 'Xóa tuyến đường thành công');
      res.redirect('/admin/routes');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi xóa tuyến đường');
      res.redirect('/admin/routes');
    }
  },

  // Get unique cities for search autocomplete
  getUniqueCities: async (req, res) => {
    try {
      // Get unique departure cities
      const departureCities = await Route.findAll({
        attributes: ['departureCity'],
        group: ['departureCity']
      });
      
      // Get unique arrival cities
      const arrivalCities = await Route.findAll({
        attributes: ['arrivalCity'],
        group: ['arrivalCity']
      });
      
      // Extract values and combine
      const departureCityValues = departureCities.map(city => city.departureCity);
      const arrivalCityValues = arrivalCities.map(city => city.arrivalCity);
      
      // Combine and remove duplicates
      const uniqueCities = [...new Set([...departureCityValues, ...arrivalCityValues])];
      
      res.json(uniqueCities);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }
};
