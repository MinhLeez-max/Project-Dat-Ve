const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// User Model
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Route Model
const Route = sequelize.define('Route', {
  departureCity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  arrivalCity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  distance: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estimatedDuration: {
    type: DataTypes.INTEGER, // Thời gian di chuyển (tính bằng phút)
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Bus Model
const Bus = sequelize.define('Bus', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  busNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING, // e.g. Sleeper, AC, Non-AC
    allowNull: false
  },
  departureDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  departureTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  arrivalDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  arrivalTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  fare: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Booking Model
const Booking = sequelize.define('Booking', {
  seatNumbers: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  passengerDetails: {
    type: DataTypes.JSON,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING, // "confirmed", "cancelled", "pending"
    defaultValue: 'pending'
  },
  bookingDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  paymentStatus: {
    type: DataTypes.STRING, // "paid", "unpaid", "refunded"
    defaultValue: 'unpaid'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Set up relationships
Route.hasMany(Bus);
Bus.belongsTo(Route);

Bus.hasMany(Booking);
Booking.belongsTo(Bus);

User.hasMany(Booking);
Booking.belongsTo(User);

// Sync all models with the database
const syncModels = async () => {
  try {
    await sequelize.sync();
    console.log('Models synchronized with database');
  } catch (error) {
    console.error('Error syncing models:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Route,
  Bus,
  Booking,
  syncModels
};