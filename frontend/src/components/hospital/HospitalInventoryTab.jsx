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
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#ffffff' }}>
            <Typography variant="h6" fontWeight="bold" color="#0F172A" mb={2}>
              Beds & Ventilators Inventory
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Total Bed Capacity"
                  type="number"
                  inputProps={{ min: 0 }}
                  fullWidth
                  value={totalBeds}
                  onChange={(e) => setTotalBeds(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Occupied Beds"
                  type="number"
                  inputProps={{ min: 0 }}
                  fullWidth
                  value={occupiedBeds}
                  onChange={(e) => setOccupiedBeds(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="ICU Beds Available"
                  type="number"
                  inputProps={{ min: 0 }}
                  fullWidth
                  value={icuAvailable}
                  onChange={(e) => setIcuAvailable(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Emergency Beds Available"
                  type="number"
                  inputProps={{ min: 0 }}
                  fullWidth
                  value={emergencyAvailable}
                  onChange={(e) => setEmergencyAvailable(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Ventilators Available"
                  type="number"
                  inputProps={{ min: 0 }}
                  fullWidth
                  value={ventilatorsAvailable}
                  onChange={(e) => setVentilatorsAvailable(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#ffffff' }}>
            <Typography variant="h6" fontWeight="bold" color="#0F172A" mb={2}>
              Blood Bank Registry (Units)
            </Typography>
            <Grid container spacing={2}>
              {Object.keys(bloodUnits).map((grp) => (
                <Grid item xs={3} key={grp}>
                  <TextField
                    label={grp.replace('p', '+').replace('n', '-')}
                    type="number"
                    inputProps={{ min: 0 }}
                    fullWidth
                    value={bloodUnits[grp]}
                    onChange={(e) => setBloodUnits({
                      ...bloodUnits,
                      [grp]: Math.max(0, parseInt(e.target.value) || 0)
                    })}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
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

