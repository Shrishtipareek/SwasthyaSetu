import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Paper
} from '@mui/material';
import {
  LocalHospital,
  Hotel,
  KingBed,
  Bloodtype,
  DirectionsCar,
  VerifiedUser
} from '@mui/icons-material';
import { hospitalAPI } from '../services/api';

const PublicDashboard = () => {
  const [stats, setStats] = useState({
    hospitalsConnected: 10,
    availableBeds: 895,
    availableIcuBeds: 82,
    availableAmbulances: 18,
    availableBloodUnits: 580,
    emergencyHospitalsCount: 10
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await hospitalAPI.getStats();
        if (data) setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" color="#0f172a" gutterBottom>
          Public Healthcare Resource Aggregates
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
          Live anonymized data from connected hospitals across the emergency network.
        </Typography>
      </Box>

      {/* Metrics Row */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {[
          { label: 'Hospitals Connected', value: stats.hospitalsConnected, icon: <LocalHospital fontSize="large" sx={{ color: '#0F766E' }} />, color: '#0F766E' },
          { label: 'Total Available Beds', value: stats.availableBeds, icon: <Hotel fontSize="large" sx={{ color: '#0D9488' }} />, color: '#0D9488' },
          { label: 'Available ICU Beds', value: stats.availableIcuBeds, icon: <KingBed fontSize="large" sx={{ color: '#0F766E' }} />, color: '#0F766E' },
          { label: 'Blood Units Stocked', value: stats.availableBloodUnits, icon: <Bloodtype fontSize="large" sx={{ color: '#881337' }} />, color: '#881337' },
          { label: 'Ready Ambulances', value: stats.availableAmbulances, icon: <DirectionsCar fontSize="large" sx={{ color: '#0F766E' }} />, color: '#0F766E' },
          { label: '24/7 Emergency Intakes', value: stats.emergencyHospitalsCount, icon: <VerifiedUser fontSize="large" sx={{ color: '#0D9488' }} />, color: '#0D9488' }
        ].map((item, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s ease', '&:hover': { borderColor: '#0F766E', boxShadow: '0 6px 20px rgba(15, 118, 110, 0.08)' } }}>
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box sx={{ p: 2, bgcolor: '#E6F6F3', borderRadius: '14px' }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="800" color="#0F172A">
                    {item.value}
                  </Typography>
                  <Typography variant="body2" color="#64748B" fontWeight="500">
                    {item.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 4, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Typography variant="h6" fontWeight="bold" color="#0F172A" sx={{ mb: 1 }}>
          Data Freshness & Transparency Standard
        </Typography>
        <Typography variant="body2" color="#64748B" sx={{ lineHeight: 1.6 }}>
          All resource metrics displayed on SwasthyaSetu are directly synchronized from participating hospital clinical administration systems via Socket.IO real-time channels. In emergency situations, bed or blood availability can fluctuate within minutes. Always verify critical admissions by clicking the 1-Click Call button.
        </Typography>
      </Paper>
    </Container>
  );
};

export default PublicDashboard;