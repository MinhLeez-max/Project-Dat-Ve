const { sequelize, Booking, Bus, User, Route } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  // Get admin dashboard
  getDashboard: async (req, res) => {
    try {
      // Get counts for dashboard stats
      const userCount = await User.count();
      const busCount = await Bus.count();
      const routeCount = await Route.count();
      const bookingCount = await Booking.count();
      
      // Get pending bookings
      const pendingBookings = await Booking.count({ 
        where: { status: 'pending' } 
      });
      
      // Get today's bookings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayBookings = await Booking.count({
        where: {
          bookingDate: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        }
      });
      
      // Get revenue stats
      const totalRevenue = await Booking.sum('totalAmount', {
        where: {
          status: {
            [Op.ne]: 'cancelled'
          }
        }
      });
      
      const monthlyRevenue = await Booking.sum('totalAmount', {
        where: {
          status: {
            [Op.ne]: 'cancelled'
          },
          bookingDate: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });
      
      // Get recent bookings
      const recentBookings = await Booking.findAll({
        include: [
          { model: User },
          { 
            model: Bus,
            include: [{ model: Route }]
          }
        ],
        order: [['bookingDate', 'DESC']],
        limit: 5
      });
      
      res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        stats: {
          users: userCount,
          buses: busCount,
          routes: routeCount,
          bookings: bookingCount,
          pendingBookings,
          todayBookings,
          totalRevenue: totalRevenue || 0,
          monthlyRevenue: monthlyRevenue || 0
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
