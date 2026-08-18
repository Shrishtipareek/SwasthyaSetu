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
import SymptomChecker from './pages/SymptomChecker';

// Custom MUI medical teal theme (Image 1 reference style)
const theme = createTheme({
  palette: {
    primary: {
      main: '#0F766E', // Primary teal
      light: '#14B8A6',
      dark: '#115E59',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0D9488', // Green teal secondary
      light: '#E6F6F3',
    },
    error: {
      main: '#ef4444', // Red emergency
    },
    background: {
      default: '#F7FAFA',
      paper: '#ffffff',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em', color: '#0F172A' },
    h5: { fontWeight: 700, color: '#0F172A' },
    h6: { fontWeight: 600, color: '#0F172A' },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          padding: '8px 20px',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 14px rgba(15, 118, 110, 0.2)',
          },
        },
        containedPrimary: {
          backgroundColor: '#0F766E',
          '&:hover': {
            backgroundColor: '#0D9488',
          },
        },
        outlinedPrimary: {
          borderColor: '#0F766E',
          color: '#0F766E',
          '&:hover': {
            backgroundColor: '#E6F6F3',
            borderColor: '#0F766E',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
          border: '1px solid #E2E8F0',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 20px 0 rgba(15, 118, 110, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E2E8F0',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0F766E',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0F766E',
            borderWidth: 2,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
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
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar onEmergencyClick={() => setEmergencyOpen(true)} />
              
              <Box component="main" sx={{ flexGrow: 1 }}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage onEmergencyClick={() => setEmergencyOpen(true)} />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/public-dashboard" element={<PublicDashboard />} />
                  <Route path="/search-hospitals" element={<HospitalSearch />} />
                  <Route path="/blood-donors" element={<BloodDirectory />} />
                  <Route path="/campaigns" element={<Campaigns />} />
                  <Route path="/symptom-checker" element={<SymptomChecker onEmergencyClick={() => setEmergencyOpen(true)} />} />

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
