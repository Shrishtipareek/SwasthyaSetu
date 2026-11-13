import React from 'react';
import { Grid, Paper, Typography, TextField, MenuItem, Button } from '@mui/material';

const HospitalCampaignTab = ({
  campTitle, setCampTitle,
  campDesc, setCampDesc,
  campType, setCampType,
  campDate, setCampDate,
  campTime, setCampTime,
  campVenue, setCampVenue,
  handleCreateCampaign
}) => {
  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={6}>
        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#ffffff' }}>
          <Typography variant="h6" fontWeight="bold" color="#0F172A" mb={2}>
            Publish Health Campaign / Drive
          </Typography>
          <form onSubmit={handleCreateCampaign}>
            <TextField
              label="Campaign Title"
              fullWidth
              required
              value={campTitle}
              onChange={(e) => setCampTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Description / Details"
              multiline
              rows={3}
              fullWidth
              required
              value={campDesc}
              onChange={(e) => setCampDesc(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              select
              label="Campaign Type"
              fullWidth
              value={campType}
              onChange={(e) => setCampType(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="blood_camp">Blood Donation Camp</MenuItem>
              <MenuItem value="vaccination">Vaccination Drive</MenuItem>
              <MenuItem value="health_camp">Free Health Checkup Camp</MenuItem>
              <MenuItem value="awareness">Health Awareness Drive</MenuItem>
            </TextField>
            <TextField
              label="Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              value={campDate}
              onChange={(e) => setCampDate(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Time Range (e.g. 09:00 AM - 04:00 PM)"
              fullWidth
              required
              value={campTime}
              onChange={(e) => setCampTime(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Venue Address"
              fullWidth
              required
              value={campVenue}
              onChange={(e) => setCampVenue(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ fontWeight: 'bold', py: 1.2, borderRadius: '8px' }}
            >
              Publish Drive to Public Directory
            </Button>
          </form>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default HospitalCampaignTab;

