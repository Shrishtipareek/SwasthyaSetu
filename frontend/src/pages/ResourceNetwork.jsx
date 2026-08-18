import React, { useState, useEffect } from 'react';
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
import { hospitalAPI, resourceRequestAPI } from '../services/api';

const ResourceNetwork = () => {
  const [hospitals, setHospitals] = useState([]);
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [selectedTargetHosp, setSelectedTargetHosp] = useState('');
  const [resourceType, setResourceType] = useState('icuBeds');
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState('high');
  const [bloodGroup, setBloodGroup] = useState('Op');
  const [reason, setReason] = useState('');
  const [outbound, setOutbound] = useState([]);
  const [msg, setMsg] = useState('');

  const loadNetworkData = async () => {
    try {
      const { data } = await hospitalAPI.getAll();
      setHospitals(data);

      const reqData = await resourceRequestAPI.getAll();
      setOutbound(reqData.data.outbound || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNetworkData();
  }, []);

  const handleOpenReq = (hId) => {
    setSelectedTargetHosp(hId);
    setReqModalOpen(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setMsg('');
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
      alert(err.response?.data?.message || 'Failed to submit request');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" color="#0f172a">
          Healthcare Resource Network (H2H)
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Inter-hospital coordination protocol for sharing ICU beds, blood inventory, and ventilators during emergency surges.
        </Typography>
      </Box>

      {msg && <Alert severity="success" sx={{ mb: 3 }}>{msg}</Alert>}

      {/* Network Overview Grid */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {hospitals.map((h) => (
          <Grid item xs={12} sm={6} md={4} key={h._id}>
            <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', height: '100%', transition: 'all 0.2s ease', '&:hover': { borderColor: '#0F766E', boxShadow: '0 6px 20px rgba(15, 118, 110, 0.08)' } }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" color="#0F172A" gutterBottom>
                  {h.name}
                </Typography>
                <Typography variant="caption" color="#64748B" sx={{ mb: 2 }}>
                  {h.address}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box display="flex" flexDirection="column" gap={1} sx={{ mb: 3, flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="#64748B">ICU Beds Ready:</Typography>
                    <Typography variant="body2" fontWeight="bold" color={h.beds?.icuAvailable > 0 ? '#0F766E' : 'error.main'}>
                      {h.beds?.icuAvailable || 0} units
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="#64748B">Emergency Beds:</Typography>
                    <Typography variant="body2" fontWeight="bold" color={h.beds?.emergencyAvailable > 0 ? '#0F766E' : 'error.main'}>
                      {h.beds?.emergencyAvailable || 0} units
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="#64748B">O- Blood Units:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="#0F172A">
                      {h.bloodInventory?.On?.availableUnits || 0} units
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
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Outbound Resource Request Log
        </Typography>
        {outbound.length === 0 ? (
          <Typography color="textSecondary" align="center" py={4}>No outbound transfer transactions logged.</Typography>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {outbound.map((req) => (
                  <TableRow key={req._id}>
                    <TableCell>{req.providingHospital?.name}</TableCell>
                    <TableCell>{req.resourceType}</TableCell>
                    <TableCell>{req.quantity}</TableCell>
                    <TableCell>
                      <Chip label={req.priority.toUpperCase()} color="error" size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={req.status.replace('_', ' ').toUpperCase()}
                        size="small"
                        color={req.status === 'accepted' ? 'success' : req.status === 'rejected' ? 'error' : 'warning'}
                      />
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
                {['Op', 'On', 'Ap', 'Bp'].map(bg => (
                  <MenuItem key={bg} value={bg}>{bg}</MenuItem>
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

            <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
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