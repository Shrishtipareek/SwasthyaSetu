import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar
} from '@mui/material';
import {
  LocalHospital,
  People,
  NotificationsActive
} from '@mui/icons-material';
import { hospitalAPI, doctorAPI, ambulanceAPI, campaignAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';

const HospitalDashboard = () => {
  const socket = useSocket();
  const [tabValue, setTabValue] = useState(0); // 0: Inventory, 1: Doctors, 2: Ambulances, 3: Campaigns
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Doctor Form
  const [docName, setDocName] = useState('');
  const [docSpec, setDocSpec] = useState('General Medicine');
  const [docContact, setDocContact] = useState('');

  // Ambulance Form
  const [ambPlate, setAmbPlate] = useState('');
  const [ambDriver, setAmbDriver] = useState('');
  const [ambContact, setAmbContact] = useState('');

  // Campaign Form
  const [campTitle, setCampTitle] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campType, setCampType] = useState('blood_camp');
  const [campDate, setCampDate] = useState('');
  const [campTime, setCampTime] = useState('');
  const [campVenue, setCampVenue] = useState('');

  // Inventory Inputs
  const [totalBeds, setTotalBeds] = useState(0);
  const [occupiedBeds, setOccupiedBeds] = useState(0);
  const [icuAvailable, setIcuAvailable] = useState(0);
  const [emergencyAvailable, setEmergencyAvailable] = useState(0);
  const [ventilatorsAvailable, setVentilatorsAvailable] = useState(0);
  const [bloodUnits, setBloodUnits] = useState({
    Ap: 0, An: 0, Bp: 0, Bn: 0, Op: 0, On: 0, ABp: 0, ABn: 0
  });

  const fetchStats = async () => {
    try {
      const { data } = await hospitalAPI.getDashboardStats();
      setStats(data);
      
      // Load inventory values
      if (data.hospital) {
        setTotalBeds(data.hospital.beds?.total || 0);
        setOccupiedBeds(data.hospital.beds?.occupied || 0);
        setIcuAvailable(data.hospital.beds?.icuAvailable || 0);
        setEmergencyAvailable(data.hospital.beds?.emergencyAvailable || 0);
        setVentilatorsAvailable(data.hospital.beds?.ventilatorsAvailable || 0);
        
        const bi = data.hospital.bloodInventory || {};
        setBloodUnits({
          Ap: bi.Ap?.availableUnits || 0,
          An: bi.An?.availableUnits || 0,
          Bp: bi.Bp?.availableUnits || 0,
          Bn: bi.Bn?.availableUnits || 0,
          Op: bi.Op?.availableUnits || 0,
          On: bi.On?.availableUnits || 0,
          ABp: bi.ABp?.availableUnits || 0,
          ABn: bi.ABn?.availableUnits || 0
        });
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('resource_request_received', () => {
        fetchStats();
      });
      socket.on('new_appointment', () => {
        fetchStats();
      });

      return () => {
        socket.off('resource_request_received');
        socket.off('new_appointment');
      };
    }
  }, [socket]);

  const handleUpdateInventory = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const payload = {
        beds: {
          total: Number(totalBeds),
          occupied: Number(occupiedBeds),
          icuAvailable: Number(icuAvailable),
          emergencyAvailable: Number(emergencyAvailable),
          ventilatorsAvailable: Number(ventilatorsAvailable)
        },
        bloodInventory: {
          Ap: { availableUnits: Number(bloodUnits.Ap) },
          An: { availableUnits: Number(bloodUnits.An) },
          Bp: { availableUnits: Number(bloodUnits.Bp) },
          Bn: { availableUnits: Number(bloodUnits.Bn) },
          Op: { availableUnits: Number(bloodUnits.Op) },
          On: { availableUnits: Number(bloodUnits.On) },
          ABp: { availableUnits: Number(bloodUnits.ABp) },
          ABn: { availableUnits: Number(bloodUnits.ABn) }
        }
      };
      await hospitalAPI.updateResources(payload);
      setSuccessMsg('Inventory resources updated successfully!');
      fetchStats();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update inventory.');
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    try {
      await doctorAPI.addDoctor({
        name: docName,
        specialization: docSpec,
        contact: docContact
      });
      setDocName('');
      setDocContact('');
      setSuccessMsg(`Dr. ${docName} added successfully.`);
      fetchStats();
    } catch (_err) {
      setErrorMsg('Failed to add doctor.');
    }
  };

  const handleRegisterAmbulance = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    try {
      await ambulanceAPI.register({
        licensePlate: ambPlate,
        driverName: ambDriver,
        driverContact: ambContact
      });
      setAmbPlate('');
      setAmbDriver('');
      setAmbContact('');
      setSuccessMsg('Ambulance registered successfully.');
      fetchStats();
    } catch (_err) {
      setErrorMsg('Failed to register ambulance.');
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    try {
      await campaignAPI.create({
        title: campTitle,
        description: campDesc,
        type: campType,
        date: campDate,
        time: campTime,
        venue: campVenue
      });
      setCampTitle('');
      setCampDesc('');
      setCampVenue('');
      setSuccessMsg('Campaign drive published.');
    } catch (_err) {
      setErrorMsg('Failed to create campaign.');
    }
  };

  if (loading) return <Typography align="center" py={10}>Loading Hospital Dashboard...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" color="#0f172a">
          {stats?.hospital?.name}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          License: {stats?.hospital?.licenseNumber} | Emergency hotline: {stats?.hospital?.emergencyPhone}
        </Typography>
      </Box>

      {/* Grid Stats Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Available Beds', value: stats?.hospital?.beds?.available, icon: <LocalHospital />, color: '#0F766E' },
          { label: 'ICU Beds Available', value: stats?.hospital?.beds?.icuAvailable, icon: <LocalHospital />, color: '#0D9488' },
          { label: 'Doctors Available', value: stats?.doctorsCount, icon: <People />, color: '#0F766E' },
          { label: 'Pending H2H Requests', value: stats?.pendingRequestsCount, icon: <NotificationsActive />, color: '#ea580c' }
        ].map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ borderLeft: `5px solid ${card.color}`, borderRadius: '12px', borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="#0F172A">{card.value}</Typography>
                  <Typography variant="body2" color="#64748B">{card.label}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: card.color, color: 'white' }}>{card.icon}</Avatar>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      <Tabs
        value={tabValue}
        onChange={(e, val) => setTabValue(val)}
        sx={{
          borderBottom: 1,
          borderColor: '#E2E8F0',
          mb: 4,
          '& .MuiTab-root': { fontWeight: '600', textTransform: 'none', color: '#64748B' },
          '& .Mui-selected': { color: '#0F766E' },
          '& .MuiTabs-indicator': { backgroundColor: '#0F766E' }
        }}
      >
        <Tab label="Inventory & Resource Manager" />
        <Tab label="Manage Staff / Doctors" />
        <Tab label="Manage Ambulance Fleet" />
        <Tab label="Host Health Drives" />
      </Tabs>

      {/* Tab 0: Inventory Manager */}
      {tabValue === 0 && (
        <form onSubmit={handleUpdateInventory}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>Beds & Ventilators Inventory</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}><TextField label="Total Bed Capacity" type="number" fullWidth value={totalBeds} onChange={(e) => setTotalBeds(e.target.value)} /></Grid>
                  <Grid item xs={6}><TextField label="Occupied Beds" type="number" fullWidth value={occupiedBeds} onChange={(e) => setOccupiedBeds(e.target.value)} /></Grid>
                  <Grid item xs={6}><TextField label="ICU Beds Available" type="number" fullWidth value={icuAvailable} onChange={(e) => setIcuAvailable(e.target.value)} /></Grid>
                  <Grid item xs={6}><TextField label="Emergency Beds Available" type="number" fullWidth value={emergencyAvailable} onChange={(e) => setEmergencyAvailable(e.target.value)} /></Grid>
                  <Grid item xs={12}><TextField label="Ventilators Available" type="number" fullWidth value={ventilatorsAvailable} onChange={(e) => setVentilatorsAvailable(e.target.value)} /></Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>Blood Bank Registry (Units)</Typography>
                <Grid container spacing={2}>
                  {Object.keys(bloodUnits).map((grp) => (
                    <Grid item xs={3} key={grp}>
                      <TextField
                        label={grp.replace('p', '+').replace('n', '-')}
                        type="number"
                        fullWidth
                        value={bloodUnits[grp]}
                        onChange={(e) => setBloodUnits({ ...bloodUnits, [grp]: e.target.value })}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" size="large" sx={{ px: 5, py: 1.5, fontWeight: 'bold' }}>
                Save Real-time Resource stock
              </Button>
            </Grid>
          </Grid>
        </form>
      )}

      {/* Tab 1: Manage Staff */}
      {tabValue === 1 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>Add Doctor profile</Typography>
              <form onSubmit={handleAddDoctor}>
                <TextField label="Doctor Name" fullWidth required value={docName} onChange={(e) => setDocName(e.target.value)} sx={{ mb: 2 }} />
                <TextField select label="Specialization" fullWidth value={docSpec} onChange={(e) => setDocSpec(e.target.value)} sx={{ mb: 2 }}>
                  {['General Medicine', 'Cardiologist', 'Pediatrician', 'Dermatologist', 'Neurologist', 'Orthopedist'].map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Contact Number" fullWidth required value={docContact} onChange={(e) => setDocContact(e.target.value)} sx={{ mb: 3 }} />
                <Button type="submit" variant="contained" fullWidth sx={{ fontWeight: 'bold' }}>Add Doctor</Button>
              </form>
            </Paper>
          </Grid>
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>Recent Bookings / Appointments</Typography>
              {stats?.recentAppointments?.length === 0 ? (
                <Typography color="textSecondary" align="center" py={4}>No recent bookings</Typography>
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
                      {stats?.recentAppointments?.map(a => (
                        <TableRow key={a._id}>
                          <TableCell>{a.patient?.name}</TableCell>
                          <TableCell>Dr. {a.doctor?.name}</TableCell>
                          <TableCell>{a.date} | {a.timeSlot}</TableCell>
                          <TableCell>{a.status.toUpperCase()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Manage Ambulance */}
      {tabValue === 2 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>Register Ambulance</Typography>
              <form onSubmit={handleRegisterAmbulance}>
                <TextField label="License Plate Number" placeholder="DL-3C-XX-XXXX" fullWidth required value={ambPlate} onChange={(e) => setAmbPlate(e.target.value)} sx={{ mb: 2 }} />
                <TextField label="Driver Name" fullWidth required value={ambDriver} onChange={(e) => setAmbDriver(e.target.value)} sx={{ mb: 2 }} />
                <TextField label="Driver Hotline" fullWidth required value={ambContact} onChange={(e) => setAmbContact(e.target.value)} sx={{ mb: 3 }} />
                <Button type="submit" variant="contained" fullWidth sx={{ fontWeight: 'bold' }}>Register Ambulance</Button>
              </form>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 3: Host Health Drives */}
      {tabValue === 3 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>Publish Health Campaign / Drive</Typography>
              <form onSubmit={handleCreateCampaign}>
                <TextField label="Campaign Title" fullWidth required value={campTitle} onChange={(e) => setCampTitle(e.target.value)} sx={{ mb: 2 }} />
                <TextField label="Description / Details" multiline rows={3} fullWidth required value={campDesc} onChange={(e) => setCampDesc(e.target.value)} sx={{ mb: 2 }} />
                <TextField select label="Campaign Type" fullWidth value={campType} onChange={(e) => setCampType(e.target.value)} sx={{ mb: 2 }}>
                  <MenuItem value="blood_camp">Blood Donation Camp</MenuItem>
                  <MenuItem value="vaccination">Vaccination Drive</MenuItem>
                  <MenuItem value="health_camp">Free Health Checkup Camp</MenuItem>
                  <MenuItem value="awareness">Awareness Drive</MenuItem>
                </TextField>
                <TextField label="Date" type="date" InputLabelProps={{ shrink: true }} fullWidth required value={campDate} onChange={(e) => setCampDate(e.target.value)} sx={{ mb: 2 }} />
                <TextField label="Time Range (e.g. 10AM-4PM)" fullWidth required value={campTime} onChange={(e) => setCampTime(e.target.value)} sx={{ mb: 2 }} />
                <TextField label="Venue Address" fullWidth required value={campVenue} onChange={(e) => setCampVenue(e.target.value)} sx={{ mb: 3 }} />
                <Button type="submit" variant="contained" fullWidth sx={{ fontWeight: 'bold' }}>Publish Drive</Button>
              </form>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default HospitalDashboard;
