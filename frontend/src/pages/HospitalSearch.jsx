import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  Card,
  CardContent,
  Box,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Skeleton,
  Tabs,
  Tab,
  IconButton,
  ButtonGroup,
  InputAdornment
} from '@mui/material';
import {
  CalendarMonth,
  LocalPhone,
  MyLocation,
  LocationOn,
  Search,
  Directions,
  Visibility,
  Map as MapIcon,
  Refresh,
  Emergency,
  EditLocation,
  Clear,
  VerifiedUser,
  Hotel
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { hospitalAPI, doctorAPI, appointmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import HospitalMap from '../components/hospital/HospitalMap';
import HospitalDetailsModal from '../components/hospital/HospitalDetailsModal';
import {
  POPULAR_LOCATIONS,
  VERIFIED_REGIONAL_HOSPITALS,
  geocodeManualLocation,
  reverseGeocode,
  fetchOverpassDirect,
  calculateDistanceKm
} from '../services/osmService';

const HospitalSearch = () => {
  const { user } = useAuth();

  // Active Tab: 0 = Nearby Real Facilities (OSM Live), 1 = SwasthyaSetu Network & Beds
  const [activeTab, setActiveTab] = useState(0);

  // User Geolocation & Manual Location Fallback States
  const [userCoords, setUserCoords] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [geocodedSuggestions, setGeocodedSuggestions] = useState([]);

  // Radius for Nearby Search: 10 km (default), 25 km, 50 km
  const [radiusKm, setRadiusKm] = useState(10);

  // Real Discovered Facilities (OSM Overpass API)
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState('');
  const [nearbySearchTerm, setNearbySearchTerm] = useState('');
  const [debouncedNearbySearch, setDebouncedNearbySearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Selected Hospital for Map Highlighting & Details Modal
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [modalHospital, setModalHospital] = useState(null);

  // Network Hospitals (Original database for bed counts & doctor appointments)
  const [networkHospitals, setNetworkHospitals] = useState([]);
  const [networkLoading, setNetworkLoading] = useState(true);
  const [networkError, setNetworkError] = useState('');
  const [networkSearch, setNetworkSearch] = useState('');
  const [debouncedNetworkSearch, setDebouncedNetworkSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [needIcu, setNeedIcu] = useState(false);
  const [needEmergency, setNeedEmergency] = useState(false);

  // Booking Modal States (Preserved)
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingHospital, setBookingHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingSlot, setBookingSlot] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  // Debounce search terms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNearbySearch(nearbySearchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [nearbySearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNetworkSearch(networkSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [networkSearch]);

  // Load Real Nearby Facilities: integrate registered network hospitals + regional verified facilities + live Overpass data
  const loadNearbyFacilities = useCallback(async (coords, radius, signal) => {
    if (!coords?.lat || !coords?.lng) return;
    setNearbyLoading(true);
    setNearbyError('');

    // Step 1: Immediately fetch registered network hospitals and compute distances
    let registeredNearby = [];
    try {
      const { data } = await hospitalAPI.getAll({}, { signal });
      if (Array.isArray(data)) {
        registeredNearby = data.map(h => {
          const hLat = h.location?.lat || h.lat;
          const hLng = h.location?.lng || h.lng;
          const dist = (hLat && hLng) ? calculateDistanceKm(coords.lat, coords.lng, hLat, hLng) : null;
          return {
            ...h,
            id: `net-${h._id}`,
            name: h.name,
            address: h.address,
            lat: hLat,
            lng: hLng,
            distanceKm: dist,
            category: h.hospitalType ? `${h.hospitalType} Hospital (SwasthyaSetu Partner)` : 'Hospital (SwasthyaSetu Partner)',
            isEmergency: Boolean(h.beds?.emergencyAvailable > 0),
            isSwasthyaSetuPartner: true,
            beds: h.beds,
            phone: h.emergencyPhone || h.contactPhone || null,
            website: h.website || null
          };
        }).filter(h => h.distanceKm != null && h.distanceKm <= radius * 1.5);
      }
    } catch {
      // Non-fatal, continue to regional
    }

    // Step 2: Immediate regional verified healthcare facilities (zero wait)
    const regionalMatches = VERIFIED_REGIONAL_HOSPITALS
      .map(h => ({
        ...h,
        distanceKm: calculateDistanceKm(coords.lat, coords.lng, h.lat, h.lng),
        isSwasthyaSetuPartner: false
      }))
      .filter(h => h.distanceKm != null && h.distanceKm <= radius * 1.5);

    const initialCombined = [...registeredNearby, ...regionalMatches].sort((a, b) => a.distanceKm - b.distanceKm);

    if (initialCombined.length > 0) {
      setNearbyHospitals(initialCombined);
      setNearbyLoading(false); // Stop skeleton immediately!
    }

    try {
      // Step 3: Try Backend Proxy (server-side Overpass with caching & regional fallback)
      try {
        const { data } = await hospitalAPI.getNearbyReal(
          { lat: coords.lat, lng: coords.lng, radius: radius * 1000 },
          { signal }
        );
        if (data?.hospitals && data.hospitals.length > 0) {
          const combined = [...registeredNearby, ...data.hospitals];
          const seen = new Set();
          const deduped = combined.filter(item => {
            const key = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }).sort((a, b) => a.distanceKm - b.distanceKm);
          setNearbyHospitals(deduped);
          return;
        }
      } catch (backendErr) {
        if (backendErr.name === 'CanceledError' || backendErr.name === 'AbortError') return;
      }

      // Step 4: Direct browser Overpass query (live OSM data)
      const directResults = await fetchOverpassDirect(coords.lat, coords.lng, radius * 1000);
      if (directResults.length > 0) {
        const combined = [...registeredNearby, ...directResults];
        const seen = new Set();
        const deduped = combined.filter(item => {
          const key = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).sort((a, b) => a.distanceKm - b.distanceKm);
        setNearbyHospitals(deduped);
      } else if (initialCombined.length === 0) {
        setNearbyHospitals([]);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error('Failed to discover nearby hospitals:', err.message);
      if (initialCombined.length === 0) {
        setNearbyError('Unable to query live OpenStreetMap healthcare data. Please check your network connection or try again.');
      }
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  // Request browser geolocation with high accuracy
  const handleDetectLocation = useCallback(() => {
    setLocationError('');
    setDetectingLocation(true);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please search your area manually below.');
      setDetectingLocation(false);
      setManualModalOpen(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDetectingLocation(false);
        setActiveTab(0); // switch to Nearby Facilities tab

        // Reverse geocode to get a human-friendly area name
        const readableName = await reverseGeocode(lat, lng);
        const coords = {
          lat,
          lng,
          displayName: readableName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        };
        setUserCoords(coords);
        loadNearbyFacilities(coords, radiusKm);
      },
      (err) => {
        setDetectingLocation(false);
        let errorMsg = 'Unable to detect your location. Please search your area manually.';
        if (err.code === 1) {
          errorMsg = 'Location permission was denied. Please allow location permissions in your browser or search your area manually.';
        } else if (err.code === 2) {
          errorMsg = 'GPS location unavailable. Please enter your city or neighborhood manually.';
        } else if (err.code === 3) {
          errorMsg = 'Location detection timed out. Please try again or select your location manually.';
        }
        setLocationError(errorMsg);
        setManualModalOpen(true); // Graceful fallback
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [radiusKm, loadNearbyFacilities]);

  // Handle Manual Location Selection
  const handleSelectLocation = async (place) => {
    setManualModalOpen(false);
    setLocationError('');
    const coords = {
      lat: place.lat,
      lng: place.lng,
      displayName: place.displayName || place.name
    };
    setUserCoords(coords);
    setActiveTab(0);
    loadNearbyFacilities(coords, radiusKm);
  };

  // Search manual places via Nominatim
  const handleSearchManualQuery = async (e) => {
    e?.preventDefault();
    if (!manualQuery.trim()) return;
    setGeocodingLoading(true);
    const results = await geocodeManualLocation(manualQuery);
    setGeocodedSuggestions(results);
    setGeocodingLoading(false);
  };

  // Change Radius
  const handleRadiusChange = (newRadius) => {
    setRadiusKm(newRadius);
    if (userCoords) {
      loadNearbyFacilities(userCoords, newRadius);
    }
  };

  // Filter and search discovered nearby facilities
  const filteredNearbyHospitals = useMemo(() => {
    return nearbyHospitals.filter((h) => {
      const matchesSearch = debouncedNearbySearch
        ? h.name.toLowerCase().includes(debouncedNearbySearch.toLowerCase()) ||
          h.address?.toLowerCase().includes(debouncedNearbySearch.toLowerCase())
        : true;

      let matchesCategory = true;
      if (categoryFilter === 'hospital') {
        matchesCategory = h.category?.toLowerCase().includes('hospital');
      } else if (categoryFilter === 'clinic') {
        matchesCategory = h.category?.toLowerCase().includes('clinic');
      } else if (categoryFilter === 'emergency') {
        matchesCategory = Boolean(h.isEmergency) || h.category?.toLowerCase().includes('emergency');
      } else if (categoryFilter === 'government') {
        matchesCategory = h.category?.toLowerCase().includes('government') || h.category?.toLowerCase().includes('public');
      } else if (categoryFilter === 'private') {
        matchesCategory = h.category?.toLowerCase().includes('private');
      }

      return matchesSearch && matchesCategory;
    });
  }, [nearbyHospitals, debouncedNearbySearch, categoryFilter]);

  // Load Network Hospitals (Preserved feature for booking and bed counts)
  const loadNetworkHospitals = useCallback(async (signal) => {
    setNetworkLoading(true);
    setNetworkError('');
    try {
      const params = {};
      if (debouncedNetworkSearch) params.name = debouncedNetworkSearch;
      if (department) params.department = department;
      if (needIcu) params.needsIcu = 'true';
      if (needEmergency) params.needsEmergency = 'true';

      const { data } = await hospitalAPI.getAll(params, { signal });

      let processed = data || [];
      if (userCoords) {
        processed = processed.map((h) => {
          const hLat = h.location?.coordinates?.[1] || h.lat || 28.6139;
          const hLng = h.location?.coordinates?.[0] || h.lng || 77.2090;
          const dist = calculateDistanceKm(userCoords.lat, userCoords.lng, hLat, hLng);
          return { ...h, distanceKm: dist };
        });
        processed.sort((a, b) => parseFloat(a.distanceKm || 999) - parseFloat(b.distanceKm || 999));
      }
      setNetworkHospitals(processed);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      setNetworkError('Unable to load network hospitals directory.');
    } finally {
      setNetworkLoading(false);
    }
  }, [debouncedNetworkSearch, department, needIcu, needEmergency, userCoords]);

  useEffect(() => {
    const controller = new AbortController();
    loadNetworkHospitals(controller.signal);
    return () => controller.abort();
  }, [loadNetworkHospitals]);

  // Booking Modal handlers (Preserved)
  const handleOpenBooking = async (hosp) => {
    setBookingHospital(hosp);
    setBookingOpen(true);
    setBookingSuccess('');
    setBookingError('');
    setSelectedDoctor('');
    setBookingDate('');
    setBookingSlot('');
    try {
      const { data } = await doctorAPI.getDoctors({ hospitalId: hosp._id || hosp.id });
      setDoctors(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmBooking = async () => {
    setBookingSuccess('');
    setBookingError('');
    try {
      if (!user) {
        setBookingError('You must be logged in to book an appointment.');
        return;
      }
      await appointmentAPI.book({
        hospitalId: bookingHospital._id || bookingHospital.id,
        doctorId: selectedDoctor,
        date: bookingDate,
        timeSlot: bookingSlot,
        reason: bookingReason
      });
      setBookingSuccess('Appointment scheduled successfully!');
      setTimeout(() => setBookingOpen(false), 1500);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to book slot.');
    }
  };

  // Open Details Modal
  const handleOpenDetails = (hosp) => {
    setModalHospital(hosp);
    setDetailsModalOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      {/* Page Header */}
      <Box mb={3} display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="800" color="#0F172A" sx={{ letterSpacing: '-0.02em' }}>
            Find Hospitals & Medical Resources
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            Discover real nearby healthcare facilities from OpenStreetMap or check live bed availability across SwasthyaSetu network.
          </Typography>
        </Box>

        {/* Primary Action Button: Find Hospital in My Area */}
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <Button
            variant="contained"
            size="large"
            onClick={handleDetectLocation}
            disabled={detectingLocation}
            startIcon={detectingLocation ? <CircularProgress size={20} color="inherit" /> : <MyLocation />}
            sx={{
              py: 1.2,
              px: 3,
              fontWeight: '700',
              borderRadius: '12px',
              bgcolor: '#0F766E',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)',
              '&:hover': { bgcolor: '#0D9488' }
            }}
          >
            {detectingLocation ? 'Detecting Location...' : userCoords ? 'Refresh My Location' : 'Find Hospitals in My Area'}
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<EditLocation />}
            onClick={() => setManualModalOpen(true)}
            sx={{
              py: 1.2,
              px: 2.5,
              fontWeight: '600',
              borderRadius: '12px',
              borderColor: '#CBD5E1',
              color: '#0F172A',
              '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' }
            }}
          >
            {userCoords ? 'Change Area' : 'Select Area Manually'}
          </Button>
        </Box>
      </Box>

      {/* Location Status Banner */}
      {userCoords && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: '#F0FDFA',
            border: '1px solid #CCFBF1',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ p: 1, bgcolor: '#0F766E', borderRadius: '50%', color: '#fff', display: 'flex' }}>
              <LocationOn fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="700" color="#0F766E">
                Detected Location: {userCoords.displayName}
              </Typography>
              <Typography variant="caption" color="#64748B">
                Coordinates: {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)} • Searching healthcare facilities within <strong>{radiusKm} km</strong>
              </Typography>
            </Box>
          </Box>

          {/* Distance Radius Selector */}
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="caption" fontWeight="bold" color="#64748B" textTransform="uppercase">
              Radius:
            </Typography>
            <ButtonGroup size="small" variant="outlined">
              {[10, 25, 50].map((r) => (
                <Button
                  key={r}
                  onClick={() => handleRadiusChange(r)}
                  variant={radiusKm === r ? 'contained' : 'outlined'}
                  sx={{
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    bgcolor: radiusKm === r ? '#0F766E' : 'transparent',
                    borderColor: '#0F766E',
                    color: radiusKm === r ? '#fff' : '#0F766E',
                    '&:hover': { bgcolor: radiusKm === r ? '#0D9488' : '#CCFBF1' }
                  }}
                >
                  {r} km
                </Button>
              ))}
            </ButtonGroup>
          </Box>
        </Paper>
      )}

      {/* Location Error Alert */}
      {locationError && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => setManualModalOpen(true)}>
              Search Area
            </Button>
          }
          sx={{ mb: 3, borderRadius: '12px' }}
        >
          {locationError}
        </Alert>
      )}

      {/* Main Mode Tabs */}
      <Paper elevation={0} sx={{ borderBottom: '1px solid #E2E8F0', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': { fontWeight: '700', textTransform: 'none', fontSize: '0.95rem' },
            '& .Mui-selected': { color: '#0F766E !important' },
            '& .MuiTabs-indicator': { bgcolor: '#0F766E' }
          }}
        >
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <span>Nearby Facilities (OpenStreetMap Live)</span>
                {nearbyHospitals.length > 0 && (
                  <Chip label={nearbyHospitals.length} size="small" sx={{ height: 20, bgcolor: '#E6F6F3', color: '#0F766E', fontWeight: 'bold' }} />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <span>SwasthyaSetu Verified Network (Bed Booking)</span>
                {networkHospitals.length > 0 && (
                  <Chip label={networkHospitals.length} size="small" sx={{ height: 20, bgcolor: '#F1F5F9', color: '#0F172A', fontWeight: 'bold' }} />
                )}
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* TAB 0: REAL NEARBY FACILITIES (OpenStreetMap Live) */}
      {activeTab === 0 && (
        <Box>
          {!userCoords && !nearbyLoading && nearbyHospitals.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px solid #E2E8F0', borderRadius: '16px', bgcolor: '#FAFAFA', my: 2 }}>
              <Box sx={{ p: 2, bgcolor: '#E6F6F3', borderRadius: '50%', width: 64, height: 64, mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MyLocation sx={{ fontSize: 32, color: '#0F766E' }} />
              </Box>
              <Typography variant="h5" fontWeight="800" color="#0F172A" gutterBottom>
                Discover Real Nearby Healthcare Facilities
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 540, mx: 'auto', mb: 3 }}>
                Click below to detect your current location or select your city to explore actual verified hospitals, clinics, and emergency centers using OpenStreetMap.
              </Typography>
              <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  startIcon={detectingLocation ? <CircularProgress size={18} color="inherit" /> : <MyLocation />}
                  sx={{ bgcolor: '#0F766E', '&:hover': { bgcolor: '#0D9488' }, fontWeight: '700', borderRadius: '10px' }}
                >
                  {detectingLocation ? 'Detecting Location...' : 'Use My Current Location'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<EditLocation />}
                  onClick={() => setManualModalOpen(true)}
                  sx={{ borderColor: '#CBD5E1', color: '#0F172A', fontWeight: '600', borderRadius: '10px' }}
                >
                  Choose City / Area Manually
                </Button>
              </Box>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {/* Left Column: Filter controls + List of Hospital Cards */}
              <Grid item xs={12} lg={7}>
                {/* Search & Filter Bar */}
                <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '14px', mb: 2.5, bgcolor: '#FFFFFF' }}>
                  <Grid container spacing={1.5} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Search facilities by name or road..."
                        value={nearbySearchTerm}
                        onChange={(e) => setNearbySearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search sx={{ color: '#94A3B8', fontSize: 20 }} />
                            </InputAdornment>
                          ),
                          endAdornment: nearbySearchTerm && (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setNearbySearchTerm('')}>
                                <Clear sx={{ fontSize: 16 }} />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        label="Filter Facility Type"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                      >
                        <MenuItem value="all">All Facilities ({nearbyHospitals.length})</MenuItem>
                        <MenuItem value="hospital">Hospitals</MenuItem>
                        <MenuItem value="clinic">Clinics & Health Centers</MenuItem>
                        <MenuItem value="emergency">24/7 Emergency Centers</MenuItem>
                        <MenuItem value="government">Government Hospitals</MenuItem>
                        <MenuItem value="private">Private Hospitals</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>

                  {/* Active Stats & Count */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5} pt={1.5} borderTop="1px solid #F1F5F9">
                    <Typography variant="body2" color="#64748B">
                      {nearbyLoading && nearbyHospitals.length === 0 ? (
                        <span>Searching facilities within <strong>{radiusKm} km</strong>...</span>
                      ) : (
                        <span>Showing <strong>{filteredNearbyHospitals.length}</strong> facilities within <strong>{radiusKm} km</strong></span>
                      )}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Refresh />}
                      onClick={() => userCoords && loadNearbyFacilities(userCoords, radiusKm)}
                      disabled={nearbyLoading}
                      sx={{ color: '#0F766E', fontWeight: 'bold', textTransform: 'none' }}
                    >
                      Refresh Results
                    </Button>
                  </Box>
                </Paper>

                {/* Error Banner */}
                {nearbyError && (
                  <Alert
                    severity="error"
                    action={
                      <Button color="inherit" size="small" onClick={() => userCoords && loadNearbyFacilities(userCoords, radiusKm)}>
                        Retry
                      </Button>
                    }
                    sx={{ mb: 2, borderRadius: '10px' }}
                  >
                    {nearbyError}
                  </Alert>
                )}

                {/* Skeletons while loading */}
                {nearbyLoading ? (
                  <Box display="flex" flexDirection="column" gap={2}>
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} sx={{ border: '1px solid #E2E8F0', borderRadius: '14px', p: 2.5 }}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Skeleton variant="text" width="60%" height={28} />
                          <Skeleton variant="rounded" width={80} height={22} sx={{ borderRadius: '12px' }} />
                        </Box>
                        <Skeleton variant="text" width="85%" height={18} sx={{ mb: 1.5 }} />
                        <Divider sx={{ my: 1.5 }} />
                        <Box display="flex" justifyContent="space-between" gap={1}>
                          <Skeleton variant="rounded" width="45%" height={34} sx={{ borderRadius: '8px' }} />
                          <Skeleton variant="rounded" width="45%" height={34} sx={{ borderRadius: '8px' }} />
                        </Box>
                      </Card>
                    ))}
                  </Box>
                ) : filteredNearbyHospitals.length === 0 ? (
                  <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid #E2E8F0', borderRadius: '14px' }}>
                    <Typography variant="h6" fontWeight="bold" color="#0F172A" gutterBottom>
                      No Facilities Found in {radiusKm} km Radius
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Try expanding your search radius to 25 km or 50 km, or clearing your name search filter.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => handleRadiusChange(radiusKm === 10 ? 25 : 50)}
                      sx={{ bgcolor: '#0F766E', '&:hover': { bgcolor: '#0D9488' }, fontWeight: 'bold' }}
                    >
                      Expand Radius to {radiusKm === 10 ? '25 km' : '50 km'}
                    </Button>
                  </Paper>
                ) : (
                  <Box display="flex" flexDirection="column" gap={2} sx={{ maxHeight: '780px', overflowY: 'auto', pr: 0.5 }}>
                    {filteredNearbyHospitals.map((hosp) => {
                      const isSelected = selectedHospital?.id === hosp.id;
                      const osmDirectionsUrl = userCoords
                        ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userCoords.lat},${userCoords.lng};${hosp.lat},${hosp.lng}`
                        : `https://www.openstreetmap.org/search?query=${encodeURIComponent(hosp.name)}`;

                      return (
                        <Card
                          key={hosp.id}
                          elevation={0}
                          sx={{
                            border: isSelected ? '2px solid #0F766E' : '1px solid #E2E8F0',
                            borderRadius: '14px',
                            bgcolor: isSelected ? '#F0FDFA' : '#FFFFFF',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 6px 20px rgba(15, 118, 110, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                            '&:hover': { borderColor: '#0F766E', boxShadow: '0 6px 18px rgba(15, 118, 110, 0.08)' }
                          }}
                        >
                          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} mb={0.5}>
                              <Typography variant="h6" fontWeight="800" color="#0F172A" sx={{ lineHeight: 1.3 }}>
                                {hosp.name}
                              </Typography>
                              {hosp.distanceKm != null && (
                                <Chip
                                  icon={<LocationOn sx={{ fontSize: 13, color: '#0F766E !important' }} />}
                                  label={`${hosp.distanceKm} km`}
                                  size="small"
                                  sx={{ bgcolor: '#F0FDFA', color: '#0F766E', fontWeight: '800', border: '1px solid #CCFBF1' }}
                                />
                              )}
                            </Box>

                            <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
                              {hosp.isSwasthyaSetuPartner ? (
                                <Chip
                                  icon={<VerifiedUser sx={{ fontSize: 13, color: '#0F766E !important' }} />}
                                  label="SwasthyaSetu Partner"
                                  size="small"
                                  sx={{ height: '22px', fontSize: '0.7rem', fontWeight: 'bold', bgcolor: '#CCFBF1', color: '#0F766E' }}
                                />
                              ) : (
                                <Chip
                                  label="OpenStreetMap Live"
                                  size="small"
                                  sx={{ height: '22px', fontSize: '0.7rem', fontWeight: '600', bgcolor: '#F1F5F9', color: '#475569' }}
                                />
                              )}
                              <Chip
                                label={hosp.category}
                                size="small"
                                sx={{
                                  height: '22px',
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  bgcolor: hosp.isEmergency ? '#FEF2F2' : '#F1F5F9',
                                  color: hosp.isEmergency ? '#DC2626' : '#334155'
                                }}
                              />
                              {hosp.isEmergency && (
                                <Chip
                                  icon={<Emergency sx={{ fontSize: 13, color: '#DC2626 !important' }} />}
                                  label="24/7 Emergency"
                                  size="small"
                                  sx={{ height: '22px', fontSize: '0.7rem', fontWeight: 'bold', bgcolor: '#FEE2E2', color: '#DC2626' }}
                                />
                              )}
                              {hosp.beds?.available != null && (
                                <Chip
                                  icon={<Hotel sx={{ fontSize: 13, color: '#16A34A !important' }} />}
                                  label={`${hosp.beds.available} Beds Available`}
                                  size="small"
                                  sx={{ height: '22px', fontSize: '0.7rem', fontWeight: 'bold', bgcolor: '#DCFCE7', color: '#16A34A' }}
                                />
                              )}
                            </Box>

                            <Typography variant="body2" color="#64748B" sx={{ mb: 1.5, lineHeight: 1.4 }}>
                              {hosp.address}
                            </Typography>

                            <Divider sx={{ my: 1.5 }} />

                            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                              <Box display="flex" gap={1} flexWrap="wrap">
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<Visibility />}
                                  onClick={() => handleOpenDetails(hosp)}
                                  sx={{ bgcolor: '#0F766E', '&:hover': { bgcolor: '#0D9488' }, fontWeight: '700', textTransform: 'none' }}
                                >
                                  View Details
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Directions />}
                                  href={osmDirectionsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ borderColor: '#CBD5E1', color: '#0F172A', fontWeight: '600', textTransform: 'none', '&:hover': { bgcolor: '#F8FAFC' } }}
                                >
                                  Get Directions
                                </Button>
                              </Box>

                              <Button
                                size="small"
                                startIcon={<MapIcon />}
                                onClick={() => setSelectedHospital(hosp)}
                                sx={{ color: '#0F766E', fontWeight: 'bold', textTransform: 'none' }}
                              >
                                {isSelected ? 'Focused on Map' : 'Show on Map'}
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                )}
              </Grid>

              {/* Right Column: React-Leaflet Map */}
              <Grid item xs={12} lg={5}>
                <Box sx={{ position: { lg: 'sticky' }, top: 90 }}>
                  <HospitalMap
                    userCoords={userCoords}
                    hospitals={filteredNearbyHospitals}
                    selectedHospital={selectedHospital}
                    onSelectHospital={(h) => setSelectedHospital(h)}
                    onViewDetails={(h) => handleOpenDetails(h)}
                    radiusKm={radiusKm}
                    height="680px"
                  />
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                    Map powered by OpenStreetMap contributors. Click any facility marker to preview details.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      )}

      {/* TAB 1: SWASTHYASETU VERIFIED NETWORK (Beds & Doctor Booking) */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Search Filter Panel */}
          <Grid item xs={12} md={3}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: '14px', bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <TextField
                label="Hospital Name"
                size="small"
                fullWidth
                value={networkSearch}
                onChange={(e) => setNetworkSearch(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                select
                label="Department"
                size="small"
                fullWidth
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">All Departments</MenuItem>
                {['General Medicine', 'Pediatrics', 'Cardiology', 'Neurology', 'Orthopedics'].map((d) => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </TextField>
              <Box display="flex" flexDirection="column" gap={1}>
                <Button
                  variant={needIcu ? 'contained' : 'outlined'}
                  onClick={() => setNeedIcu(!needIcu)}
                  fullWidth
                  size="small"
                  sx={{
                    bgcolor: needIcu ? '#0F766E' : 'transparent',
                    borderColor: '#0F766E',
                    color: needIcu ? '#ffffff' : '#0F766E',
                    '&:hover': { bgcolor: needIcu ? '#0D9488' : '#E6F6F3' }
                  }}
                >
                  Needs ICU Bed
                </Button>
                <Button
                  variant={needEmergency ? 'contained' : 'outlined'}
                  onClick={() => setNeedEmergency(!needEmergency)}
                  fullWidth
                  size="small"
                  sx={{
                    bgcolor: needEmergency ? '#0F766E' : 'transparent',
                    borderColor: '#0F766E',
                    color: needEmergency ? '#ffffff' : '#0F766E',
                    '&:hover': { bgcolor: needEmergency ? '#0D9488' : '#E6F6F3' }
                  }}
                >
                  Needs Emergency Bed
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Network Results List */}
          <Grid item xs={12} md={9}>
            {networkError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>
                {networkError}
              </Alert>
            )}

            {networkLoading ? (
              <Grid container spacing={3}>
                {[1, 2, 3, 4].map((item) => (
                  <Grid item xs={12} sm={6} key={item}>
                    <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3 }}>
                      <Skeleton variant="text" width="60%" height={32} />
                      <Skeleton variant="text" width="85%" height={20} sx={{ mb: 2 }} />
                      <Divider sx={{ my: 1.5 }} />
                      <Box display="flex" gap={1}>
                        <Skeleton variant="rounded" width="50%" height={30} />
                        <Skeleton variant="rounded" width="50%" height={30} />
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : networkHospitals.length === 0 ? (
              <Box py={8} textAlign="center">
                <Typography color="textSecondary">No registered network hospitals matching your criteria were found.</Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {networkHospitals.map((h) => (
                  <Grid item xs={12} sm={6} key={h._id}>
                    <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s ease', '&:hover': { borderColor: '#0F766E', boxShadow: '0 6px 20px rgba(15, 118, 110, 0.08)' } }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                          <Typography variant="h6" fontWeight="bold" color="#0F172A">
                            {h.name}
                          </Typography>
                          {h.distanceKm && (
                            <Chip
                              icon={<LocationOn sx={{ fontSize: 14 }} />}
                              label={`${h.distanceKm} km`}
                              size="small"
                              sx={{ bgcolor: '#F0FDFA', color: '#0F766E', fontWeight: 'bold', border: '1px solid #CCFBF1' }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="#64748B" sx={{ mb: 2 }}>{h.address}</Typography>
                        <Divider sx={{ my: 1.5 }} />
                        <Box display="flex" justifyContent="space-between" mb={2}>
                          <Chip label={`ICU: ${h.beds?.icuAvailable} Left`} size="small" sx={{ bgcolor: h.beds?.icuAvailable > 0 ? '#E6F6F3' : '#FEE2E2', color: h.beds?.icuAvailable > 0 ? '#0F766E' : '#EF4444', fontWeight: 'bold' }} />
                          <Chip label={`ER Beds: ${h.beds?.emergencyAvailable} Left`} size="small" sx={{ bgcolor: h.beds?.emergencyAvailable > 0 ? '#E6F6F3' : '#FEE2E2', color: h.beds?.emergencyAvailable > 0 ? '#0F766E' : '#EF4444', fontWeight: 'bold' }} />
                        </Box>
                        <Box display="flex" gap={1}>
                          <Button variant="contained" size="small" fullWidth startIcon={<CalendarMonth />} onClick={() => handleOpenBooking(h)} sx={{ bgcolor: '#0F766E', '&:hover': { bgcolor: '#0D9488' } }}>
                            Book Doctor
                          </Button>
                          <Button variant="outlined" size="small" startIcon={<LocalPhone />} href={`tel:${h.emergencyPhone}`} sx={{ borderColor: '#E2E8F0', color: '#0F172A', '&:hover': { bgcolor: '#F1F5F9' } }}>
                            Call
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      )}

      {/* Manual Location Selection Dialog (Fallback when GPS denied / unavailable) */}
      <Dialog open={manualModalOpen} onClose={() => setManualModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: '800', color: '#0F172A' }}>
          Select Location Manually
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Search for your city, district, or locality to discover real nearby healthcare facilities without browser geolocation.
          </Typography>

          <form onSubmit={handleSearchManualQuery}>
            <Box display="flex" gap={1} mb={2.5}>
              <TextField
                autoFocus
                fullWidth
                size="small"
                placeholder="e.g. Saket, Connaught Place, Koramangala..."
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={geocodingLoading || !manualQuery.trim()}
                sx={{ bgcolor: '#0F766E', '&:hover': { bgcolor: '#0D9488' }, fontWeight: 'bold', minWidth: '90px' }}
              >
                {geocodingLoading ? <CircularProgress size={18} color="inherit" /> : 'Search'}
              </Button>
            </Box>
          </form>

          {/* Quick Popular Locations */}
          <Typography variant="caption" fontWeight="bold" color="#64748B" textTransform="uppercase" display="block" mb={1}>
            Popular Cities & Healthcare Hubs
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
            {POPULAR_LOCATIONS.map((loc) => (
              <Chip
                key={loc.name}
                label={loc.name.split(' ')[0]}
                onClick={() => handleSelectLocation(loc)}
                clickable
                sx={{ fontWeight: '600', bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#CCFBF1', color: '#0F766E' } }}
              />
            ))}
          </Box>

          {/* Search Results */}
          {geocodedSuggestions.length > 0 && (
            <Box>
              <Typography variant="caption" fontWeight="bold" color="#64748B" textTransform="uppercase" display="block" mb={1}>
                Matching Locations
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {geocodedSuggestions.map((sug, idx) => (
                  <Paper
                    key={idx}
                    elevation={0}
                    onClick={() => handleSelectLocation(sug)}
                    sx={{
                      p: 1.5,
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': { borderColor: '#0F766E', bgcolor: '#F0FDFA' }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOn sx={{ color: '#0F766E', fontSize: 18 }} />
                      <Typography variant="body2" color="#0F172A" sx={{ lineHeight: 1.3 }}>
                        {sug.displayName}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setManualModalOpen(false)} sx={{ color: '#64748B', fontWeight: 'bold' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hospital Details Modal (Requirement 4) */}
      <HospitalDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        hospital={modalHospital}
        userCoords={userCoords}
        onBookDoctor={(h) => handleOpenBooking(h)}
      />

      {/* Doctor Booking Modal (Preserved existing feature) */}
      <Dialog open={bookingOpen} onClose={() => setBookingOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Book Doctor Appointment at {bookingHospital?.name}
        </DialogTitle>
        <DialogContent>
          {bookingSuccess && <Alert severity="success" sx={{ mb: 2 }}>{bookingSuccess}</Alert>}
          {bookingError && <Alert severity="error" sx={{ mb: 2 }}>{bookingError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              select
              label="Select Doctor"
              size="small"
              fullWidth
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              {doctors.map((d) => (
                <MenuItem key={d._id} value={d._id}>
                  Dr. {d.name} ({d.specialization}) - ₹{d.consultationFee || 500}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="date"
              label="Preferred Date"
              InputLabelProps={{ shrink: true }}
              size="small"
              fullWidth
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />
            <TextField
              select
              label="Time Slot"
              size="small"
              fullWidth
              value={bookingSlot}
              onChange={(e) => setBookingSlot(e.target.value)}
            >
              {['10:00 AM - 10:30 AM', '11:00 AM - 11:30 AM', '02:00 PM - 02:30 PM', '04:00 PM - 04:30 PM'].map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Reason for Visit / Symptoms"
              multiline
              rows={2}
              size="small"
              fullWidth
              value={bookingReason}
              onChange={(e) => setBookingReason(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setBookingOpen(false)} sx={{ color: '#64748B' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmBooking}
            disabled={!selectedDoctor || !bookingDate || !bookingSlot}
            sx={{ bgcolor: '#0F766E', '&:hover': { bgcolor: '#0D9488' }, fontWeight: 'bold' }}
          >
            Confirm Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HospitalSearch;
