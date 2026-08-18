import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import {
  SmartToy,
  Warning as WarningIcon,
  CheckCircle,
  CalendarMonth,
  RefreshOutlined,
  SendOutlined
} from '@mui/icons-material';
import { aiAPI } from '../services/api';

const SymptomChecker = ({ onEmergencyClick }) => {
  const navigate = useNavigate();
  const [symptomText, setSymptomText] = useState('');
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const quickSymptoms = [
    'High Fever & Cold Chills',
    'Severe Chest Pain or Pressure',
    'Persistent Cough & Sore Throat',
    'Shortness of Breath & Wheezing',
    'Severe Headache & Dizziness',
    'Stomach Pain & Nausea',
    'Joint Pain & Body Aches'
  ];

  const handleQuickAdd = (symptom) => {
    if (symptomText.includes(symptom)) return;
    setSymptomText(prev => prev ? `${prev}, ${symptom}` : symptom);
  };

  const handleAnalyze = async () => {
    if (!symptomText.trim()) {
      setErrorMsg('Please describe your symptoms before starting the AI check.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const { data } = await aiAPI.chat({ message: symptomText });
      setAssessment(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Unable to connect to CareAI. Please try again or seek emergency assistance.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSymptomText('');
    setAssessment(null);
    setErrorMsg('');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          mb: 4,
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 50%, #115E59 100%)',
          color: '#FFFFFF',
          boxShadow: '0 8px 30px rgba(15, 118, 110, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2, maxWidth: '750px' }}>
          <Box display="inline-flex" alignItems="center" gap={1} px={2} py={0.6} borderRadius="20px" bgcolor="rgba(255, 255, 255, 0.18)" mb={2}>
            <SmartToy sx={{ fontSize: 20, color: '#5EEAD4' }} />
            <Typography variant="caption" fontWeight="bold" color="#FFFFFF">CareAI Clinical Triage Platform</Typography>
          </Box>

          <Typography variant="h3" fontWeight="800" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, mb: 1.5, letterSpacing: '-0.02em' }}>
            AI Health Symptom Checker
          </Typography>
          <Typography variant="body1" sx={{ color: '#CCFBF1', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Enter your symptoms for immediate 24/7 analysis, danger sign detection, triage risk scoring, and doctor specialization matching.
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={4}>
        {/* Input Column */}
        <Grid item xs={12} md={assessment ? 5 : 8} sx={{ mx: assessment ? 0 : 'auto', transition: 'all 0.3s ease' }}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)'
            }}
          >
            <Typography variant="h6" fontWeight="700" color="#0F2C59" mb={1}>
              Describe Your Symptoms
            </Typography>
            <Typography variant="body2" color="#64748B" mb={2.5}>
              Select common symptoms below or type out how you are feeling in detail:
            </Typography>

            {/* Quick Symptom Chips */}
            <Box display="flex" flexWrap="wrap" gap={1} mb={2.5}>
              {quickSymptoms.map((sym, idx) => (
                <Chip
                  key={idx}
                  label={`+ ${sym}`}
                  onClick={() => handleQuickAdd(sym)}
                  sx={{
                    bgcolor: symptomText.includes(sym) ? '#E6F6F3' : '#F1F5F9',
                    color: symptomText.includes(sym) ? '#0F766E' : '#475569',
                    fontWeight: '600',
                    fontSize: '0.82rem',
                    borderColor: symptomText.includes(sym) ? '#0F766E' : '#E2E8F0',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#E6F6F3', color: '#0F766E' }
                  }}
                />
              ))}
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="e.g. I have had a temperature of 101°F for two days with severe sore throat and body ache..."
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: '#F8FAFC',
                  fontSize: '0.95rem'
                }
              }}
            />

            {errorMsg && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px' }}>{errorMsg}</Alert>}

            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                fullWidth
                disabled={loading}
                onClick={handleAnalyze}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendOutlined />}
                sx={{
                  py: 1.4,
                  fontSize: '1rem',
                  fontWeight: '700',
                  borderRadius: '12px',
                  bgcolor: '#0F766E',
                  boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
                  '&:hover': { bgcolor: '#0D9488' }
                }}
              >
                {loading ? 'Analyzing Symptoms...' : 'Analyze Symptoms'}
              </Button>

              {assessment && (
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  startIcon={<RefreshOutlined />}
                  sx={{ borderRadius: '12px', px: 3, fontWeight: '700', borderColor: '#CBD5E1', color: '#64748B' }}
                >
                  Reset
                </Button>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Results Column */}
        {assessment && (
          <Grid item xs={12} md={7}>
            <Card
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: '16px',
                border: assessment.isEmergency ? '2px solid #DC2626' : '1px solid #CCFBF1',
                bgcolor: assessment.isEmergency ? '#FEF2F2' : '#FFFFFF',
                boxShadow: '0 4px 20px rgba(15, 118, 110, 0.08)'
              }}
            >
              {/* Risk Level Badge Header */}
              {assessment.isEmergency ? (
                <Alert
                  severity="error"
                  icon={<WarningIcon sx={{ fontSize: 28 }} />}
                  sx={{ mb: 3, borderRadius: '12px', bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: '700' }}
                >
                  <Typography variant="subtitle1" fontWeight="800">EMERGENCY WARNING DETECTED</Typography>
                  CareAI detected potential critical emergency symptoms. Seek medical care immediately.
                </Alert>
              ) : (
                <Alert
                  severity="info"
                  icon={<CheckCircle sx={{ fontSize: 28, color: '#0F766E' }} />}
                  sx={{ mb: 3, borderRadius: '12px', bgcolor: '#F0FDFA', color: '#0F766E', fontWeight: '700', border: '1px solid #CCFBF1' }}
                >
                  <Typography variant="subtitle1" fontWeight="800">CareAI Triage Assessment Completed</Typography>
                  Preliminary guidance based on reported symptoms.
                </Alert>
              )}

              <Typography variant="h6" fontWeight="800" color="#0F2C59" mb={1.5}>
                Analysis & Clinical Guidance
              </Typography>
              <Typography variant="body1" color="#334155" sx={{ whitespace: 'pre-line', lineHeight: 1.7, mb: 3 }}>
                {assessment.reply}
              </Typography>

              <Divider sx={{ my: 2.5 }} />

              {/* Action Buttons */}
              <Box display="flex" flexWrap="wrap" gap={2}>
                {assessment.isEmergency && (
                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    onClick={onEmergencyClick}
                    startIcon={<WarningIcon />}
                    sx={{ py: 1.4, px: 3, fontWeight: '800', borderRadius: '12px', boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)' }}
                  >
                    Trigger Emergency Intake
                  </Button>
                )}

                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/search-hospitals')}
                  startIcon={<CalendarMonth />}
                  sx={{ py: 1.4, px: 3, fontWeight: '700', borderRadius: '12px', bgcolor: '#0F766E', '&:hover': { bgcolor: '#0D9488' } }}
                >
                  Book Doctor Appointment
                </Button>
              </Box>

              <Typography variant="caption" color="#94A3B8" display="block" mt={3}>
                * Disclaimer: CareAI provides preliminary information only and is not a substitute for professional medical diagnosis or treatment.
              </Typography>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default SymptomChecker;
