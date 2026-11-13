import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Divider,
  Paper,
  TextField,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { hospitalAPI, resourceRequestAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const BLOOD_GROUP_OPTIONS = [
  { value: 'Ap', label: 'A+' }, { value: 'An', label: 'A-' },
  { value: 'Bp', label: 'B+' }, { value: 'Bn', label: 'B-' },
  { value: 'Op', label: 'O+' }, { value: 'On', label: 'O-' },
  { value: 'ABp', label: 'AB+' }, { value: 'ABn', label: 'AB-' }
];
const bloodLabel = (key) => BLOOD_GROUP_OPTIONS.find((b) => b.value === key)?.label || key;
const describeResource = (req) =>
  req.resourceType === 'blood' && req.details?.bloodGroup ? `blood (${bloodLabel(req.details.bloodGroup)})` : req.resourceType;
const formatUnits = (n) => `${n} ${n === 1 ? 'unit' : 'units'}`;
const statusColor = (status) =>
  ['accepted', 'completed'].includes(status) ? 'success' : ['rejected', 'cancelled'].includes(status) ? 'error' : 'warning';

const ResourceNetwork = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const myHospitalId = user?.hospitalProfile?._id;
  const [hospitals, setHospitals] = useState([]);
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [selectedTargetHosp, setSelectedTargetHosp] = useState('');
  const [resourceType, setResourceType] = useState('icuBeds');
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState('high');
  const [bloodGroup, setBloodGroup] = useState('Op');
  const [reason, setReason] = useState('');
  const [outbound, setOutbound] = useState([]);
  const [inbound, setInbound] = useState([]);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadNetworkData = useCallback(async () => {
    try {
      const { data } = await hospitalAPI.getAll();
      setHospitals(data);

      const reqData = await resourceRequestAPI.getAll();
      setOutbound(reqData.data.outbound || []);
      setInbound(reqData.data.inbound || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadNetworkData();
  }, [loadNetworkData]);

  // Refresh when another hospital sends or updates a request.
  useEffect(() => {
    if (!socket) return undefined;
    socket.on('resource_request_received', loadNetworkData);
    socket.on('resource_request_updated', loadNetworkData);
    return () => {
      socket.off('resource_request_received', loadNetworkData);
      socket.off('resource_request_updated', loadNetworkData);
    };
  }, [socket, loadNetworkData]);

  const handleOpenReq = (hId) => {
    setSelectedTargetHosp(hId);
    setReqModalOpen(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');
    try {
      await resourceRequestAPI.create({
        providingHospitalId: selectedTargetHosp,
        resourceType,
        quantity: Number(quantity),
        priority,
        reason,
        details: resourceType === 'blood' ? { bloodGroup } : {}
      });
      setMsg('Resource request transmitted to target hospital!');
      setReqModalOpen(false);
      loadNetworkData();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to submit request'));
      setReqModalOpen(false);
    }
  };

  const runAction = async (action, successText) => {
    setMsg('');
    setErrorMsg('');
    try {
      await action();
      setMsg(successText);
      loadNetworkData();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Action failed'));
    }
  };

  const handleRespond = (req, action) => {
    if (action === 'partial') {
      const input = window.prompt(`How many of the ${req.quantity} requested unit(s) can you provide?`, String(Math.max(1, req.quantity - 1)));
      if (input === null) return;
      runAction(() => resourceRequestAPI.respond(req._id, { action, fulfilledQuantity: Number(input) }), 'Request partially fulfilled.');
      return;
    }
    runAction(() => resourceRequestAPI.respond(req._id, { action }), action === 'accept' ? 'Request accepted. Stock reserved.' : 'Request rejected.');
  };

  const handleStatus = (req, status, successText) =>
    runAction(() => resourceRequestAPI.updateStatus(req._id, { status }), successText);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
          Healthcare Resource Network (H2H)
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Inter-hospital coordination protocol for sharing ICU beds, blood inventory, and ventilators during emergency surges.
        </Typography>
      </Box>

      {msg && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMsg('')}>{msg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

      {/* Inbound requests: other hospitals asking this hospital for resources */}
      <Paper elevation={0} sx={{ p: 3, mb: 6, border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Inbound Resource Requests
        </Typography>
        {inbound.length === 0 ? (
          <Typography color="textSecondary" align="center" sx={{ py: 4 }}>No hospital has requested resources from you yet.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Requesting Hospital</strong></TableCell>
                  <TableCell><strong>Resource</strong></TableCell>
                  <TableCell><strong>Quantity</strong></TableCell>
                  <TableCell><strong>Priority</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inbound.map((req) => (
                  <TableRow key={req._id}>
                    <TableCell>
                      {req.requestingHospital?.name}
                      {req.reason && <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>{req.reason}</Typography>}
                    </TableCell>
                    <TableCell>{describeResource(req)}</TableCell>
                    <TableCell>{req.fulfilledQuantity > 0 && req.fulfilledQuantity !== req.quantity ? `${req.fulfilledQuantity} / ${req.quantity}` : req.quantity}</TableCell>
                    <TableCell>
                      <Chip label={req.priority.toUpperCase()} color={['high', 'critical'].includes(req.priority) ? 'error' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={req.status.replace('_', ' ').toUpperCase()} size="small" color={statusColor(req.status)} />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {req.status === 'pending' && (
                        <>
                          <Button size="small" color="success" onClick={() => handleRespond(req, 'accept')}>Accept</Button>
                          {req.quantity > 1 && <Button size="small" onClick={() => handleRespond(req, 'partial')}>Partial</Button>}
                          <Button size="small" color="error" onClick={() => handleRespond(req, 'reject')}>Reject</Button>
                        </>
                      )}
                      {['accepted', 'partially_fulfilled'].includes(req.status) && (
                        <Button size="small" onClick={() => handleStatus(req, 'in_transit', 'Marked as in transit.')}>Dispatch</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Network Overview Grid (your own hospital is excluded: you cannot request from yourself) */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {hospitals.filter((h) => h._id !== myHospitalId).map((h) => (
          <Grid key={h._id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', height: '100%', transition: 'all 0.2s ease', '&:hover': { borderColor: '#0F766E', boxShadow: '0 6px 20px rgba(15, 118, 110, 0.08)' } }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#0F172A' }}>
                  {h.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', mb: 2 }}>
                  {h.address}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>ICU Beds Ready:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: h.beds?.icuAvailable > 0 ? '#0F766E' : 'error.main' }}>
                      {formatUnits(h.beds?.icuAvailable || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>Emergency Beds:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: h.beds?.emergencyAvailable > 0 ? '#0F766E' : 'error.main' }}>
                      {formatUnits(h.beds?.emergencyAvailable || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>O- Blood Units:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#0F172A' }}>
                      {formatUnits(h.bloodInventory?.On?.availableUnits || 0)}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Send />}
                  onClick={() => handleOpenReq(h._id)}
                  sx={{ fontWeight: 'bold', bgcolor: '#0F766E', '&:hover': { bgcolor: '#0D9488' } }}
                >
                  Request Resource
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Outbound Transfers Status Table */}
      <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Outbound Resource Request Log
        </Typography>
        {outbound.length === 0 ? (
          <Typography color="textSecondary" align="center" sx={{ py: 4 }}>No outbound transfer transactions logged.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Target Hospital</strong></TableCell>
                  <TableCell><strong>Resource Type</strong></TableCell>
                  <TableCell><strong>Quantity</strong></TableCell>
                  <TableCell><strong>Priority</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {outbound.map((req) => (
                  <TableRow key={req._id}>
                    <TableCell>{req.providingHospital?.name}</TableCell>
                    <TableCell>{describeResource(req)}</TableCell>
                    <TableCell>{req.fulfilledQuantity > 0 && req.fulfilledQuantity !== req.quantity ? `${req.fulfilledQuantity} / ${req.quantity}` : req.quantity}</TableCell>
                    <TableCell>
                      <Chip label={req.priority.toUpperCase()} color={['high', 'critical'].includes(req.priority) ? 'error' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={req.status.replace('_', ' ').toUpperCase()}
                        size="small"
                        color={statusColor(req.status)}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {['accepted', 'partially_fulfilled', 'in_transit'].includes(req.status) && (
                        <Button size="small" color="success" onClick={() => handleStatus(req, 'completed', 'Transfer marked as received. Your inventory was updated.')}>
                          Mark Received
                        </Button>
                      )}
                      {['pending', 'accepted', 'partially_fulfilled', 'in_transit'].includes(req.status) && (
                        <Button size="small" color="error" onClick={() => handleStatus(req, 'cancelled', 'Request cancelled.')}>
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Request Modal */}
      <Dialog open={reqModalOpen} onClose={() => setReqModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle fontWeight="bold">Submit H2H Resource Request</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmitRequest}>
            <TextField
              select
              label="Resource Type"
              fullWidth
              required
              margin="normal"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
            >
              <MenuItem value="icuBeds">ICU Beds</MenuItem>
              <MenuItem value="emergencyBeds">Emergency Beds</MenuItem>
              <MenuItem value="blood">Blood Inventory</MenuItem>
              <MenuItem value="ventilators">Ventilators</MenuItem>
            </TextField>

            {resourceType === 'blood' && (
              <TextField
                select
                label="Blood Group"
                fullWidth
                margin="normal"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                {BLOOD_GROUP_OPTIONS.map(bg => (
                  <MenuItem key={bg.value} value={bg.value}>{bg.label}</MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              label="Quantity Required"
              type="number"
              fullWidth
              required
              margin="normal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
            />

            <TextField
              select
              label="Priority Level"
              fullWidth
              margin="normal"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical Surge</MenuItem>
            </TextField>

            <TextField
              label="Clinical Justification / Reason"
              fullWidth
              multiline
              rows={2}
              margin="normal"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => setReqModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">Transmit Request</Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default ResourceNetwork;