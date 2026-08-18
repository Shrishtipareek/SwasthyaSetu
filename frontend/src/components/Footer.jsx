import React from 'react';
import { Box, Typography, Container, Grid, Link } from '@mui/material';
import { LocalHospital } from '@mui/icons-material';

const Footer = () => {

  return (
    <Box sx={{ bgcolor: '#ffffff', color: '#64748B', py: 6, mt: 'auto', borderTop: '1px solid #E2E8F0', boxShadow: '0 -4px 20px rgba(15, 118, 110, 0.02)' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocalHospital sx={{ color: '#DC2626', mr: 1, fontSize: 26 }} />
              <Typography variant="h6" color="#0F172A" fontWeight="bold">
                Swasthya<span style={{ color: '#0F766E' }}>Setu</span>
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ lineHeight: 1.6, color: '#64748B' }}>
              Centralized emergency coordination network connecting hospitals, voluntary donors, and patients. Delivering real-time resource availability when it matters most.
            </Typography>
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" color="#0F172A" fontWeight="bold" mb={2}>
              Resources
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/public-dashboard" color="inherit" underline="hover" sx={{ '&:hover': { color: '#0F766E' } }}>Aggregate Metrics</Link>
              <Link href="/search-hospitals" color="inherit" underline="hover" sx={{ '&:hover': { color: '#0F766E' } }}>Nearby Hospital Finder</Link>
              <Link href="/blood-donors" color="inherit" underline="hover" sx={{ '&:hover': { color: '#0F766E' } }}>Voluntary Blood Registry</Link>
              <Link href="/campaigns" color="inherit" underline="hover" sx={{ '&:hover': { color: '#0F766E' } }}>Awareness Campaigns</Link>
            </Box>
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" color="#0F172A" fontWeight="bold" mb={2}>
              Disclaimer
            </Typography>
            <Typography variant="caption" display="block" sx={{ lineHeight: 1.5, color: '#94A3B8' }}>
              SwasthyaSetu is a technology platform connecting users with hospitals and providing general health information via CareAI. We do NOT provide diagnostic services or write medical prescriptions. In a severe medical emergency, please dial local helpline numbers (like 102/108) or visit the nearest ER immediately.
            </Typography>
          </Grid>
        </Grid>
        <Box sx={{ borderTop: '1px solid #E2E8F0', mt: 4, pt: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            &copy; {new Date().getFullYear()} SwasthyaSetu. Dedicated to saving lives. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
