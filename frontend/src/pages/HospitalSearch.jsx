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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert
} from '@mui/material';
import {
  CalendarMonth,
  LocalPhone,
  MyLocation,
  LocationOn
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { hospitalAPI, doctorAPI, appointmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const HospitalSearch = () => {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState('');
  const [needIcu, setNeedIcu] = useState(false);
  const [needEmergency, setNeedEmergency] = useState(false);
  const [inMyArea, setInMyArea] = useState(false);
  const [detectingArea, setDetectingArea] = useState(false);
  const [userCoords, setUserCoords] = useState(null);

  // Booking Modal States
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingSlot, setBookingSlot] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  // Distance helper in km
  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const loadHospitals = useCallback(async () => {
    try {
      const params = {};
      if (searchTerm) params.name = searchTerm;
      if (department) params.department = department;
      if (needIcu) params.needsIcu = 'true';
      if (needEmergency) params.needsEmergency = 'true';

      const { data } = await hospitalAPI.getAll(params);

      let processed = data;
      if (userCoords) {
        processed = data.map(h => {
          const hLat = h.location?.coordinates?.[1] || h.lat || 28.6139;
          const hLng = h.location?.coordinates?.[0] || h.lng || 77.2090;
          const dist = getDistance(userCoords.lat, userCoords.lng, hLat, hLng);
          return { ...h, distanceKm: dist };
        });

        if (inMyArea) {
          processed.sort((a, b) => (parseFloat(a.distanceKm || 999) - parseFloat(b.distanceKm || 999)));
        }
      }

      setHospitals(processed);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, department, needIcu, needEmergency, inMyArea, userCoords]);

  const handleFindInMyArea = () => {
    if (inMyArea) {
      setInMyArea(false);
      return;
    }

    setDetectingArea(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setInMyArea(true);
          setDetectingArea(false);
        },
        (err) => {
          console.warn('Geolocation denied, using default Delhi NCR area coordinates', err.message);
          const fallback = { lat: 28.6139, lng: 77.2090 };
          setUserCoords(fallback);
          setInMyArea(true);
          setDetectingArea(false);
        },
        { timeout: 8000 }
      );
    } else {
      const fallback = { lat: 28.6139, lng: 77.2090 };
      setUserCoords(fallback);
      setInMyArea(true);
      setDetectingArea(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

  const handleOpenBooking = async (hosp) => {
    setSelectedHospital(hosp);
    setBookingOpen(true);
    setBookingSuccess('');
    setBookingError('');
    setSelectedDoctor('');
    setBookingDate('');
    setBookingSlot('');

    try {
      const { data } = await doctorAPI.getDoctors({ hospitalId: hosp._id });
      setDoctors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmBooking = async () => {
    setBookingSuccess('');
    setBookingError('');
    try {
      if (!user) {
        setBookingError('You must be logged in to book an appointment.');
        return;
      }
      await appointmentAPI.book({
        hospitalId: selectedHospital._id,
        doctorId: selectedDoctor,
        date: bookingDate,
        timeSlot: bookingSlot,
        reason: bookingReason
      });
      setBookingSuccess('Appointment scheduled successfully!');
      setTimeout(() => {
        setBookingOpen(false);
      }, 1500);
    } catch (err) {
      setBookingError(err || 'Failed to book slot. It might be already taken.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" color="#0f172a">
          Find Hospital & Resources
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Search verified hospitals, check active bed availability, and book appointments.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Search Filter Panel */}
        <Grid item xs={12} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: '14px', bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Button
              variant={inMyArea ? 'contained' : 'outlined'}
              onClick={handleFindInMyArea}
              fullWidth
              size="small"
              startIcon={detectingArea ? <CircularProgress size={16} color="inherit" /> : <MyLocation />}
              sx={{
                mb: 2,
                py: 1,
                fontWeight: '700',
                borderRadius: '10px',
                bgcolor: inMyArea ? '#0F766E' : '#F0FDFA',
                borderColor: '#0F766E',
                color: inMyArea ? '#ffffff' : '#0F766E',
                boxShadow: inMyArea ? '0 4px 12px rgba(15, 118, 110, 0.2)' : 'none',
                '&:hover': { bgcolor: inMyArea ? '#0D9488' : '#CCFBF1' }
              }}
            >
              {detectingArea ? 'Locating Area...' : inMyArea ? '✓ Showing Hospitals in My Area' : 'Find Hospitals in My Area'}
            </Button>

            <TextField
              label="Hospital Name"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              select
              label="Department"
              size="small"
              fullWidth
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="">All Departments</MenuItem>
              {['General Medicine', 'Pediatrics', 'Cardiology', 'Neurology', 'Orthopedics'].map(d => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </TextField>
            <Box display="flex" flexDirection="column" gap={1}>
              <Button
                variant={needIcu ? 'contained' : 'outlined'}
                onClick={() => setNeedIcu(!needIcu)}
                fullWidth
                size="small"
                sx={{
                  bgcolor: needIcu ? '#0F766E' : 'transparent',
                  borderColor: '#0F766E',
                  color: needIcu ? '#ffffff' : '#0F766E',
                  '&:hover': { bgcolor: needIcu ? '#0D9488' : '#E6F6F3' }
                }}
              >
                Needs ICU Bed
              </Button>
              <Button
                variant={needEmergency ? 'contained' : 'outlined'}
                onClick={() => setNeedEmergency(!needEmergency)}
                fullWidth
                size="small"
                sx={{
                  bgcolor: needEmergency ? '#0F766E' : 'transparent',
                  borderColor: '#0F766E',
                  color: needEmergency ? '#ffffff' : '#0F766E',
                  '&:hover': { bgcolor: needEmergency ? '#0D9488' : '#E6F6F3' }
                }}
              >
                Needs Emergency Bed
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Results List */}
        <Grid item xs={12} md={9}>
          {loading ? (
            <Typography align="center" py={4}>Searching hospitals...</Typography>
          ) : hospitals.length === 0 ? (
            <Box py={8} textAlign="center">
              <Typography color="textSecondary">No hospitals matching your search criteria were found.</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {hospitals.map(h => (
                <Grid item xs={12} sm={6} key={h._id}>
                  <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s ease', '&:hover': { borderColor: '#0F766E', boxShadow: '0 6px 20px rgba(15, 118, 110, 0.08)' } }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                        <Typography variant="h6" fontWeight="bold" color="#0F172A">{h.name}</Typography>
                        {h.distanceKm && (
                          <Chip
                            icon={<LocationOn sx={{ fontSize: 14 }} />}
                            label={`${h.distanceKm} km away`}
                            size="small"
                            sx={{ bgcolor: '#F0FDFA', color: '#0F766E', fontWeight: 'bold', border: '1px solid #CCFBF1', fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="#64748B" sx={{ mb: 2 }}>{h.address}</Typography>
                      <Divider sx={{ my: 1.5 }} />
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Chip label={`ICU: ${h.beds?.icuAvailable} Left`} size="small" sx={{ bgcolor: h.beds?.icuAvailable > 0 ? '#E6F6F3' : '#FEE2E2', color: h.beds?.icuAvailable > 0 ? '#0F766E' : '#EF4444', fontWeight: 'bold' }} />
                        <Chip label={`ER Beds: ${h.beds?.emergencyAvailable} Left`} size="small" sx={{ bgcolor: h.beds?.emergencyAvailable > 0 ? '#E6F6F3' : '#FEE2E2', color: h.beds?.emergencyAvailable > 0 ? '#0F766E' : '#EF4444', fontWeight: 'bold' }} />
                      </Box>
                      <Box display="flex" gap={1}>
                        <Button variant="contained" size="small" fullWidth startIcon={<CalendarMonth />} onClick={() => handleOpenBooking(h)} sx={{ bgcolor: '#0F766E', '&:hover': { bgcolor: '#0D9488' } }}>
                          Book Doctor
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<LocalPhone />} href={`tel:${h.emergencyPhone}`} sx={{ borderColor: '#E2E8F0', color: '#0F172A', '&:hover': { bgcolor: '#F1F5F9' } }}>
                          Call
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>

      {/* Booking Dialog */}
      <Dialog open={bookingOpen} onClose={() => setBookingOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Book Appointment at {selectedHospital?.name}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {bookingSuccess && <Alert severity="success" sx={{ mb: 2 }}>{bookingSuccess}</Alert>}
          {bookingError && <Alert severity="error" sx={{ mb: 2 }}>{bookingError}</Alert>}

          <TextField
            select
            label="Select Doctor"
            fullWidth
            required
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          >
            {doctors.map(d => (
              <MenuItem key={d._id} value={d._id}>Dr. {d.name} ({d.specialization})</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Choose Date"
            type="date"
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            select
            label="Available Slot"
            fullWidth
            required
            value={bookingSlot}
            onChange={(e) => setBookingSlot(e.target.value)}
            sx={{ mb: 2 }}
          >
            {['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'].map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Reason / Symptoms"
            multiline
            rows={2}
            fullWidth
            value={bookingReason}
            onChange={(e) => setBookingReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmBooking} disabled={!selectedDoctor || !bookingDate || !bookingSlot}>Confirm Appointment</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HospitalSearch;
