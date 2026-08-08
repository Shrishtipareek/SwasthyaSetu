import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Tabs,
  Tab,
  MenuItem,
  Grid,
  Link,
  useTheme
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { registerUser, registerHospital } = useAuth();

  const [tabValue, setTabValue] = useState(0); // 0: Patient, 1: Hospital
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={0} sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h5" fontWeight="bold" color="#0f172a">
            Create Account
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            Join the SwasthyaSetu emergency healthcare network
          </Typography>
        </Box>

        <Tabs
          value={tabValue}
          onChange={(e, val) => { setTabValue(val); setErrorMsg(''); }}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Patient / User" sx={{ fontWeight: 'bold' }} />
          <Tab label="Hospital / Facility" sx={{ fontWeight: 'bold' }} />
        </Tabs>

        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Common fields */}
            <Grid item xs={12}>
              <TextField
                label={tabValue === 0 ? 'Full Name' : 'Hospital Name'}
                variant="outlined"
                fullWidth
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email Address"
                variant="outlined"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Number"
                variant="outlined"
                fullWidth
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Password"
                variant="outlined"
                type="password"
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Grid>

            {/* Patient Specific Fields */}
            {tabValue === 0 && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date of Birth"
                    variant="outlined"
                    type="date"
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    label="Gender"
                    fullWidth
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    {['Male', 'Female', 'Other'].map(g => (
                      <MenuItem key={g} value={g}>{g}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    label="Blood"
                    fullWidth
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </>
            )}

            {/* Hospital Specific Fields */}
            {tabValue === 1 && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="License / Registry Number"
                    variant="outlined"
                    fullWidth
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Emergency Hotline"
                    variant="outlined"
                    fullWidth
                    required
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Complete Address"
                    variant="outlined"
                    fullWidth
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    label="Hospital Type"
                    fullWidth
                    value={hospitalType}
                    onChange={(e) => setHospitalType(e.target.value)}
                  >
                    {['Government', 'Private', 'Charitable'].map(t => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="GPS Latitude"
                    variant="outlined"
                    type="number"
                    inputProps={{ step: "0.0001" }}
                    fullWidth
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="GPS Longitude"
                    variant="outlined"
                    type="number"
                    inputProps={{ step: "0.0001" }}
                    fullWidth
                    required
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} mt={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                sx={{ py: 1.5, fontWeight: 'bold', textTransform: 'capitalize', borderRadius: '8px' }}
              >
                {loading ? 'Registering...' : 'Register'}
              </Button>
            </Grid>
          </Grid>
        </form>

        <Box textAlign="center" mt={3}>
          <Typography variant="body2" color="textSecondary">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" fontWeight="bold">
              Login Here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
