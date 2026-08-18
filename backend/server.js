const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const socketManager = require('./sockets/socketManager');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

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

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketManager(server);
app.set('socketio', io); // Attach socketio instance to express app

// Middleware
app.use(cors());
app.use(express.json());

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

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SwasthyaSetu emergency healthcare coordination platform API.' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`SwasthyaSetu Server running on port ${PORT}`);
});
