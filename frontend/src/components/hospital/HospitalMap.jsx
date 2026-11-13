import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Box, Typography, Button, Chip } from '@mui/material';
import { Directions, Visibility } from '@mui/icons-material';

// Helper component to smoothly center/fly map when coordinates change
const MapUpdater = ({ center, zoom = 13, selectedHospital }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedHospital && selectedHospital.lat && selectedHospital.lng) {
      map.flyTo([selectedHospital.lat, selectedHospital.lng], 15, { duration: 1.2 });
    } else if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, selectedHospital, map]);

  return null;
};

// Custom User Pin
const createUserMarkerIcon = () =>
  L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="position: relative; width: 34px; height: 34px;">
        <div style="position: absolute; top: 0; left: 0; width: 34px; height: 34px; border-radius: 50%; background: rgba(15, 118, 110, 0.35); animation: pulse 2s infinite;"></div>
        <div style="position: absolute; top: 3px; left: 3px; width: 28px; height: 28px; border-radius: 50%; background: #0F766E; border: 3px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 13px; font-weight: bold;">
          📍
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });

// Custom Hospital Marker Pin
const createHospitalMarkerIcon = (isSelected = false, isEmergency = false) => {
  const bg = isSelected ? '#0F172A' : isEmergency ? '#DC2626' : '#0F766E';
  const size = isSelected ? 38 : 32;
  const emoji = isEmergency ? '🚨' : '🏥';
  return L.divIcon({
    className: 'custom-hospital-marker',
    html: `
      <div style="width: ${size}px; height: ${size}px; border-radius: 50%; background: ${bg}; border: 3px solid #FFFFFF; box-shadow: 0 4px 14px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: ${isSelected ? 18 : 14}px; font-weight: bold; transition: all 0.2s ease;">
        ${emoji}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

const HospitalMap = ({
  userCoords,
  hospitals = [],
  selectedHospital,
  onSelectHospital,
  onViewDetails,
  radiusKm = 10,
  height = '540px'
}) => {
  const defaultCenter = useMemo(() => {
    if (userCoords?.lat && userCoords?.lng) return [userCoords.lat, userCoords.lng];
    if (hospitals.length > 0 && hospitals[0].lat && hospitals[0].lng) return [hospitals[0].lat, hospitals[0].lng];
    return [28.6139, 77.2090];
  }, [userCoords, hospitals]);

  const userIcon = useMemo(() => createUserMarkerIcon(), []);

  return (
    <Box
      sx={{
        height,
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        position: 'relative'
      }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater
          center={defaultCenter}
          zoom={radiusKm > 25 ? 11 : radiusKm > 10 ? 12 : 13}
          selectedHospital={selectedHospital}
        />

        {/* User Location Marker */}
        {userCoords?.lat && userCoords?.lng && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
            <Popup>
              <Box sx={{ p: 0.5, minWidth: '160px' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0F766E' }}>
                  📍 Your Detected Location
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                  Search radius: <strong>{radiusKm} km</strong>
                </Typography>
                {userCoords.displayName && (
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                    {userCoords.displayName}
                  </Typography>
                )}
              </Box>
            </Popup>
          </Marker>
        )}

        {/* Hospital Markers */}
        {hospitals.map((hosp) => {
          if (!hosp.lat || !hosp.lng) return null;
          const isSelected = selectedHospital?.id === hosp.id;
          const isEmergency = Boolean(hosp.isEmergency);
          const icon = createHospitalMarkerIcon(isSelected, isEmergency);

          const directionsUrl = userCoords
            ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userCoords.lat},${userCoords.lng};${hosp.lat},${hosp.lng}`
            : `https://www.openstreetmap.org/search?query=${encodeURIComponent(hosp.name)}`;

          return (
            <Marker
              key={hosp.id}
              position={[hosp.lat, hosp.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectHospital && onSelectHospital(hosp)
              }}
            >
              <Popup>
                <Box sx={{ p: 0.5, maxWidth: '240px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <Chip
                      label={hosp.category || 'Facility'}
                      size="small"
                      sx={{ height: '18px', fontSize: '0.65rem', fontWeight: 'bold' }}
                    />
                    {hosp.distanceKm != null && (
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#0F766E' }}>
                        {hosp.distanceKm} km
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0F172A', lineHeight: 1.3, mb: 0.5 }}>
                    {hosp.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1, lineHeight: 1.3 }}>
                    {hosp.address}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Visibility sx={{ fontSize: 13 }} />}
                      onClick={() => onViewDetails && onViewDetails(hosp)}
                      sx={{
                        fontSize: '0.7rem',
                        py: 0.4,
                        px: 1,
                        bgcolor: '#0F766E',
                        '&:hover': { bgcolor: '#0D9488' }
                      }}
                    >
                      Details
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Directions sx={{ fontSize: 13 }} />}
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontSize: '0.7rem', py: 0.4, px: 1, borderColor: '#CBD5E1', color: '#0F172A' }}
                    >
                      Route
                    </Button>
                  </Box>
                </Box>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </Box>
  );
};

export default HospitalMap;
