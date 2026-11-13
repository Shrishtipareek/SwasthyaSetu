import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button
} from '@mui/material';

const STATUS_COLORS = { requested: 'error', accepted: 'warning', ambulance_assigned: 'info', completed: 'success' };

/** SOS requests routed to this hospital, with the actions allowed for each status. */
const HospitalEmergencyTab = ({ emergencies = [], onUpdateStatus }) => (
  <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Emergency Intake Requests</Typography>
    {emergencies.length === 0 ? (
      <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
        No emergency requests have been routed to your hospital.
      </Typography>
    ) : (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Received</strong></TableCell>
              <TableCell><strong>Need</strong></TableCell>
              <TableCell><strong>Patient / Contact</strong></TableCell>
              <TableCell><strong>Distance</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {emergencies.map((em) => (
              <TableRow key={em._id}>
                <TableCell>{new Date(em.createdAt).toLocaleString()}</TableCell>
                <TableCell>{em.requestType.replace('_', ' ').toUpperCase()}</TableCell>
                <TableCell>
                  {em.patient?.name || 'Guest'} · {em.contactNumber}
                  {em.ambulance && (
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      Ambulance {em.ambulance.licensePlate} ({em.ambulance.driverName})
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {typeof em.distance === 'number' ? `${em.distance.toFixed(1)} km` : '-'} {em.travelTime ? `(${em.travelTime})` : ''}
                </TableCell>
                <TableCell>
                  <Chip size="small" label={em.status.replace('_', ' ').toUpperCase()} color={STATUS_COLORS[em.status] || 'default'} />
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  {em.status === 'requested' && (
                    <Button size="small" onClick={() => onUpdateStatus(em._id, 'accepted')}>Accept</Button>
                  )}
                  {['requested', 'accepted'].includes(em.status) && (
                    <Button size="small" onClick={() => onUpdateStatus(em._id, 'ambulance_assigned')}>Send Ambulance</Button>
                  )}
                  {em.status !== 'completed' && (
                    <Button size="small" color="success" onClick={() => onUpdateStatus(em._id, 'completed')}>Complete</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </Paper>
);

export default HospitalEmergencyTab;
