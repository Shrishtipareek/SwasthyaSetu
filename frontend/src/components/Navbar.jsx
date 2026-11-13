import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [notifications, setNotifications] = useState([]);
  // Derived from the list so the badge can never drift out of sync with it.
  const unreadCount = notifications.filter(n => !n.read).length;
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (user) {
      try {
        const { data } = await notificationAPI.getNotifications();
        setNotifications(data);
      } catch (err) {
        console.error('Error fetching notifications:', err.message);
      }
    } else {
      // Logged out: do not keep showing the previous account's notifications.
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (socket && user) {
      const handleNewNotification = (notif) => {
        setNotifications(prev => (notif?._id && prev.some(n => n._id === notif._id) ? prev : [notif, ...prev]));
      };

      socket.on('notification_received', handleNewNotification);
      socket.on('emergency_alert_received', fetchNotifications);

      // Pass the handlers: socket.off(event) alone would also remove listeners
      // that other components (e.g. the hospital dashboard) registered.
      return () => {
        socket.off('notification_received', handleNewNotification);
        socket.off('emergency_alert_received', fetchNotifications);
      };
    }
  }, [socket, user, fetchNotifications]);

  const handleMarkRead = async (id) => {
    // Clicking an already-read notification used to decrement the unread badge too.
    const target = notifications.find(n => n._id === id);
    if (!target || target.read) return;
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    setAnchorElUser(null);
    navigate('/');
  };

  const isAdmin = ['admin', 'superadmin'].includes(user?.role);
  const menuItems = [
    { label: 'Public Dashboard', path: '/public-dashboard', roles: ['guest', 'patient', 'hospital', 'admin', 'superadmin'] },
    { label: 'Find Hospital', path: '/search-hospitals', roles: ['guest', 'patient'] },
    { label: 'Blood Directory', path: '/blood-donors', roles: ['guest', 'patient'] },
    { label: 'Health Campaigns', path: '/campaigns', roles: ['guest', 'patient', 'hospital', 'admin', 'superadmin'] },
    { label: 'Dashboard', path: user?.role === 'hospital' ? '/hospital-dashboard' : isAdmin ? '/admin-dashboard' : '/dashboard', roles: ['patient', 'hospital', 'admin', 'superadmin'] },
    { label: 'H2H Network', path: '/resource-network', roles: ['hospital'] },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!user) return item.roles.includes('guest');
    return item.roles.includes(user.role);
  });

  return (
    <>
      <AppBar position="sticky" sx={{ background: '#ffffff', color: '#0F172A', borderBottom: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(15, 118, 110, 0.04)' }}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 0.5, px: { xs: 1.5, sm: 2, md: 3 }, gap: 1 }}>
          <Box component={RouterLink} to="/" aria-label="SwasthyaSetu home" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
            <LocalHospital sx={{ color: '#DC2626', mr: { xs: 0.75, sm: 1 }, fontSize: { xs: 26, sm: 32 } }} />
            <Typography variant="h5" noWrap sx={{ fontWeight: '900', fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.6rem' }, letterSpacing: '-0.03em', color: '#0F172A' }}>
              Swasthya<span style={{ color: '#0F766E' }}>Setu</span>
            </Typography>
          </Box>

          {!isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {filteredMenuItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.label}
                    component={RouterLink}
                    to={item.path}
                    sx={{
                      color: isActive ? '#0F766E' : '#475569',
                      backgroundColor: isActive ? '#E6F6F3' : 'transparent',
                      textTransform: 'none',
                      fontWeight: isActive ? '700' : '600',
                      borderRadius: '8px',
                      px: 1.8,
                      py: 0.8,
                      '&:hover': { color: '#0F766E', backgroundColor: '#E6F6F3' }
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              {/* Compact SOS button: the full "EMERGENCY" label collided with the logo on phones */}
              <Button
                variant="contained"
                color="error"
                onClick={onEmergencyClick}
                aria-label="Emergency"
                startIcon={<WarningIcon sx={{ fontSize: '18px !important' }} />}
                sx={{ py: 0.5, px: 1.25, minWidth: 0, fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '8px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
              >
                SOS
              </Button>
              {user && (
                <IconButton aria-label="Notifications" onClick={(e) => setAnchorElNotif(e.currentTarget)}>
                  <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon sx={{ color: '#64748b' }} />
                  </Badge>
                </IconButton>
              )}
              <IconButton aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer Menu */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250, p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0F766E', mb: 2 }}>
            SwasthyaSetu Menu
          </Typography>
          <Divider />
          <List>
            {filteredMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem
                  key={item.label}
                  component={RouterLink}
                  to={item.path}
                  onClick={() => setDrawerOpen(false)}
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    backgroundColor: isActive ? '#E6F6F3' : 'transparent',
                    color: isActive ? '#0F766E' : '#1E293B',
                    fontWeight: isActive ? 700 : 500
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: {
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? '#0F766E' : '#1E293B'
                    } }}
                  />
                </ListItem>
              );
            })}
          </List>
          <Divider />
          <Box sx={{ p: 2 }}>
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
                {new Date(notif.createdAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{user?.name}</Typography>
            <Typography variant="caption" color="textSecondary">{user?.role?.toUpperCase()}</Typography>
          </Box>
        </MenuItem>
        <Divider />
        {/* Admins used to be sent to the patient-only /dashboard and bounced to the home page. */}
        <MenuItem onClick={() => { setAnchorElUser(null); navigate(user?.role === 'hospital' ? '/hospital-dashboard' : ['admin', 'superadmin'].includes(user?.role) ? '/admin-dashboard' : '/dashboard'); }}>Dashboard</MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
    </>
  );
};

export default Navbar;
