const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/SwasthyaSetu';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection warning: ${error.message}`);
    console.warn(`WARNING: Could not connect to MongoDB at ${uri}. Ensure MongoDB service is running or provide a valid MONGO_URI in backend/.env. Running with graceful in-memory fallbacks.`);
  }

  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB runtime connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Reconnection will be attempted automatically.');
  });
};

module.exports = connectDB;
