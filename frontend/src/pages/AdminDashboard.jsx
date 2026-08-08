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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import { VerifiedUser, LocalHospital, People, CalendarMonth } from '@mui/icons-material';
import { adminAPI } from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAdminData = async () => {
    try {
      const statsRes = await adminAPI.getStats();
      setStats(statsRes.data);

      const hospRes = await adminAPI.getHospitals();
      setHospitals(hospRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerify = async (id, status) => {
    setSuccessMsg('');
    try {
      await adminAPI.verifyHospital(id, { status });
      setSuccessMsg(`Hospital status updated to ${status.toUpperCase()}.`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Typography align="center" py={10}>Loading Administrator Dashboard...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" color="#0f172a">
          Platform Management & Audits
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Review new clinical license registrations and monitor system metrics.
        </Typography>
      </Box>

      {/* Stats row */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[
          { label: 'Total Patients', value: stats?.patientsCount, icon: <People />, color: '#0ea5e9' },
          { label: 'Total Hospitals', value: stats?.hospitalsCount, icon: <LocalHospital />, color: '#22c55e' },
          { label: 'Pending Approvals', value: stats?.pendingHospitalsCount, icon: <VerifiedUser />, color: '#ea580c' },
          { label: 'Scheduled Appointments', value: stats?.appointmentsCount, icon: <CalendarMonth />, color: '#6366f1' }
        ].map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ borderLeft: `5px solid ${card.color}` }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="#0f172a">{card.value}</Typography>
                  <Typography variant="body2" color="textSecondary">{card.label}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${card.color}15`, color: card.color }}>{card.icon}</Avatar>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}

      {/* Hospital verification list */}
      <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Hospital License Registrations
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {hospitals.length === 0 ? (
          <Typography color="textSecondary" align="center" py={4}>No hospital accounts found.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Hospital Name</strong></TableCell>
                  <TableCell><strong>License</strong></TableCell>
                  <TableCell><strong>Address</strong></TableCell>
                  <TableCell><strong>Verification Status</strong></TableCell>
                  <TableCell><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hospitals.map((h) => (
                  <TableRow key={h._id}>
                    <TableCell>{h.name}</TableCell>
                    <TableCell>{h.licenseNumber}</TableCell>
                    <TableCell>{h.address}</TableCell>
                    <TableCell>
                      <Chip
                        label={h.verifiedStatus.toUpperCase()}
                        size="small"
                        color={h.verifiedStatus === 'verified' ? 'success' : h.verifiedStatus === 'pending' ? 'warning' : 'error'}
                        sx={{ fontSize: '0.65rem', height: 18 }}
                      />
                    </TableCell>
                    <TableCell>
                      {h.verifiedStatus === 'pending' && (
                        <Box display="flex" gap={1}>
                          <Button variant="contained" color="success" size="small" onClick={() => handleVerify(h._id, 'verified')}>
                            Approve
                          </Button>
                          <Button variant="outlined" color="error" size="small" onClick={() => handleVerify(h._id, 'rejected')}>
                            Reject
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
