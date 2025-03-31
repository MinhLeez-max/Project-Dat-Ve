const Route = require('../models/Route');
const Bus = require('../models/Bus');

module.exports = {
  // Get all routes
  getAllRoutes: async (req, res) => {
    try {
      const routes = await Route.find().sort({ departureCity: 1 });
      
      res.render('admin/routes', {
        title: 'Manage Routes',
        routes
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error fetching routes');
      res.redirect('/admin/dashboard');
    }
  },

  // Render add route form
  getAddRoute: (req, res) => {
    res.render('admin/routes', {
      title: 'Add New Route',
      addRoute: true
    });
  },

  // Add new route
  addRoute: async (req, res) => {
    try {
      const { departureCity, arrivalCity, distance, estimatedDuration } = req.body;
      
      // Validate input
      if (!departureCity || !arrivalCity || !distance || !estimatedDuration) {
        req.flash('error_msg', 'Please fill in all fields');
        return res.redirect('/admin/routes/add');
      }

      // Check if route already exists
      const existingRoute = await Route.findOne({ 
        departureCity: departureCity,
        arrivalCity: arrivalCity
      });

      if (existingRoute) {
        req.flash('error_msg', 'This route already exists');
        return res.redirect('/admin/routes/add');
      }

      // Create and save new route
      const newRoute = new Route({
        departureCity,
        arrivalCity,
        distance,
        estimatedDuration
      });

      await newRoute.save();
      
      req.flash('success_msg', 'New route added successfully');
      res.redirect('/admin/routes');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error adding new route');
      res.redirect('/admin/routes');
    }
  },

  // Get route by ID
  getRoute: async (req, res) => {
    try {
      const route = await Route.findById(req.params.id);
      
      if (!route) {
        req.flash('error_msg', 'Route not found');
        return res.redirect('/admin/routes');
      }
      
      res.render('admin/routes', {
        title: 'Edit Route',
        route,
        editRoute: true
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error fetching route');
      res.redirect('/admin/routes');
    }
  },

  // Update route
  updateRoute: async (req, res) => {
    try {
      const { departureCity, arrivalCity, distance, estimatedDuration } = req.body;
      
      // Validate input
      if (!departureCity || !arrivalCity || !distance || !estimatedDuration) {
        req.flash('error_msg', 'Please fill in all fields');
        return res.redirect(`/admin/routes/${req.params.id}`);
      }

      // Find and update route
      const route = await Route.findById(req.params.id);
      
      if (!route) {
        req.flash('error_msg', 'Route not found');
        return res.redirect('/admin/routes');
      }
      
      route.departureCity = departureCity;
      route.arrivalCity = arrivalCity;
      route.distance = distance;
      route.estimatedDuration = estimatedDuration;
      
      await route.save();
      
      req.flash('success_msg', 'Route updated successfully');
      res.redirect('/admin/routes');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error updating route');
      res.redirect('/admin/routes');
    }
  },

  // Delete route
  deleteRoute: async (req, res) => {
    try {
      // Check if route is being used by any buses
      const buses = await Bus.find({ routeId: req.params.id });
      
      if (buses.length > 0) {
        req.flash('error_msg', 'Cannot delete route with active buses. Remove buses first.');
        return res.redirect('/admin/routes');
      }
      
      // Find and delete route
      await Route.findByIdAndDelete(req.params.id);
      
      req.flash('success_msg', 'Route deleted successfully');
      res.redirect('/admin/routes');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error deleting route');
      res.redirect('/admin/routes');
    }
  },

  // Get unique cities for search autocomplete
  getUniqueCities: async (req, res) => {
    try {
      // Get unique departure cities
      const departureCities = await Route.distinct('departureCity');
      
      // Get unique arrival cities
      const arrivalCities = await Route.distinct('arrivalCity');
      
      // Combine and remove duplicates
      const uniqueCities = [...new Set([...departureCities, ...arrivalCities])];
      
      res.json(uniqueCities);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
};
