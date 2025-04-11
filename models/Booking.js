const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  seatNumbers: {
    type: [String],
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  passengerDetails: {
    type: Array,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid', 'refunded'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String
  }
});

module.exports = mongoose.model('Booking', BookingSchema);