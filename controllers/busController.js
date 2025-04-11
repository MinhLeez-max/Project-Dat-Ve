const { Bus, Route, Booking } = require('../models/index');

module.exports = {
  // Get all routes and buses
  getAllRoutesAndBuses: async (req, res) => {
    try {
      // Get all routes
      const routes = await Route.find().sort({ departureCity: 1 });
      
      // Get buses for each route
      const routesWithBuses = await Promise.all(routes.map(async (route) => {
        const buses = await Bus.find({ route: route._id })
                           .sort({ departureDate: 1, departureTime: 1 });
        
        return {
          route: route,
          buses: buses
        };
      }));
      
      res.render('bus/all-routes', {
        title: 'Tất Cả Tuyến Đường',
        routesWithBuses
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi tải danh sách tuyến đường');
      res.redirect('/');
    }
  },
  
  // Get search form
  getSearchForm: async (req, res) => {
    try {
      // Get unique departure cities using MongoDB
      const departureCities = await Route.distinct('departureCity');
      
      // Get unique arrival cities using MongoDB
      const arrivalCities = await Route.distinct('arrivalCity');
      
      res.render('bus/search', {
        title: 'Tìm Xe',
        departureCities,
        arrivalCities
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi tải trang tìm kiếm');
      res.redirect('/');
    }
  },

  // Search buses
  searchBuses: async (req, res) => {
    try {
      const { departureCity, arrivalCity, departureDate } = req.body;
      
      // Validate input
      if (!departureCity || !arrivalCity || !departureDate) {
        req.flash('error_msg', 'Vui lòng điền đầy đủ thông tin');
        return res.redirect('/buses/search');
      }

      // Find routes matching the search criteria
      const routes = await Route.find({
        departureCity: departureCity,
        arrivalCity: arrivalCity
      });

      if (routes.length === 0) {
        req.flash('error_msg', 'Không tìm thấy tuyến đường cho các thành phố đã chọn');
        return res.redirect('/buses/search');
      }

      const routeIds = routes.map(route => route._id);

      // Set date range for search
      const date = new Date(departureDate);
      const nextDay = new Date(departureDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Find buses for these routes and date
      const buses = await Bus.find({
        route: { $in: routeIds },
        departureDate: {
          $gte: date,
          $lt: nextDay
        }
      }).populate('route');

      res.render('bus/results', {
        title: 'Kết Quả Tìm Kiếm',
        buses,
        departureCity,
        arrivalCity,
        departureDate
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi tìm kiếm xe');
      res.redirect('/buses/search');
    }
  },

  // Get bus details and available seats
  getBusDetails: async (req, res) => {
    try {
      const busId = req.params.id;
      
      // Find bus with details using MongoDB
      const bus = await Bus.findById(busId).populate('route');
      
      if (!bus) {
        req.flash('error_msg', 'Không tìm thấy xe');
        return res.redirect('/buses/search');
      }

      // Find existing bookings for this bus
      const bookings = await Booking.find({
        bus: busId,
        status: { $ne: 'cancelled' }
      });

      // Create an array of already booked seats
      const bookedSeats = [];
      bookings.forEach(booking => {
        if (booking.seatNumbers && booking.seatNumbers.length) {
          booking.seatNumbers.forEach(seatNumber => {
            bookedSeats.push(seatNumber);
          });
        }
      });

      res.render('booking/select-seats', {
        title: 'Chọn Ghế',
        bus,
        bookedSeats
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi tải thông tin xe');
      res.redirect('/buses/search');
    }
  },

  // Admin: Get all buses
  getAllBuses: async (req, res) => {
    try {
      // Using MongoDB to fetch all buses with routes
      const buses = await Bus.find()
        .populate('route')
        .sort({ departureDate: 1, departureTime: 1 });
      
      res.render('admin/buses', {
        title: 'Quản lý Xe',
        buses
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi tải danh sách xe');
      res.redirect('/admin/dashboard');
    }
  },

  // Admin: Render add bus form
  getAddBus: async (req, res) => {
    try {
      // Using MongoDB to fetch routes sorted by departure city
      const routes = await Route.find().sort({ departureCity: 1 });
      
      res.render('admin/buses', {
        title: 'Thêm Xe Mới',
        routes,
        addBus: true
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi tải form thêm xe');
      res.redirect('/admin/buses');
    }
  },

  // Admin: Add new bus
  addBus: async (req, res) => {
    try {
      const { 
        routeId, busNumber, busName, busType, totalSeats, 
        departureTime, arrivalTime, price, 
        wifi, usb, food, waterBottle, blanket, entertainment,
        rows, columns, layout
      } = req.body;
      
      // Validate input
      if (!routeId || !busNumber || !busName || !busType || !totalSeats || 
          !departureTime || !arrivalTime || !price || !rows || !columns || !layout) {
        req.flash('error_msg', 'Vui lòng điền đầy đủ thông tin');
        return res.redirect('/admin/buses/add');
      }

      // Check if bus number already exists
      const existingBus = await Bus.findOne({ busNumber });
      
      if (existingBus) {
        req.flash('error_msg', 'Xe buýt với số hiệu này đã tồn tại');
        return res.redirect('/admin/buses/add');
      }

      // Create new bus using MongoDB
      await Bus.create({
        route: routeId,
        busNumber,
        name: busName,
        type: busType,
        capacity: totalSeats,
        departureTime,
        arrivalTime,
        fare: price,
        departureDate: new Date(), // Mặc định ngày hiện tại, cần cập nhật sau
        arrivalDate: new Date(),   // Mặc định ngày hiện tại, cần cập nhật sau
        amenities: {
          wifi: wifi === 'on',
          usb: usb === 'on',
          food: food === 'on',
          waterBottle: waterBottle === 'on',
          blanket: blanket === 'on',
          entertainment: entertainment === 'on'
        },
        seatLayout: {
          rows,
          columns,
          layout
        }
      });
      
      req.flash('success_msg', 'Thêm xe mới thành công');
      res.redirect('/admin/buses');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi thêm xe mới');
      res.redirect('/admin/buses');
    }
  },

  // Admin: Get bus by ID
  getBus: async (req, res) => {
    try {
      const bus = await Bus.findById(req.params.id);
      const routes = await Route.find().sort({ departureCity: 1 });
      
      if (!bus) {
        req.flash('error_msg', 'Không tìm thấy xe');
        return res.redirect('/admin/buses');
      }
      
      res.render('admin/buses', {
        title: 'Chỉnh sửa thông tin xe',
        bus,
        routes,
        editBus: true
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi tải thông tin xe');
      res.redirect('/admin/buses');
    }
  },

  // Admin: Update bus
  updateBus: async (req, res) => {
    try {
      const { 
        routeId, busNumber, busName, busType, totalSeats, 
        departureTime, arrivalTime, fare, available,
        wifi, usb, food, waterBottle, blanket, entertainment,
        rows, columns, layout
      } = req.body;
      
      // Validate input
      if (!routeId || !busNumber || !busName || !busType || !totalSeats || 
          !departureTime || !arrivalTime || !fare || !rows || !columns || !layout) {
        req.flash('error_msg', 'Vui lòng điền đầy đủ thông tin');
        return res.redirect(`/admin/buses/${req.params.id}`);
      }

      // Find bus
      const bus = await Bus.findById(req.params.id);
      
      if (!bus) {
        req.flash('error_msg', 'Không tìm thấy xe');
        return res.redirect('/admin/buses');
      }
      
      // Check if bus number already exists (except for this bus)
      if (busNumber !== bus.busNumber) {
        const existingBus = await Bus.findOne({ busNumber });
        
        if (existingBus && !existingBus._id.equals(bus._id)) {
          req.flash('error_msg', 'Xe buýt với số hiệu này đã tồn tại');
          return res.redirect(`/admin/buses/${req.params.id}`);
        }
      }

      // Update bus with MongoDB
      await Bus.findByIdAndUpdate(req.params.id, {
        route: routeId,
        busNumber,
        name: busName,
        type: busType,
        capacity: totalSeats,
        departureTime,
        arrivalTime,
        fare: fare,
        amenities: {
          wifi: wifi === 'on',
          usb: usb === 'on',
          food: food === 'on',
          waterBottle: waterBottle === 'on',
          blanket: blanket === 'on',
          entertainment: entertainment === 'on'
        },
        seatLayout: {
          rows,
          columns,
          layout
        }
      });
      
      req.flash('success_msg', 'Cập nhật thông tin xe thành công');
      res.redirect('/admin/buses');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi cập nhật thông tin xe');
      res.redirect('/admin/buses');
    }
  },

  // Admin: Delete bus
  deleteBus: async (req, res) => {
    try {
      // Check if bus has any active bookings
      const bookings = await Booking.find({ 
        bus: req.params.id,
        status: { $ne: 'cancelled' }
      });
      
      if (bookings.length > 0) {
        req.flash('error_msg', 'Không thể xóa xe có các đặt chỗ đang hoạt động');
        return res.redirect('/admin/buses');
      }
      
      // Find and delete bus
      const bus = await Bus.findById(req.params.id);
      
      if (!bus) {
        req.flash('error_msg', 'Không tìm thấy xe');
        return res.redirect('/admin/buses');
      }
      
      await Bus.findByIdAndDelete(req.params.id);
      
      req.flash('success_msg', 'Xóa xe thành công');
      res.redirect('/admin/buses');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi xóa xe');
      res.redirect('/admin/buses');
    }
  }
};
