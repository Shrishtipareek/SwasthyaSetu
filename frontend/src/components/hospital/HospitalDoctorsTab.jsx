import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';

const HospitalDoctorsTab = ({
  docName, setDocName,
  docSpec, setDocSpec,
  docContact, setDocContact,
  handleAddDoctor,
  recentAppointments
}) => {
  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={5}>
        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#ffffff' }}>
          <Typography variant="h6" fontWeight="bold" color="#0F172A" mb={2}>
            Add Doctor Profile
          </Typography>
          <form onSubmit={handleAddDoctor}>
            <TextField
              label="Doctor Name"
              fullWidth
              required
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              select
              label="Specialization"
              fullWidth
              value={docSpec}
              onChange={(e) => setDocSpec(e.target.value)}
              sx={{ mb: 2 }}
            >
              {[
                'General Medicine',
                'Cardiologist',
                'Pediatrician',
                'Dermatologist',
                'Neurologist',
                'Orthopedist',
                'Emergency Physician',
                'Pulmonologist'
              ].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Contact Number"
              fullWidth
              required
              value={docContact}
              onChange={(e) => setDocContact(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ fontWeight: 'bold', py: 1.2, borderRadius: '8px' }}
            >
              Add Doctor
            </Button>
          </form>
        </Paper>
      </Grid>

      <Grid item xs={12} md={7}>
        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#ffffff' }}>
          <Typography variant="h6" fontWeight="bold" color="#0F172A" mb={2}>
            Recent Bookings / Appointments
          </Typography>
          {!recentAppointments || recentAppointments.length === 0 ? (
            <Typography color="textSecondary" align="center" py={4}>
              No recent patient appointments recorded.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Patient</strong></TableCell>
                    <TableCell><strong>Doctor</strong></TableCell>
                    <TableCell><strong>Slot</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentAppointments.map(a => (
                    <TableRow key={a._id}>
                      <TableCell>{a.patient?.name || 'Walk-in'}</TableCell>
                      <TableCell>Dr. {a.doctor?.name}</TableCell>
                      <TableCell>{a.date} | {a.timeSlot}</TableCell>
                      <TableCell>
                        <span style={{
                          color: a.status === 'upcoming' ? '#0F766E' : a.status === 'cancelled' ? '#EF4444' : '#64748B',
                          fontWeight: 600
                        }}>
                          {a.status.toUpperCase()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default HospitalDoctorsTab;

