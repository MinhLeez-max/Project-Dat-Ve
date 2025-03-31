const Booking = require('../models/Booking');
const Bus = require('../models/Bus');
const User = require('../models/User');
const Route = require('../models/Route');

module.exports = {
  // Get admin dashboard
  getDashboard: async (req, res) => {
    try {
      // Get counts for dashboard stats
      const userCount = await User.countDocuments();
      const busCount = await Bus.countDocuments();
      const routeCount = await Route.countDocuments();
      const bookingCount = await Booking.countDocuments();
      
      // Get pending bookings
      const pendingBookings = await Booking.countDocuments({ status: 'pending' });
      
      // Get today's bookings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayBookings = await Booking.countDocuments({
        bookingDate: {
          $gte: today,
          $lt: tomorrow
        }
      });
      
      // Get revenue stats
      const totalRevenue = await Booking.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      
      const monthlyRevenue = await Booking.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' },
            bookingDate: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      
      // Get recent bookings
      const recentBookings = await Booking.find()
        .populate('userId')
        .populate('busId')
        .sort({ bookingDate: -1 })
        .limit(5);
      
      // Get bus route details for each booking
      for (let i = 0; i < recentBookings.length; i++) {
        const bus = await Bus.findById(recentBookings[i].busId._id).populate('routeId');
        recentBookings[i].route = bus.routeId;
      }
      
      res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        stats: {
          users: userCount,
          buses: busCount,
          routes: routeCount,
          bookings: bookingCount,
          pendingBookings,
          todayBookings,
          totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
          monthlyRevenue: monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0
        },
        recentBookings
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading dashboard');
      res.redirect('/');
    }
  }
};
