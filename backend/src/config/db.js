const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
};

module.exports = connectDB;
