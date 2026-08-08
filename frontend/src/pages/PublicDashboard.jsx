import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Paper,
  Avatar
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

  const [loading, setLoading] = useState(true);

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
          { label: 'Hospitals Connected', value: stats.hospitalsConnected, icon: <LocalHospital fontSize="large" color="primary" />, color: '#0ea5e9' },
          { label: 'Total Available Beds', value: stats.availableBeds, icon: <Hotel fontSize="large" color="success" />, color: '#22c55e' },
          { label: 'Available ICU Beds', value: stats.availableIcuBeds, icon: <KingBed fontSize="large" color="error" />, color: '#ef4444' },
          { label: 'Blood Units Stocked', value: stats.availableBloodUnits, icon: <Bloodtype fontSize="large" color="error" />, color: '#b91c1c' },
          { label: 'Ready Ambulances', value: stats.availableAmbulances, icon: <DirectionsCar fontSize="large" color="warning" />, color: '#f59e0b' },
          { label: '24/7 Emergency Intakes', value: stats.emergencyHospitalsCount, icon: <VerifiedUser fontSize="large" color="info" />, color: '#6366f1' }
        ].map((item, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box sx={{ p: 2, bgcolor: `${item.color}15`, borderRadius: '16px' }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="#0f172a">
                    {item.value}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {item.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 4, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 1 }}>
          Data Freshness & Transparency Standard
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>
          All resource metrics displayed on SwasthyaSetu are directly synchronized from participating hospital clinical administration systems via Socket.IO real-time channels. In emergency situations, bed or blood availability can fluctuate within minutes. Always verify critical admissions by clicking the 1-Click Call button.
        </Typography>
      </Paper>
    </Container>
  );
};

export default PublicDashboard;