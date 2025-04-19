const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/project",
    );
    console.log(`Kết nối MongoDB thành công: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    console.log("Continuing without database connection...");
  }
};

module.exports = connectDB;