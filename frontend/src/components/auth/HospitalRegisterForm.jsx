import React from 'react';
import {
  TextField,
  Button,
  Grid,
  MenuItem,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  EmailOutlined,
  LockOutlined,
  ArrowForward,
  PhoneOutlined,
  BadgeOutlined,
  LocationOnOutlined,
  CallOutlined,
  LocalHospital
} from '@mui/icons-material';

const HospitalRegisterForm = ({
  name, setName,
  email, setEmail,
  password, setPassword,
  phone, setPhone,
  licenseNumber, setLicenseNumber,
  emergencyPhone, setEmergencyPhone,
  address, setAddress,
  hospitalType, setHospitalType,
  lat, setLat,
  lng, setLng,
  showPassword, setShowPassword,
  loading,
  fieldInputStyle
}) => {
  return (
    <>
      <TextField
        fullWidth
        label="Hospital Name"
        placeholder="e.g. City Care Super Speciality Hospital"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        sx={{ mb: 2 }}
        slotProps={{ input: {
          sx: fieldInputStyle,
          startAdornment: (
            <InputAdornment position="start">
              <LocalHospital sx={{ color: '#0F766E', fontSize: 20 }} />
            </InputAdornment>
          ),
        } }}
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Official Hospital Email"
            type="email"
            placeholder="admin@hospital.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            slotProps={{ input: {
              sx: fieldInputStyle,
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlined sx={{ color: '#0F766E', fontSize: 20 }} />
                </InputAdornment>
              ),
            } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="General Help Desk Phone"
            placeholder="011-XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            slotProps={{ input: {
              sx: fieldInputStyle,
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneOutlined sx={{ color: '#0F766E', fontSize: 20 }} />
                </InputAdornment>
              ),
            } }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Medical License Number"
            placeholder="e.g. HOSP-DL-2024-889"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            required
            slotProps={{ input: {
              sx: fieldInputStyle,
              startAdornment: (
                <InputAdornment position="start">
                  <BadgeOutlined sx={{ color: '#0F766E', fontSize: 20 }} />
                </InputAdornment>
              ),
            } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="24/7 Emergency Hotline"
            placeholder="e.g. 102 or emergency desk"
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(e.target.value)}
            required
            slotProps={{ input: {
              sx: fieldInputStyle,
              startAdornment: (
                <InputAdornment position="start">
                  <CallOutlined sx={{ color: '#DC2626', fontSize: 20 }} />
                </InputAdornment>
              ),
            } }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            fullWidth
            label="Physical Street Address"
            placeholder="Complete address with locality & city"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            slotProps={{ input: {
              sx: fieldInputStyle,
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnOutlined sx={{ color: '#0F766E', fontSize: 20 }} />
                </InputAdornment>
              ),
            } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            fullWidth
            label="Hospital Type"
            value={hospitalType}
            onChange={(e) => setHospitalType(e.target.value)}
            slotProps={{ input: { sx: fieldInputStyle } }}
          >
            <MenuItem value="Private">Private</MenuItem>
            <MenuItem value="Government">Government</MenuItem>
            <MenuItem value="Trust/Charitable">Trust / Charitable</MenuItem>
            <MenuItem value="Semi-Government">Semi-Government</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={6}>
          <TextField
            fullWidth
            label="Latitude"
            type="number"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            slotProps={{ input: { sx: fieldInputStyle } }}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            fullWidth
            label="Longitude"
            type="number"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            slotProps={{ input: { sx: fieldInputStyle } }}
          />
        </Grid>
      </Grid>

      <TextField
        fullWidth
        label="Create Admin Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="At least 6 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        helperText="Minimum 6 characters"
        sx={{ mb: 3 }}
        slotProps={{ input: {
          sx: fieldInputStyle,
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlined sx={{ color: '#0F766E', fontSize: 20 }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
              </IconButton>
            </InputAdornment>
          ),
        } }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={loading}
        endIcon={<ArrowForward />}
        sx={{
          bgcolor: '#0F766E',
          py: 1.5,
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: '1rem',
          boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
          '&:hover': {
            bgcolor: '#0D9488',
            boxShadow: '0 6px 18px rgba(15, 118, 110, 0.35)',
          }
        }}
      >
        {loading ? 'Submitting Registration...' : 'Register Hospital & Access Portal'}
      </Button>
    </>
  );
};

export default HospitalRegisterForm;

