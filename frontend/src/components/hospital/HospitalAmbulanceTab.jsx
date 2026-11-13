import React from 'react';
import { Grid, Paper, Typography, TextField, Button } from '@mui/material';

const HospitalAmbulanceTab = ({
  ambPlate, setAmbPlate,
  ambDriver, setAmbDriver,
  ambContact, setAmbContact,
  handleRegisterAmbulance
}) => {
  return (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#ffffff' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0F172A', mb: 2 }}>
            Register Fleet Ambulance
          </Typography>
          <form onSubmit={handleRegisterAmbulance}>
            <TextField
              label="License Plate Number"
              placeholder="e.g. DL-01-EA-1008"
              fullWidth
              required
              value={ambPlate}
              onChange={(e) => setAmbPlate(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Driver Name"
              fullWidth
              required
              value={ambDriver}
              onChange={(e) => setAmbDriver(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Driver Emergency Hotline"
              fullWidth
              required
              value={ambContact}
              onChange={(e) => setAmbContact(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ fontWeight: 'bold', py: 1.2, borderRadius: '8px' }}
            >
              Register Ambulance
            </Button>
          </form>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default HospitalAmbulanceTab;

