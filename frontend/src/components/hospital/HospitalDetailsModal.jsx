import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Divider,
  Chip,
  Grid,
  IconButton,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Close,
  Phone,
  Language,
  Directions,
  LocationOn,
  Emergency,
  AccessTime,
  ContentCopy,
  Check,
  LocalHospital,
  OpenInNew,
  CalendarMonth
} from '@mui/icons-material';

const HospitalDetailsModal = ({ open, onClose, hospital, userCoords, onBookDoctor }) => {
  const [copied, setCopied] = useState(false);

  if (!hospital) return null;

  const handleCopyAddress = () => {
    if (hospital.address) {
      navigator.clipboard.writeText(hospital.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const osmDirectionsUrl = userCoords
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userCoords.lat},${userCoords.lng};${hospital.lat},${hospital.lng}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(hospital.name + ' ' + (hospital.address || ''))}`;

  const gmapsDirectionsUrl = userCoords
    ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${hospital.lat},${hospital.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${hospital.lat},${hospital.lng}`;

  const getCategoryColor = (cat = '') => {
    const c = cat.toLowerCase();
    if (c.includes('emergency')) return { bg: '#FEE2E2', text: '#DC2626' };
    if (c.includes('government') || c.includes('public')) return { bg: '#DBEAFE', text: '#1D4ED8' };
    if (c.includes('private')) return { bg: '#F3E8FF', text: '#7E22CE' };
    if (c.includes('clinic')) return { bg: '#E0F2FE', text: '#0284C7' };
    return { bg: '#CCFBF1', text: '#0F766E' };
  };

  const catColors = getCategoryColor(hospital.category);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: '16px', p: 1 } } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1 }}>
        <Box sx={{ pr: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
            <Chip
              label={hospital.category || 'Healthcare Facility'}
              size="small"
              sx={{ bgcolor: catColors.bg, color: catColors.text, fontWeight: '700', fontSize: '0.72rem' }}
            />
            {hospital.distanceKm != null && (
              <Chip
                icon={<LocationOn sx={{ fontSize: '14px !important', color: '#0F766E !important' }} />}
                label={`${hospital.distanceKm} km from you`}
                size="small"
                sx={{ bgcolor: '#F0FDFA', color: '#0F766E', fontWeight: '700', fontSize: '0.72rem', border: '1px solid #CCFBF1' }}
              />
            )}
            {hospital.isEmergency && (
              <Chip
                icon={<Emergency sx={{ fontSize: '14px !important', color: '#DC2626 !important' }} />}
                label="24/7 Emergency"
                size="small"
                sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: '700', fontSize: '0.72rem' }}
              />
            )}
          </Box>
          <Typography variant="h5" sx={{ fontWeight: '800', color: '#0F172A' }}>
            {hospital.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#94A3B8' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Address & Coordinates */}
        <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: '12px', border: '1px solid #E2E8F0', mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-start', flex: 1, pr: 1 }}>
              <LocationOn sx={{ color: '#0F766E', mt: 0.2, fontSize: 20 }} />
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>
                  Address
                </Typography>
                <Typography variant="body2" sx={{ color: '#0F172A', mt: 0.2, lineHeight: 1.5 }}>
                  {hospital.address || 'Address details not listed in OpenStreetMap'}
                </Typography>
              </Box>
            </Box>
            {hospital.address && hospital.address !== 'Address not listed in OSM registry' && (
              <Tooltip title={copied ? 'Copied!' : 'Copy Address'}>
                <IconButton onClick={handleCopyAddress} size="small" sx={{ color: copied ? '#0F766E' : '#64748B' }}>
                  {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              GPS: <strong>{hospital.lat?.toFixed(5)}, {hospital.lng?.toFixed(5)}</strong>
            </Typography>
            {hospital.openingHours && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime sx={{ fontSize: 15, color: '#64748B' }} />
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Hours: <strong>{hospital.openingHours}</strong>
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Contact Information Grid */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {/* Phone */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '12px', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Phone sx={{ color: hospital.phone ? '#0F766E' : '#94A3B8', fontSize: 18 }} />
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>
                  Contact Phone
                </Typography>
              </Box>
              {hospital.phone ? (
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  href={`tel:${hospital.phone}`}
                  startIcon={<Phone />}
                  sx={{ borderColor: '#0F766E', color: '#0F766E', fontWeight: '700', textTransform: 'none', '&:hover': { bgcolor: '#F0FDFA' } }}
                >
                  {hospital.phone}
                </Button>
              ) : (
                <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                  Not listed in OSM
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Website */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '12px', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Language sx={{ color: hospital.website ? '#0F766E' : '#94A3B8', fontSize: 18 }} />
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>
                  Official Website
                </Typography>
              </Box>
              {hospital.website ? (
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  href={hospital.website.startsWith('http') ? hospital.website : `https://${hospital.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNew sx={{ fontSize: 15 }} />}
                  sx={{ borderColor: '#E2E8F0', color: '#0F172A', fontWeight: '600', textTransform: 'none', '&:hover': { bgcolor: '#F1F5F9' } }}
                >
                  Visit Website
                </Button>
              ) : (
                <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                  Not listed in OSM
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* SwasthyaSetu Network Live Bed Status if registered */}
        {hospital.isRegisteredNetwork && hospital.beds && (
          <Alert severity="success" icon={<LocalHospital />} sx={{ mb: 2.5, borderRadius: '10px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Verified SwasthyaSetu Network Hospital
            </Typography>
            <Typography variant="body2">
              ICU Beds Available: <strong>{hospital.beds.icuAvailable}</strong> | Emergency Beds: <strong>{hospital.beds.emergencyAvailable}</strong>
            </Typography>
          </Alert>
        )}

        {/* Source attribution notice */}
        <Typography variant="caption" sx={{ display: 'block', color: '#94A3B8', textAlign: 'center' }}>
          Healthcare data queried live from OpenStreetMap contributors & Overpass API.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0, gap: 1, flexWrap: 'wrap' }}>
        {hospital.isRegisteredNetwork && onBookDoctor && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<CalendarMonth />}
            onClick={() => {
              onClose();
              onBookDoctor(hospital);
            }}
            sx={{ bgcolor: '#0F766E', '&:hover': { bgcolor: '#0D9488' }, fontWeight: '700' }}
          >
            Book Doctor
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={<Directions />}
          href={osmDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ bgcolor: '#0F766E', color: '#ffffff', fontWeight: '700', '&:hover': { bgcolor: '#0D9488' } }}
        >
          OSM Directions
        </Button>
        <Button
          variant="outlined"
          startIcon={<Directions />}
          href={gmapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ borderColor: '#E2E8F0', color: '#0F172A', fontWeight: '600', '&:hover': { bgcolor: '#F1F5F9' } }}
        >
          Google Maps
        </Button>
        <Button onClick={onClose} sx={{ color: '#64748B', fontWeight: '600' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HospitalDetailsModal;

