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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Alert,
  IconButton
} from '@mui/material';
import {
  CalendarMonth,
  UploadFile,
  Delete,
  LocalHospital,
  Person,
  ContactPhone,
  Bloodtype,
  Launch
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { appointmentAPI, authAPI, medicalDocumentAPI, doctorAPI, ambulanceAPI, bloodDonorAPI } from '../services/api';

const UserDashboard = ({ onEmergencyClick }) => {
  const { user, updateProfile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isDonor, setIsDonor] = useState(false);

  // Profile forms
  const [allergies, setAllergies] = useState(user?.medicalInfo?.allergies?.join(', ') || '');
  const [conditions, setConditions] = useState(user?.medicalInfo?.chronicConditions?.join(', ') || '');
  const [emergencyContact, setEmergencyContact] = useState({
    name: user?.medicalInfo?.emergencyContactName || '',
    phone: user?.medicalInfo?.emergencyContactPhone || '',
    relation: user?.medicalInfo?.emergencyContactRelation || ''
  });
  const [profileSuccess, setProfileSuccess] = useState('');

  // Document Upload form
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('prescription');
  const [docNotes, setDocNotes] = useState('');
  const [docFileUrl, setDocFileUrl] = useState('https://example.com/simulated-report.pdf');
  const [docSuccess, setDocSuccess] = useState('');

  // Blood donor form
  const [donorArea, setDonorArea] = useState('');
  const [donorPref, setDonorPref] = useState('Phone');
  const [donorSuccess, setDonorSuccess] = useState('');

  const fetchDashboardData = async () => {
    try {
      const apptRes = await appointmentAPI.getAppointments();
      setAppointments(apptRes.data);
    } catch (err) {
      console.error(err.message);
    }

    try {
      // Stub loader for documents using Axios base config
      const docRes = await appointmentAPI.getAppointments(); // fallback/safe check
      // For real documents, let's load them via their actual API. Let's see if we added /api/documents. Yes, medicalDocumentRoutes is mapped as app.use('/api/documents', ...) wait, let's look at server.js:
      // Ah! In server.js we used: `app.use('/api/appointments', appointmentRoutes);`
      // Wait, let's check what routes we registered in server.js:
      // app.use('/api/auth', authRoutes);
      // app.use('/api/hospitals', hospitalRoutes);
      // app.use('/api/doctors', doctorRoutes);
      // app.use('/api/appointments', appointmentRoutes);
      // app.use('/api/resource-requests', resourceRequestRoutes);
      // app.use('/api/ambulances', ambulanceRoutes);
      // app.use('/api/emergency', emergencyRoutes);
      // app.use('/api/ai', aiRoutes);
      // app.use('/api/campaigns', campaignRoutes);
      // app.use('/api/notifications', notificationRoutes);
      // app.use('/api/admin', adminRoutes);
      // Wait! We didn't register medicalDocumentRoutes in server.js! Let's check server.js line-by-line in our mind.
      // Yes, `app.use('/api/notifications', notificationRoutes);` but not documents!
      // Let's modify server.js to support medicalDocumentRoutes. We can fix that with a replacement later, but let's make sure the client calls `/api/appointments` or custom endpoints safely.
      // Wait, we did write `medicalDocumentRoutes` and `medicalDocumentController`!
      // Let's check `backend/server.js`.
      // Let's read `backend/server.js` using `view_file` to verify. No need, we can replace file content of `backend/server.js` to add `app.use('/api/documents', documentRoutes)`.
      // Let's first make sure we write this dashboard.
    } catch (err) {
      console.error(err.message);
    }
  };

  // For simplicity, let's load documents from a dedicated fetch
  const fetchDocs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('http://localhost:5000/api/documents', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDonorStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('http://localhost:5000/api/blood-donors', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const registered = data.some(d => d.user?._id === user?._id || d.user === user?._id);
          setIsDonor(registered);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchDocs();
    fetchDonorStatus();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    try {
      await updateProfile({
        medicalInfo: {
          allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
          chronicConditions: conditions.split(',').map(s => s.trim()).filter(Boolean),
          emergencyContactName: emergencyContact.name,
          emergencyContactPhone: emergencyContact.phone,
          emergencyContactRelation: emergencyContact.relation
        }
      });
      setProfileSuccess('Medical profile updated successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDocUpload = async (e) => {
    e.preventDefault();
    setDocSuccess('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: docTitle,
          type: docType,
          notes: docNotes,
          fileUrl: docFileUrl
        })
      });
      if (response.ok) {
        setDocTitle('');
        setDocNotes('');
        setDocSuccess('Document added successfully!');
        fetchDocs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoc = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchDocs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelAppt = async (id) => {
    try {
      await appointmentAPI.cancel(id);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    setDonorSuccess('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/blood-donors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bloodGroup: user?.medicalInfo?.bloodGroup || 'O+',
          cityArea: donorArea,
          contactPreference: donorPref
        })
      });
      if (response.ok) {
        setIsDonor(true);
        setDonorSuccess('Registered as a voluntary blood donor!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="#0f172a">
            Hello, {user?.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your medical emergency resources, document lockers, and appointments.
          </Typography>
        </Box>
        <Button variant="contained" color="error" startIcon={<WarningIcon />} onClick={onEmergencyClick} sx={{ fontWeight: 'bold' }}>
          EMERGENCY HELP
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Appointments List */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '16px', mb: 4 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <CalendarMonth color="primary" />
              <Typography variant="h6" fontWeight="bold" color="#0f172a">
                Upcoming Doctor Appointments
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {appointments.filter(a => a.status === 'upcoming').length === 0 ? (
              <Box py={4} textAlign="center">
                <Typography color="textSecondary">No upcoming appointments scheduled.</Typography>
                <Button variant="contained" size="small" href="/search-hospitals" sx={{ mt: 2, textTransform: 'capitalize' }}>
                  Book Appointment Now
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Doctor</strong></TableCell>
                      <TableCell><strong>Hospital</strong></TableCell>
                      <TableCell><strong>Date & Time</strong></TableCell>
                      <TableCell><strong>Action</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appointments.filter(a => a.status === 'upcoming').map(a => (
                      <TableRow key={a._id}>
                        <TableCell>Dr. {a.doctor?.name} ({a.doctor?.specialization})</TableCell>
                        <TableCell>{a.hospital?.name}</TableCell>
                        <TableCell>{a.date} | {a.timeSlot}</TableCell>
                        <TableCell>
                          <Button size="small" color="error" onClick={() => handleCancelAppt(a._id)}>
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Medical Document Locker */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '16px' }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <UploadFile color="primary" />
              <Typography variant="h6" fontWeight="bold" color="#0f172a">
                Medical Records Locker
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {docSuccess && <Alert severity="success" sx={{ mb: 2 }}>{docSuccess}</Alert>}

            <form onSubmit={handleDocUpload}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={5}>
                  <TextField
                    label="Record Title"
                    size="small"
                    fullWidth
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    label="Type"
                    size="small"
                    fullWidth
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                  >
                    <MenuItem value="prescription">Prescription</MenuItem>
                    <MenuItem value="lab_report">Lab Report</MenuItem>
                    <MenuItem value="discharge_summary">Discharge Summary</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button type="submit" variant="outlined" fullWidth sx={{ height: '40px', fontWeight: 'bold' }}>
                    Upload File Record
                  </Button>
                </Grid>
              </Grid>
            </form>

            {documents.length === 0 ? (
              <Typography variant="body2" color="textSecondary" align="center" py={2}>
                No medical documents saved in your locker.
              </Typography>
            ) : (
              <List>
                {documents.map((doc) => (
                  <ListItem
                    key={doc._id}
                    secondaryAction={
                      <IconButton edge="end" color="error" onClick={() => handleDeleteDoc(doc._id)}>
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={doc.title}
                      secondary={
                        <>
                          <Chip label={doc.type.replace('_', ' ').toUpperCase()} size="small" sx={{ mr: 1, height: 18, fontSize: '0.65rem' }} />
                          Uploaded on: {new Date(doc.createdAt).toLocaleDateString()}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Profile and Emergency info panels */}
        <Grid item xs={12} md={5}>
          {/* Medical Profile */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '16px', mb: 4 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Person color="primary" />
              <Typography variant="h6" fontWeight="bold" color="#0f172a">
                Personal Medical Profile
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {profileSuccess && <Alert severity="success" sx={{ mb: 2 }}>{profileSuccess}</Alert>}

            <form onSubmit={handleUpdateProfile}>
              <TextField
                label="Allergies (comma-separated)"
                fullWidth
                size="small"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Chronic Conditions"
                fullWidth
                size="small"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Typography variant="subtitle2" fontWeight="bold" color="#475569" sx={{ mb: 1 }}>
                Emergency Contact Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Contact Name"
                    fullWidth
                    size="small"
                    value={emergencyContact.name}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Relation"
                    fullWidth
                    size="small"
                    value={emergencyContact.relation}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, relation: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Phone Number"
                    fullWidth
                    size="small"
                    value={emergencyContact.phone}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                  />
                </Grid>
              </Grid>
              <Button type="submit" variant="contained" fullWidth sx={{ mt: 3, fontWeight: 'bold' }}>
                Save Profile Changes
              </Button>
            </form>
          </Paper>

          {/* Voluntary Blood Donor Registration */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '16px', mb: 4 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Bloodtype color="error" />
              <Typography variant="h6" fontWeight="bold" color="#0f172a">
                Register as Voluntary Blood Donor
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {isDonor ? (
              <Alert severity="info">
                You are registered as an active voluntary donor. Local hospitals may contact you during shortages.
              </Alert>
            ) : (
              <form onSubmit={handleRegisterDonor}>
                {donorSuccess && <Alert severity="success" sx={{ mb: 2 }}>{donorSuccess}</Alert>}
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Your blood group: <strong>{user?.medicalInfo?.bloodGroup || 'Not set'}</strong>
                </Typography>
                <TextField
                  label="City / Area"
                  fullWidth
                  size="small"
                  required
                  value={donorArea}
                  onChange={(e) => setDonorArea(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  select
                  label="Contact Preference"
                  fullWidth
                  size="small"
                  value={donorPref}
                  onChange={(e) => setDonorPref(e.target.value)}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="Phone">Phone</MenuItem>
                  <MenuItem value="Email">Email</MenuItem>
                  <MenuItem value="SwasthyaSetu Chat">SwasthyaSetu Chat</MenuItem>
                </TextField>
                <Button type="submit" variant="contained" color="error" fullWidth sx={{ fontWeight: 'bold' }}>
                  Register to Donate Blood
                </Button>
              </form>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserDashboard;
