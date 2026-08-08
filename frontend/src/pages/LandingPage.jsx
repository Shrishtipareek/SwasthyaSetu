import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme
} from '@mui/material';
import {
  Warning as WarningIcon,
  LocalHospital,
  Speed,
  People,
  ExpandMore,
  VerifiedUser,
  Share,
  CalendarMonth,
  SmartToy
} from '@mui/icons-material';
import { hospitalAPI } from '../services/api';

const LandingPage = ({ onEmergencyClick }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    hospitalsConnected: 10,
    availableBeds: 500,
    availableAmbulances: 12,
    bloodUnitsAvailable: 2500,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await hospitalAPI.getStats();
        setStats(data);
      } catch (err) {
        console.warn('Failed to load live metrics, using seeds', err.message);
      }
    };
    fetchStats();
  }, []);

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          pt: { xs: 8, md: 14 },
          pb: { xs: 8, md: 14 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            fontWeight="bold"
            sx={{ fontSize: { xs: '2.5rem', md: '3.75rem' }, mb: 2, lineHeight: 1.2 }}
          >
            Healthcare Help, When You Need It Most.
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: '#94a3b8', mb: 5, maxWidth: '800px', mx: 'auto', fontWeight: 'normal', fontSize: { xs: '1rem', md: '1.25rem' } }}
          >
            Connect with hospitals, find emergency resources, book doctor appointments, and get healthcare assistance — all from one platform.
          </Typography>
          <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<WarningIcon />}
              onClick={onEmergencyClick}
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              Emergency Help
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate('/search-hospitals')}
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              Find Hospital
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              onClick={() => navigate('/login')}
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold', borderColor: '#475569' }}
            >
              Book Appointment
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Aggregate Stats Bar */}
      <Box sx={{ bgcolor: '#ffffff', py: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} textAlign="center">
            {[
              { label: 'Connected Hospitals', value: stats.hospitalsConnected, icon: <LocalHospital color="primary" /> },
              { label: 'Available Beds', value: stats.availableBeds, icon: <Speed color="primary" /> },
              { label: 'Active Ambulances', value: stats.availableAmbulances, icon: <Speed color="primary" /> },
              { label: 'Blood Units Available', value: stats.bloodUnitsAvailable, icon: <People color="primary" /> }
            ].map((stat, idx) => (
              <Grid item xs={6} md={3} key={idx}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <Box sx={{ p: 1.5, bgcolor: '#f0f9ff', borderRadius: '50%', mb: 1 }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="#0f172a">
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Grid */}
      <Box sx={{ py: 10, bgcolor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" textAlign="center" fontWeight="bold" mb={1} color="#0f172a">
            Our Emergency Network & Coordination Tools
          </Typography>
          <Typography variant="body1" textAlign="center" color="textSecondary" mb={6}>
            Designed to save crucial minutes during healthcare crises.
          </Typography>
          <Grid container spacing={4}>
            {[
              { title: 'Emergency Finder', desc: 'Real-time GPS routing to nearby verified hospitals containing available ICU beds and emergency departments.', icon: <WarningIcon sx={{ fontSize: 40, color: '#dc2626' }} /> },
              { title: 'Hospital-to-Hospital Sharing', desc: ' सेंट्रल resource requests that allow clinical administrators to request blood units, ICU beds, and ventilators from nearby network hospitals.', icon: <Share sx={{ fontSize: 40, color: '#0ea5e9' }} /> },
              { title: 'CareAI Healthcare Assistant', desc: 'AI-driven chatbot available 24/7. Detects dangerous emergency symptoms, advises OTC categories for minor cold/fever, and maps doctors.', icon: <SmartToy sx={{ fontSize: 40, color: '#0d9488' }} /> },
              { title: 'Smart Appointments', desc: 'Directly search specializations, filter doctors, check schedules, and schedule booking slots manually or via AI.', icon: <CalendarMonth sx={{ fontSize: 40, color: '#4f46e5' }} /> },
              { title: 'Ambulance Systems', desc: 'Coordinate and check live ambulance driver directories to request transport dispatch directly to your coordinates.', icon: <Speed sx={{ fontSize: 40, color: '#f59e0b' }} /> },
              { title: 'Verified Hospital Security', desc: 'Platform safeguards. Every hospital registration undergoes strict license verification before becoming visible.', icon: <VerifiedUser sx={{ fontSize: 40, color: '#22c55e' }} /> },
            ].map((f, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Card sx={{ height: '100%', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box mb={2}>{f.icon}</Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom color="#0f172a">{f.title}</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>{f.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FAQ Accordion */}
      <Box sx={{ py: 10, bgcolor: '#ffffff' }}>
        <Container maxWidth="md">
          <Typography variant="h4" textAlign="center" fontWeight="bold" mb={4} color="#0f172a">
            Frequently Asked Questions
          </Typography>
          {[
            { q: "How is resource availability kept accurate?", a: "Every hospital is provided with a secure admin dashboard where they can update their beds, ICU, blood, and pharmacy quantities. Socket.IO broadcasts updates to connected clients in real time." },
            { q: "Can guests request emergency assistance?", a: "Yes. Guests can use the Emergency Finder to search nearby hospitals, check bed counts, call emergency lines, and request intake coordinate bookings without registration." },
            { q: "What security measures are in place for clinical documents?", a: "All medical document metadata, prescriptions, and summaries are strictly visible only to the patient who uploaded them. Hospitals can only access them when explicitly shared." },
            { q: "Is CareAI a replacement for doctors?", a: "No. CareAI is a platform assistant. It is programmed to identify critical symptoms (like breathing issues or chest pain) and urge the user to go to the emergency room. It will never prescribe medicines." }
          ].map((faq, idx) => (
            <Accordion key={idx} sx={{ boxShadow: 'none', borderBottom: '1px solid #e2e8f0', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography fontWeight="bold" color="#1e293b">{faq.q}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="textSecondary" sx={{ lineHeight: 1.6 }}>{faq.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
