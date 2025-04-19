require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Route, Bus } = require('./models');

// Kết nối trực tiếp tới cơ sở dữ liệu
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/project';

console.log('Đang kết nối tới MongoDB...');
mongoose.connect(MONGO_URI)
  .then(() => console.log('Kết nối MongoDB thành công...'))
  .catch(err => {
    console.error('Lỗi kết nối MongoDB:', err.message);
    process.exit(1);
  });

// Dữ liệu mẫu
const routes = [
  {
    departureCity: 'Hà Nội',
    arrivalCity: 'Hồ Chí Minh',
    distance: 1720,
    estimatedDuration: '32 giờ'
  },
  {
    departureCity: 'Hà Nội',
    arrivalCity: 'Đà Nẵng',
    distance: 780,
    estimatedDuration: '14 giờ'
  },
  {
    departureCity: 'Hồ Chí Minh',
    arrivalCity: 'Đà Lạt',
    distance: 310,
    estimatedDuration: '8 giờ'
  },
  {
    departureCity: 'Hồ Chí Minh',
    arrivalCity: 'Cần Thơ',
    distance: 170,
    estimatedDuration: '4 giờ'
  },
  {
    departureCity: 'Đà Nẵng',
    arrivalCity: 'Hội An',
    distance: 30,
    estimatedDuration: '45 phút'
  },
  {
    departureCity: 'Đà Nẵng',
    arrivalCity: 'Huế',
    distance: 100,
    estimatedDuration: '2 giờ'
  }
];

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '0123456789',
    password: '123456',
    isAdmin: true
  },
  {
    name: 'Regular User',
    email: 'user@example.com',
    phone: '0987654321',
    password: 'password123',
    isAdmin: false
  }
];

// Hàm seed dữ liệu
const seedData = async () => {
  try {
    // Xóa dữ liệu cũ
    await User.deleteMany({});
    await Route.deleteMany({});
    await Bus.deleteMany({});

    console.log('Dữ liệu cũ đã được xóa thành công');

    // Tạo người dùng
    const createdUsers = [];
    for (const user of users) {
      const newUser = new User(user); // Không cần hash password thủ công
      const savedUser = await newUser.save(); // Middleware sẽ tự động hash
      createdUsers.push(savedUser);
    }

    console.log('Người dùng đã được tạo thành công');

    // Tạo tuyến đường
    const createdRoutes = [];
    for (const route of routes) {
      const newRoute = new Route(route);
      const savedRoute = await newRoute.save();
      createdRoutes.push(savedRoute);
    }

    console.log('Tuyến đường đã được tạo thành công');

    // Tạo xe buýt cho từng tuyến đường
    for (const route of createdRoutes) {
      // Tạo xe buýt
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const newBus1 = new Bus({
        name: 'Xe Giường Nằm',
        busNumber: `XE${Math.floor(1000 + Math.random() * 9000)}`,
        capacity: 40,
        type: 'sleeper',
        departureDate: today,
        departureTime: '08:00',
        arrivalDate: today,
        arrivalTime: '16:00',
        fare: 350000,
        route: route._id,
        amenities: {
          wifi: true,
          usb: true,
          food: true,
          waterBottle: true,
          blanket: true,
          entertainment: true
        },
        seatLayout: {
          rows: 10,
          columns: 4,
          layout: '2-2'
        }
      });

      const newBus2 = new Bus({
        name: 'Xe Ghế Ngồi',
        busNumber: `XE${Math.floor(1000 + Math.random() * 9000)}`,
        capacity: 50,
        type: 'seater',
        departureDate: tomorrow,
        departureTime: '06:00',
        arrivalDate: tomorrow,
        arrivalTime: '14:00',
        fare: 250000,
        route: route._id,
        amenities: {
          wifi: true,
          usb: true,
          food: false,
          waterBottle: true,
          blanket: false,
          entertainment: false
        },
        seatLayout: {
          rows: 10,
          columns: 5,
          layout: '2-1-2'
        }
      });

      await newBus1.save();
      await newBus2.save();
    }

    console.log('Xe buýt đã được tạo thành công');
    console.log('Tất cả dữ liệu đã được seed thành công');
    process.exit();
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  }
};

seedData();