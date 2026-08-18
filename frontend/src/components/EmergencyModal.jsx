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
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Phone,
  Directions,
  CheckCircle,
  Warning as WarningIcon
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { emergencyAPI } from '../services/api';

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
  const [step, setStep] = useState(1); // 1: Select Type, 2: Locating/Loading, 3: Results
  const [selectedType, setSelectedType] = useState('');
  const [_loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 28.6139, lng: 77.2090 });
  const [errorMsg, setErrorMsg] = useState('');

  const emergencyOptions = [
    { label: 'ICU Bed', value: 'icu', color: '#dc2626' },
    { label: 'Emergency Bed', value: 'bed', color: '#dc2626' },
    { label: 'Ambulance', value: 'ambulance', color: '#ea580c' },
    { label: 'Blood', value: 'blood', color: '#881337' },
    { label: 'Oxygen', value: 'oxygen', color: '#0284c7' },
    { label: 'Emergency Doctor', value: 'doctor', color: '#0d9488' },
    { label: 'Nearby Hospital', value: 'nearby_hospital', color: '#4f46e5' }
  ];

  const handleSelectType = async (type) => {
    setSelectedType(type);
    setStep(2);
    setLoading(true);
    setErrorMsg('');

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
          // Fallback coordinates (Delhi)
          const fallbackLoc = { lat: 28.6129, lng: 77.2290 };
          setUserLocation(fallbackLoc);
          submitEmergency(type, fallbackLoc);
        },
        { timeout: 8000 }
      );
    } else {
      const fallbackLoc = { lat: 28.6129, lng: 77.2290 };
      setUserLocation(fallbackLoc);
      submitEmergency(type, fallbackLoc);
    }
  };

  const submitEmergency = async (type, loc) => {
    try {
      const phoneNum = '9876543210'; // default demo patient contact number
      const { data } = await emergencyAPI.initiate({
        requestType: type,
        location: loc,
        contactNumber: phoneNum,
        details: `Emergency ${type.toUpperCase()} request triggered.`
      });
      setResults(data);
      setStep(3);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process emergency request. Please try calling hospitals directly.');
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
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: selectedType === 'blood' ? '#881337' : '#991b1b', color: 'white', p: 2 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon />
          <Typography variant="h6" fontWeight="bold">EMERGENCY ASSISTANCE</Typography>
        </Box>
        <IconButton color="inherit" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, md: 4 }, bgcolor: '#fafafa' }}>
        {step === 1 && (
          <Box py={2} textAlign="center">
            <Typography variant="h5" fontWeight="bold" gutterBottom color="#1e293b">
              WHAT DO YOU NEED?
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
              Select your required emergency resource to find nearby hospitals with live available stock.
            </Typography>
            <Grid container spacing={2} justifyContent="center">
              {emergencyOptions.map((opt) => (
                <Grid item xs={6} sm={4} key={opt.value}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleSelectType(opt.value)}
                    sx={{
                      py: 3,
                      bgcolor: opt.color,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      borderRadius: '12px',
                      boxShadow: `0 4px 12px ${opt.color}44`,
                      '&:hover': {
                        bgcolor: opt.color,
                        filter: 'brightness(0.9)',
                        boxShadow: `0 6px 16px ${opt.color}66`,
                      }
                    }}
                  >
                    {opt.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {step === 2 && (
          <Box py={8} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
            <CircularProgress color="error" size={50} sx={{ mb: 3 }} />
            <Typography variant="h6" fontWeight="bold" color="#334155">
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
              <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>
            ) : (
              <Grid container spacing={3}>
                {/* Hospital List Panel */}
                <Grid item xs={12} md={5}>
                  <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                    Your emergency request has been logged and assigned to <strong>{results?.emergencyRequest?.hospital ? 'the nearest available hospital' : 'nearest facility'}</strong>.
                  </Alert>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="#1e293b">
                    Recommended Hospitals
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box display="flex" flexDirection="column" gap={2} sx={{ maxHeight: '420px', overflowY: 'auto', pr: 1 }}>
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
                              <Typography variant="subtitle1" fontWeight="bold" color="#0f172a">
                                {rh.name} {index === 0 && <Chip label="BEST CHOICE" color="success" size="small" sx={{ ml: 1, height: 20 }} />}
                              </Typography>
                              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                {rh.address}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 500 }}>
                                Distance: <strong>{rh.distance.toFixed(1)} km</strong> | Travel Time: <strong>{rh.travelTime}</strong>
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ color: '#64748b', mt: 0.5 }}>
                                ICU Beds: {rh.icuAvailable} | Emergency Beds: {rh.emergencyAvailable}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box display="flex" gap={1} mt={2}>
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
                <Grid item xs={12} md={7}>
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
