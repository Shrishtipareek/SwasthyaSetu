import React, { useState, useEffect, useRef } from 'react';
import {
  Fab,
  Paper,
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Button,
  useTheme
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy,
  Warning as WarningIcon
} from '@mui/icons-material';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CareAIChat = ({ onEmergencyClick }) => {
  const theme = useTheme();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am CareAI, your medical coordination assistant. 🏥\n\nHow can I help you today? Ask me about:\n- Symptoms\n- Hospital resources\n- ICU or bed availability\n- Doctor appointments\n\nDisclaimer: CareAI provides general information and does not replace professional medical advice."
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!isOpen || !user) return;

      try {
        const { data } = await aiAPI.getHistory();

        if (Array.isArray(data) && data.length > 0) {
          setMessages([
            {
              sender: 'ai',
              text: 'Welcome back! Here is our recent chat history:'
            },
            ...data.map((item) => ({
              sender: item.sender,
              text: item.text,
              isEmergency: item.isEmergency || false,
              suggestAppointment: item.suggestAppointment || false
            }))
          ]);
        }
      } catch (error) {
        console.error(
          'Failed to load chat history:',
          error?.response?.data || error.message
        );
      }
    };

    loadHistory();
  }, [isOpen, user]);

  const handleSend = async (textToSend = '') => {
    const text = (
      typeof textToSend === 'string' && textToSend.trim()
        ? textToSend
        : inputValue
    ).trim();

    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text
      }
    ]);

    setInputValue('');
    setLoading(true);

    try {
      const response = await aiAPI.chat(text);
      const data = response?.data;

      if (!data || !data.success) {
        throw new Error(
          data?.message || 'AI response was not received.'
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text:
            data.reply ||
            'Sorry, I could not generate a response.',
          isEmergency: Boolean(data.isEmergency),
          suggestAppointment: Boolean(data.suggestAppointment)
        }
      ]);
    } catch (error) {
      console.error(
        'CareAI error:',
        error?.response?.data || error.message
      );

      const backendMessage =
        error?.response?.data?.message;

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text:
            backendMessage ||
            'I am having trouble connecting right now. Please try again. For urgent medical needs, seek immediate medical help.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'I have a mild fever',
    'What are emergency warning symptoms?',
    'Find ICU beds near me',
    'I need a doctor appointment'
  ];

  return (
    <>
      <Fab
        aria-label="chat"
        onClick={() => setIsOpen((prev) => !prev)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: '#0F766E',
          color: '#FFFFFF',
          '&:hover': {
            bgcolor: '#0D9488'
          },
          boxShadow:
            '0 4px 20px rgba(15, 118, 110, 0.4)',
          zIndex: 1000
        }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {isOpen && (
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            bottom: 96,
            right: 24,
            width: {
              xs: 'calc(100% - 48px)',
              sm: 380
            },
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            overflow: 'hidden',
            zIndex: 1000,
            boxShadow:
              '0 8px 30px rgba(0,0,0,0.15)'
          }}
        >
          <Box
            sx={{
              bgcolor: theme.palette.primary.main,
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)'
                }}
              >
                <SmartToy />
              </Avatar>

              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                >
                  CareAI Assistant
                </Typography>

                <Typography
                  variant="caption"
                  sx={{ opacity: 0.8 }}
                >
                  Online | Virtual Guide
                </Typography>
              </Box>
            </Box>

            <IconButton
              color="inherit"
              onClick={() => setIsOpen(false)}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              flexGrow: 1,
              p: 2,
              overflowY: 'auto',
              bgcolor: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  alignSelf:
                    message.sender === 'user'
                      ? 'flex-end'
                      : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    bgcolor:
                      message.sender === 'user'
                        ? '#0F766E'
                        : '#FFFFFF',
                    color:
                      message.sender === 'user'
                        ? '#FFFFFF'
                        : '#0F172A',
                    borderRadius:
                      message.sender === 'user'
                        ? '12px 12px 0 12px'
                        : '12px 12px 12px 0',
                    border:
                      message.sender === 'user'
                        ? 'none'
                        : '1px solid #E2E8F0',
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.9rem'
                  }}
                >
                  {message.text}
                </Paper>

                {message.isEmergency && (
                  <Box
                    sx={{
                      mt: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1
                    }}
                  >
                    <Button
                      variant="contained"
                      color="error"
                      fullWidth
                      startIcon={<WarningIcon />}
                      onClick={() => {
                        setIsOpen(false);

                        if (onEmergencyClick) {
                          onEmergencyClick();
                        }
                      }}
                      sx={{
                        fontWeight: 'bold'
                      }}
                    >
                      OPEN EMERGENCY FINDER
                    </Button>
                  </Box>
                )}

                {message.suggestAppointment && (
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    sx={{
                      mt: 1,
                      fontSize: '0.8rem',
                      textTransform: 'capitalize'
                    }}
                    href="/dashboard"
                  >
                    Go to Appointment Booking
                  </Button>
                )}
              </Box>
            ))}

            {loading && (
              <Box
                sx={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <CircularProgress size={16} />

                <Typography
                  variant="caption"
                  color="textSecondary"
                >
                  CareAI is typing...
                </Typography>
              </Box>
            )}

            <div ref={chatEndRef} />
          </Box>

          <Box
            sx={{
              p: 1,
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              bgcolor: '#FFFFFF',
              whiteSpace: 'nowrap'
            }}
          >
            {suggestions.map((suggestion, index) => (
              <Chip
                key={index}
                label={suggestion}
                onClick={() => handleSend(suggestion)}
                clickable
                color="primary"
                variant="outlined"
                size="small"
                disabled={loading}
                sx={{
                  fontSize: '0.75rem'
                }}
              />
            ))}
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              gap: 1,
              bgcolor: '#FFFFFF',
              alignItems: 'center'
            }}
          >
            <TextField
              placeholder="Ask CareAI..."
              variant="outlined"
              size="small"
              fullWidth
              value={inputValue}
              disabled={loading}
              onChange={(event) =>
                setInputValue(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px'
                }
              }}
            />

            <IconButton
              color="primary"
              disabled={
                !inputValue.trim() || loading
              }
              onClick={() => handleSend()}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default CareAIChat;