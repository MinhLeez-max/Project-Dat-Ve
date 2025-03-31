const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vexere",
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    console.log("Continuing without database connection...");
    // Instead of exiting, we'll continue running the app without DB
    // process.exit(1);
  }
};

module.exports = connectDB;
