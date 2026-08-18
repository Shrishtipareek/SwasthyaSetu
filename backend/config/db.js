const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/SwasthyaSetu', {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    console.warn(`WARNING: Could not connect to MongoDB at ${process.env.MONGO_URI || 'mongodb://localhost:27017/SwasthyaSetu'}. Please ensure MongoDB service is running or provide a valid MONGO_URI in backend/.env`);
  }
};

module.exports = connectDB;
