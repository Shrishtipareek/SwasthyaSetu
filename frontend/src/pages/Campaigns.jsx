import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Divider,
  Chip,
  Alert,
  Skeleton,
  Paper,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  CalendarMonth,
  LocationOn,
  LocalActivity,
  Campaign as CampaignIcon,
  Add,
  Refresh,
  CheckCircle,
  PeopleAlt,
  Close
} from '@mui/icons-material';
import { campaignAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Campaigns = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState('');
  const [registeringId, setRegisteringId] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Create Campaign Modal (for Hospital / Admin users)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('health_camp');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00 AM - 04:00 PM');
  const [newVenue, setNewVenue] = useState('');
  const [newOrganizer, setNewOrganizer] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
      const { data } = await campaignAPI.getCampaigns(params);
      setCampaigns(Array.isArray(data) ? data : (data?.campaigns || []));
    } catch (err) {
      console.error('Failed to load campaigns:', err.message);
      setError(err.response?.data?.message || 'Unable to fetch health campaigns from database.');
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleRegister = async (id) => {
    if (!user) {
      alert('Please log in to register for community health campaigns.');
      return;
    }
    setRegisteringId(id);
    setSuccessId('');
    try {
      await campaignAPI.register(id);
      setSuccessId(id);
      loadCampaigns();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to register for drive.');
    } finally {
      setRegisteringId('');
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreateLoading(true);

    try {
      await campaignAPI.create({
        title: newTitle,
        description: newDesc,
        type: newType,
        date: newDate,
        time: newTime,
        venue: newVenue,
        organizer: newOrganizer || user?.name || undefined
      });
      setCreateSuccess('Campaign published successfully!');
      setTimeout(() => {
        setCreateModalOpen(false);
        setNewTitle('');
        setNewDesc('');
        setNewDate('');
        setNewVenue('');
        setCreateSuccess('');
        loadCampaigns();
      }, 1000);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to publish campaign.');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatTypeLabel = (type = '') => {
    switch (type) {
      case 'blood_camp': return 'Blood Donation Camp';
      case 'vaccination': return 'Vaccination Drive';
      case 'health_camp': return 'Free Health Checkup';
      case 'awareness': return 'Health Awareness';
      default: return type.replace(/_/g, ' ').toUpperCase();
    }
  };

  const isHospitalOrAdmin = user?.role === 'hospital' || user?.role === 'admin';

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>
            Community Health Campaigns & Drives
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            Participate in verified vaccination drives, free health screenings, and voluntary donation camps.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {isHospitalOrAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateModalOpen(true)}
              sx={{ bgcolor: '#0F766E', '&:hover': { bgcolor: '#0D9488' }, fontWeight: 'bold', borderRadius: '10px' }}
            >
              Publish Campaign
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={() => loadCampaigns()}
            disabled={loading}
            sx={{ borderColor: '#CBD5E1', color: '#0F172A', fontWeight: '600', borderRadius: '10px' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '12px', mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#475569' }}>
            Filter Drive Type:
          </Typography>
          <TextField
            select
            size="small"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">All Health Campaigns</MenuItem>
            <MenuItem value="blood_camp">Blood Donation Camps</MenuItem>
            <MenuItem value="vaccination">Vaccination Drives</MenuItem>
            <MenuItem value="health_camp">Free Health Checkups</MenuItem>
            <MenuItem value="awareness">Awareness Drives</MenuItem>
          </TextField>
        </Box>

        <Typography variant="caption" color="textSecondary">
          Active Campaigns: <strong>{campaigns.length}</strong>
        </Typography>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: '12px' }} action={
          <Button color="inherit" size="small" onClick={() => loadCampaigns()}>Retry</Button>
        }>
          {error}
        </Alert>
      )}

      {/* Campaign Cards or Skeletons */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid key={item} size={{ xs: 12, md: 6 }}>
              <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '14px', p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="rounded" width={90} height={24} sx={{ borderRadius: '12px' }} />
                </Box>
                <Skeleton variant="text" width="90%" height={20} />
                <Skeleton variant="text" width="75%" height={20} sx={{ mb: 2 }} />
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                  <Skeleton variant="text" width="50%" height={24} />
                  <Skeleton variant="text" width="65%" height={24} />
                  <Skeleton variant="text" width="55%" height={24} />
                </Box>
                <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: '10px' }} />
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : campaigns.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', border: '1px dashed #CBD5E1', borderRadius: '16px', bgcolor: '#F8FAFC' }}>
          <CampaignIcon sx={{ fontSize: 52, color: '#94A3B8', mb: 1.5 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#334155' }}>
            No Health Campaigns Scheduled Currently
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
            There are no active community drives registered in the database matching this filter. Verified healthcare institutions can publish upcoming vaccination, blood donation, and health checkup camps.
          </Typography>
          {isHospitalOrAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateModalOpen(true)}
              sx={{ bgcolor: '#0F766E', '&:hover': { bgcolor: '#0D9488' }, fontWeight: 'bold' }}
            >
              Publish First Campaign Drive
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {campaigns.map(camp => {
            const userIdStr = user?._id || user?.id;
            const registered = (camp.registeredUsers || []).some(
              u => String(u?._id || u) === String(userIdStr)
            );
            const hostName = camp.hospital?.name || camp.organizer || 'SwasthyaSetu Healthcare Network';

            return (
              <Grid key={camp._id} size={{ xs: 12, md: 6 }}>
                <Card sx={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: '#0F766E', boxShadow: '0 6px 20px rgba(15, 118, 110, 0.08)' }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: '800', color: '#0F172A', lineHeight: 1.3 }}>
                        {camp.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                          label={formatTypeLabel(camp.type)}
                          size="small"
                          sx={{
                            bgcolor: '#E6F6F3',
                            color: '#0F766E',
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                          }}
                        />
                        {camp.status && (
                          <Chip
                            label={camp.status.toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: camp.status === 'active' ? '#DCFCE7' : '#F1F5F9',
                              color: camp.status === 'active' ? '#16A34A' : '#64748B',
                              fontWeight: 'bold',
                              fontSize: '0.65rem'
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{ color: '#64748B', mb: 2, lineHeight: 1.6, minHeight: 44 }}>
                      {camp.description}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarMonth sx={{ color: '#0F766E', fontSize: 19 }} />
                        <Typography variant="body2" sx={{ color: '#0F172A' }}>
                          Schedule: <strong>{camp.date}</strong> | {camp.time}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn sx={{ color: '#0F766E', fontSize: 19 }} />
                        <Typography variant="body2" sx={{ color: '#0F172A' }}>
                          Venue: <strong>{camp.venue}</strong>
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalActivity sx={{ color: '#0F766E', fontSize: 19 }} />
                        <Typography variant="body2" sx={{ color: '#0F172A' }}>
                          Organizer: <strong>{hostName}</strong>
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleAlt sx={{ color: '#64748B', fontSize: 19 }} />
                        <Typography variant="caption" color="textSecondary">
                          Registered Attendees: <strong>{camp.registeredUsers?.length || 0}</strong>
                        </Typography>
                      </Box>
                    </Box>

                    {successId === camp._id && (
                      <Alert severity="success" icon={<CheckCircle fontSize="inherit" />} sx={{ mb: 2, borderRadius: '8px' }}>
                        Drive registration confirmed successfully!
                      </Alert>
                    )}

                    {registered ? (
                      <Button
                        variant="contained"
                        color="success"
                        disabled
                        fullWidth
                        startIcon={<CheckCircle />}
                        sx={{ borderRadius: '10px', fontWeight: 'bold' }}
                      >
                        Slot Reserved
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        fullWidth
                        disabled={registeringId === camp._id}
                        onClick={() => handleRegister(camp._id)}
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: '#0F766E',
                          '&:hover': { bgcolor: '#0D9488' },
                          borderRadius: '10px'
                        }}
                      >
                        {registeringId === camp._id ? 'Registering...' : 'Register for Campaign'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create Campaign Dialog (for Hospitals/Admins) */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '14px', p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Publish New Community Health Drive
          <IconButton size="small" onClick={() => setCreateModalOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleCreateCampaign}>
          <DialogContent sx={{ pt: 1 }}>
            {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
            {createSuccess && <Alert severity="success" sx={{ mb: 2 }}>{createSuccess}</Alert>}

            <TextField
              label="Campaign Title"
              fullWidth
              required
              placeholder="e.g. Mega Blood Donation Drive 2026"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Description / Details"
              multiline
              rows={3}
              fullWidth
              required
              placeholder="Details on eligibility, medical checkups included, and prerequisites..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              select
              label="Campaign Type"
              fullWidth
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="blood_camp">Blood Donation Camp</MenuItem>
              <MenuItem value="vaccination">Vaccination Drive</MenuItem>
              <MenuItem value="health_camp">Free Health Checkup</MenuItem>
              <MenuItem value="awareness">Health Awareness</MenuItem>
            </TextField>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Time Range"
                  fullWidth
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </Grid>
            </Grid>
            <TextField
              label="Venue Address"
              fullWidth
              required
              placeholder="e.g. Civil Hospital Auditorium, Ward 4"
              value={newVenue}
              onChange={(e) => setNewVenue(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Organizer / Host Name"
              fullWidth
              placeholder="e.g. City General Hospital / Red Cross"
              value={newOrganizer}
              onChange={(e) => setNewOrganizer(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCreateModalOpen(false)} sx={{ color: '#64748B' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createLoading}
              sx={{ bgcolor: '#0F766E', '&:hover': { bgcolor: '#0D9488' }, fontWeight: 'bold' }}
            >
              {createLoading ? 'Publishing...' : 'Publish to Directory'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Campaigns;
