const { sequelize, Booking, Bus, User, Route } = require('../models');

module.exports = {
  // Process selected seats and render passenger details form
  processSelectedSeats: async (req, res) => {
    try {
      const { busId, journeyDate, selectedSeats } = req.body;
      
      // Validate input
      if (!busId || !journeyDate || !selectedSeats) {
        req.flash('error_msg', 'Vui lòng chọn ít nhất một ghế');
        return res.redirect(`/buses/${busId}?date=${journeyDate}`);
      }

      // Convert selectedSeats to array if it's a string (single seat selected)
      const seats = Array.isArray(selectedSeats) ? selectedSeats : [selectedSeats];
      
      // Get bus details
      const bus = await Bus.findByPk(busId, {
        include: [Route]
      });
      
      if (!bus) {
        req.flash('error_msg', 'Không tìm thấy xe');
        return res.redirect('/buses/search');
      }

      // Calculate total amount
      const totalAmount = bus.fare * seats.length;
      
      // Store booking data in session for the next step
      req.session.bookingData = {
        busId,
        selectedSeats: seats,
        totalAmount,
        bus: {
          name: bus.name,
          busNumber: bus.busNumber,
          departureCity: bus.Route.departureCity,
          arrivalCity: bus.Route.arrivalCity,
          departureTime: bus.departureTime,
          arrivalTime: bus.arrivalTime,
          fare: bus.fare
        }
      };
      
      res.render('booking/passenger-details', {
        title: 'Thông Tin Hành Khách',
        seats,
        bus,
        journeyDate,
        totalAmount
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi xử lý ghế đã chọn');
      res.redirect('/buses/search');
    }
  },

  // Process passenger details and render payment page
  processPassengerDetails: (req, res) => {
    try {
      const { passengerName, passengerAge, passengerGender } = req.body;
      
      // Get booking data from session
      const bookingData = req.session.bookingData;
      
      if (!bookingData) {
        req.flash('error_msg', 'Phiên đặt vé đã hết hạn');
        return res.redirect('/buses/search');
      }

      // Validate input
      if (!passengerName || !passengerAge || !passengerGender) {
        req.flash('error_msg', 'Vui lòng điền đầy đủ thông tin hành khách');
        return res.redirect('/bookings/passenger-details');
      }

      // Process passenger data - handle both array and single values
      const passengers = [];
      
      // If only one seat is selected
      if (!Array.isArray(passengerName)) {
        passengers.push({
          seatNumber: bookingData.selectedSeats[0],
          passengerName,
          passengerAge,
          passengerGender
        });
      } else {
        // If multiple seats are selected
        for (let i = 0; i < passengerName.length; i++) {
          passengers.push({
            seatNumber: bookingData.selectedSeats[i],
            passengerName: passengerName[i],
            passengerAge: passengerAge[i],
            passengerGender: passengerGender[i]
          });
        }
      }
      
      // Update booking data in session
      req.session.bookingData.passengerDetails = passengers;
      
      res.render('booking/payment', {
        title: 'Thanh Toán',
        bookingData: req.session.bookingData
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi xử lý thông tin hành khách');
      res.redirect('/buses/search');
    }
  },

  // Process payment and create booking
  processPayment: async (req, res) => {
    try {
      const { paymentMethod } = req.body;
      
      // Get booking data from session
      const bookingData = req.session.bookingData;
      
      if (!bookingData) {
        req.flash('error_msg', 'Phiên đặt vé đã hết hạn');
        return res.redirect('/buses/search');
      }

      // Validate input
      if (!paymentMethod) {
        req.flash('error_msg', 'Vui lòng chọn phương thức thanh toán');
        return res.redirect('/bookings/payment');
      }

      // Ensure user is logged in
      if (!req.session.user) {
        req.flash('error_msg', 'Vui lòng đăng nhập để hoàn tất đặt vé');
        return res.redirect('/login');
      }

      // Create new booking
      const newBooking = await Booking.create({
        UserId: req.session.user.id,
        BusId: bookingData.busId,
        seatNumbers: bookingData.selectedSeats,
        totalAmount: bookingData.totalAmount,
        passengerDetails: bookingData.passengerDetails,
        paymentMethod,
        status: 'confirmed',
        paymentStatus: 'completed',
        bookingDate: new Date()
      });
      
      // Clear booking data from session
      delete req.session.bookingData;
      
      // Send confirmation email (mock for now)
      // emailService.sendBookingConfirmation(newBooking);
      
      req.flash('success_msg', 'Đặt vé thành công');
      res.redirect(`/bookings/${newBooking.id}/confirmation`);
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi xử lý thanh toán');
      res.redirect('/bookings/payment');
    }
  },

  // Get booking confirmation
  getBookingConfirmation: async (req, res) => {
    try {
      const booking = await Booking.findByPk(req.params.id, {
        include: [
          { model: User },
          { 
            model: Bus,
            include: [Route]
          }
        ]
      });
      
      if (!booking) {
        req.flash('error_msg', 'Không tìm thấy đặt vé');
        return res.redirect('/');
      }

      // Check if booking belongs to logged in user
      if (booking.UserId !== req.session.user.id) {
        req.flash('error_msg', 'Bạn không có quyền truy cập');
        return res.redirect('/');
      }
      
      // Bus and route details are already included through the associations
      
      res.render('booking/confirmation', {
        title: 'Xác Nhận Đặt Vé',
        booking
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi tải thông tin đặt vé');
      res.redirect('/');
    }
  },

  // Get my bookings
  getMyBookings: async (req, res) => {
    try {
      const bookings = await Booking.findAll({
        where: { UserId: req.session.user.id },
        include: [
          { 
            model: Bus,
            include: [Route]
          }
        ],
        order: [['bookingDate', 'DESC']]
      });
      
      res.render('booking/my-bookings', {
        title: 'Vé Của Tôi',
        bookings
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi tải danh sách vé');
      res.redirect('/');
    }
  },

  // Cancel booking
  cancelBooking: async (req, res) => {
    try {
      const booking = await Booking.findByPk(req.params.id, {
        include: [{ model: Bus }]
      });
      
      if (!booking) {
        req.flash('error_msg', 'Không tìm thấy đặt vé');
        return res.redirect('/bookings/my-bookings');
      }

      // Check if booking belongs to logged in user
      if (booking.UserId !== req.session.user.id) {
        req.flash('error_msg', 'Bạn không có quyền truy cập');
        return res.redirect('/bookings/my-bookings');
      }

      // Check if booking can be cancelled (not past departure date)
      const departureDate = new Date(booking.Bus.departureDate);
      const currentDate = new Date();
      
      if (departureDate < currentDate) {
        req.flash('error_msg', 'Không thể hủy vé cho chuyến đã qua');
        return res.redirect('/bookings/my-bookings');
      }

      // Update booking status
      booking.status = 'cancelled';
      booking.paymentStatus = 'refunded';
      
      await booking.save();
      
      req.flash('success_msg', 'Hủy vé thành công');
      res.redirect('/bookings/my-bookings');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi hủy vé');
      res.redirect('/bookings/my-bookings');
    }
  },

  // Admin: Get all bookings
  getAllBookings: async (req, res) => {
    try {
      // Pagination
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;
      
      // Filtering
      const where = {};
      if (req.query.status) {
        where.status = req.query.status;
      }
      
      // Get total count for pagination
      const totalBookings = await Booking.count({ where });
      
      // Get bookings
      const bookings = await Booking.findAll({
        where,
        include: [
          { model: User },
          { 
            model: Bus,
            include: [Route]
          }
        ],
        order: [['bookingDate', 'DESC']],
        offset,
        limit
      });
      
      res.render('admin/bookings', {
        title: 'Quản Lý Đặt Vé',
        bookings,
        currentPage: page,
        totalPages: Math.ceil(totalBookings / limit),
        totalBookings,
        filter: req.query
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi tải danh sách đặt vé');
      res.redirect('/admin/dashboard');
    }
  },

  // Admin: Update booking status
  updateBookingStatus: async (req, res) => {
    try {
      const { status, paymentStatus } = req.body;
      
      // Validate input
      if (!status || !paymentStatus) {
        req.flash('error_msg', 'Vui lòng chọn cả trạng thái và trạng thái thanh toán');
        return res.redirect(`/admin/bookings/${req.params.id}`);
      }

      // Find and update booking
      const booking = await Booking.findByPk(req.params.id);
      
      if (!booking) {
        req.flash('error_msg', 'Không tìm thấy đặt vé');
        return res.redirect('/admin/bookings');
      }
      
      booking.status = status;
      booking.paymentStatus = paymentStatus;
      
      await booking.save();
      
      req.flash('success_msg', 'Cập nhật trạng thái đặt vé thành công');
      res.redirect('/admin/bookings');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi cập nhật trạng thái đặt vé');
      res.redirect('/admin/bookings');
    }
  }
};
