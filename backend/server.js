const dotenv = require('dotenv');
dotenv.config();

// Validate Environment Variables before server startup
const validateEnv = require('./config/validateEnv');
validateEnv();

const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const socketManager = require('./sockets/socketManager');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { securityHeaders, createRateLimiter } = require('./middleware/securityMiddleware');
const requestLogger = require('./middleware/loggerMiddleware');

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

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketManager(server);
app.set('socketio', io);

// Security Headers (Helmet standard)
app.use(securityHeaders);

// HTTP Request Logger (Morgan standard)
app.use(requestLogger);

// CORS Whitelist Configuration
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173']
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('CORS Policy: Request origin blocked by Access-Control-Allow-Origin'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers with 5MB payload limit
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Rate Limiters
const globalLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 300, message: 'Too many requests. Please slow down.' });
const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 40, message: 'Too many authentication attempts. Please try again in 15 minutes.' });
const aiLimiter = createRateLimiter({ windowMs: 1 * 60 * 1000, max: 20, message: 'CareAI request limit reached. Please wait a moment before sending more messages.' });
const emergencyLimiter = createRateLimiter({ windowMs: 1 * 60 * 1000, max: 15, message: 'Emergency dispatch rate limit reached.' });

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/emergency', emergencyLimiter, emergencyRoutes);

// Other API Routes
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/resource-requests', resourceRequestRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blood-donors', bloodDonorRoutes);
app.use('/api/documents', medicalDocumentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SwasthyaSetu API',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SwasthyaSetu emergency healthcare coordination platform API.' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`SwasthyaSetu Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
