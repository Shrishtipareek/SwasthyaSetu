const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb://localhost:27017/SwasthyaSetu';
const RETRY_DELAY_MS = 5000;
const RETRY_LOG_EVERY = 12; // while retrying, log roughly once a minute

// Fail fast (instead of hanging for 10s per request) when the DB is unavailable,
// so controllers can quickly fall back to demo data or return 503.
mongoose.set('bufferTimeoutMS', 2500);
mongoose.set('strictQuery', true);

let listenersAttached = false;
let retryTimer = null;
let connectedOnce = false;
let failedAttempts = 0;

const attachListeners = () => {
  if (listenersAttached) return;
  listenersAttached = true;
  // Only report connection-state changes after a first successful connection;
  // during start-up retries these events just repeat the connect error.
  mongoose.connection.on('disconnected', () => connectedOnce && console.warn('MongoDB disconnected.'));
  mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected.'));
  mongoose.connection.on('error', (err) => connectedOnce && console.error(`MongoDB error: ${err.message}`));
};

const syncIndexes = async () => {
  try {
    // Make sure index definition changes (e.g. the appointment slot index) are
    // applied to existing databases, not only to fresh ones.
    const Appointment = require('../models/Appointment');
    await Appointment.syncIndexes();
  } catch (error) {
    console.warn(`Index sync warning: ${error.message}`);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI || DEFAULT_URI;
  attachListeners();
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    connectedOnce = true;
    if (failedAttempts > 0) console.log(`MongoDB became reachable after ${failedAttempts} failed attempt(s).`);
    failedAttempts = 0;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await syncIndexes();
    return conn;
  } catch (error) {
    failedAttempts += 1;
    if (failedAttempts === 1) {
      console.error(`Database connection error: ${error.message}`);
      console.warn(
        `WARNING: Could not connect to MongoDB at ${uri}. Retrying every ${RETRY_DELAY_MS / 1000}s. ` +
          'Public endpoints will serve demo fallback data until the database is reachable.'
      );
    } else if (failedAttempts % RETRY_LOG_EVERY === 0) {
      console.warn(`Still unable to connect to MongoDB (attempt ${failedAttempts}): ${error.message}`);
    }
    clearTimeout(retryTimer);
    retryTimer = setTimeout(connectDB, RETRY_DELAY_MS);
    retryTimer.unref();
    return null;
  }
};

module.exports = connectDB;
