const { User, Route, Bus, Booking } = require('../models');
const moment = require('moment');

module.exports = {
  getDashboard: async (req, res) => {
    try {
      // Đếm số lượng
      const userCount = await User.countDocuments();
      const routeCount = await Route.countDocuments();
      const busCount = await Bus.countDocuments();
      const bookingCount = await Booking.countDocuments();

      // Lấy danh sách đặt vé gần đây
      const recentBookings = await Booking.find()
        .populate('user')
        .populate({ path: 'bus', populate: { path: 'route' } })
        .sort({ bookingDate: -1 })
        .limit(5);

      // Các tuyến mới nhất
      const routes = await Route.find().sort({ createdAt: -1 }).limit(3);

      // Các thành phố khởi hành và đến
      const departureCities = await Route.distinct('departureCity');
      const arrivalCities = await Route.distinct('arrivalCity');

      // Tính doanh thu
      const allBookings = await Booking.find().populate('bus');

      let totalRevenue = 0;
      let monthlyRevenue = 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      allBookings.forEach(booking => {
        if (booking.bus && booking.bus.fare) {
          totalRevenue += booking.bus.fare;

          if (booking.bookingDate >= startOfMonth && booking.bookingDate <= now) {
            monthlyRevenue += booking.bus.fare;
          }
        }
      });

      // Render dashboard
      res.render('admin/dashboard', {
        title: 'Dashboard',
        stats: {
          users: userCount,
          routes: routeCount,
          buses: busCount,
          bookings: bookingCount,
          totalRevenue: totalRevenue,
          monthlyRevenue: monthlyRevenue
        },
        recentBookings,
        routes,
        departureCities: departureCities.map(city => ({ departureCity: city })),
        arrivalCities: arrivalCities.map(city => ({ arrivalCity: city })),
        moment
      });

    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Lỗi khi tải dashboard');
      res.redirect('/');
    }
  }
};
