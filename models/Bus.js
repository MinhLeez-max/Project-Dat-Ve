const mongoose = require('mongoose');

const BusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  busNumber: {
    type: String,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  departureDate: {
    type: Date,
    required: true
  },
  departureTime: {
    type: String,
    required: true
  },
  arrivalDate: {
    type: Date,
    required: true
  },
  arrivalTime: {
    type: String,
    required: true
  },
  fare: {
    type: Number,
    required: true
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  amenities: {
    type: Object,
    default: {
      wifi: false,
      usb: false,
      food: false,
      waterBottle: false,
      blanket: false,
      entertainment: false
    }
  },
  seatLayout: {
    type: Object,
    default: {
      rows: 10,
      columns: 4,
      layout: '2-2'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Bus', BusSchema);