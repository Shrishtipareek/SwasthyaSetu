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
      text: "Hello! I am **CareAI**, your medical coordination assistant. 🏥\n\nHow can I help you today? Ask me about:\n- Symptoms (e.g. 'I have a mild cold')\n- Local ICU/bed resource checks\n- Booking doctor appointments\n\n*Disclaimer: CareAI provides general information and does not replace professional medical advice.*"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    // Load history when chatbot is opened and user is logged in
    const loadHistory = async () => {
      if (isOpen && user) {
        try {
          const { data } = await aiAPI.getHistory();
          if (data && data.length > 0) {
            setMessages([
              {
                sender: 'ai',
                text: "Welcome back! Here is our recent chat history:"
              },
              ...data.map(m => ({ sender: m.sender, text: m.text }))
            ]);
          }
        } catch (err) {
          console.error('Failed to load chat history:', err.message);
        }
      }
    };
    loadHistory();
  }, [isOpen, user]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInputValue('');
    setLoading(true);

    try {
      const { data } = await aiAPI.chat({ message: text });
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: data.reply,
        isEmergency: data.isEmergency,
        suggestAppointment: data.suggestAppointment
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: "I am having trouble connecting right now. Please try again. For urgent needs, seek medical help immediately."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "I have a mild fever",
    "Emergency warning symptoms?",
    "Find ICU beds near me",
    "Need doctor appointment"
  ];

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          boxShadow: '0 4px 20px rgba(14, 165, 233, 0.4)',
          zIndex: 1000
        }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {/* Chat Window */}
      {isOpen && (
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            bottom: 96,
            right: 24,
            width: { xs: 'calc(100% - 48px)', sm: 380 },
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            overflow: 'hidden',
            zIndex: 1000,
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
          }}
        >
          {/* Header */}
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
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <SmartToy />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">CareAI Assistant</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Online | Virtual Guide</Typography>
              </Box>
            </Box>
            <IconButton color="inherit" onClick={() => setIsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Messages Body */}
          <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {messages.map((m, idx) => (
              <Box
                key={idx}
                sx={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    bgcolor: m.sender === 'user' ? theme.palette.primary.main : '#ffffff',
                    color: m.sender === 'user' ? 'white' : '#1e293b',
                    borderRadius: m.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.9rem'
                  }}
                >
                  {m.text}
                </Paper>

                {/* Emergency shortcut if emergency warning detected */}
                {m.isEmergency && (
                  <Box mt={1} display="flex" flexDirection="column" gap={1}>
                    <Button
                      variant="contained"
                      color="error"
                      fullWidth
                      startIcon={<WarningIcon />}
                      onClick={() => {
                        setIsOpen(false);
                        onEmergencyClick();
                      }}
                      sx={{ fontWeight: 'bold' }}
                    >
                      OPEN EMERGENCY FINDER
                    </Button>
                  </Box>
                )}

                {/* Appointment suggest shortcut */}
                {m.suggestAppointment && (
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    sx={{ mt: 1, fontSize: '0.8rem', textTransform: 'capitalize' }}
                    href="/dashboard"
                  >
                    Go to Appointment Booking
                  </Button>
                )}
              </Box>
            ))}
            {loading && (
              <Box alignSelf="flex-start" display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="textSecondary">CareAI is typing...</Typography>
              </Box>
            )}
            <div ref={chatEndRef} />
          </Box>

          {/* Quick Suggestions Chips */}
          <Box sx={{ p: 1, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1, overflowX: 'auto', bgcolor: '#ffffff', whiteSpace: 'nowrap' }}>
            {suggestions.map((s, idx) => (
              <Chip
                key={idx}
                label={s}
                onClick={() => handleSend(s)}
                clickable
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
          </Box>

          {/* Input field */}
          <Box sx={{ p: 1.5, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1, bgcolor: '#ffffff', alignItems: 'center' }}>
            <TextField
              placeholder="Ask CareAI..."
              variant="outlined"
              size="small"
              fullWidth
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px'
                }
              }}
            />
            <IconButton
              color="primary"
              disabled={!inputValue.trim() || loading}
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
