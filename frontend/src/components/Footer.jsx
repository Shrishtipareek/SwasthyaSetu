import React from 'react';
import { Box, Typography, Container, Grid, Link, useTheme } from '@mui/material';
import { LocalHospital } from '@mui/icons-material';

const Footer = () => {
  const theme = useTheme();

  return (
    <Box sx={{ bgcolor: '#0f172a', color: '#94a3b8', py: 6, mt: 'auto', borderTop: '1px solid #1e293b' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" mb={2}>
              <LocalHospital sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6" color="#f8fafc" fontWeight="bold">
                SwasthyaSetu
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              Centralized emergency coordination network connecting hospitals, voluntary donors, and patients. Delivering real-time resource availability when it matters most.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" color="#f8fafc" fontWeight="bold" mb={2}>
              Resources
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Link href="/public-dashboard" color="inherit" underline="hover">Aggregate Metrics</Link>
              <Link href="/search-hospitals" color="inherit" underline="hover">Nearby Hospital Finder</Link>
              <Link href="/blood-donors" color="inherit" underline="hover">Voluntary Blood Registry</Link>
              <Link href="/campaigns" color="inherit" underline="hover">Awareness Campaigns</Link>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" color="#f8fafc" fontWeight="bold" mb={2}>
              Disclaimer
            </Typography>
            <Typography variant="caption" display="block" sx={{ lineHeight: 1.5, color: '#64748b' }}>
              SwasthyaSetu is a technology platform connecting users with hospitals and providing general health information via CareAI. We do NOT provide diagnostic services or write medical prescriptions. In a severe medical emergency, please dial local helpline numbers (like 102/108) or visit the nearest ER immediately.
            </Typography>
          </Grid>
        </Grid>
        <Box borderTop="1px solid #1e293b" mt={4} pt={3} textAlign="center">
          <Typography variant="body2" sx={{ color: '#475569' }}>
            &copy; {new Date().getFullYear()} SwasthyaSetu. Dedicated to saving lives. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
