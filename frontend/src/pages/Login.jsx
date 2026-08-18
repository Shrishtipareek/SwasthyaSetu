import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
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
  ArrowForward
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const user = await login(email, password);
      // Route to correct dashboard based on role
      if (user.role === 'hospital') {
        navigate('/hospital-dashboard');
      } else if (user.role === 'admin' || user.role === 'superadmin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg(err || 'Failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)', width: '100%', overflow: 'hidden' }}>
      {/* Left Side - 50% width */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          flex: { md: '0 0 50%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 6, md: 8 },
          bgcolor: '#FFFFFF'
        }}
      >
        <Box sx={{ width: '100%', maxWidth: '440px' }}>
          {/* Top Header Logo */}
          <Box component={RouterLink} to="/" sx={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', mb: 5 }}>
            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(220, 38, 38, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5 }}>
              <LocalHospital sx={{ color: '#DC2626', fontSize: 30 }} />
            </Box>
            <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: '-0.03em', color: '#0F2C59' }}>
              Swasthya<span style={{ color: '#0F766E' }}>Setu</span>
            </Typography>
          </Box>

          <Typography variant="h3" fontWeight="800" color="#0F2C59" sx={{ fontSize: { xs: '2rem', sm: '2.4rem' }, mb: 1, fontFamily: 'serif, Inter, sans-serif' }}>
            Welcome Back
          </Typography>
          <Typography variant="body1" color="#64748B" sx={{ mb: 4, fontSize: '0.98rem' }}>
            Login to your SwasthyaSetu dashboard
          </Typography>

          {errorMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>{errorMsg}</Alert>}

          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={0.8}>
                Email Address *
              </Typography>
              <TextField
                fullWidth
                required
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined sx={{ color: '#94A3B8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '12px',
                      bgcolor: '#F8FAFC',
                      '& fieldset': { borderColor: '#E2E8F0' },
                      '&:hover fieldset': { borderColor: '#CBD5E1' },
                      '&.Mui-focused fieldset': { borderColor: '#0F766E' }
                    }
                  }
                }}
              />
            </Box>

            <Box sx={{ mb: 3.5 }}>
              <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={0.8}>
                Password *
              </Typography>
              <TextField
                fullWidth
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={{ color: '#94A3B8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <VisibilityOff sx={{ color: '#94A3B8', fontSize: 20 }} /> : <Visibility sx={{ color: '#94A3B8', fontSize: 20 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '12px',
                      bgcolor: '#F8FAFC',
                      '& fieldset': { borderColor: '#E2E8F0' },
                      '&:hover fieldset': { borderColor: '#CBD5E1' },
                      '&.Mui-focused fieldset': { borderColor: '#0F766E' }
                    }
                  }
                }}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              endIcon={!loading && <ArrowForward />}
              sx={{
                py: 1.6,
                fontSize: '1rem',
                fontWeight: '700',
                textTransform: 'none',
                borderRadius: '12px',
                bgcolor: '#0F766E',
                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
                '&:hover': {
                  bgcolor: '#0D9488',
                  boxShadow: '0 6px 20px rgba(13, 148, 136, 0.35)'
                }
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" color="#64748B">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register" fontWeight="700" sx={{ color: '#0F766E', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Register Here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right Side - 50% width Healthcare Branding Area */}
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
            Your Health, Connected
          </Typography>
          <Typography variant="body1" color="#475569" sx={{ lineHeight: 1.7, fontSize: '1.02rem', fontWeight: '400' }}>
            A trusted platform connecting patients, hospitals, blood donors, and essential healthcare resources.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
