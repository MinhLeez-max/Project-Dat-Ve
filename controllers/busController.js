const { sequelize, Bus, Route, Booking } = require('../models/index');
const { Op } = require('sequelize');

module.exports = {
  // Get all routes and buses
  getAllRoutesAndBuses: async (req, res) => {
    try {
      // Get all routes
      const routes = await Route.findAll({
        order: [['departureCity', 'ASC']]
      });
      
      // Get buses for each route
      const routesWithBuses = await Promise.all(routes.map(async (route) => {
        const buses = await Bus.findAll({
          where: { RouteId: route.id },
          order: [['departureDate', 'ASC'], ['departureTime', 'ASC']]
        });
        
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
      // Get unique departure cities using Sequelize
      const departureCities = await Route.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('departureCity')), 'departureCity']],
        raw: true
      }).then(cities => cities.map(city => city.departureCity));
      
      // Get unique arrival cities using Sequelize
      const arrivalCities = await Route.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('arrivalCity')), 'arrivalCity']],
        raw: true
      }).then(cities => cities.map(city => city.arrivalCity));
      
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

      // Find route IDs matching the search criteria - using Sequelize
      const routes = await Route.findAll({
        where: {
          departureCity: departureCity,
          arrivalCity: arrivalCity
        }
      });

      if (routes.length === 0) {
        req.flash('error_msg', 'Không tìm thấy tuyến đường cho các thành phố đã chọn');
        return res.redirect('/buses/search');
      }

      const routeIds = routes.map(route => route.id);

      // Set date range for search
      const date = new Date(departureDate);
      const nextDay = new Date(departureDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Find buses for these routes and date - using Sequelize and associations
      const buses = await Bus.findAll({
        where: {
          RouteId: routeIds,
          departureDate: {
            [Op.gte]: date,
            [Op.lt]: nextDay
          }
        },
        include: [Route]
      });

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
      const journeyDate = req.query.date;
      
      // Find bus with details - using Sequelize
      const bus = await Bus.findByPk(busId, {
        include: [Route]
      });
      
      if (!bus) {
        req.flash('error_msg', 'Không tìm thấy xe');
        return res.redirect('/buses/search');
      }

      // Find existing bookings for this bus and date to determine booked seats - using Sequelize
      const journeyStart = new Date(journeyDate);
      const journeyEnd = new Date(journeyDate);
      journeyEnd.setDate(journeyEnd.getDate() + 1);
      
      // Chúng ta sẽ dùng truy vấn SQL thuần vì journeyDate mới được thêm vào
      const bookings = await Booking.findAll({
        where: {
          BusId: busId,
          status: { 
            [Op.ne]: 'cancelled' 
          }
        }
      });

      // Lọc booking theo journeyDate
      const filteredBookings = bookings.filter(booking => {
        if (!booking.journeyDate) return false;
        const bookingDate = new Date(booking.journeyDate);
        return bookingDate >= journeyStart && bookingDate < journeyEnd;
      });

      // Create an array of already booked seats
      const bookedSeats = [];
      filteredBookings.forEach(booking => {
        if (booking.seatNumbers && booking.seatNumbers.length) {
          booking.seatNumbers.forEach(seatNumber => {
            bookedSeats.push(seatNumber);
          });
        }
      });

      res.render('booking/select-seats', {
        title: 'Chọn Ghế',
        bus,
        journeyDate,
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
      // Using Sequelize for fetching all buses with routes
      const buses = await Bus.findAll({
        include: [Route],
        order: [['departureDate', 'ASC'], ['departureTime', 'ASC']]
      });
      
      res.render('admin/buses', {
        title: 'Manage Buses',
        buses
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error fetching buses');
      res.redirect('/admin/dashboard');
    }
  },

  // Admin: Render add bus form
  getAddBus: async (req, res) => {
    try {
      // Using Sequelize to fetch routes sorted by departure city
      const routes = await Route.findAll({
        order: [['departureCity', 'ASC']]
      });
      
      res.render('admin/buses', {
        title: 'Add New Bus',
        routes,
        addBus: true
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading add bus form');
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
        req.flash('error_msg', 'Please fill in all required fields');
        return res.redirect('/admin/buses/add');
      }

      // Check if bus number already exists
      const existingBus = await Bus.findOne({ 
        where: { busNumber }
      });
      
      if (existingBus) {
        req.flash('error_msg', 'Xe buýt với số hiệu này đã tồn tại');
        return res.redirect('/admin/buses/add');
      }

      // Create new bus using Sequelize
      await Bus.create({
        RouteId: routeId,
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
      
      req.flash('success_msg', 'New bus added successfully');
      res.redirect('/admin/buses');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error adding new bus');
      res.redirect('/admin/buses');
    }
  },

  // Admin: Get bus by ID
  getBus: async (req, res) => {
    try {
      const bus = await Bus.findByPk(req.params.id);
      const routes = await Route.findAll({
        order: [['departureCity', 'ASC']]
      });
      
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
        departureTime, arrivalTime, price, available,
        wifi, usb, food, waterBottle, blanket, entertainment,
        rows, columns, layout
      } = req.body;
      
      // Validate input
      if (!routeId || !busNumber || !busName || !busType || !totalSeats || 
          !departureTime || !arrivalTime || !price || !rows || !columns || !layout) {
        req.flash('error_msg', 'Vui lòng điền đầy đủ thông tin');
        return res.redirect(`/admin/buses/${req.params.id}`);
      }

      // Find bus
      const bus = await Bus.findByPk(req.params.id);
      
      if (!bus) {
        req.flash('error_msg', 'Không tìm thấy xe');
        return res.redirect('/admin/buses');
      }
      
      // Check if bus number already exists (except for this bus)
      if (busNumber !== bus.busNumber) {
        const existingBus = await Bus.findOne({ 
          where: { busNumber } 
        });
        
        if (existingBus) {
          req.flash('error_msg', 'Xe buýt với số hiệu này đã tồn tại');
          return res.redirect(`/admin/buses/${req.params.id}`);
        }
      }

      // Update bus with Sequelize
      await bus.update({
        RouteId: routeId,
        busNumber,
        name: busName,
        type: busType,
        capacity: totalSeats,
        departureTime,
        arrivalTime,
        fare: price,
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
      const bookings = await Booking.findAll({ 
        where: {
          BusId: req.params.id,
          status: { [Op.ne]: 'cancelled' }
        }
      });
      
      // Lọc booking theo ngày hiện tại
      const currentDate = new Date();
      const activeBookings = bookings.filter(booking => {
        if (!booking.journeyDate) return false;
        const journeyDate = new Date(booking.journeyDate);
        return journeyDate >= currentDate;
      });
      
      if (activeBookings.length > 0) {
        req.flash('error_msg', 'Không thể xóa xe có các đặt chỗ đang hoạt động');
        return res.redirect('/admin/buses');
      }
      
      // Find and delete bus
      const bus = await Bus.findByPk(req.params.id);
      
      if (!bus) {
        req.flash('error_msg', 'Không tìm thấy xe');
        return res.redirect('/admin/buses');
      }
      
      await bus.destroy();
      
      req.flash('success_msg', 'Xóa xe thành công');
      res.redirect('/admin/buses');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi xóa xe');
      res.redirect('/admin/buses');
    }
  }
};
