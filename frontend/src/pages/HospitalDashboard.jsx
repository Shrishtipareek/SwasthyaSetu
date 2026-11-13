import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Tabs,
  Tab,
  Alert,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  LocalHospital,
  People,
  NotificationsActive
} from '@mui/icons-material';
import { hospitalAPI, doctorAPI, ambulanceAPI, campaignAPI, emergencyAPI, getErrorMessage } from '../services/api';
import { useSocket } from '../context/SocketContext';
import HospitalInventoryTab from '../components/hospital/HospitalInventoryTab';
import HospitalDoctorsTab from '../components/hospital/HospitalDoctorsTab';
import HospitalAmbulanceTab from '../components/hospital/HospitalAmbulanceTab';
import HospitalCampaignTab from '../components/hospital/HospitalCampaignTab';
import HospitalEmergencyTab from '../components/hospital/HospitalEmergencyTab';

const HospitalDashboard = () => {
  const socket = useSocket();
  const [tabValue, setTabValue] = useState(0); // 0: Inventory, 1: Doctors, 2: Ambulances, 3: Campaigns, 4: Emergencies
  const [stats, setStats] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
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

  // syncForm=false is used for background refreshes (socket events) so a hospital
  // admin's unsaved inventory edits are not overwritten while typing; every
  // hospital's inventory save broadcasts `resource_update` to all clients.
  const fetchStats = useCallback(async ({ syncForm = true } = {}) => {
    try {
      const { data } = await hospitalAPI.getDashboardStats();
      setStats(data);

      if (data.hospital && syncForm) {
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
  }, []);

  const fetchEmergencies = useCallback(async () => {
    try {
      const { data } = await emergencyAPI.getHospitalEmergencies();
      setEmergencies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err.message);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchEmergencies();
  }, [fetchStats, fetchEmergencies]);

  useEffect(() => {
    if (!socket) return undefined;
    const refreshStats = () => fetchStats({ syncForm: false });
    socket.on('resource_request_received', refreshStats);
    socket.on('new_appointment', refreshStats);
    socket.on('resource_update', refreshStats);
    socket.on('emergency_alert_received', fetchEmergencies);

    // Remove only these handlers: socket.off(event) without a handler also removes
    // listeners that other components (e.g. the Navbar) registered.
    return () => {
      socket.off('resource_request_received', refreshStats);
      socket.off('new_appointment', refreshStats);
      socket.off('resource_update', refreshStats);
      socket.off('emergency_alert_received', fetchEmergencies);
    };
  }, [socket, fetchStats, fetchEmergencies]);

  const handleEmergencyStatus = async (id, status) => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await emergencyAPI.updateStatus(id, { status });
      setSuccessMsg(`Emergency request updated: ${status.replace('_', ' ')}.`);
      fetchEmergencies();
      fetchStats({ syncForm: false });
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update emergency request.'));
    }
  };

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
      // err.message is axios' generic "Request failed with status code 400".
      setErrorMsg(getErrorMessage(err, 'Failed to update inventory.'));
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
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
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add doctor.');
    }
  };

  const handleRegisterAmbulance = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
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
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to register ambulance.');
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
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
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create campaign.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
          {stats?.hospital?.name}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          License: {stats?.hospital?.licenseNumber} | Emergency hotline: {stats?.hospital?.emergencyPhone}
        </Typography>
      </Box>

      {/* Grid Stats Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Available Beds', value: stats?.hospital?.beds?.available ?? 0, icon: <LocalHospital />, color: '#0F766E' },
          { label: 'ICU Beds Available', value: stats?.hospital?.beds?.icuAvailable ?? 0, icon: <LocalHospital />, color: '#0D9488' },
          { label: 'Doctors Registered', value: stats?.doctorsCount ?? 0, icon: <People />, color: '#0F766E' },
          { label: 'Pending H2H Requests', value: stats?.pendingRequestsCount ?? 0, icon: <NotificationsActive />, color: '#ea580c' }
        ].map((card, idx) => (
          <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderLeft: `5px solid ${card.color}`, borderRadius: '12px', borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0F172A' }}>{card.value}</Typography>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>{card.label}</Typography>
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
        <Tab label={`Emergency Intake${emergencies.filter((e) => e.status !== 'completed').length ? ` (${emergencies.filter((e) => e.status !== 'completed').length})` : ''}`} />
      </Tabs>

      {/* Tab 0: Inventory Manager */}
      {tabValue === 0 && (
        <HospitalInventoryTab
          totalBeds={totalBeds} setTotalBeds={setTotalBeds}
          occupiedBeds={occupiedBeds} setOccupiedBeds={setOccupiedBeds}
          icuAvailable={icuAvailable} setIcuAvailable={setIcuAvailable}
          emergencyAvailable={emergencyAvailable} setEmergencyAvailable={setEmergencyAvailable}
          ventilatorsAvailable={ventilatorsAvailable} setVentilatorsAvailable={setVentilatorsAvailable}
          bloodUnits={bloodUnits} setBloodUnits={setBloodUnits}
          handleUpdateInventory={handleUpdateInventory}
        />
      )}

      {/* Tab 1: Manage Staff */}
      {tabValue === 1 && (
        <HospitalDoctorsTab
          docName={docName} setDocName={setDocName}
          docSpec={docSpec} setDocSpec={setDocSpec}
          docContact={docContact} setDocContact={setDocContact}
          handleAddDoctor={handleAddDoctor}
          recentAppointments={stats?.recentAppointments}
        />
      )}

      {/* Tab 2: Manage Ambulance */}
      {tabValue === 2 && (
        <HospitalAmbulanceTab
          ambPlate={ambPlate} setAmbPlate={setAmbPlate}
          ambDriver={ambDriver} setAmbDriver={setAmbDriver}
          ambContact={ambContact} setAmbContact={setAmbContact}
          handleRegisterAmbulance={handleRegisterAmbulance}
        />
      )}

      {/* Tab 3: Host Health Drives */}
      {tabValue === 3 && (
        <HospitalCampaignTab
          campTitle={campTitle} setCampTitle={setCampTitle}
          campDesc={campDesc} setCampDesc={setCampDesc}
          campType={campType} setCampType={setCampType}
          campDate={campDate} setCampDate={setCampDate}
          campTime={campTime} setCampTime={setCampTime}
          campVenue={campVenue} setCampVenue={setCampVenue}
          handleCreateCampaign={handleCreateCampaign}
        />
      )}

      {/* Tab 4: Emergency Intake (SOS requests routed to this hospital) */}
      {tabValue === 4 && (
        <HospitalEmergencyTab emergencies={emergencies} onUpdateStatus={handleEmergencyStatus} />
      )}
    </Container>
  );
};

export default HospitalDashboard;
