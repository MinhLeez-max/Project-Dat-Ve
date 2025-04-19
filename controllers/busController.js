const { Bus, Route, Booking } = require('../models/index');

module.exports = {
  // Lấy tất cả tuyến đường và xe
  getAllRoutesAndBuses: async (req, res) => {
    try {
      // Lấy tất cả tuyến đường
      const routes = await Route.find().sort({ departureCity: 1 });
      
      // Lấy danh sách xe cho từng tuyến đường
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
  
  // Hiển thị form tìm kiếm
  getSearchForm: async (req, res) => {
    try {
      // Lấy danh sách các thành phố khởi hành duy nhất
      const departureCities = await Route.distinct('departureCity');
      
      // Lấy danh sách các thành phố đến duy nhất
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

  // Tìm kiếm xe
  searchBuses: async (req, res) => {
    try {
      const { departureCity, arrivalCity, departureDate } = req.body;
      
      // Kiểm tra đầu vào
      if (!departureCity || !arrivalCity || !departureDate) {
        req.flash('error_msg', 'Vui lòng điền đầy đủ thông tin');
        return res.redirect('/buses/search');
      }

      // Tìm tuyến đường phù hợp với tiêu chí tìm kiếm
      const routes = await Route.find({
        departureCity: departureCity,
        arrivalCity: arrivalCity
      });

      if (routes.length === 0) {
        req.flash('error_msg', 'Không tìm thấy tuyến đường cho các thành phố đã chọn');
        return res.redirect('/buses/search');
      }

      const routeIds = routes.map(route => route._id);

      // Thiết lập phạm vi ngày tìm kiếm
      const date = new Date(departureDate);
      const nextDay = new Date(departureDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Tìm xe phù hợp với tuyến đường và ngày
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

  // Lấy thông tin chi tiết xe và ghế trống
  getBusDetails: async (req, res) => {
    try {
      const busId = req.params.id;
      
      // Tìm xe với thông tin chi tiết
      const bus = await Bus.findById(busId).populate('route');
      
      if (!bus) {
        req.flash('error_msg', 'Không tìm thấy xe');
        return res.redirect('/buses/search');
      }

      // Tìm các đặt chỗ hiện có cho xe này
      const bookings = await Booking.find({
        bus: busId,
        status: { $ne: 'cancelled' }
      });

      // Tạo danh sách các ghế đã được đặt
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

  // Lấy danh sách tất cả xe
  getAllBuses: async (req, res) => {
    try {
      // Lấy danh sách xe từ MongoDB
      const buses = await Bus.find()
        .populate('route') // Lấy thông tin tuyến đường
        .sort({ departureDate: 1, departureTime: 1 });
  
      // Kiểm tra và xử lý thời gian
      buses.forEach(bus => {
        try {
          if (bus.departureTime) {
            const departureDate = new Date(bus.departureTime);
            if (!isNaN(departureDate)) {
              bus.departureTime = departureDate.toISOString();
            } else {
              bus.departureTime = null;
            }
          }
      
          if (bus.arrivalTime) {
            const arrivalDate = new Date(bus.arrivalTime);
            if (!isNaN(arrivalDate)) {
              bus.arrivalTime = arrivalDate.toISOString();
            } else {
              bus.arrivalTime = null;
            }
          }
        } catch (err) {
          console.error(`Lỗi khi xử lý thời gian cho xe: ${bus._id}`, err);
          bus.departureTime = null;
          bus.arrivalTime = null;
        }
      });
  
      // Hiển thị danh sách xe
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

  // Admin: Hiển thị form thêm xe
  getAddBus: async (req, res) => {
    try {
      // Lấy danh sách tuyến đường
      const routes = await Route.find().sort({ departureCity: 1 });
      
      const bus = {};
      res.render('admin/buses', {
        title: 'Thêm Xe Mới',
        routes,
        bus,
        addBus: true
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi tải form thêm xe');
      res.redirect('/admin/buses');
    }
  },

  // Admin: Thêm xe mới
  addBus: async (req, res) => {
    try {
      console.log("Dữ liệu nhận được từ form:", req.body);
  
      const { 
        routeId, busNumber, name, type, capacity, 
        departureDate, departureTime, arrivalDate, arrivalTime, fare 
      } = req.body;
  
      // Kiểm tra dữ liệu
      if (!routeId || !busNumber || !name || !type || !capacity || 
          !departureDate || !departureTime || !arrivalDate || !arrivalTime || !fare) {
        req.flash('error_msg', 'Vui lòng điền đủ thông tin');
        return res.redirect('/admin/buses/add');
      }
  
      // Tạo xe mới
      await Bus.create({
        route: routeId,
        busNumber,
        name,
        type,
        capacity,
        departureDate,
        departureTime,
        arrivalDate,
        arrivalTime,
        fare
      });
  
      req.flash('success_msg', 'Thêm xe mới thành công');
      res.redirect('/admin/buses');
    } catch (err) {
      console.error("Lỗi khi thêm xe:", err);
      req.flash('error_msg', 'Lỗi khi thêm xe mới');
      res.redirect('/admin/buses/add');
    }
  },

  // Admin: Lấy thông tin xe theo ID
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

  // Admin: Cập nhật thông tin xe
  updateBus: async (req, res) => {
    try {
      const { 
        routeId, busNumber, busName, busType, totalSeats, 
        departureTime, arrivalTime, fare, available,
        wifi, usb, food, waterBottle, blanket, entertainment,
        rows, columns, layout
      } = req.body;
      
      // Kiểm tra dữ liệu
      if (!routeId || !busNumber || !busName || !busType || !totalSeats || 
          !departureTime || !arrivalTime || !fare || !rows || !columns || !layout) {
        req.flash('error_msg', 'Vui lòng điền đầy đủ thông tin');
        return res.redirect(`/admin/buses/${req.params.id}`);
      }

      // Tìm xe
      const bus = await Bus.findById(req.params.id);
      
      if (!bus) {
        req.flash('error_msg', 'Không tìm thấy xe');
        return res.redirect('/admin/buses');
      }
      
      // Kiểm tra số xe đã tồn tại
      if (busNumber !== bus.busNumber) {
        const existingBus = await Bus.findOne({ busNumber });
        
        if (existingBus && !existingBus._id.equals(bus._id)) {
          req.flash('error_msg', 'Xe với số hiệu này đã tồn tại');
          return res.redirect(`/admin/buses/${req.params.id}`);
        }
      }

      // Cập nhật thông tin xe
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

  // Admin: Xóa xe
  deleteBus: async (req, res) => {
    try {
      // Kiểm tra nếu xe có các đặt chỗ đang hoạt động
      const bookings = await Booking.find({ 
        bus: req.params.id,
        status: { $ne: 'cancelled' }
      });
      
      if (bookings.length > 0) {
        req.flash('error_msg', 'Không thể xóa xe có các đặt chỗ đang hoạt động');
        return res.redirect('/admin/buses');
      }
      
      // Tìm và xóa xe
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