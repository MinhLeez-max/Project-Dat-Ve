// File này không còn được sử dụng vì chúng ta đã chuyển sang sử dụng Sequelize
// Tất cả models đã được định nghĩa trong models/index.js
// Giữ file này để tham khảo

const BookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  seats: [{
    seatNumber: { type: String, required: true },
    passengerName: { type: String, required: true },
    passengerAge: { type: Number, required: true },
    passengerGender: { type: String, enum: ['Male', 'Female', 'Other'], required: true }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  journeyDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'banking', 'e-wallet'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  bookingReference: {
    type: String,
    unique: true  // This implicitly creates an index
  }
});

// Generate unique booking reference before saving
BookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    // Generate a random alphanumeric string for booking reference
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let bookingRef = '';
    for (let i = 0; i < 8; i++) {
      bookingRef += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.bookingReference = `VX${bookingRef}`;
  }
  next();
});

// Add index for faster lookups
BookingSchema.index({ userId: 1, bookingDate: -1 });
BookingSchema.index({ busId: 1, journeyDate: 1 });
// Unique index is automatically created by the 'unique: true' property on bookingReference

module.exports = mongoose.model('Booking', BookingSchema);
