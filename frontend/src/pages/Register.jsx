import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  Tabs,
  Tab,
  Link
} from '@mui/material';
import {
  LocalHospital,
  PersonOutlined,
  BusinessOutlined
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import PatientRegisterForm from '../components/auth/PatientRegisterForm';
import HospitalRegisterForm from '../components/auth/HospitalRegisterForm';

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
  const [lat, setLat] = useState(28.5672);
  const [lng, setLng] = useState(77.2100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Client-side validations (M11)
    if (!name.trim()) {
      setErrorMsg('Please enter your full name or hospital name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Please provide a valid contact phone number.');
      return;
    }

    setLoading(true);

    try {
      if (tabValue === 0) {
        // Patient registration
        const medicalInfo = {
          dob,
          gender,
          bloodGroup
        };
        await registerUser({ name: name.trim(), email: email.trim(), password, phone: phone.trim(), role: 'patient', medicalInfo });
        navigate('/dashboard');
      } else {
        // Hospital registration
        if (!licenseNumber.trim() || !address.trim()) {
          setErrorMsg('License number and address are required for hospital registration.');
          setLoading(false);
          return;
        }

        await registerHospital({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          licenseNumber: licenseNumber.trim(),
          emergencyPhone: emergencyPhone.trim() || phone.trim(),
          address: address.trim(),
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

  const fieldInputStyle = {
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    fontSize: '0.9rem',
    '& fieldset': {
      borderColor: '#E2E8F0',
    },
    '&:hover fieldset': {
      borderColor: '#0F766E',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#0F766E',
    },
  };

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)', width: '100%', overflow: 'hidden' }}>
      {/* Left Form Area */}
      <Box
        sx={{
          width: { xs: '100%', md: '55%' },
          flex: { md: '0 0 55%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 6, md: 8 },
          bgcolor: '#FFFFFF',
          overflowY: 'auto',
          maxHeight: '100vh'
        }}
      >
        <Box sx={{ width: '100%', maxWidth: '520px' }}>
          {/* Logo Header */}
          <Box component={RouterLink} to="/" sx={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', mb: 3 }}>
            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(220, 38, 38, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5 }}>
              <LocalHospital sx={{ color: '#DC2626', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: '-0.02em', color: '#0F172A' }}>
              Swasthya<span style={{ color: '#0F766E' }}>Setu</span>
            </Typography>
          </Box>

          <Typography variant="h4" fontWeight="800" sx={{ color: '#0F172A', mb: 1, letterSpacing: '-0.02em', fontSize: { xs: '1.6rem', sm: '2rem' } }}>
            Create an Account
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
            Join India's centralized emergency hospital and resource coordination network.
          </Typography>

          {/* Role Tabs */}
          <Tabs
            value={tabValue}
            onChange={(e, val) => {
              setTabValue(val);
              setErrorMsg('');
            }}
            variant="fullWidth"
            sx={{
              mb: 3,
              p: 0.5,
              bgcolor: '#F1F5F9',
              borderRadius: '12px',
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                minHeight: '44px',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#64748B',
                transition: 'all 0.2s',
                '&.Mui-selected': {
                  color: '#0F766E',
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                }
              }
            }}
          >
            <Tab icon={<PersonOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Patient / Citizen" />
            <Tab icon={<BusinessOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Hospital Authority" />
          </Tabs>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {tabValue === 0 ? (
              <PatientRegisterForm
                name={name} setName={setName}
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                phone={phone} setPhone={setPhone}
                dob={dob} setDob={setDob}
                gender={gender} setGender={setGender}
                bloodGroup={bloodGroup} setBloodGroup={setBloodGroup}
                showPassword={showPassword} setShowPassword={setShowPassword}
                loading={loading}
                fieldInputStyle={fieldInputStyle}
              />
            ) : (
              <HospitalRegisterForm
                name={name} setName={setName}
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                phone={phone} setPhone={setPhone}
                licenseNumber={licenseNumber} setLicenseNumber={setLicenseNumber}
                emergencyPhone={emergencyPhone} setEmergencyPhone={setEmergencyPhone}
                address={address} setAddress={setAddress}
                hospitalType={hospitalType} setHospitalType={setHospitalType}
                lat={lat} setLat={setLat}
                lng={lng} setLng={setLng}
                showPassword={showPassword} setShowPassword={setShowPassword}
                loading={loading}
                fieldInputStyle={fieldInputStyle}
              />
            )}
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Already registered?{' '}
              <Link component={RouterLink} to="/login" sx={{ color: '#0F766E', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Sign in to your account
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right Hero / Branding Area */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '45%',
          flex: '0 0 45%',
          background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
          color: '#FFFFFF',
          p: 6,
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, my: 'auto' }}>
          <Typography variant="h3" fontWeight="900" sx={{ mb: 2, lineHeight: 1.2 }}>
            Connected Care When Seconds Count.
          </Typography>
          <Typography variant="body1" sx={{ color: '#CCFBF1', lineHeight: 1.6, fontSize: '1.05rem', maxWidth: '420px' }}>
            Direct access to verified hospital bed inventories, emergency ambulance tracking, and coordinated inter-hospital transfers.
          </Typography>
        </Box>

        <Typography variant="caption" sx={{ color: '#99F6E4', opacity: 0.8 }}>
          &copy; {new Date().getFullYear()} SwasthyaSetu. Empowering Emergency Healthcare.
        </Typography>
      </Box>
    </Box>
  );
};

export default Register;
