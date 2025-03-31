const mongoose = require('mongoose');

const BusSchema = new mongoose.Schema({
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  busNumber: {
    type: String,
    required: true,
    unique: true
  },
  busName: {
    type: String,
    required: true
  },
  busType: {
    type: String,
    enum: ['Regular', 'Sleeper', 'AC', 'Deluxe'],
    required: true
  },
  totalSeats: {
    type: Number,
    required: true
  },
  departureTime: {
    type: Date,
    required: true
  },
  arrivalTime: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  amenities: {
    wifi: { type: Boolean, default: false },
    usb: { type: Boolean, default: false },
    food: { type: Boolean, default: false },
    waterBottle: { type: Boolean, default: false },
    blanket: { type: Boolean, default: false },
    entertainment: { type: Boolean, default: false }
  },
  available: {
    type: Boolean,
    default: true
  },
  seatLayout: {
    rows: { type: Number, required: true },
    columns: { type: Number, required: true },
    layout: {
      type: String,
      enum: ['2-2', '2-1', '1-1', '3-2'],
      default: '2-2'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add compound index for searching
BusSchema.index({ routeId: 1, departureTime: 1 });

module.exports = mongoose.model('Bus', BusSchema);
