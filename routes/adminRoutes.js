const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const routeController = require('../controllers/routeController');
const busController = require('../controllers/busController');
const bookingController = require('../controllers/bookingController');
const { ensureAdmin } = require('../middleware/adminAuth');

// Admin dashboard
router.get('/dashboard', ensureAdmin, adminController.getDashboard);

// Routes management
router.get('/routes', ensureAdmin, routeController.getAllRoutes);
router.get('/routes/add', ensureAdmin, routeController.getAddRoute);
router.post('/routes', ensureAdmin, routeController.addRoute);
router.get('/routes/:id', ensureAdmin, routeController.getRoute);
router.put('/routes/:id', ensureAdmin, routeController.updateRoute);
router.delete('/routes/:id', ensureAdmin, routeController.deleteRoute);

// Buses management
router.get('/buses', ensureAdmin, busController.getAllBuses);
router.get('/buses/add', ensureAdmin, busController.getAddBus);
router.post('/buses', ensureAdmin, busController.addBus);
router.get('/buses/:id', ensureAdmin, busController.getBus);
router.put('/buses/:id', ensureAdmin, busController.updateBus);
router.delete('/buses/:id', ensureAdmin, busController.deleteBus);

// Bookings management
router.get('/bookings', ensureAdmin, bookingController.getAllBookings);
router.put('/bookings/:id', ensureAdmin, bookingController.updateBookingStatus);

module.exports = router;
