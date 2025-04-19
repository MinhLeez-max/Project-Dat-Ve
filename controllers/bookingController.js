const { Booking, Bus, User, Route } = require('../models');

module.exports = {
  // Xử lý các ghế đã chọn và hiển thị biểu mẫu thông tin chi tiết về hành khách
  processSelectedSeats: async (req, res) => {
    try {
      const { busId, selectedSeats } = req.body;
      
      // Xác thực đầu vào
      if (!busId || !selectedSeats) {
        req.flash('error_msg', 'Vui lòng chọn ít nhất một ghế');
        return res.redirect(`/buses/${busId}`);
      }

      // Chuyển đổi selectedSeats thành mảng nếu chỉ chọn một ghế
      const seats = Array.isArray(selectedSeats) ? selectedSeats : [selectedSeats];
      
      // Lấy thông tin chi tiết xe
      const bus = await Bus.findById(busId).populate('route');
      
      if (!bus) {
        req.flash('error_msg', 'Không tìm thấy xe');
        return res.redirect('/buses/search');
      }

      // Tính tổng số tiền
      const totalAmount = bus.fare * seats.length;
      
      // Lưu trữ dữ liệu đặt vé trong phiên để sử dụng ở bước tiếp theo
      req.session.bookingData = {
        busId,
        selectedSeats: seats,
        totalAmount,
        bus: {
          name: bus.name,
          busNumber: bus.busNumber,
          departureCity: bus.route.departureCity,
          arrivalCity: bus.route.arrivalCity,
          departureTime: bus.departureTime,
          arrivalTime: bus.arrivalTime,
          fare: bus.fare
        }
      };
      
      res.render('booking/passenger-details', {
        title: 'Thông Tin Hành Khách',
        seats,
        bus,
        totalAmount,
        journeyDate: req.body.journeyDate
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi xử lý ghế đã chọn');
      res.redirect('/buses/search');
    }
  },

  // Xử lý thông tin hành khách và hiển thị trang thanh toán
  processPassengerDetails: (req, res) => {
    try {
      const { passengerName, passengerAge, passengerGender } = req.body;
      
      // Lấy dữ liệu đặt vé từ phiên
      const bookingData = req.session.bookingData;
      
      if (!bookingData) {
        req.flash('error_msg', 'Phiên đặt vé đã hết hạn');
        return res.redirect('/buses/search');
      }

      // Xác thực đầu vào
      if (!passengerName || !passengerAge || !passengerGender) {
        req.flash('error_msg', 'Vui lòng điền đầy đủ thông tin hành khách');
        return res.redirect('/bookings/passenger-details');
      }

      // Xử lý dữ liệu hành khách - hỗ trợ cả mảng và giá trị đơn
      const passengers = [];
      
      // Nếu chỉ chọn một ghế
      if (!Array.isArray(passengerName)) {
        passengers.push({
          seatNumber: bookingData.selectedSeats[0],
          passengerName,
          passengerAge,
          passengerGender
        });
      } else {
        // Nếu chọn nhiều ghế
        for (let i = 0; i < passengerName.length; i++) {
          passengers.push({
            seatNumber: bookingData.selectedSeats[i],
            passengerName: passengerName[i],
            passengerAge: passengerAge[i],
            passengerGender: passengerGender[i]
          });
        }
      }
      
      // Cập nhật dữ liệu hành khách trong phiên
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

  // Xử lý thanh toán và tạo đặt chỗ
  processPayment: async (req, res) => {
    try {
      const { paymentMethod } = req.body;
      
      // Lấy dữ liệu đặt vé từ phiên
      const bookingData = req.session.bookingData;

      if (!bookingData) {
        req.flash('error_msg', 'Phiên đặt vé đã hết hạn');
        return res.redirect('/buses/search');
      }

      // Xác thực phương thức thanh toán
      if (!paymentMethod) {
        req.flash('error_msg', 'Vui lòng chọn phương thức thanh toán');
        return res.redirect('/bookings/payment');
      }

      // Đảm bảo người dùng đã đăng nhập
      if (!req.session.user) {
        req.flash('error_msg', 'Vui lòng đăng nhập để hoàn tất đặt vé');
        return res.redirect('/login');
      }

      // Tạo đặt chỗ mới
      const newBooking = new Booking({
        user: req.session.user.id,
        bus: bookingData.busId,
        seatNumbers: bookingData.selectedSeats,
        totalAmount: bookingData.totalAmount,
        passengerDetails: bookingData.passengerDetails,
        paymentMethod,
        status: 'confirmed',
        paymentStatus: 'paid'
      });
      
      await newBooking.save();
      
      // Xóa dữ liệu đặt vé khỏi phiên
      delete req.session.bookingData;
      
      req.flash('success_msg', 'Đặt vé thành công');
      res.redirect(`/bookings/${newBooking._id}/confirmation`);
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi xử lý thanh toán');
      res.redirect('/bookings/payment');
    }
  },

  // Hiển thị xác nhận đặt vé
  getBookingConfirmation: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id)
        .populate('user')
        .populate({
          path: 'bus',
          populate: {
            path: 'route'
          }
        });
      
      if (!booking) {
        req.flash('error_msg', 'Không tìm thấy đặt vé');
        return res.redirect('/');
      }

      // Kiểm tra quyền truy cập của người dùng
      if (booking.user._id.toString() !== req.session.user.id) {
        req.flash('error_msg', 'Bạn không có quyền truy cập');
        return res.redirect('/');
      }
      
      res.render('booking/confirmation', {
        title: 'Xác Nhận Đặt Vé',
        booking,
        bus: booking.bus,
        route: booking.bus.route,
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi tải thông tin đặt vé');
      res.redirect('/');
    }
  },

  // Hiển thị danh sách vé của tôi
  getMyBookings: async (req, res) => {
    try {
      const bookings = await Booking.find({ user: req.session.user.id })
        .populate({
          path: 'bus',
          populate: {
            path: 'route'
          }
        })
        .sort({ bookingDate: -1 });
      
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

  // Hủy đặt vé
  cancelBooking: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id).populate('bus');
      
      if (!booking) {
        req.flash('error_msg', 'Không tìm thấy đặt vé');
        return res.redirect('/bookings/my-bookings');
      }

      // Kiểm tra quyền truy cập của người dùng
      if (booking.user.toString() !== req.session.user.id) {
        req.flash('error_msg', 'Bạn không có quyền truy cập');
        return res.redirect('/bookings/my-bookings');
      }

      // Kiểm tra nếu vé có thể hủy (chưa qua ngày khởi hành)
      const departureDate = new Date(booking.bus.departureDate);
      const currentDate = new Date();
      
      if (departureDate < currentDate) {
        req.flash('error_msg', 'Không thể hủy vé cho chuyến đã qua');
        return res.redirect('/bookings/my-bookings');
      }

      // Cập nhật trạng thái đặt vé
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

  // Admin: Hiển thị danh sách tất cả các đặt vé
  getAllBookings: async (req, res) => {
    try {
      // Phân trang
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const skip = (page - 1) * limit;
      
      // Lọc dữ liệu
      const filter = {};
      if (req.query.status) {
        filter.status = req.query.status;
      }
      
      // Lấy tổng số lượng đặt vé
      const totalBookings = await Booking.countDocuments(filter);
      
      // Lấy danh sách đặt vé
      const bookings = await Booking.find(filter)
        .populate('user')
        .populate({
          path: 'bus',
          populate: {
            path: 'route'
          }
        })
        .sort({ bookingDate: -1 })
        .skip(skip)
        .limit(limit);
      
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

  // Admin: Cập nhật trạng thái đặt vé
  updateBookingStatus: async (req, res) => {
    try {
      const { status, paymentStatus } = req.body;
      
      // Xác thực đầu vào
      if (!status || !paymentStatus) {
        req.flash('error_msg', 'Vui lòng chọn cả trạng thái và trạng thái thanh toán');
        return res.redirect(`/admin/bookings/${req.params.id}`);
      }

      // Tìm và cập nhật đặt vé
      const booking = await Booking.findById(req.params.id);
      
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