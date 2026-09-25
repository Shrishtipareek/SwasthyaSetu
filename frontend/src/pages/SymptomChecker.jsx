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
    'Joint Pain & Body Aches',
    'Nausea',
    'Headache',
    'Fever',
    'Cough',
    'Vomiting',
    'Dizziness',
    'Rash'
  ];

  const handleQuickAdd = (symptom) => {
    setSymptomText((prev) => {
      const current = prev.trim();

      if (!current) {
        return symptom;
      }

      if (
        current
          .toLowerCase()
          .split(',')
          .map((item) => item.trim())
          .includes(symptom.toLowerCase())
      ) {
        return current;
      }

      return `${current}, ${symptom}`;
    });

    setErrorMsg('');
    setAssessment(null);
  };

  const handleAnalyze = async () => {
    const text = symptomText.trim();

    if (!text) {
      setErrorMsg('Please enter or select at least one symptom.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setAssessment(null);

    try {
      const response = await aiAPI.chat(text);

      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }

      const data = response.data;

      if (data.success === false) {
        throw new Error(
          data.message || 'Unable to analyze symptoms'
        );
      }

      if (!data.reply) {
        throw new Error('CareAI returned an empty response');
      }

      setAssessment({
        reply: data.reply,
        isEmergency: Boolean(data.isEmergency),
        suggestAppointment: Boolean(data.suggestAppointment)
      });
    } catch (error) {
      console.error(
        'AI symptom analysis error:',
        error.response?.data || error.message
      );

      setErrorMsg(
        error.response?.data?.message ||
        error.message ||
        'Unable to connect to CareAI. Please try again.'
      );
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
    <Container
      maxWidth="lg"
      sx={{
        py: { xs: 3, md: 6 },
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          mb: 4,
          borderRadius: '20px',
          background:
            'linear-gradient(135deg, #0F766E 0%, #0D9488 50%, #115E59 100%)',
          color: '#FFFFFF',
          boxShadow:
            '0 8px 30px rgba(15, 118, 110, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '780px'
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.7,
              borderRadius: '20px',
              bgcolor: 'rgba(255,255,255,0.18)',
              mb: 2
            }}
          >
            <SmartToy
              sx={{
                fontSize: 20,
                color: '#5EEAD4'
              }}
            />

            <Typography
              variant="caption"
              fontWeight="bold"
              color="#FFFFFF"
            >
              CareAI Clinical Triage Platform
            </Typography>
          </Box>

          <Typography
            variant="h3"
            fontWeight="800"
            sx={{
              fontSize: {
                xs: '1.8rem',
                sm: '2.2rem',
                md: '2.5rem'
              },
              mb: 1.5,
              letterSpacing: '-0.02em'
            }}
          >
            AI Health Symptom Checker
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#CCFBF1',
              fontSize: '1.05rem',
              lineHeight: 1.6
            }}
          >
            Enter a single symptom, multiple symptoms, or select
            an option below. CareAI will provide preliminary
            health information and guidance.
          </Typography>
        </Box>
      </Paper>

      <Grid
        container
        spacing={4}
        sx={{
          width: '100%',
          margin: 0
        }}
      >
        <Grid
          item
          xs={12}
          md={assessment ? 5 : 8}
          sx={{
            mx: assessment ? 0 : 'auto',
            minWidth: 0,
            width: '100%'
          }}
        >
          <Card
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              width: '100%',
              boxSizing: 'border-box',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow:
                '0 2px 12px rgba(15, 23, 42, 0.04)',
              overflow: 'hidden'
            }}
          >
            <Typography
              variant="h6"
              fontWeight="700"
              color="#0F2C59"
              mb={1}
            >
              Describe Your Symptoms
            </Typography>

            <Typography
              variant="body2"
              color="#64748B"
              mb={2.5}
            >
              You can select any symptom below or type even one
              word such as “nausea”, “fever”, or “headache”.
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                mb: 2.5
              }}
            >
              {quickSymptoms.map((symptom) => {
                const selected = symptomText
                  .toLowerCase()
                  .includes(symptom.toLowerCase());

                return (
                  <Chip
                    key={symptom}
                    label={symptom}
                    onClick={() => handleQuickAdd(symptom)}
                    clickable
                    sx={{
                      maxWidth: '100%',
                      minHeight: '40px',
                      height: 'auto',
                      whiteSpace: 'normal',
                      flexShrink: 1,
                      boxSizing: 'border-box',
                      bgcolor: selected
                        ? '#E6F6F3'
                        : '#F1F5F9',
                      color: selected
                        ? '#0F766E'
                        : '#475569',
                      fontWeight: '600',
                      fontSize: {
                        xs: '0.74rem',
                        sm: '0.82rem'
                      },
                      border: '1px solid',
                      borderColor: selected
                        ? '#0F766E'
                        : '#E2E8F0',
                      '& .MuiChip-label': {
                        whiteSpace: 'normal',
                        overflowWrap: 'anywhere',
                        display: 'block',
                        paddingTop: '8px',
                        paddingBottom: '8px'
                      },
                      '&:hover': {
                        bgcolor: '#E6F6F3',
                        color: '#0F766E'
                      }
                    }}
                  />
                );
              })}
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Type any symptom, for example: nausea, headache, fever, stomach pain..."
              value={symptomText}
              onChange={(event) => {
                setSymptomText(event.target.value);
                setErrorMsg('');
                setAssessment(null);
              }}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: '#F8FAFC',
                  fontSize: '0.95rem'
                }
              }}
            />

            {errorMsg && (
              <Alert
                severity="error"
                sx={{
                  mb: 2.5,
                  borderRadius: '10px'
                }}
              >
                {errorMsg}
              </Alert>
            )}

            <Box
              display="flex"
              gap={2}
              sx={{
                width: '100%',
                flexDirection: {
                  xs: 'column',
                  sm: 'row'
                }
              }}
            >
              <Button
                variant="contained"
                fullWidth
                disabled={loading}
                onClick={handleAnalyze}
                startIcon={
                  loading ? (
                    <CircularProgress
                      size={20}
                      color="inherit"
                    />
                  ) : (
                    <SendOutlined />
                  )
                }
                sx={{
                  py: 1.4,
                  fontSize: '1rem',
                  fontWeight: '700',
                  borderRadius: '12px',
                  bgcolor: '#0F766E',
                  boxShadow:
                    '0 4px 14px rgba(15,118,110,0.25)',
                  '&:hover': {
                    bgcolor: '#0D9488'
                  }
                }}
              >
                {loading
                  ? 'Analyzing Symptoms...'
                  : 'Analyze Symptoms'}
              </Button>

              {assessment && (
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  startIcon={<RefreshOutlined />}
                  sx={{
                    borderRadius: '12px',
                    px: 3,
                    py: 1.4,
                    fontWeight: '700',
                    borderColor: '#CBD5E1',
                    color: '#64748B',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Reset
                </Button>
              )}
            </Box>
          </Card>
        </Grid>

        {assessment && (
          <Grid
            item
            xs={12}
            md={7}
            sx={{
              minWidth: 0,
              width: '100%'
            }}
          >
            <Card
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3.5 },
                width: '100%',
                boxSizing: 'border-box',
                borderRadius: '16px',
                border: assessment.isEmergency
                  ? '2px solid #DC2626'
                  : '1px solid #CCFBF1',
                bgcolor: assessment.isEmergency
                  ? '#FEF2F2'
                  : '#FFFFFF',
                boxShadow:
                  '0 4px 20px rgba(15,118,110,0.08)',
                overflow: 'hidden'
              }}
            >
              {assessment.isEmergency ? (
                <Alert
                  severity="error"
                  icon={
                    <WarningIcon
                      sx={{ fontSize: 28 }}
                    />
                  }
                  sx={{
                    mb: 3,
                    borderRadius: '12px',
                    bgcolor: '#FEE2E2',
                    color: '#991B1B',
                    fontWeight: '700'
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="800"
                  >
                    EMERGENCY WARNING DETECTED
                  </Typography>

                  CareAI detected symptoms that may require
                  urgent medical attention. Please seek
                  immediate medical care.
                </Alert>
              ) : (
                <Alert
                  severity="info"
                  icon={
                    <CheckCircle
                      sx={{
                        fontSize: 28,
                        color: '#0F766E'
                      }}
                    />
                  }
                  sx={{
                    mb: 3,
                    borderRadius: '12px',
                    bgcolor: '#F0FDFA',
                    color: '#0F766E',
                    fontWeight: '700',
                    border: '1px solid #CCFBF1'
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="800"
                  >
                    CareAI Analysis Completed
                  </Typography>

                  Preliminary guidance based on your reported
                  symptoms.
                </Alert>
              )}

              <Typography
                variant="h6"
                fontWeight="800"
                color="#0F2C59"
                mb={1.5}
              >
                Analysis & Clinical Guidance
              </Typography>

              <Box
                sx={{
                  color: '#334155',
                  lineHeight: 1.7,
                  mb: 3,
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                  '& h2': {
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#0F2C59',
                    marginTop: '18px',
                    marginBottom: '8px'
                  },
                  '& h3': {
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#0F2C59',
                    marginTop: '15px',
                    marginBottom: '6px'
                  },
                  '& ul': {
                    paddingLeft: '22px',
                    marginTop: '6px',
                    marginBottom: '10px'
                  },
                  '& li': {
                    marginBottom: '5px'
                  },
                  '& p': {
                    marginBottom: '10px'
                  }
                }}
              >
                {assessment.reply
                  .split('\n')
                  .map((line, index) => {
                    const trimmed = line.trim();

                    if (!trimmed) {
                      return (
                        <Box
                          key={index}
                          sx={{ height: '6px' }}
                        />
                      );
                    }

                    if (trimmed.startsWith('## ')) {
                      return (
                        <Typography
                          key={index}
                          component="h2"
                        >
                          {trimmed.replace('## ', '')}
                        </Typography>
                      );
                    }

                    if (trimmed.startsWith('### ')) {
                      return (
                        <Typography
                          key={index}
                          component="h3"
                        >
                          {trimmed.replace('### ', '')}
                        </Typography>
                      );
                    }

                    if (trimmed.startsWith('- ')) {
                      return (
                        <Box
                          key={index}
                          component="li"
                        >
                          {trimmed.replace('- ', '')}
                        </Box>
                      );
                    }

                    return (
                      <Typography
                        key={index}
                        component="p"
                      >
                        {trimmed
                          .replace(/\*\*(.*?)\*\*/g, '$1')
                          .replace(/\*(.*?)\*/g, '$1')}
                      </Typography>
                    );
                  })}
              </Box>

              <Divider sx={{ my: 2.5 }} />

              <Box
                display="flex"
                flexWrap="wrap"
                gap={2}
              >
                {assessment.isEmergency && (
                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    onClick={onEmergencyClick}
                    startIcon={<WarningIcon />}
                    sx={{
                      py: 1.4,
                      px: 3,
                      fontWeight: '800',
                      borderRadius: '12px'
                    }}
                  >
                    Trigger Emergency Intake
                  </Button>
                )}

                <Button
                  variant="contained"
                  size="large"
                  onClick={() =>
                    navigate('/search-hospitals')
                  }
                  startIcon={<CalendarMonth />}
                  sx={{
                    py: 1.4,
                    px: 3,
                    fontWeight: '700',
                    borderRadius: '12px',
                    bgcolor: '#0F766E',
                    '&:hover': {
                      bgcolor: '#0D9488'
                    }
                  }}
                >
                  Book Doctor Appointment
                </Button>
              </Box>

              <Typography
                variant="caption"
                color="#94A3B8"
                display="block"
                mt={3}
                lineHeight={1.5}
              >
                * Disclaimer: CareAI provides preliminary
                information only and is not a substitute for
                professional medical diagnosis or treatment.
              </Typography>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default SymptomChecker;