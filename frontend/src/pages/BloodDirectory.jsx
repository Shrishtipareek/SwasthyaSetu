import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  Card,
  CardContent,
  Box,
  Divider,
  Paper,
  Chip,
  Alert,
  Skeleton,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Bloodtype, Phone, Lock, Search, Clear, Refresh } from '@mui/icons-material';
import { bloodDonorAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BloodDirectory = () => {
  const { user } = useAuth();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [cityArea, setCityArea] = useState('');
  const [debouncedCity, setDebouncedCity] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCity(cityArea);
    }, 350);
    return () => clearTimeout(timer);
  }, [cityArea]);

  const loadDonors = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (bloodGroup && bloodGroup !== 'all') params.bloodGroup = bloodGroup;
      if (debouncedCity && debouncedCity.trim()) params.cityArea = debouncedCity.trim();

      const { data } = await bloodDonorAPI.getDonors(params, { signal });
      setDonors(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Failed to load blood donors:', err.message);
      setError(err.response?.data?.message || 'Unable to load blood donors at this moment. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [bloodGroup, debouncedCity]);

  useEffect(() => {
    const controller = new AbortController();
    loadDonors(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadDonors]);

  const handleResetFilters = () => {
    setBloodGroup('');
    setCityArea('');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
          Voluntary Blood Donor Directory
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Connect directly with voluntary donors in your city. Personal details are protected under communication safety policies.
        </Typography>
      </Box>

      {!user && (
        <Alert severity="info" icon={<Lock fontSize="inherit" />} sx={{ mb: 3, borderRadius: '10px' }}>
          Donor phone numbers are partially masked for guest users. <strong>Log in</strong> to view unmasked contact numbers.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Filters Panel */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: '14px', bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0F172A' }}>Filter Donors</Typography>
              {(bloodGroup || cityArea) && (
                <Button size="small" onClick={handleResetFilters} sx={{ textTransform: 'none', color: '#0F766E', p: 0 }}>
                  Reset
                </Button>
              )}
            </Box>

            <TextField
              select
              label="Blood Group"
              fullWidth
              size="small"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="">All Blood Groups</MenuItem>
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                <MenuItem key={bg} value={bg}>{bg}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="City / Area"
              placeholder="e.g. Kanpur, Saket"
              fullWidth
              size="small"
              value={cityArea}
              onChange={(e) => setCityArea(e.target.value)}
              slotProps={{ input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#94A3B8', fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: cityArea && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setCityArea('')}>
                      <Clear sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                )
              } }}
            />

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="textSecondary">
                Found: <strong>{donors.length} active</strong>
              </Typography>
              <IconButton size="small" onClick={() => loadDonors()} title="Refresh list">
                <Refresh fontSize="small" sx={{ color: '#0F766E' }} />
              </IconButton>
            </Box>
          </Paper>
        </Grid>

        {/* List of Donors */}
        <Grid size={{ xs: 12, md: 9 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }} action={
              <Button color="inherit" size="small" onClick={() => loadDonors()}>Retry</Button>
            }>
              {error}
            </Alert>
          )}

          {loading ? (
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map((item) => (
                <Grid key={item} size={{ xs: 12, sm: 6 }}>
                  <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Skeleton variant="text" width="55%" height={26} />
                      <Skeleton variant="rounded" width={55} height={24} sx={{ borderRadius: '16px' }} />
                    </Box>
                    <Skeleton variant="text" width="70%" height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="40%" height={16} sx={{ mb: 2 }} />
                    <Divider sx={{ mb: 2 }} />
                    <Skeleton variant="rounded" width="100%" height={32} sx={{ borderRadius: '8px' }} />
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : donors.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center', border: '1px dashed #CBD5E1', borderRadius: '14px', bgcolor: '#F8FAFC' }}>
              <Bloodtype sx={{ fontSize: 48, color: '#94A3B8', mb: 1 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#334155' }}>
                No Active Blood Donors Found
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {bloodGroup || cityArea
                  ? 'No registered voluntary donors match your current filter criteria. Try clearing or expanding your search.'
                  : 'No voluntary blood donors have registered yet in the database.'}
              </Typography>
              {(bloodGroup || cityArea) && (
                <Button variant="outlined" size="small" onClick={handleResetFilters} sx={{ color: '#0F766E', borderColor: '#0F766E' }}>
                  Clear All Filters
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {donors.map(donor => (
                <Grid key={donor._id} size={{ xs: 12, sm: 6 }}>
                  <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s ease', '&:hover': { borderColor: '#0F766E', boxShadow: '0 6px 20px rgba(15, 118, 110, 0.08)' } }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0F172A' }}>
                          {donor.user?.name || 'Voluntary Donor'}
                        </Typography>
                        <Chip
                          icon={<Bloodtype sx={{ color: '#0F766E !important' }} />}
                          label={donor.bloodGroup}
                          size="small"
                          sx={{ fontWeight: 'bold', bgcolor: '#E6F6F3', color: '#0F766E' }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#64748B', mb: 1 }}>
                        City / Area: <strong>{donor.cityArea}</strong>
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#64748B', mb: 2 }}>
                        Contact Preference: <strong>{donor.contactPreference || 'Phone'}</strong>
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        startIcon={<Phone />}
                        href={donor.user?.phone && !donor.user.phone.includes('*') ? `tel:${donor.user.phone}` : undefined}
                        disabled={!donor.user?.phone || donor.user.phone.includes('*')}
                        sx={{ borderColor: '#0F766E', color: '#0F766E', fontWeight: 'bold', '&:hover': { bgcolor: '#E6F6F3' } }}
                      >
                        {!donor.user?.phone || donor.user?.phone?.includes('*')
                          ? `Protected: ${donor.user?.phone || 'Login required'}`
                          : `Call: ${donor.user.phone}`}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default BloodDirectory;
