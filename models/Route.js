const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  departureCity: { type: String, required: true },
  arrivalCity: { type: String, required: true },
  distance: { type: Number, required: true },
  estimatedDuration: { type: String, required: true },
  reatedAt: { type: Date, default: Date.now }
},{
timestamps: true
});
module.exports = mongoose.model('Route', routeSchema);