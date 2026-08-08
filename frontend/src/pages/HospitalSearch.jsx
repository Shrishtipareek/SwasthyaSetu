import React, { useState, useEffect } from 'react';
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
import { Search, CalendarMonth, LocalPhone } from '@mui/icons-material';
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

  const loadHospitals = async () => {
    try {
      const params = {};
      if (searchTerm) params.name = searchTerm;
      if (department) params.department = department;
      if (needIcu) params.needsIcu = 'true';
      if (needEmergency) params.needsEmergency = 'true';

      const { data } = await hospitalAPI.getAll(params);
      setHospitals(data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, [searchTerm, department, needIcu, needEmergency]);

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
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '16px' }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>Filter Hospitals</Typography>
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
              >
                Needs ICU Bed
              </Button>
              <Button
                variant={needEmergency ? 'contained' : 'outlined'}
                onClick={() => setNeedEmergency(!needEmergency)}
                fullWidth
                size="small"
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
                  <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight="bold" color="#0f172a">{h.name}</Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>{h.address}</Typography>
                      <Divider sx={{ my: 1.5 }} />
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Chip label={`ICU: ${h.beds?.icuAvailable} Left`} color={h.beds?.icuAvailable > 2 ? 'success' : h.beds?.icuAvailable > 0 ? 'warning' : 'error'} size="small" />
                        <Chip label={`ER Beds: ${h.beds?.emergencyAvailable} Left`} color={h.beds?.emergencyAvailable > 2 ? 'success' : 'error'} size="small" />
                      </Box>
                      <Box display="flex" gap={1}>
                        <Button variant="contained" size="small" fullWidth startIcon={<CalendarMonth />} onClick={() => handleOpenBooking(h)}>
                          Book Doctor
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<LocalPhone />} href={`tel:${h.emergencyPhone}`}>
                          Emergency Call
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
