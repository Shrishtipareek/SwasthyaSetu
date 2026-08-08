import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, Box, CssBaseline } from '@mui/material';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CareAIChat from './components/CareAIChat';
import EmergencyModal from './components/EmergencyModal';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import ResourceNetwork from './pages/ResourceNetwork';
import HospitalSearch from './pages/HospitalSearch';
import PublicDashboard from './pages/PublicDashboard';
import BloodDirectory from './pages/BloodDirectory';
import Campaigns from './pages/Campaigns';
import AdminDashboard from './pages/AdminDashboard';

// Custom MUI trustworthy theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0ea5e9', // Blue/Teal healthcare primary
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0d9488', // Green teal secondary
    },
    error: {
      main: '#ef4444', // Red emergency
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

function App() {
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Box display="flex" flexDirection="column" minHeight="100vh">
              <Navbar onEmergencyClick={() => setEmergencyOpen(true)} />
              
              <Box component="main" flexGrow={1}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage onEmergencyClick={() => setEmergencyOpen(true)} />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/public-dashboard" element={<PublicDashboard />} />
                  <Route path="/search-hospitals" element={<HospitalSearch />} />
                  <Route path="/blood-donors" element={<BloodDirectory />} />
                  <Route path="/campaigns" element={<Campaigns />} />

                  {/* Patient Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['patient']}>
                        <UserDashboard onEmergencyClick={() => setEmergencyOpen(true)} />
                      </ProtectedRoute>
                    }
                  />

                  {/* Hospital Routes */}
                  <Route
                    path="/hospital-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['hospital']}>
                        <HospitalDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/resource-network"
                    element={
                      <ProtectedRoute allowedRoles={['hospital']}>
                        <ResourceNetwork />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Box>

              <Footer />
              
              {/* Global Floating chatbot CareAI */}
              <CareAIChat onEmergencyClick={() => setEmergencyOpen(true)} />

              {/* Global Emergency Locator and Notification Dispatch modal */}
              <EmergencyModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
            </Box>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
