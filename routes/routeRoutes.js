const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');

// Get unique cities for search autocomplete
router.get('/cities', routeController.getUniqueCities);

module.exports = router;
