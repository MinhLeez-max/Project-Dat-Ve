const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Booking = require('../models/Booking');

module.exports = {
  // Get search form
  getSearchForm: async (req, res) => {
    try {
      // Get unique departure cities
      const departureCities = await Route.distinct('departureCity');
      
      // Get unique arrival cities
      const arrivalCities = await Route.distinct('arrivalCity');
      
      res.render('bus/search', {
        title: 'Search Buses',
        departureCities,
        arrivalCities
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading search page');
      res.redirect('/');
    }
  },

  // Search buses
  searchBuses: async (req, res) => {
    try {
      const { departureCity, arrivalCity, departureDate } = req.body;
      
      // Validate input
      if (!departureCity || !arrivalCity || !departureDate) {
        req.flash('error_msg', 'Please fill in all fields');
        return res.redirect('/buses/search');
      }

      // Find route IDs matching the search criteria
      const routes = await Route.find({
        departureCity,
        arrivalCity
      });

      if (routes.length === 0) {
        req.flash('error_msg', 'No routes found for the selected cities');
        return res.redirect('/buses/search');
      }

      const routeIds = routes.map(route => route._id);

      // Set date range for search
      const date = new Date(departureDate);
      const nextDay = new Date(departureDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Find buses for these routes and date
      const buses = await Bus.find({
        routeId: { $in: routeIds },
        departureTime: {
          $gte: date,
          $lt: nextDay
        },
        available: true
      }).populate('routeId');

      res.render('bus/results', {
        title: 'Bus Results',
        buses,
        departureCity,
        arrivalCity,
        departureDate
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error searching buses');
      res.redirect('/buses/search');
    }
  },

  // Get bus details and available seats
  getBusDetails: async (req, res) => {
    try {
      const busId = req.params.id;
      const journeyDate = req.query.date;
      
      // Find bus with details
      const bus = await Bus.findById(busId).populate('routeId');
      
      if (!bus) {
        req.flash('error_msg', 'Bus not found');
        return res.redirect('/buses/search');
      }

      // Find existing bookings for this bus and date to determine booked seats
      const bookings = await Booking.find({
        busId,
        journeyDate: { 
          $gte: new Date(journeyDate),
          $lt: new Date(new Date(journeyDate).setDate(new Date(journeyDate).getDate() + 1))
        },
        status: { $ne: 'cancelled' }
      });

      // Create an array of already booked seats
      const bookedSeats = [];
      bookings.forEach(booking => {
        booking.seats.forEach(seat => {
          bookedSeats.push(seat.seatNumber);
        });
      });

      res.render('booking/select-seats', {
        title: 'Select Seats',
        bus,
        journeyDate,
        bookedSeats
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error fetching bus details');
      res.redirect('/buses/search');
    }
  },

  // Admin: Get all buses
  getAllBuses: async (req, res) => {
    try {
      const buses = await Bus.find()
        .populate('routeId')
        .sort({ departureTime: 1 });
      
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
      const routes = await Route.find().sort({ departureCity: 1 });
      
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
      const existingBus = await Bus.findOne({ busNumber });
      
      if (existingBus) {
        req.flash('error_msg', 'A bus with this number already exists');
        return res.redirect('/admin/buses/add');
      }

      // Create new bus
      const newBus = new Bus({
        routeId,
        busNumber,
        busName,
        busType,
        totalSeats,
        departureTime,
        arrivalTime,
        price,
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

      await newBus.save();
      
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
      const bus = await Bus.findById(req.params.id);
      const routes = await Route.find().sort({ departureCity: 1 });
      
      if (!bus) {
        req.flash('error_msg', 'Bus not found');
        return res.redirect('/admin/buses');
      }
      
      res.render('admin/buses', {
        title: 'Edit Bus',
        bus,
        routes,
        editBus: true
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error fetching bus');
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
        req.flash('error_msg', 'Please fill in all required fields');
        return res.redirect(`/admin/buses/${req.params.id}`);
      }

      // Find bus
      const bus = await Bus.findById(req.params.id);
      
      if (!bus) {
        req.flash('error_msg', 'Bus not found');
        return res.redirect('/admin/buses');
      }
      
      // Check if bus number already exists (except for this bus)
      if (busNumber !== bus.busNumber) {
        const existingBus = await Bus.findOne({ busNumber });
        
        if (existingBus) {
          req.flash('error_msg', 'A bus with this number already exists');
          return res.redirect(`/admin/buses/${req.params.id}`);
        }
      }

      // Update bus
      bus.routeId = routeId;
      bus.busNumber = busNumber;
      bus.busName = busName;
      bus.busType = busType;
      bus.totalSeats = totalSeats;
      bus.departureTime = departureTime;
      bus.arrivalTime = arrivalTime;
      bus.price = price;
      bus.available = available === 'on';
      bus.amenities = {
        wifi: wifi === 'on',
        usb: usb === 'on',
        food: food === 'on',
        waterBottle: waterBottle === 'on',
        blanket: blanket === 'on',
        entertainment: entertainment === 'on'
      };
      bus.seatLayout = {
        rows,
        columns,
        layout
      };
      
      await bus.save();
      
      req.flash('success_msg', 'Bus updated successfully');
      res.redirect('/admin/buses');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error updating bus');
      res.redirect('/admin/buses');
    }
  },

  // Admin: Delete bus
  deleteBus: async (req, res) => {
    try {
      // Check if bus has any active bookings
      const bookings = await Booking.find({ 
        busId: req.params.id,
        status: { $ne: 'cancelled' },
        journeyDate: { $gte: new Date() }
      });
      
      if (bookings.length > 0) {
        req.flash('error_msg', 'Cannot delete bus with active bookings');
        return res.redirect('/admin/buses');
      }
      
      // Find and delete bus
      await Bus.findByIdAndDelete(req.params.id);
      
      req.flash('success_msg', 'Bus deleted successfully');
      res.redirect('/admin/buses');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error deleting bus');
      res.redirect('/admin/buses');
    }
  }
};
