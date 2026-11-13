import React from 'react';
import { Paper, Typography, Grid, TextField, Button } from '@mui/material';

const HospitalInventoryTab = ({
  totalBeds, setTotalBeds,
  occupiedBeds, setOccupiedBeds,
  icuAvailable, setIcuAvailable,
  emergencyAvailable, setEmergencyAvailable,
  ventilatorsAvailable, setVentilatorsAvailable,
  bloodUnits, setBloodUnits,
  handleUpdateInventory
}) => {
  return (
    <form onSubmit={handleUpdateInventory}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#ffffff' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0F172A', mb: 2 }}>
              Beds & Ventilators Inventory
            </Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  label="Total Bed Capacity"
                  type="number"
                  fullWidth
                  value={totalBeds}
                  onChange={(e) => setTotalBeds(Math.max(0, parseInt(e.target.value) || 0))}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Occupied Beds"
                  type="number"
                  fullWidth
                  value={occupiedBeds}
                  onChange={(e) => setOccupiedBeds(Math.max(0, parseInt(e.target.value) || 0))}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="ICU Beds Available"
                  type="number"
                  fullWidth
                  value={icuAvailable}
                  onChange={(e) => setIcuAvailable(Math.max(0, parseInt(e.target.value) || 0))}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Emergency Beds Available"
                  type="number"
                  fullWidth
                  value={emergencyAvailable}
                  onChange={(e) => setEmergencyAvailable(Math.max(0, parseInt(e.target.value) || 0))}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Ventilators Available"
                  type="number"
                  fullWidth
                  value={ventilatorsAvailable}
                  onChange={(e) => setVentilatorsAvailable(Math.max(0, parseInt(e.target.value) || 0))}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#ffffff' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0F172A', mb: 2 }}>
              Blood Bank Registry (Units)
            </Typography>
            <Grid container spacing={2}>
              {Object.keys(bloodUnits).map((grp) => (
                <Grid key={grp} size={3}>
                  <TextField
                    label={grp.replace('p', '+').replace('n', '-')}
                    type="number"
                    fullWidth
                    value={bloodUnits[grp]}
                    onChange={(e) => setBloodUnits({
                      ...bloodUnits,
                      [grp]: Math.max(0, parseInt(e.target.value) || 0)
                    })}
                    slotProps={{ htmlInput: { min: 0 } }}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid size={12}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            sx={{ px: 5, py: 1.5, fontWeight: 'bold', borderRadius: '10px' }}
          >
            Save Real-time Resource Stock
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default HospitalInventoryTab;

