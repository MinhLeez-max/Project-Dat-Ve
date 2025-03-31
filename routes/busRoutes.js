const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const { ensureAuthenticated } = require('../middleware/auth');

// Search buses
router.get('/search', busController.getSearchForm);
router.post('/search', busController.searchBuses);

// Get bus details and available seats
router.get('/:id', ensureAuthenticated, busController.getBusDetails);

module.exports = router;
