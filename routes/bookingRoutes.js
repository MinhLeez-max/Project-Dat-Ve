const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { ensureAuthenticated } = require('../middleware/auth');

// Process selected seats
router.post('/select-seats', ensureAuthenticated, bookingController.processSelectedSeats);

// Passenger details
router.get('/passenger-details', ensureAuthenticated, (req, res) => {
  if (!req.session.bookingData) {
    req.flash('error_msg', 'Booking session expired');
    return res.redirect('/buses/search');
  }
  res.render('booking/passenger-details', {
    title: 'Chi tiết hành khách',
    seats: req.session.bookingData.selectedSeats,
    bus: req.session.bookingData.bus,
    journeyDate: req.session.bookingData.journeyDate,
    totalAmount: req.session.bookingData.totalAmount
  });
});
router.post('/passenger-details', ensureAuthenticated, bookingController.processPassengerDetails);

// Payment
router.get('/payment', ensureAuthenticated, (req, res) => {
  if (!req.session.bookingData) {
    req.flash('error_msg', 'Booking session expired');
    return res.redirect('/buses/search');
  }
  res.render('booking/payment', {
    title: 'Payment',
    bookingData: req.session.bookingData
  });
});
router.post('/payment', ensureAuthenticated, bookingController.processPayment);

// Booking confirmation
router.get('/:id/confirmation', ensureAuthenticated, bookingController.getBookingConfirmation);

// My bookings
router.get('/my-bookings', ensureAuthenticated, bookingController.getMyBookings);

// Cancel booking
router.post('/:id/cancel', ensureAuthenticated, bookingController.cancelBooking);

module.exports = router;
