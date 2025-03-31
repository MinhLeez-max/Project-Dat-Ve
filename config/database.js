const { Sequelize } = require('sequelize');

// Create a new Sequelize instance with the DATABASE_URL from environment variables
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Database connected successfully');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.log("Continuing without database connection...");
  }
};

module.exports = { sequelize, connectDB };