import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Tabs,
  Tab,
  MenuItem,
  Grid,
  Link,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  LocalHospital,
  Visibility,
  VisibilityOff,
  EmailOutlined,
  LockOutlined,
  ArrowForward,
  PersonOutlined,
  PhoneOutlined,
  BadgeOutlined,
  LocationOnOutlined,
  CalendarTodayOutlined,
  MedicalServicesOutlined,
  CallOutlined
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { registerUser, registerHospital } = useAuth();

  const [tabValue, setTabValue] = useState(0); // 0: Patient, 1: Hospital
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Patient Fields
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [dob, setDob] = useState('');

  // Hospital Fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [address, setAddress] = useState('');
  const [hospitalType, setHospitalType] = useState('Private');
  const [lat, setLat] = useState(28.5672); // default
  const [lng, setLng] = useState(77.2100); // default

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (tabValue === 0) {
        // Patient registration
        const medicalInfo = {
          dob,
          gender,
          bloodGroup
        };
        await registerUser({ name, email, password, phone, role: 'patient', medicalInfo });
        navigate('/dashboard');
      } else {
        // Hospital registration
        await registerHospital({
          name,
          email,
          password,
          phone,
          licenseNumber,
          emergencyPhone,
          address,
          hospitalType,
          location: { lat: parseFloat(lat), lng: parseFloat(lng) }
        });
        navigate('/hospital-dashboard');
      }
    } catch (err) {
      setErrorMsg(err || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Reusable compact input styling matching Login.jsx
  const fieldInputStyle = {
    borderRadius: '10px',
    bgcolor: '#F8FAFC',
    fontSize: '0.88rem',
    '& .MuiInputBase-input': {
      py: '8.5px',
      px: '12px',
      fontSize: '0.88rem'
    },
    '& fieldset': { borderColor: '#E2E8F0' },
    '&:hover fieldset': { borderColor: '#CBD5E1' },
    '&.Mui-focused fieldset': { borderColor: '#0F766E' }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)', width: '100%', overflow: 'hidden' }}>
      {/* Left Side - Form Area */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          flex: { md: '0 0 50%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 2.5, sm: 4, md: 5 },
          bgcolor: '#FFFFFF',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto'
        }}
      >
        <Box sx={{ width: '100%', maxWidth: '480px', my: 'auto' }}>
          {/* Top Header Logo */}
          <Box component={RouterLink} to="/" sx={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', mb: 2.5 }}>
            <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: 'rgba(220, 38, 38, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.2 }}>
              <LocalHospital sx={{ color: '#DC2626', fontSize: 26 }} />
            </Box>
            <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: '-0.03em', color: '#0F2C59' }}>
              Swasthya<span style={{ color: '#0F766E' }}>Setu</span>
            </Typography>
          </Box>

          <Typography variant="h4" fontWeight="800" color="#0F2C59" sx={{ fontSize: { xs: '1.6rem', sm: '1.9rem' }, mb: 0.8, fontFamily: 'serif, Inter, sans-serif' }}>
            Create Account
          </Typography>
          <Typography variant="body2" color="#64748B" sx={{ mb: 2.5, fontSize: '0.9rem' }}>
            Join the SwasthyaSetu emergency healthcare network
          </Typography>

          {/* Tab Selector */}
          <Tabs
            value={tabValue}
            onChange={(e, val) => { setTabValue(val); setErrorMsg(''); }}
            variant="fullWidth"
            sx={{
              mb: 2.5,
              bgcolor: '#F8FAFC',
              p: 0.5,
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                fontWeight: '700',
                textTransform: 'none',
                fontSize: '0.84rem',
                color: '#64748B',
                borderRadius: '8px',
                py: 0.8,
                minHeight: '36px',
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  color: '#0F766E',
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(15, 118, 110, 0.12)'
                }
              }
            }}
          >
            <Tab label="Register as Patient / User" />
            <Tab label="Register as Hospital / Clinic" />
          </Tabs>

          {errorMsg && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', py: 0.5 }}>{errorMsg}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={1.5}>
              {/* Common fields */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={0.4} sx={{ fontSize: '0.82rem' }}>
                  {tabValue === 0 ? 'Full Name *' : 'Hospital Name *'}
                </Typography>
                <TextField
                  fullWidth
                  required
                  size="small"
                  placeholder={tabValue === 0 ? 'e.g. John Doe' : 'e.g. City Central Hospital'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          {tabValue === 0 ? (
                            <PersonOutlined sx={{ color: '#94A3B8', fontSize: 18 }} />
                          ) : (
                            <LocalHospital sx={{ color: '#94A3B8', fontSize: 18 }} />
                          )}
                        </InputAdornment>
                      ),
                      sx: fieldInputStyle
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={0.4} sx={{ fontSize: '0.82rem' }}>
                  Email Address *
                </Typography>
                <TextField
                  fullWidth
                  required
                  size="small"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined sx={{ color: '#94A3B8', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      sx: fieldInputStyle
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={0.4} sx={{ fontSize: '0.82rem' }}>
                  Contact Number *
                </Typography>
                <TextField
                  fullWidth
                  required
                  size="small"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneOutlined sx={{ color: '#94A3B8', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      sx: fieldInputStyle
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={0.4} sx={{ fontSize: '0.82rem' }}>
                  Password *
                </Typography>
                <TextField
                  fullWidth
                  required
                  size="small"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined sx={{ color: '#94A3B8', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                            {showPassword ? <VisibilityOff sx={{ color: '#94A3B8', fontSize: 18 }} /> : <Visibility sx={{ color: '#94A3B8', fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: fieldInputStyle
                    }
                  }}
                />
              </Grid>

              {/* Patient Specific Fields */}
              {tabValue === 0 && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={0.4} sx={{ fontSize: '0.82rem' }}>
                      Date of Birth *
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarTodayOutlined sx={{ color: '#94A3B8', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                          sx: fieldInputStyle
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={0.4} sx={{ fontSize: '0.82rem' }}>
                      Gender
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      slotProps={{
                        input: { sx: fieldInputStyle }
                      }}
                    >
                      {['Male', 'Female', 'Other'].map((g) => (
                        <MenuItem key={g} value={g} sx={{ fontSize: '0.88rem' }}>{g}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={0.4} sx={{ fontSize: '0.82rem' }}>
                      Blood Group
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      slotProps={{
                        input: { sx: fieldInputStyle }
                      }}
                    >
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                        <MenuItem key={bg} value={bg} sx={{ fontSize: '0.88rem' }}>{bg}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </>
              )}

              {/* Hospital Specific Fields */}
              {tabValue === 1 && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={0.4} sx={{ fontSize: '0.82rem' }}>
                      License / Registry Number *
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      placeholder="e.g. REG-123456"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeOutlined sx={{ color: '#94A3B8', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                          sx: fieldInputStyle
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={0.4} sx={{ fontSize: '0.82rem' }}>
                      Emergency Hotline *
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      placeholder="+91 9876500000"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <CallOutlined sx={{ color: '#94A3B8', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                          sx: fieldInputStyle
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={0.4} sx={{ fontSize: '0.82rem' }}>
                      Complete Address *
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      placeholder="123 Health Ave, City, State"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOnOutlined sx={{ color: '#94A3B8', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                          sx: fieldInputStyle
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={0.4} sx={{ fontSize: '0.82rem' }}>
                      Hospital Type
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={hospitalType}
                      onChange={(e) => setHospitalType(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <MedicalServicesOutlined sx={{ color: '#94A3B8', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                          sx: fieldInputStyle
                        }
                      }}
                    >
                      {['Government', 'Private', 'Charitable'].map((t) => (
                        <MenuItem key={t} value={t} sx={{ fontSize: '0.88rem' }}>{t}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={0.4} sx={{ fontSize: '0.82rem' }}>
                      GPS Latitude *
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      type="number"
                      inputProps={{ step: "0.0001" }}
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      slotProps={{
                        input: { sx: fieldInputStyle }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={0.4} sx={{ fontSize: '0.82rem' }}>
                      GPS Longitude *
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      type="number"
                      inputProps={{ step: "0.0001" }}
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      slotProps={{
                        input: { sx: fieldInputStyle }
                      }}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12} mt={0.5}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  endIcon={!loading && <ArrowForward />}
                  sx={{
                    py: 1.3,
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    textTransform: 'none',
                    borderRadius: '10px',
                    bgcolor: '#0F766E',
                    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
                    '&:hover': {
                      bgcolor: '#0D9488',
                      boxShadow: '0 6px 20px rgba(13, 148, 136, 0.35)'
                    }
                  }}
                >
                  {loading ? 'Registering...' : 'Register'}
                </Button>
              </Grid>
            </Grid>
          </form>

          <Box sx={{ textAlign: 'center', mt: 3, mb: 2 }}>
            <Typography variant="body2" color="#64748B">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" fontWeight="700" sx={{ color: '#0F766E', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Login Here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right Side - Healthcare Branding Area matching Login.jsx */}
      <Box
        sx={{
          width: '50%',
          flex: '0 0 50%',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          p: 6,
          overflow: 'hidden',
          bgcolor: '#E6F4F1'
        }}
      >
        {/* Blurred Medical Background Image */}
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
            filter: 'blur(10px)',
            transform: 'scale(1.08)',
            opacity: 0.35,
            zIndex: 0
          }}
        />

        {/* Soft Mint Gradient Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(230, 244, 241, 0.75) 0%, rgba(209, 236, 231, 0.85) 50%, rgba(232, 245, 242, 0.80) 100%)',
            zIndex: 1
          }}
        />

        {/* Right-side Content Container */}
        <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '440px' }}>
          {/* Prominent SwasthyaSetu Medical Card / Badge */}
          <Box
            sx={{
              p: 4.5,
              borderRadius: '24px',
              bgcolor: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 20px 50px rgba(15, 118, 110, 0.12)',
              mb: 5,
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Box sx={{ p: 2, borderRadius: '20px', bgcolor: 'rgba(220, 38, 38, 0.08)', mb: 2, border: '1px solid rgba(220, 38, 38, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LocalHospital sx={{ color: '#DC2626', fontSize: 64 }} />
            </Box>
            <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.03em', color: '#0F2C59' }}>
              Swasthya<span style={{ color: '#0F766E' }}>Setu</span>
            </Typography>
          </Box>

          <Typography variant="h4" fontWeight="800" color="#0F2C59" sx={{ mb: 2, fontFamily: 'serif, Inter, sans-serif' }}>
            Join Our Healthcare Network
          </Typography>
          <Typography variant="body1" color="#475569" sx={{ lineHeight: 1.7, fontSize: '1.02rem', fontWeight: '400' }}>
            A trusted platform connecting patients, hospitals, blood donors, and essential healthcare resources.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;

