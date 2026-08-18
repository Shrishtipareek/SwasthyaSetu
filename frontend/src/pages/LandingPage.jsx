import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Warning as WarningIcon,
  Speed,
  ExpandMore,
  VerifiedUser,
  Share,
  CalendarMonth,
  SmartToy,
  ArrowForward
} from '@mui/icons-material';
import heroImg from '../assets/hero.png';

const LandingPage = ({ onEmergencyClick: _onEmergencyClick }) => {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 12 },
          textAlign: 'center',
          borderBottom: '1px solid #E2E8F0',
          overflow: 'hidden',
          color: '#FFFFFF'
        }}
      >
        {/* Blurred Medical Team Background Image */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${heroImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
            filter: 'blur(2px)',
            transform: 'scale(1.03)',
            zIndex: 0
          }}
        />

        {/* Dark Teal Transparent Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.65) 0%, rgba(15, 118, 110, 0.70) 60%, rgba(17, 94, 89, 0.75) 100%)',
            zIndex: 1
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.8, borderRadius: '20px', bgcolor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255, 255, 255, 0.25)', mb: 3 }}>
            <VerifiedUser sx={{ fontSize: 18, color: '#5EEAD4' }} />
            <Typography variant="caption" fontWeight="bold" color="#FFFFFF">Centralized Healthcare Coordination Platform</Typography>
          </Box>

          <Typography
            variant="h2"
            fontWeight="800"
            sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, mb: 2, lineHeight: 1.2, color: '#FFFFFF', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
          >
            Healthcare Help, <span style={{ color: '#5EEAD4' }}>When You Need It Most.</span>
          </Typography>

          <Typography
            variant="h6"
            sx={{ color: '#E2E8F0', mb: 5, maxWidth: '780px', mx: 'auto', fontWeight: '400', fontSize: { xs: '1rem', md: '1.2rem' }, lineHeight: 1.6, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
          >
            Connect with hospitals, find real-time emergency resources, book doctor appointments, and get AI healthcare assistance — all from one platform.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<CalendarMonth />}
              onClick={() => navigate('/search-hospitals')}
              sx={{
                px: 5,
                py: 1.6,
                fontSize: '1.1rem',
                fontWeight: '700',
                borderRadius: '12px',
                bgcolor: '#0F766E',
                color: '#FFFFFF',
                boxShadow: '0 6px 20px rgba(15, 118, 110, 0.35)',
                '&:hover': {
                  bgcolor: '#0D9488',
                  boxShadow: '0 8px 25px rgba(13, 148, 136, 0.45)'
                }
              }}
            >
              Book Appointment
            </Button>
          </Box>
        </Container>
      </Box>

      {/* CareAI Symptom Checker Banner */}
      <Box
        sx={{
          bgcolor: '#F0FDFA',
          py: 5,
          borderBottom: '1px solid #CCFBF1',
          boxShadow: '0 4px 20px rgba(15, 118, 110, 0.04)'
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3,
              bgcolor: '#FFFFFF',
              p: { xs: 3, md: 4 },
              borderRadius: '20px',
              border: '1px solid #CCFBF1',
              boxShadow: '0 4px 16px rgba(15, 118, 110, 0.08)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  bgcolor: '#E6F6F3',
                  color: '#0F766E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <SmartToy sx={{ fontSize: 38 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="800" color="#0F2C59" mb={0.5}>
                  CareAI Symptom Checker
                </Typography>
                <Typography variant="body2" color="#64748B" sx={{ maxWidth: '580px', lineHeight: 1.6 }}>
                  Analyze symptoms instantly 24/7 with artificial intelligence. Detect emergency warning signs, get triage risk advice, and match doctors.
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/symptom-checker')}
              endIcon={<ArrowForward />}
              sx={{
                py: 1.5,
                px: 3.5,
                fontSize: '1rem',
                fontWeight: '700',
                borderRadius: '12px',
                bgcolor: '#0F766E',
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
                '&:hover': {
                  bgcolor: '#0D9488',
                  boxShadow: '0 6px 18px rgba(13, 148, 136, 0.35)'
                }
              }}
            >
              Start AI Symptom Check
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Grid */}
      <Box
        sx={{
          py: 10,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Visible Blurred Background Image */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/medicine_bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(12px)',
            transform: 'scale(1.08)',
            zIndex: 0
          }}
        />

        {/* Light Translucent Frosted Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(240, 253, 250, 0.30) 50%, rgba(241, 245, 249, 0.35) 100%)',
            zIndex: 1
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h4" textAlign="center" fontWeight="800" mb={1} color="#1E293B">
            Our Emergency Network & Coordination Tools
          </Typography>
          <Typography variant="body1" textAlign="center" color="#475569" mb={6} fontWeight="500">
            Designed to save crucial minutes during healthcare crises.
          </Typography>
          <Grid container spacing={4}>
            {[
              { title: 'Emergency Finder', desc: 'Real-time GPS routing to nearby verified hospitals containing available ICU beds and emergency departments.', icon: <WarningIcon sx={{ fontSize: 36, color: '#dc2626' }} /> },
              { title: 'Hospital-to-Hospital Sharing', desc: 'Central resource requests that allow clinical administrators to request blood units, ICU beds, and ventilators from nearby network hospitals.', icon: <Share sx={{ fontSize: 36, color: '#0f766e' }} /> },
              { title: 'CareAI Healthcare Assistant', desc: 'AI-driven chatbot available 24/7. Detects dangerous emergency symptoms, advises OTC categories for minor cold/fever, and maps doctors.', icon: <SmartToy sx={{ fontSize: 36, color: '#0f766e' }} /> },
              { title: 'Smart Appointments', desc: 'Directly search specializations, filter doctors, check schedules, and schedule booking slots manually or via AI.', icon: <CalendarMonth sx={{ fontSize: 36, color: '#0f766e' }} /> },
              { title: 'Ambulance Systems', desc: 'Coordinate and check live ambulance driver directories to request transport dispatch directly to your coordinates.', icon: <Speed sx={{ fontSize: 36, color: '#0f766e' }} /> },
              { title: 'Verified Hospital Security', desc: 'Platform safeguards. Every hospital registration undergoes strict license verification before becoming visible.', icon: <VerifiedUser sx={{ fontSize: 36, color: '#0f766e' }} /> },
            ].map((f, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: '16px',
                    bgcolor: 'rgba(255, 255, 255, 0.70)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.85)',
                    boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      borderColor: '#0f766e',
                      boxShadow: '0 14px 36px rgba(15, 118, 110, 0.2)',
                      bgcolor: 'rgba(255, 255, 255, 0.88)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(15, 118, 110, 0.1)', border: '1px solid rgba(15, 118, 110, 0.25)', width: 'fit-content', borderRadius: '12px', mb: 2.5 }}>{f.icon}</Box>
                    <Typography variant="h6" fontWeight="700" gutterBottom color="#334155">{f.title}</Typography>
                    <Typography variant="body2" color="#64748B" sx={{ lineHeight: 1.6 }}>{f.desc}</Typography>
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
