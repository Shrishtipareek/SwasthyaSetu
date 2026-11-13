import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Divider,
  Paper,
  Card,
  CardContent,
  Alert,
  IconButton,
  Chip,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  FormControl,
  TextField
} from '@mui/material';
import {
  Close as CloseIcon,
  Phone,
  Directions,
  CheckCircle,
  Warning as WarningIcon,
  MonitorHeart,
  Hotel,
  AirportShuttle,
  Bloodtype,
  Air,
  MedicalServices,
  LocalHospital
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { emergencyAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_HELPLINES = ['108 (National Ambulance)', '102 (Medical Intake)', '112 (Universal Emergency)'];

// Custom Icon for User's Location (Red Pin)
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const EmergencyModal = ({ open, onClose }) => {
  const { user } = useAuth();
  const [guestPhone, setGuestPhone] = useState('');
  const [helplines, setHelplines] = useState(DEFAULT_HELPLINES);
  const [step, setStep] = useState(1); // 1: Select Type, 2: Locating/Loading, 3: Results
  const [selectedType, setSelectedType] = useState('');
  const [_loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 28.6139, lng: 77.2090 });
  const [locationNotice, setLocationNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [selectedArea, setSelectedArea] = useState('central_delhi');

  const areaCoordinates = {
    central_delhi: { name: 'Central Delhi (Connaught Place / AIIMS)', lat: 28.6139, lng: 77.2090 },
    south_delhi: { name: 'South Delhi (Saket / Max Super Speciality)', lat: 28.5284, lng: 77.2198 },
    sarita_vihar: { name: 'South-East Delhi (Sarita Vihar / Apollo)', lat: 28.5361, lng: 77.2882 },
    east_delhi: { name: 'East Delhi (Mayur Vihar / Preet Vihar)', lat: 28.6280, lng: 77.2789 },
    north_delhi: { name: 'North Delhi (Civil Lines / Rohini)', lat: 28.6890, lng: 77.2060 }
  };

  const emergencyOptions = [
    { label: 'ICU Bed', value: 'icu', color: '#DC2626', hint: 'Critical care bed', icon: <MonitorHeart /> },
    { label: 'Emergency Bed', value: 'bed', color: '#DC2626', hint: 'ER admission', icon: <Hotel /> },
    { label: 'Ambulance', value: 'ambulance', color: '#EA580C', hint: 'Dispatch transport', icon: <AirportShuttle /> },
    { label: 'Blood', value: 'blood', color: '#9F1239', hint: 'Blood units', icon: <Bloodtype /> },
    { label: 'Oxygen', value: 'oxygen', color: '#0284C7', hint: 'Oxygen support', icon: <Air /> },
    { label: 'Emergency Doctor', value: 'doctor', color: '#0F766E', hint: 'On-call doctor', icon: <MedicalServices /> },
    { label: 'Nearby Hospital', value: 'nearby_hospital', color: '#4F46E5', hint: 'Closest facility', icon: <LocalHospital /> }
  ];

  const handleSelectType = async (type) => {
    setSelectedType(type);
    setStep(2);
    setLoading(true);
    setErrorMsg('');
    setLocationNotice('');

    if (useManualLocation) {
      const selected = areaCoordinates[selectedArea] || areaCoordinates.central_delhi;
      setUserLocation(selected);
      setLocationNotice(`Using manual location selection: ${selected.name}`);
      return submitEmergency(type, selected);
    }

    // Step 1: Detect user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          submitEmergency(type, loc);
        },
        (error) => {
          console.warn('Geolocation blocked or unavailable, using Delhi coordinates fallback.', error.message);
          setLocationNotice('GPS access unavailable; using regional reference coordinates.');
          const fallbackLoc = areaCoordinates[selectedArea] || { lat: 28.6129, lng: 77.2290 };
          setUserLocation(fallbackLoc);
          submitEmergency(type, fallbackLoc);
        },
        { timeout: 8000 }
      );
    } else {
      setLocationNotice('Browser geolocation unsupported; using regional coordinates.');
      const fallbackLoc = areaCoordinates[selectedArea] || { lat: 28.6129, lng: 77.2290 };
      setUserLocation(fallbackLoc);
      submitEmergency(type, fallbackLoc);
    }
  };

  const submitEmergency = async (type, loc) => {
    try {
      // Logged-in users are reached on their profile number; guests may type one.
      // A hard-coded demo number used to be sent for everyone.
      const contactNumber = guestPhone.trim() || user?.phone || undefined;
      const { data } = await emergencyAPI.initiate({
        requestType: type,
        location: loc,
        contactNumber,
        details: `Emergency ${type.toUpperCase()} request triggered.`
      });
      setResults(data);
      if (data?.emergencyHelplines?.length) setHelplines(data.emergencyHelplines);
      setStep(3);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.emergencyHelplines?.length) setHelplines(err.response.data.emergencyHelplines);
      setErrorMsg(getErrorMessage(err, 'Failed to process emergency request. Please try calling hospitals directly.'));
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedType('');
    setResults(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="lg"
      slotProps={{ paper: {
        sx: {
          borderRadius: '16px',
          overflow: 'hidden'
        }
      } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: selectedType === 'blood' ? '#881337' : '#991b1b', color: 'white', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon />
          {/* color: inherit, otherwise the theme's dark h6 colour sits on the red header */}
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'inherit', letterSpacing: '0.02em' }}>EMERGENCY ASSISTANCE</Typography>
        </Box>
        <IconButton color="inherit" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, md: 4 }, bgcolor: '#fafafa' }}>
        {step === 1 && (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1e293b' }}>
              WHAT DO YOU NEED?
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Select your required emergency resource to find nearby hospitals with live available stock.
            </Typography>

            {!user && (
              <TextField
                label="Your phone number"
                helperText="Optional, so the hospital can call you back"
                type="tel"
                size="small"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                sx={{ mb: 3, width: '100%', maxWidth: 420 }}
              />
            )}

            <Box sx={{ mb: 3, p: 2, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useManualLocation}
                    onChange={(e) => setUseManualLocation(e.target.checked)}
                    color="primary"
                  />
                }
                label={<Typography variant="body2" sx={{ fontWeight: '600' }}>Manual Location Selector</Typography>}
              />

              {useManualLocation && (
                <FormControl size="small" sx={{ minWidth: 260 }}>
                  <Select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    sx={{ borderRadius: '8px', fontSize: '0.88rem' }}
                  >
                    {Object.entries(areaCoordinates).map(([key, val]) => (
                      <MenuItem key={key} value={key}>{val.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
              {emergencyOptions.map((opt) => (
                <Grid key={opt.value} size={{ xs: 6, sm: 4, md: 3 }}>
                  <Button
                    fullWidth
                    onClick={() => handleSelectType(opt.value)}
                    sx={{
                      height: '100%',
                      py: 2.25,
                      px: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      borderRadius: '14px',
                      bgcolor: '#FFFFFF',
                      color: '#0F172A',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
                      '&:hover': {
                        bgcolor: `${opt.color}0D`,
                        borderColor: opt.color,
                        boxShadow: `0 6px 18px ${opt.color}26`,
                      }
                    }}
                  >
                    <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: `${opt.color}14`, color: opt.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {opt.icon}
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.98rem', lineHeight: 1.2 }}>{opt.label}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.3 }}>{opt.hint}</Typography>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {step === 2 && (
          <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress color="error" size={50} sx={{ mb: 3 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#334155' }}>
              Locating nearest verified hospitals...
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Checking real-time bed, ICU, and resource availability grids.
            </Typography>
          </Box>
        )}

        {step === 3 && (
          <Box>
            {errorMsg ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMsg}
                <Box sx={{ mt: 1 }}>Emergency helplines: <strong>{helplines.join(' · ')}</strong></Box>
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {/* Hospital List Panel */}
                <Grid size={{ xs: 12, md: 5 }}>
                  {results?.emergencyRequest ? (
                    <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                      Your emergency request has been logged and sent to <strong>{results.recommendedHospitals?.[0]?.name || 'the nearest available hospital'}</strong>.
                    </Alert>
                  ) : (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {results?.message || 'Your request could not be logged. Please call one of these hospitals directly.'}
                      <Box sx={{ mt: 1 }}>Emergency helplines: <strong>{helplines.join(' · ')}</strong></Box>
                    </Alert>
                  )}
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                    Recommended Hospitals
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {locationNotice && (
                    <Alert severity="info" sx={{ mb: 2, py: 0.5, borderRadius: '8px', fontSize: '0.85rem' }}>
                      {locationNotice}
                    </Alert>
                  )}
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '420px', overflowY: 'auto', pr: 1 }}>
                    {results?.recommendedHospitals?.map((rh, index) => (
                      <Card
                        key={rh._id}
                        elevation={0}
                        sx={{
                          border: index === 0 ? '2px solid #22c55e' : '1px solid #e2e8f0',
                          borderRadius: '12px',
                          bgcolor: index === 0 ? '#f0fdf4' : '#ffffff'
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                                {rh.name} {index === 0 && <Chip label="BEST CHOICE" color="success" size="small" sx={{ ml: 1, height: 20 }} />}
                              </Typography>
                              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                {rh.address}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 500 }}>
                                Distance: <strong>{typeof rh.distance === 'number' ? `${rh.distance.toFixed(1)} km` : '—'}</strong> | Travel Time: <strong>{rh.travelTime || '—'}</strong>
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mt: 0.5 }}>
                                ICU Beds: {rh.icuAvailable} | Emergency Beds: {rh.emergencyAvailable}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              startIcon={<Phone />}
                              href={`tel:${rh.emergencyPhone}`}
                              sx={{ flexGrow: 1, fontWeight: 'bold' }}
                            >
                              Call Emergency
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Directions />}
                              target="_blank"
                              href={`https://www.google.com/maps/dir/?api=1&destination=${rh.location.lat},${rh.location.lng}`}
                              sx={{ fontWeight: 'bold' }}
                            >
                              Directions
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Grid>

                {/* Map Display Panel */}
                <Grid size={{ xs: 12, md: 7 }}>
                  <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', height: '480px' }}>
                    <MapContainer
                      center={[userLocation.lat, userLocation.lng]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      
                      {/* User Location Marker */}
                      <Marker position={[userLocation.lat, userLocation.lng]} icon={redIcon}>
                        <Popup>
                          <strong>Your Location</strong>
                        </Popup>
                      </Marker>

                      {/* Hospital Location Markers */}
                      {results?.recommendedHospitals?.map((rh) => (
                        <Marker key={rh._id} position={[rh.location.lat, rh.location.lng]}>
                          <Popup>
                            <strong>{rh.name}</strong>
                            <br />
                            Emergency Contact: {rh.emergencyPhone}
                            <br />
                            ICU Available: {rh.icuAvailable}
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyModal;
