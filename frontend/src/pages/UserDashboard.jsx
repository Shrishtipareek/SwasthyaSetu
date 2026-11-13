import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Typography,
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
  IconButton,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton
} from '@mui/material';
import {
  CalendarMonth,
  UploadFile,
  Delete,
  Person,
  Bloodtype,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { appointmentAPI, medicalDocumentAPI, bloodDonorAPI, getErrorMessage } from '../services/api';

const UserDashboard = ({ onEmergencyClick }) => {
  const { user, updateProfile } = useAuth();
  const [actionError, setActionError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isDonor, setIsDonor] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(null);

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
  const [docFileUrl] = useState('https://example.com/simulated-report.pdf');
  const [docSuccess, setDocSuccess] = useState('');

  // Blood donor form
  const [donorArea, setDonorArea] = useState('');
  const [donorPref, setDonorPref] = useState('Phone');
  // Never pre-select a blood group the user did not provide (it used to default to "O+").
  const [donorBloodGroup, setDonorBloodGroup] = useState(user?.medicalInfo?.bloodGroup || '');
  const [donorSuccess, setDonorSuccess] = useState('');
  const [donorError, setDonorError] = useState('');
  const [donorLoading, setDonorLoading] = useState(false);
  const [isEditingDonor, setIsEditingDonor] = useState(false);
  const [confirmDeleteDonor, setConfirmDeleteDonor] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const apptRes = await appointmentAPI.getAppointments();
      setAppointments(apptRes.data);
    } catch (err) {
      console.error(err.message);
    }
  }, []);

  const fetchDocs = useCallback(async () => {
    try {
      const { data } = await medicalDocumentAPI.getDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err.message);
    }
  }, []);

  const fetchDonorStatus = useCallback(async () => {
    try {
      const { data } = await bloodDonorAPI.getMyProfile();
      if (data?.isRegistered && data.donor) {
        setIsDonor(true);
        if (data.donor.bloodGroup) setDonorBloodGroup(data.donor.bloodGroup);
        if (data.donor.cityArea) setDonorArea(data.donor.cityArea);
        if (data.donor.contactPreference) setDonorPref(data.donor.contactPreference);
      } else {
        setIsDonor(false);
      }
    } catch (err) {
      console.error('Error fetching donor status:', err.message);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoadingData(true);
      await Promise.allSettled([
        fetchDashboardData(),
        fetchDocs(),
        fetchDonorStatus()
      ]);
      setLoadingData(false);
    };
    loadAll();
  }, [user, fetchDashboardData, fetchDocs, fetchDonorStatus]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setActionError('');
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
      setActionError(getErrorMessage(err, 'Failed to update medical profile.'));
    }
  };

  const handleDocUpload = async (e) => {
    e.preventDefault();
    setDocSuccess('');
    setActionError('');
    try {
      await medicalDocumentAPI.upload({
        title: docTitle,
        type: docType,
        notes: docNotes,
        fileUrl: docFileUrl
      });
      setDocTitle('');
      setDocNotes('');
      setDocSuccess('Document added successfully!');
      fetchDocs();
    } catch (err) {
      console.error('Failed to upload document:', err.message);
      setActionError(getErrorMessage(err, 'Failed to add document.'));
    }
  };

  const handleConfirmDeleteDoc = async () => {
    if (!deletingDoc) return;
    setActionError('');
    try {
      await medicalDocumentAPI.delete(deletingDoc._id);
      setDeletingDoc(null);
      fetchDocs();
    } catch (err) {
      console.error('Failed to delete document:', err.message);
      setDeletingDoc(null);
      setActionError(getErrorMessage(err, 'Failed to delete document.'));
    }
  };

  const handleConfirmCancelAppt = async () => {
    if (!cancellingAppt) return;
    setActionError('');
    try {
      await appointmentAPI.cancel(cancellingAppt._id);
      setCancellingAppt(null);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to cancel appointment:', err.message);
      setCancellingAppt(null);
      setActionError(getErrorMessage(err, 'Failed to cancel appointment.'));
    }
  };

  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    setDonorSuccess('');
    setDonorError('');
    setDonorLoading(true);
    try {
      await bloodDonorAPI.register({
        bloodGroup: donorBloodGroup,
        cityArea: donorArea,
        contactPreference: donorPref
      });
      setIsDonor(true);
      setIsEditingDonor(false);
      setDonorSuccess('Successfully registered as a voluntary blood donor!');
      fetchDonorStatus();
    } catch (err) {
      console.error('Failed to register donor:', err.message);
      setDonorError(err.response?.data?.message || 'Failed to register as blood donor.');
    } finally {
      setDonorLoading(false);
    }
  };

  const handleConfirmRemoveDonor = async () => {
    setDonorLoading(true);
    setDonorError('');
    try {
      await bloodDonorAPI.remove();
      setIsDonor(false);
      setIsEditingDonor(false);
      setConfirmDeleteDonor(false);
      setDonorSuccess('Voluntary blood donor registration removed.');
    } catch (err) {
      console.error('Failed to remove donor:', err.message);
      setDonorError(err.response?.data?.message || 'Failed to remove blood donor registration.');
    } finally {
      setDonorLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
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

      {actionError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setActionError('')}>
          {actionError}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Appointments List */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: '14px', mb: 4, bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CalendarMonth sx={{ color: '#0F766E' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0F172A' }}>
                Upcoming Doctor Appointments
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {loadingData ? (
              <Box sx={{ py: 2 }}>
                <Skeleton variant="text" width="100%" height={36} />
                <Skeleton variant="text" width="100%" height={36} />
                <Skeleton variant="text" width="100%" height={36} />
              </Box>
            ) : appointments.filter(a => a.status === 'upcoming').length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
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
                          <Button size="small" color="error" variant="outlined" onClick={() => setCancellingAppt(a)}>
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
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: '14px', bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <UploadFile sx={{ color: '#0F766E' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0F172A' }}>
                Medical Records Locker
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {docSuccess && <Alert severity="success" sx={{ mb: 2 }}>{docSuccess}</Alert>}

            <form onSubmit={handleDocUpload}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <TextField
                    label="Record Title"
                    size="small"
                    fullWidth
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
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
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Button type="submit" variant="outlined" fullWidth sx={{ height: '40px', fontWeight: 'bold', borderColor: '#0F766E', color: '#0F766E', '&:hover': { bgcolor: '#E6F6F3' } }}>
                    Upload File Record
                  </Button>
                </Grid>
              </Grid>
            </form>

            {loadingData ? (
              <Box sx={{ py: 2 }}>
                <Skeleton variant="text" width="100%" height={36} />
                <Skeleton variant="text" width="100%" height={36} />
              </Box>
            ) : documents.length === 0 ? (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                No medical documents saved in your locker.
              </Typography>
            ) : (
              <List>
                {documents.map((doc) => (
                  <ListItem
                    key={doc._id}
                    secondaryAction={
                      <IconButton edge="end" color="error" onClick={() => setDeletingDoc(doc)}>
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={doc.title}
                      secondary={
                        <>
                          <Chip label={doc.type.replace('_', ' ').toUpperCase()} size="small" sx={{ mr: 1, height: 20, fontSize: '0.65rem', bgcolor: '#E6F6F3', color: '#0F766E', fontWeight: 'bold' }} />
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
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Medical Profile */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: '14px', mb: 4, bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Person sx={{ color: '#0F766E' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0F172A' }}>
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
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#475569', mb: 1 }}>
                Emergency Contact Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    label="Contact Name"
                    fullWidth
                    size="small"
                    value={emergencyContact.name}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    label="Relation"
                    fullWidth
                    size="small"
                    value={emergencyContact.relation}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, relation: e.target.value })}
                  />
                </Grid>
                <Grid size={12}>
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

          {/* Voluntary Blood Donor Registration & Management */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '16px', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Bloodtype color="error" />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                  Voluntary Blood Donor
                </Typography>
              </Box>
              {isDonor && !isEditingDonor && (
                <Chip label="Active Donor" color="success" size="small" sx={{ fontWeight: 'bold' }} />
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />

            {donorSuccess && <Alert severity="success" sx={{ mb: 2 }}>{donorSuccess}</Alert>}
            {donorError && <Alert severity="error" sx={{ mb: 2 }}>{donorError}</Alert>}

            {isDonor && !isEditingDonor ? (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  You are registered as an active voluntary donor. Local emergency systems and hospitals may contact you during critical shortages.
                </Alert>
                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '10px', mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.8 }}>
                    Blood Group: <strong>{donorBloodGroup}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.8 }}>
                    Registered Area: <strong>{donorArea}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Contact Preference: <strong>{donorPref}</strong>
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => setIsEditingDonor(true)}
                    sx={{ color: '#0F766E', borderColor: '#0F766E', fontWeight: 'bold' }}
                  >
                    Edit Details
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    fullWidth
                    onClick={() => setConfirmDeleteDonor(true)}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Deregister
                  </Button>
                </Box>
              </Box>
            ) : (
              <form onSubmit={handleRegisterDonor}>
                <TextField
                  select
                  label="Blood Group"
                  fullWidth
                  size="small"
                  required
                  value={donorBloodGroup}
                  onChange={(e) => setDonorBloodGroup(e.target.value)}
                  sx={{ mb: 2 }}
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="City / Area"
                  fullWidth
                  size="small"
                  required
                  placeholder="e.g. Kanpur, Saket, Parel"
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
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  {isEditingDonor && (
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setIsEditingDonor(false)}
                      disabled={donorLoading}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    color="error"
                    fullWidth
                    disabled={donorLoading}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {donorLoading ? 'Saving...' : isEditingDonor ? 'Save Updates' : 'Register to Donate Blood'}
                  </Button>
                </Box>
              </form>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Appointment Cancellation Confirmation Dialog */}
      <Dialog
        open={Boolean(cancellingAppt)}
        onClose={() => setCancellingAppt(null)}
        slotProps={{ paper: { sx: { borderRadius: '12px', p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0F172A' }}>
          Confirm Appointment Cancellation
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569' }}>
            Are you sure you want to cancel your appointment with <strong>Dr. {cancellingAppt?.doctor?.name}</strong> at <strong>{cancellingAppt?.hospital?.name}</strong> on {cancellingAppt?.date} ({cancellingAppt?.timeSlot})?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 2 }}>
          <Button onClick={() => setCancellingAppt(null)} sx={{ color: '#64748B' }}>
            Keep Appointment
          </Button>
          <Button onClick={handleConfirmCancelAppt} color="error" variant="contained">
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Deletion Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingDoc)}
        onClose={() => setDeletingDoc(null)}
        slotProps={{ paper: { sx: { borderRadius: '12px', p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0F172A' }}>
          Delete Medical Document
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569' }}>
            Are you sure you want to permanently delete <strong>{deletingDoc?.title}</strong> from your medical record locker? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 2 }}>
          <Button onClick={() => setDeletingDoc(null)} sx={{ color: '#64748B' }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDeleteDoc} color="error" variant="contained">
            Delete Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deregister Blood Donor Confirmation Dialog */}
      <Dialog
        open={confirmDeleteDonor}
        onClose={() => setConfirmDeleteDonor(false)}
        slotProps={{ paper: { sx: { borderRadius: '12px', p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0F172A' }}>
          Deregister as Blood Donor
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569' }}>
            Are you sure you want to remove your voluntary blood donor registration? You will no longer be listed in the community donor directory during emergency blood shortages.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 2 }}>
          <Button onClick={() => setConfirmDeleteDonor(false)} sx={{ color: '#64748B' }} disabled={donorLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmRemoveDonor} color="error" variant="contained" disabled={donorLoading}>
            {donorLoading ? 'Removing...' : 'Confirm Deregister'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserDashboard;
