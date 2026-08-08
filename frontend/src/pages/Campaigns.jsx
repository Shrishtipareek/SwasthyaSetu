import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Divider,
  Paper,
  Chip,
  Alert
} from '@mui/material';
import { CalendarMonth, LocationOn, LocalActivity } from '@mui/icons-material';
import { campaignAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Campaigns = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successId, setSuccessId] = useState('');

  const loadCampaigns = async () => {
    try {
      const { data } = await campaignAPI.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleRegister = async (id) => {
    setSuccessId('');
    try {
      if (!user) {
        alert('Please log in as a patient to register for drives.');
        return;
      }
      await campaignAPI.register(id);
      setSuccessId(id);
      loadCampaigns();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to register.');
    }
  };

  const getCampaignIconColor = (type) => {
    if (type === 'blood_camp') return '#dc2626';
    if (type === 'vaccination') return '#06b6d4';
    return '#f59e0b';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" color="#0f172a">
          Community Health Campaigns & Drives
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Participate in local vaccination drives, free health screenings, and voluntary donation camps.
        </Typography>
      </Box>

      {loading ? (
        <Typography align="center" py={4}>Loading drives...</Typography>
      ) : campaigns.length === 0 ? (
        <Box py={8} textAlign="center">
          <Typography color="textSecondary">No active public campaigns scheduled.</Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {campaigns.map(camp => {
            const registered = camp.registeredUsers?.includes(user?._id);
            return (
              <Grid item xs={12} md={6} key={camp._id}>
                <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6" fontWeight="bold" color="#0f172a">
                        {camp.title}
                      </Typography>
                      <Chip
                        label={camp.type.toUpperCase().replace('_', ' ')}
                        size="small"
                        sx={{
                          bgcolor: `${getCampaignIconColor(camp.type)}15`,
                          color: getCampaignIconColor(camp.type),
                          fontWeight: 'bold',
                          fontSize: '0.65rem'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                      {camp.description}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Box display="flex" flexDirection="column" gap={1.5} sx={{ mb: 3 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CalendarMonth sx={{ color: '#64748b', fontSize: 20 }} />
                        <Typography variant="body2" color="#475569">
                          Schedule: <strong>{camp.date}</strong> | {camp.time}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationOn sx={{ color: '#64748b', fontSize: 20 }} />
                        <Typography variant="body2" color="#475569">
                          Venue: <strong>{camp.venue}</strong>
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocalActivity sx={{ color: '#64748b', fontSize: 20 }} />
                        <Typography variant="body2" color="#475569">
                          Host Hospital: <strong>{camp.hospital?.name}</strong>
                        </Typography>
                      </Box>
                    </Box>

                    {successId === camp._id && (
                      <Alert severity="success" sx={{ mb: 2 }}>Drive slot registered successfully!</Alert>
                    )}

                    {registered ? (
                      <Button variant="contained" color="success" disabled fullWidth>
                        Slot Reserved
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => handleRegister(camp._id)}
                      >
                        Register for Camp Drive
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default Campaigns;
