const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
  departureCity: {
    type: String,
    required: true
  },
  arrivalCity: {
    type: String,
    required: true
  },
  distance: {
    type: Number,  // in km
    required: true
  },
  estimatedDuration: {
    type: Number,  // in minutes
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for faster searching
RouteSchema.index({ departureCity: 1, arrivalCity: 1 });

module.exports = mongoose.model('Route', RouteSchema);
