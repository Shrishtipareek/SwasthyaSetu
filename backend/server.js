// Load environment variables FIRST so every module sees them at require-time.
const dotenv = require('dotenv');
dotenv.config();

// Validate environment variables before anything else reads them.
const validateEnv = require('./config/validateEnv');
validateEnv();

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { corsOrigin } = require('./config/cors');
const socketManager = require('./sockets/socketManager');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { securityHeaders, apiLimiter, authLimiter, aiLimiter, emergencyLimiter } = require('./middleware/securityMiddleware');
const requestLogger = require('./middleware/loggerMiddleware');
const { isDbConnected } = require('./utils/http');

// Route imports
const authRoutes = require('./routes/authRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const resourceRequestRoutes = require('./routes/resourceRequestRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const aiRoutes = require('./routes/aiRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bloodDonorRoutes = require('./routes/bloodDonorRoutes');
const medicalDocumentRoutes = require('./routes/medicalDocumentRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketManager(server);
app.set('socketio', io); // Attach socketio instance to express app

if (process.env.TRUST_PROXY) {
  // e.g. TRUST_PROXY=1 behind a single reverse proxy, so rate limiting sees client IPs.
  app.set('trust proxy', /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);
}

// Middleware
app.disable('x-powered-by');
app.use(securityHeaders);
if (process.env.LOG_REQUESTS !== 'false') {
  app.use(requestLogger);
}
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// 5MB leaves room for base64 medical document uploads.
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Rate limiting
app.use('/api', apiLimiter);
app.use(['/api/auth/login', '/api/auth/register', '/api/auth/register-hospital'], authLimiter);
app.use('/api/ai', aiLimiter);
app.use('/api/emergency', emergencyLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/resource-requests', resourceRequestRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blood-donors', bloodDonorRoutes);
app.use('/api/documents', medicalDocumentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: isDbConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    service: 'SwasthyaSetu API',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SwasthyaSetu emergency healthcare coordination platform API.' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or set a different PORT in backend/.env`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down SwasthyaSetu server...`);
  // io.close() disconnects sockets and closes the HTTP server.
  io.close(() => {
    mongoose.connection.close(false).finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 5000).unref();
};

if (require.main === module) {
  connectDB();
  server.listen(PORT, () => {
    console.log(`SwasthyaSetu Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = { app, server };
