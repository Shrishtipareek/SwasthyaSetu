import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Paper,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Chip,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  LocalHospital,
  Hotel,
  KingBed,
  Bloodtype,
  DirectionsCar,
  VerifiedUser,
  Close,
  LocationOn,
  Phone,
  OpenInNew,
  ArrowForward
} from '@mui/icons-material';
import { hospitalAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const PublicDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    hospitalsConnected: 0,
    availableBeds: 0,
    availableIcuBeds: 0,
    availableAmbulances: 0,
    availableBloodUnits: 0,
    emergencyHospitalsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Connected Hospitals Modal
  const [hospitalModalOpen, setHospitalModalOpen] = useState(false);
  const [hospitalList, setHospitalList] = useState([]);
  const [hospitalListLoading, setHospitalListLoading] = useState(false);
  const [hospitalListError, setHospitalListError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await hospitalAPI.getStats({ signal: controller.signal });
        if (data) {
          setStats({
            hospitalsConnected: data.hospitalsConnected ?? (data.hospitals?.length || 0),
            availableBeds: data.availableBeds ?? 0,
            availableIcuBeds: data.availableIcuBeds ?? 0,
            availableAmbulances: data.availableAmbulances ?? 0,
            availableBloodUnits: data.availableBloodUnits ?? (data.bloodUnitsAvailable || 0),
            emergencyHospitalsCount: data.emergencyHospitalsCount ?? (data.emergencyHospitals || 0)
          });
          if (Array.isArray(data.hospitals)) {
            setHospitalList(data.hospitals);
          }
        }
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
          return;
        }
        console.error('Failed to load public stats:', err.message);
        setError('Real-time database sync paused. Please refresh to fetch live hospital metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    return () => {
      controller.abort();
    };
  }, []);

  const handleOpenHospitalModal = async () => {
    setHospitalModalOpen(true);
    setHospitalListLoading(true);
    setHospitalListError('');
    try {
      // First try connected endpoint, fallback to getAll
      let list = [];
      try {
        const { data } = await hospitalAPI.getConnected();
        list = Array.isArray(data) ? data : [];
      } catch {
        const { data } = await hospitalAPI.getAll();
        list = Array.isArray(data) ? data : [];
      }
      setHospitalList(list);
    } catch (err) {
      console.error('Failed to load hospital list:', err.message);
      setHospitalListError('Unable to load connected hospitals list from database.');
    } finally {
      setHospitalListLoading(false);
    }
  };

  const metricCards = [
    {
      id: 'hospitals',
      label: 'Connected Hospitals',
      value: stats.hospitalsConnected,
      icon: <LocalHospital fontSize="large" sx={{ color: '#0F766E' }} />,
      clickable: true,
      hint: 'Click to view hospitals'
    },
    {
      id: 'beds',
      label: 'Available Total Beds',
      value: stats.availableBeds,
      icon: <Hotel fontSize="large" sx={{ color: '#0D9488' }} />
    },
    {
      id: 'icu',
      label: 'Available ICU Beds',
      value: stats.availableIcuBeds,
      icon: <KingBed fontSize="large" sx={{ color: '#0F766E' }} />
    },
    {
      id: 'blood',
      label: 'Blood Units Stocked',
      value: stats.availableBloodUnits,
      icon: <Bloodtype fontSize="large" sx={{ color: '#881337' }} />
    },
    {
      id: 'ambulances',
      label: 'Ready Ambulances',
      value: stats.availableAmbulances,
      icon: <DirectionsCar fontSize="large" sx={{ color: '#0F766E' }} />
    },
    {
      id: 'emergency',
      label: '24/7 Emergency Intakes',
      value: stats.emergencyHospitalsCount,
      icon: <VerifiedUser fontSize="large" sx={{ color: '#0D9488' }} />
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>
          Public Healthcare Resource Aggregates
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ maxWidth: '640px', mx: 'auto' }}>
          Real-time synchronized data from participating hospitals and medical institutions across the SwasthyaSetu emergency network.
        </Typography>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 4, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      {/* Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((item) => (
            <Grid key={item} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '14px', p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                  <Skeleton variant="rounded" width={56} height={56} sx={{ borderRadius: '14px' }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="50%" height={40} />
                    <Skeleton variant="text" width="75%" height={22} />
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))
        ) : (
          metricCards.map((item) => {
            const isClickable = Boolean(item.clickable);
            return (
              <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  onClick={isClickable ? handleOpenHospitalModal : undefined}
                  sx={{
                    border: isClickable ? '2px solid #0F766E' : '1px solid #E2E8F0',
                    borderRadius: '14px',
                    boxShadow: isClickable ? '0 4px 14px rgba(15, 118, 110, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease',
                    cursor: isClickable ? 'pointer' : 'default',
                    bgcolor: isClickable ? '#FAFCFC' : '#FFFFFF',
                    '&:hover': isClickable ? {
                      borderColor: '#0D9488',
                      boxShadow: '0 8px 24px rgba(15, 118, 110, 0.16)',
                      transform: 'translateY(-2px)'
                    } : {
                      borderColor: '#CBD5E1'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                      <Box sx={{ p: 2, bgcolor: isClickable ? '#E6F6F3' : '#F8FAFC', borderRadius: '14px' }}>
                        {item.icon}
                      </Box>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: '800', color: '#0F172A' }}>
                          {item.value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: '600' }}>
                          {item.label}
                        </Typography>
                        {isClickable && (
                          <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            View Hospitals <ArrowForward sx={{ fontSize: 13 }} />
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      {/* Info Card */}
      <Paper elevation={0} sx={{ p: 4, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0F172A', mb: 1 }}>
          Data Freshness & Transparency Standard
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
          All resource metrics displayed on SwasthyaSetu are directly synchronized from participating hospital clinical administration databases via Socket.IO real-time events. In emergency situations, bed or blood availability can fluctuate within minutes. Always verify critical admissions by calling the hospital emergency desk directly.
        </Typography>
      </Paper>

      {/* Connected Hospitals Details Dialog */}
      <Dialog
        open={hospitalModalOpen}
        onClose={() => setHospitalModalOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px', p: 1 } } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: '800', color: '#0F172A' }}>
              Connected Hospitals & Healthcare Facilities
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Institutions currently registered in the SwasthyaSetu emergency network ({hospitalList.length} connected)
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setHospitalModalOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ py: 3 }}>
          {hospitalListError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
              {hospitalListError}
            </Alert>
          )}

          {hospitalListLoading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <CircularProgress size={36} sx={{ color: '#0F766E', mb: 2 }} />
              <Typography variant="body2" color="textSecondary">
                Fetching connected hospitals from database...
              </Typography>
            </Box>
          ) : hospitalList.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center', border: '1px dashed #CBD5E1', borderRadius: '14px', bgcolor: '#F8FAFC' }}>
              <LocalHospital sx={{ fontSize: 52, color: '#94A3B8', mb: 1.5 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#334155' }}>
                No Connected Hospitals Registered Yet
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 460, mx: 'auto', mb: 3 }}>
                There are currently 0 hospital administrations registered in the database. When hospitals register with SwasthyaSetu, their details and bed capacities will appear here dynamically.
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setHospitalModalOpen(false);
                  navigate('/register');
                }}
                sx={{ bgcolor: '#0F766E', '&:hover': { bgcolor: '#0D9488' }, fontWeight: 'bold' }}
              >
                Register a Hospital Facility
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {hospitalList.map((hosp) => (
                <Grid key={hosp._id || hosp.id} size={{ xs: 12, sm: 6 }}>
                  <Card sx={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: '#0F766E', boxShadow: '0 4px 14px rgba(15, 118, 110, 0.08)' }
                  }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: '800', color: '#0F172A', lineHeight: 1.3 }}>
                          {hosp.name}
                        </Typography>
                        <Chip
                          label={hosp.verifiedStatus === 'verified' ? 'Verified' : 'Active'}
                          size="small"
                          color={hosp.verifiedStatus === 'verified' ? 'success' : 'default'}
                          sx={{ height: 22, fontSize: '0.65rem', fontWeight: 'bold' }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={hosp.hospitalType || 'Hospital'}
                          size="small"
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold', bgcolor: '#F1F5F9', color: '#334155' }}
                        />
                        {hosp.beds && (
                          <Chip
                            label={`${hosp.beds.available || 0} Beds`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold', bgcolor: '#DCFCE7', color: '#16A34A' }}
                          />
                        )}
                        {hosp.beds?.icuAvailable != null && (
                          <Chip
                            label={`${hosp.beds.icuAvailable} ICU`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold', bgcolor: '#E0F2FE', color: '#0369A1' }}
                          />
                        )}
                      </Box>

                      <Typography variant="body2" sx={{ color: '#64748B', mb: 1.5, display: 'flex', alignItems: 'flex-start', gap: 0.5, lineHeight: 1.4 }}>
                        <LocationOn fontSize="small" sx={{ color: '#94A3B8', mt: 0.2, flexShrink: 0 }} />
                        <span>{hosp.address || 'Address registered on network'}</span>
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        {(hosp.emergencyPhone || hosp.contactPhone) && (
                          <Button
                            size="small"
                            startIcon={<Phone />}
                            href={`tel:${hosp.emergencyPhone || hosp.contactPhone}`}
                            sx={{ color: '#0F766E', fontWeight: 'bold', textTransform: 'none' }}
                          >
                            {hosp.emergencyPhone || hosp.contactPhone}
                          </Button>
                        )}
                        {hosp.website && (
                          <Button
                            size="small"
                            endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                            href={hosp.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: '#64748B', textTransform: 'none' }}
                          >
                            Website
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setHospitalModalOpen(false)} variant="contained" sx={{ bgcolor: '#0F766E', '&:hover': { bgcolor: '#0D9488' }, fontWeight: 'bold' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PublicDashboard;
