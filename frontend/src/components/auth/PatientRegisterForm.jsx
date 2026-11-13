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
  PersonOutlined,
  PhoneOutlined,
  CalendarTodayOutlined,
  MedicalServicesOutlined
} from '@mui/icons-material';

const PatientRegisterForm = ({
  name, setName,
  email, setEmail,
  password, setPassword,
  phone, setPhone,
  dob, setDob,
  gender, setGender,
  bloodGroup, setBloodGroup,
  showPassword, setShowPassword,
  loading,
  fieldInputStyle
}) => {
  return (
    <>
      <TextField
        fullWidth
        label="Full Name"
        placeholder="e.g. John Doe"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        sx={{ mb: 2 }}
        InputProps={{
          sx: fieldInputStyle,
          startAdornment: (
            <InputAdornment position="start">
              <PersonOutlined sx={{ color: '#0F766E', fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        label="Email Address"
        type="email"
        placeholder="name@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        sx={{ mb: 2 }}
        InputProps={{
          sx: fieldInputStyle,
          startAdornment: (
            <InputAdornment position="start">
              <EmailOutlined sx={{ color: '#0F766E', fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        label="Mobile Phone"
        placeholder="10-digit mobile number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
        sx={{ mb: 2 }}
        InputProps={{
          sx: fieldInputStyle,
          startAdornment: (
            <InputAdornment position="start">
              <PhoneOutlined sx={{ color: '#0F766E', fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            InputProps={{ sx: fieldInputStyle }}
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="Blood Group"
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            InputProps={{
              sx: fieldInputStyle,
              startAdornment: (
                <InputAdornment position="start">
                  <MedicalServicesOutlined sx={{ color: '#DC2626', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          >
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((grp) => (
              <MenuItem key={grp} value={grp}>{grp}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            InputProps={{
              sx: fieldInputStyle,
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarTodayOutlined sx={{ color: '#64748B', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      <TextField
        fullWidth
        label="Create Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="At least 6 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        helperText="Minimum 6 characters with letters and numbers"
        sx={{ mb: 3 }}
        InputProps={{
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
        }}
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
        {loading ? 'Creating Account...' : 'Create Patient Account'}
      </Button>
    </>
  );
};

export default PatientRegisterForm;

