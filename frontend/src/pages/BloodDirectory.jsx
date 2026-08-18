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
  Chip
} from '@mui/material';
import { Bloodtype, Phone } from '@mui/icons-material';

const BloodDirectory = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [cityArea, setCityArea] = useState('');

  const loadDonors = useCallback(async () => {
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/blood-donors?bloodGroup=${encodeURIComponent(bloodGroup)}`;
      if (cityArea) {
        url += `&cityArea=${encodeURIComponent(cityArea)}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDonors(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [bloodGroup, cityArea]);

  useEffect(() => {
    loadDonors();
  }, [loadDonors]);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" color="#0f172a">
          Voluntary Blood Donor Directory
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Connect directly with voluntary donors in your city. Personal details are protected under communication safety policies.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Filters */}
        <Grid item xs={12} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: '14px', bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={2} color="#0F172A">Filter Donors</Typography>
            <TextField
              select
              label="Blood Group"
              fullWidth
              size="small"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              sx={{ mb: 2 }}
            >
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                <MenuItem key={bg} value={bg}>{bg}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="City / Area"
              placeholder="e.g. Saket"
              fullWidth
              size="small"
              value={cityArea}
              onChange={(e) => setCityArea(e.target.value)}
            />
          </Paper>
        </Grid>

        {/* List of Donors */}
        <Grid item xs={12} md={9}>
          {loading ? (
            <Typography align="center" py={4}>Searching active donors...</Typography>
          ) : donors.length === 0 ? (
            <Box py={8} textAlign="center">
              <Typography color="textSecondary">No active voluntary donors found matching this criteria.</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {donors.map(donor => (
                <Grid item xs={12} sm={6} key={donor._id}>
                  <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s ease', '&:hover': { borderColor: '#0F766E', boxShadow: '0 6px 20px rgba(15, 118, 110, 0.08)' } }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography variant="subtitle1" fontWeight="bold" color="#0F172A">
                          {donor.user?.name || 'Voluntary Donor'}
                        </Typography>
                        <Chip
                          icon={<Bloodtype sx={{ color: '#0F766E !important' }} />}
                          label={donor.bloodGroup}
                          size="small"
                          sx={{ fontWeight: 'bold', bgcolor: '#E6F6F3', color: '#0F766E' }}
                        />
                      </Box>
                      <Typography variant="body2" color="#64748B" sx={{ mb: 1 }}>
                        Area: <strong>{donor.cityArea}</strong>
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ color: '#64748B', mb: 2 }}>
                        Contact Pref: {donor.contactPreference}
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        startIcon={<Phone />}
                        href={`tel:${donor.user?.phone}`}
                        sx={{ borderColor: '#0F766E', color: '#0F766E', fontWeight: 'bold', '&:hover': { bgcolor: '#E6F6F3' } }}
                      >
                        Contact Donor
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
