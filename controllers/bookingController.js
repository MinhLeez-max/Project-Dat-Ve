const { sequelize, Booking, Bus, User, Route } = require('../models');

module.exports = {
  // Process selected seats and render passenger details form
  processSelectedSeats: async (req, res) => {
    try {
      const { busId, journeyDate, selectedSeats } = req.body;
      
      // Validate input
      if (!busId || !journeyDate || !selectedSeats) {
        req.flash('error_msg', 'Please select at least one seat');
        return res.redirect(`/buses/${busId}?date=${journeyDate}`);
      }

      // Convert selectedSeats to array if it's a string (single seat selected)
      const seats = Array.isArray(selectedSeats) ? selectedSeats : [selectedSeats];
      
      // Get bus details
      const bus = await Bus.findByPk(busId, {
        include: [{ model: Route, as: 'route' }]
      });
      
      if (!bus) {
        req.flash('error_msg', 'Bus not found');
        return res.redirect('/buses/search');
      }

      // Calculate total amount
      const totalAmount = bus.price * seats.length;
      
      // Store booking data in session for the next step
      req.session.bookingData = {
        busId,
        journeyDate,
        selectedSeats: seats,
        totalAmount,
        bus: {
          busName: bus.busName,
          busNumber: bus.busNumber,
          departureCity: bus.routeId.departureCity,
          arrivalCity: bus.routeId.arrivalCity,
          departureTime: bus.departureTime,
          arrivalTime: bus.arrivalTime,
          price: bus.price
        }
      };
      
      res.render('booking/passenger-details', {
        title: 'Passenger Details',
        seats,
        bus,
        journeyDate,
        totalAmount
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error processing selected seats');
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
        req.flash('error_msg', 'Booking session expired');
        return res.redirect('/buses/search');
      }

      // Validate input
      if (!passengerName || !passengerAge || !passengerGender) {
        req.flash('error_msg', 'Please fill in all passenger details');
        return res.redirect('/bookings/passenger-details');
      }

      // Process passenger data - handle both array and single values
      const seats = [];
      
      // If only one seat is selected
      if (!Array.isArray(passengerName)) {
        seats.push({
          seatNumber: bookingData.selectedSeats[0],
          passengerName,
          passengerAge,
          passengerGender
        });
      } else {
        // If multiple seats are selected
        for (let i = 0; i < passengerName.length; i++) {
          seats.push({
            seatNumber: bookingData.selectedSeats[i],
            passengerName: passengerName[i],
            passengerAge: passengerAge[i],
            passengerGender: passengerGender[i]
          });
        }
      }
      
      // Update booking data in session
      req.session.bookingData.seats = seats;
      
      res.render('booking/payment', {
        title: 'Payment',
        bookingData: req.session.bookingData
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error processing passenger details');
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
        req.flash('error_msg', 'Booking session expired');
        return res.redirect('/buses/search');
      }

      // Validate input
      if (!paymentMethod) {
        req.flash('error_msg', 'Please select a payment method');
        return res.redirect('/bookings/payment');
      }

      // Ensure user is logged in
      if (!req.session.user) {
        req.flash('error_msg', 'Please log in to complete booking');
        return res.redirect('/login');
      }

      // Create new booking
      const newBooking = await Booking.create({
        userId: req.session.user.id,
        busId: bookingData.busId,
        seats: bookingData.seats,
        totalAmount: bookingData.totalAmount,
        journeyDate: new Date(bookingData.journeyDate),
        paymentMethod,
        status: 'confirmed',
        paymentStatus: 'completed',
        bookingDate: new Date()
      });
      
      // Clear booking data from session
      delete req.session.bookingData;
      
      // Send confirmation email (mock for now)
      // emailService.sendBookingConfirmation(newBooking);
      
      req.flash('success_msg', 'Booking confirmed successfully');
      res.redirect(`/bookings/${newBooking._id}/confirmation`);
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error processing payment');
      res.redirect('/bookings/payment');
    }
  },

  // Get booking confirmation
  getBookingConfirmation: async (req, res) => {
    try {
      const booking = await Booking.findByPk(req.params.id, {
        include: [
          { model: User, as: 'user' },
          { 
            model: Bus, 
            as: 'bus',
            include: [{ model: Route, as: 'route' }]
          }
        ]
      });
      
      if (!booking) {
        req.flash('error_msg', 'Booking not found');
        return res.redirect('/');
      }

      // Check if booking belongs to logged in user
      if (booking.userId !== req.session.user.id) {
        req.flash('error_msg', 'Unauthorized access');
        return res.redirect('/');
      }
      
      // Bus and route details are already included through the associations
      
      res.render('booking/confirmation', {
        title: 'Booking Confirmation',
        booking
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error fetching booking confirmation');
      res.redirect('/');
    }
  },

  // Get my bookings
  getMyBookings: async (req, res) => {
    try {
      const bookings = await Booking.findAll({
        where: { userId: req.session.user.id },
        include: [
          { 
            model: Bus, 
            as: 'bus',
            include: [{ model: Route, as: 'route' }]
          }
        ],
        order: [['bookingDate', 'DESC']]
      });
      
      res.render('booking/my-bookings', {
        title: 'My Bookings',
        bookings
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error fetching your bookings');
      res.redirect('/');
    }
  },

  // Cancel booking
  cancelBooking: async (req, res) => {
    try {
      const booking = await Booking.findByPk(req.params.id);
      
      if (!booking) {
        req.flash('error_msg', 'Booking not found');
        return res.redirect('/bookings/my-bookings');
      }

      // Check if booking belongs to logged in user
      if (booking.userId !== req.session.user.id) {
        req.flash('error_msg', 'Unauthorized access');
        return res.redirect('/bookings/my-bookings');
      }

      // Check if booking can be cancelled (not past journey date)
      const journeyDate = new Date(booking.journeyDate);
      const currentDate = new Date();
      
      if (journeyDate < currentDate) {
        req.flash('error_msg', 'Cannot cancel past bookings');
        return res.redirect('/bookings/my-bookings');
      }

      // Update booking status
      booking.status = 'cancelled';
      booking.paymentStatus = 'refunded';
      
      await booking.save();
      
      req.flash('success_msg', 'Booking cancelled successfully');
      res.redirect('/bookings/my-bookings');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error cancelling booking');
      res.redirect('/bookings/my-bookings');
    }
  },

  // Admin: Get all bookings
  getAllBookings: async (req, res) => {
    try {
      // Pagination
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const skip = (page - 1) * limit;
      
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
          { model: User, as: 'user' },
          { 
            model: Bus, 
            as: 'bus',
            include: [{ model: Route, as: 'route' }]
          }
        ],
        order: [['bookingDate', 'DESC']],
        offset: skip,
        limit
      });
      
      res.render('admin/bookings', {
        title: 'Manage Bookings',
        bookings,
        currentPage: page,
        totalPages: Math.ceil(totalBookings / limit),
        totalBookings,
        filter: req.query
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error fetching bookings');
      res.redirect('/admin/dashboard');
    }
  },

  // Admin: Update booking status
  updateBookingStatus: async (req, res) => {
    try {
      const { status, paymentStatus } = req.body;
      
      // Validate input
      if (!status || !paymentStatus) {
        req.flash('error_msg', 'Please select both status and payment status');
        return res.redirect(`/admin/bookings/${req.params.id}`);
      }

      // Find and update booking
      const booking = await Booking.findByPk(req.params.id);
      
      if (!booking) {
        req.flash('error_msg', 'Booking not found');
        return res.redirect('/admin/bookings');
      }
      
      booking.status = status;
      booking.paymentStatus = paymentStatus;
      
      await booking.save();
      
      req.flash('success_msg', 'Booking status updated successfully');
      res.redirect('/admin/bookings');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error updating booking status');
      res.redirect('/admin/bookings');
    }
  }
};
