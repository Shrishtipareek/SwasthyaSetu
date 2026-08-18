import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  ListSubheader
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Warning as WarningIcon,
  LocalHospital
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { notificationAPI } from '../services/api';

const Navbar = ({ onEmergencyClick }) => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (user) {
      try {
        const { data } = await notificationAPI.getNotifications();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch (err) {
        console.error('Error fetching notifications:', err.message);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (socket && user) {
      const handleNewNotification = (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(c => c + 1);
      };

      socket.on('notification_received', handleNewNotification);
      socket.on('emergency_alert_received', () => {
        fetchNotifications();
      });

      return () => {
        socket.off('notification_received', handleNewNotification);
        socket.off('emergency_alert_received');
      };
    }
  }, [socket, user, fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    setAnchorElUser(null);
    navigate('/');
  };

  const menuItems = [
    { label: 'Public Dashboard', path: '/public-dashboard', roles: ['guest', 'patient', 'hospital', 'admin'] },
    { label: 'Find Hospital', path: '/search-hospitals', roles: ['guest', 'patient'] },
    { label: 'Blood Directory', path: '/blood-donors', roles: ['guest', 'patient'] },
    { label: 'Health Campaigns', path: '/campaigns', roles: ['guest', 'patient', 'hospital'] },
    { label: 'Dashboard', path: user?.role === 'hospital' ? '/hospital-dashboard' : user?.role === 'admin' ? '/admin-dashboard' : '/dashboard', roles: ['patient', 'hospital', 'admin'] },
    { label: 'H2H Network', path: '/resource-network', roles: ['hospital'] },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!user) return item.roles.includes('guest');
    return item.roles.includes(user.role);
  });

  return (
    <>
      <AppBar position="sticky" sx={{ background: '#ffffff', color: '#0F172A', borderBottom: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(15, 118, 110, 0.04)' }}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 0.5 }}>
          <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
            <LocalHospital sx={{ color: '#DC2626', mr: 1, fontSize: { xs: 28, sm: 34 } }} />
            <Typography variant="h5" fontWeight="900" sx={{ fontSize: { xs: '1.4rem', sm: '1.75rem' }, letterSpacing: '-0.03em', color: '#0F172A' }}>
              Swasthya<span style={{ color: '#0F766E' }}>Setu</span>
            </Typography>
          </Box>

          {!isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {filteredMenuItems.map(item => (
                <Button key={item.label} component={RouterLink} to={item.path} sx={{ color: '#475569', textTransform: 'none', fontWeight: '600', borderRadius: '8px', px: 1.8, py: 0.8, '&:hover': { color: '#0F766E', backgroundColor: '#E6F6F3' } }}>
                  {item.label}
                </Button>
              ))}

              <Button
                variant="contained"
                color="error"
                startIcon={<WarningIcon />}
                onClick={onEmergencyClick}
                sx={{
                  ml: 1.5,
                  px: 2.5,
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.03)' },
                    '100%': { transform: 'scale(1)' }
                  }
                }}
              >
                EMERGENCY
              </Button>

              {user ? (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1.5 }}>
                  <IconButton onClick={(e) => setAnchorElNotif(e.currentTarget)} sx={{ color: '#64748b', '&:hover': { color: '#0F766E', backgroundColor: '#E6F6F3' } }}>
                    <Badge badgeContent={unreadCount} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>

                  <IconButton onClick={(e) => setAnchorElUser(e.currentTarget)} sx={{ ml: 1 }}>
                    <AccountCircle sx={{ color: '#0F766E', fontSize: 34 }} />
                  </IconButton>
                </Box>
              ) : (
                <Button variant="contained" color="primary" component={RouterLink} to="/login" sx={{ ml: 1.5, textTransform: 'none', fontWeight: '600', borderRadius: '10px', px: 2.5 }}>
                  Login
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="contained"
                color="error"
                onClick={onEmergencyClick}
                sx={{ mr: 1, py: 0.5, px: 2, fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                EMERGENCY
              </Button>
              {user && (
                <IconButton onClick={(e) => setAnchorElNotif(e.currentTarget)}>
                  <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon sx={{ color: '#64748b' }} />
                  </Badge>
                </IconButton>
              )}
              <IconButton onClick={() => setDrawerOpen(true)} sx={{ ml: 1 }}>
                <MenuIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer Menu */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="#0F766E" mb={2}>
            SwasthyaSetu Menu
          </Typography>
          <Divider />
          <List>
            {filteredMenuItems.map((item) => (
              <ListItem button key={item.label} component={RouterLink} to={item.path} onClick={() => setDrawerOpen(false)}>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <Box p={2}>
            {user ? (
              <Button variant="outlined" color="error" fullWidth onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <Button variant="contained" color="primary" fullWidth component={RouterLink} to="/login" onClick={() => setDrawerOpen(false)}>
                Login
              </Button>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Notifications Popover Menu */}
      <Menu
        anchorEl={anchorElNotif}
        open={Boolean(anchorElNotif)}
        onClose={() => setAnchorElNotif(null)}
        slotProps={{
          paper: {
            sx: {
              width: 320,
              maxHeight: 400,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              borderRadius: '12px'
            }
          }
        }}
      >
        <ListSubheader sx={{ bgcolor: 'background.paper', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Notifications</span>
          {unreadCount > 0 && <span style={{ fontSize: '0.8rem', color: theme.palette.error.main }}>{unreadCount} unread</span>}
        </ListSubheader>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem sx={{ py: 2, justifyContent: 'center', color: '#64748b' }}>
            No new notifications
          </MenuItem>
        ) : (
          notifications.map(notif => (
            <MenuItem
              key={notif._id}
              onClick={() => handleMarkRead(notif._id)}
              sx={{
                whiteSpace: 'normal',
                bgcolor: notif.read ? 'inherit' : 'rgba(14, 165, 233, 0.05)',
                borderLeft: notif.read ? 'none' : `4px solid ${theme.palette.primary.main}`,
                py: 1.5,
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: notif.read ? 'normal' : 'bold', color: '#1e293b' }}>
                {notif.message}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5 }}>
                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* User Popover Menu */}
      <Menu
        anchorEl={anchorElUser}
        open={Boolean(anchorElUser)}
        onClose={() => setAnchorElUser(null)}
      >
        <MenuItem disabled>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">{user?.name}</Typography>
            <Typography variant="caption" color="textSecondary">{user?.role?.toUpperCase()}</Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setAnchorElUser(null); navigate(user?.role === 'hospital' ? '/hospital-dashboard' : '/dashboard'); }}>Dashboard</MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
    </>
  );
};

export default Navbar;
