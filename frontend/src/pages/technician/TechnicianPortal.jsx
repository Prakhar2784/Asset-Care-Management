import { useState, useEffect } from "react";
import {
  Box, CircularProgress, Grid, Paper, Stack, Typography, Chip, Button, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, TextField, Select, MenuItem, FormControl, InputLabel, Autocomplete, IconButton, InputAdornment
} from "@mui/material";
import {
  ConfirmationNumberRounded, BuildRounded, TaskAltRounded,
  BuildCircleRounded, HandymanRounded, CheckCircleRounded,
  CloseRounded, AddRounded, EditRounded, HelpOutlineRounded
} from "@mui/icons-material";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Critical': return { bg: 'rgba(220,38,38,0.12)',   color: '#EF4444' };
    case 'High':     return { bg: 'rgba(234,88,12,0.12)',   color: '#F97316' };
    case 'Medium':   return { bg: 'rgba(22,163,74,0.12)',   color: '#22C55E' };
    case 'Low':      return { bg: 'rgba(100,116,139,0.12)', color: '#64748B' };
    default:         return { bg: 'rgba(71,85,105,0.12)',   color: '#64748B' };
  }
};

const TechnicianPortal = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState('');
  const [error, setError] = useState('');

  // Maintenance Log Form State
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [editLog, setEditLog] = useState(null);
  const [submittingLog, setSubmittingLog] = useState(false);
  const [logFormError, setLogFormError] = useState("");
  
  const EMPTY_LOG_FORM = {
    serviceDate: new Date().toISOString().split('T')[0],
    nextServiceDate: "",
    description: "",
    status: "Completed",
    cost: "",
    notes: "",
  };
  
  const [logForm, setLogForm] = useState(EMPTY_LOG_FORM);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, logsRes, assetsRes] = await Promise.all([
        api.get('/tickets'),
        api.get('/maintenance').catch(() => ({ data: [] })),
        api.get('/assets/all-active').catch(() => ({ data: [] }))
      ]);
      setTickets(ticketsRes.data);
      setLogs(logsRes.data);
      setAllAssets(assetsRes.data);
    } catch (err) {
      setError("Failed to load dashboard data.");
      console.error("Failed to load technician dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (ticketId, newStatus) => {
    try {
      await api.put(`/tickets/${ticketId}/status`, { status: newStatus });
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: newStatus } : t));
      setSnackbar(`Ticket marked as "${newStatus}"`);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    }
  };

  const openAddLog = () => {
    setEditLog(null);
    setSelectedAsset(null);
    setLogForm(EMPTY_LOG_FORM);
    setLogFormError("");
    setLogDialogOpen(true);
  };

  const openEditLog = (log) => {
    setEditLog(log);
    setSelectedAsset(log.asset || null);
    setLogFormError("");
    setLogForm({
      serviceDate: log.serviceDate ? log.serviceDate.slice(0, 10) : "",
      nextServiceDate: log.nextServiceDate ? log.nextServiceDate.slice(0, 10) : "",
      description: log.description || "",
      status: log.status || "Completed",
      cost: log.cost ?? "",
      notes: log.notes || "",
    });
    setLogDialogOpen(true);
  };

  const handleSaveLog = async () => {
    if (!selectedAsset) {
      setLogFormError("Please select an asset.");
      return;
    }
    if (!logForm.serviceDate) {
      setLogFormError("Service Date is required.");
      return;
    }
    const yr = parseInt(logForm.serviceDate.slice(0, 4), 10);
    if (isNaN(yr) || yr < 1990 || yr > 2099) {
      setLogFormError("Please enter a valid year for Service Date (1990–2099).");
      return;
    }
    if (!logForm.description.trim()) {
      setLogFormError("Description is required.");
      return;
    }

    setLogFormError("");
    setSubmittingLog(true);
    try {
      if (editLog) {
        await api.put(`/maintenance/log/${editLog._id}`, logForm);
        setSnackbar("Maintenance log updated successfully.");
      } else {
        await api.post(`/maintenance/${selectedAsset._id}`, {
          ...logForm,
          technicianName: currentUser?.name || "",
        });
        setSnackbar("Maintenance log recorded successfully.");
      }
      setLogDialogOpen(false);
      // Refresh data
      fetchData();
    } catch (err) {
      setLogFormError(err.response?.data?.message || "Failed to save maintenance log.");
    } finally {
      setSubmittingLog(false);
    }
  };

  // Show tickets explicitly assigned to this technician OR unowned legacy tickets
  const myAssigned = tickets.filter(t =>
    t.status === 'Assigned to Technician' &&
    (!t.assignedTechnician || t.assignedTechnician?._id === currentUser?._id)
  );
  const inProgressRepairs = tickets.filter(t =>
    t.assignedTechnician?._id === currentUser?._id &&
    t.status === 'Under Repair'
  );
  const completedRepairs = tickets.filter(t =>
    t.assignedTechnician?._id === currentUser?._id &&
    t.status === 'Resolved'
  );

  const kpis = [
    { label: "My Assigned Tasks", value: myAssigned.length,      color: "#7777C7", icon: <ConfirmationNumberRounded /> },
    { label: "In Progress",       value: inProgressRepairs.length, color: "#7777C7", icon: <BuildCircleRounded /> },
    { label: "Resolved by Me",    value: completedRepairs.length, color: "#10B981", icon: <TaskAltRounded /> }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
        <CircularProgress sx={{ color: 'text.primary' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', pb: 5 }}>
      <PageHeader title="Technician Portal" subtitle={`Welcome back, ${currentUser?.name || 'Technician'}. Act on your assigned tickets below.`} />

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', fontWeight: 600 }} onClose={() => setError('')}>{error}</Alert>}

      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map(k => (
          <Grid size={{ xs: 12, sm: 4 }} key={k.label}>
            <Paper sx={{ p: 3, borderRadius: '20px', border: 1, borderColor: 'divider', position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: k.color }} />
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: `${k.color}15`, display: 'grid', placeItems: 'center', mb: 2, color: k.color }}>
                {k.icon}
              </Box>
              <Typography fontSize={32} fontWeight={950} sx={{ lineHeight: 1 }}>{k.value}</Typography>
              <Typography fontSize={13} fontWeight={700} color="text.secondary" mt={0.5}>{k.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Left: My Assigned Tickets with Action Buttons */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
            <Typography fontSize={16} fontWeight={800} mb={2.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ConfirmationNumberRounded sx={{ color: '#F59E0B' }} />
              My Active Tasks ({myAssigned.length})
            </Typography>

            {myAssigned.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center', bgcolor: 'action.hover', borderRadius: '14px', border: '1px dashed', borderColor: 'divider' }}>
                <TaskAltRounded sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.disabled" fontWeight={700}>No tickets currently assigned to you.</Typography>
                <Typography color="text.disabled" fontSize={12} mt={0.5}>Your HOD will assign tickets after approving.</Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {myAssigned.map(ticket => {
                  const pc = getPriorityColor(ticket.priority);
                  return (
                    <Paper key={ticket._id} sx={{ p: 2, borderRadius: '14px', border: 1, borderColor: 'divider', transition: 'all 0.2s', '&:hover': { borderColor: 'rgba(17,24,39,0.35)', transform: 'translateY(-1px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } }}>
                      {/* Header row */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography fontWeight={900} fontSize={14} sx={{ fontFamily: 'monospace' }}>{ticket.ticketId}</Typography>
                          <Chip label={ticket.priority} size="small" sx={{ bgcolor: pc.bg, color: pc.color, fontWeight: 800, height: 20, fontSize: 10 }} />
                        </Box>
                        <Chip label="Assigned to You" size="small" sx={{ bgcolor: 'rgba(14,165,233,0.12)', color: '#38BDF8', fontWeight: 800, height: 20, fontSize: 10 }} />
                      </Box>
                      <Typography fontSize={13} fontWeight={700} mb={0.5}>Issue: {ticket.issue}</Typography>
                      <Typography fontSize={11} color="text.secondary" mb={2}>
                        Asset: <strong>{ticket.asset?.name || ticket.itemLabel || 'N/A'}</strong> — Raised by {ticket.raisedBy?.name}
                      </Typography>
                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button fullWidth variant="contained" size="small" startIcon={<CheckCircleRounded />}
                          onClick={() => handleAction(ticket._id, 'Resolved')}
                          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 800, boxShadow: 'none', bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A', boxShadow: 'none' } }}>
                          Mark Resolved
                        </Button>
                        <Button fullWidth variant="outlined" size="small" startIcon={<HandymanRounded />}
                          onClick={() => handleAction(ticket._id, 'Service Center Required')}
                          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 800, borderColor: '#F97316', color: '#F97316', '&:hover': { bgcolor: 'rgba(249,115,22,0.06)', borderColor: '#F97316' } }}>
                          Need Service Center
                        </Button>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Right: Recent Maintenance Logs */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography fontSize={16} fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BuildRounded sx={{ color: '#3B82F6' }} />
                Recent Maintenance Logs
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddRounded />}
                onClick={openAddLog}
                sx={{
                  background: "#7777C7",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  borderRadius: "8px",
                  boxShadow: "none",
                  textTransform: "none",
                  '&:hover': { bgcolor: '#6464B8', boxShadow: 'none' }
                }}
              >
                Add Log
              </Button>
            </Box>

            {logs.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center', bgcolor: 'action.hover', borderRadius: '14px', border: '1px dashed', borderColor: 'divider' }}>
                <BuildRounded sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.disabled" fontWeight={600}>No maintenance logs recorded yet.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {logs.slice(0, 6).map(log => (
                  <Box key={log._id} sx={{ p: 1.5, borderRadius: '12px', border: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography fontWeight={800} fontSize={13}>{log.asset?.name || 'Unknown Asset'}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={log.status || 'N/A'} size="small" sx={{ fontWeight: 800, height: 18, fontSize: 9 }} />
                        <IconButton size="small" onClick={() => openEditLog(log)} sx={{ color: 'primary.main', p: 0.2 }}>
                          <EditRounded sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography fontSize={12} color="text.secondary">{log.description}</Typography>
                    <Typography fontSize={10} color="text.disabled" mt={0.5}>By {log.loggedBy?.name || 'System'}</Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add/Edit Maintenance Log Dialog */}
      <Dialog
        open={logDialogOpen}
        onClose={() => setLogDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "20px", overflow: "hidden" } } }}
      >
        <Box sx={{
          p: 3,
          background: "linear-gradient(135deg,rgba(17,24,39,0.1),rgba(17,24,39,0.05))",
          borderBottom: "1px solid", borderColor: "divider",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "12px",
              background: "#111827",
              display: "grid", placeItems: "center",
            }}>
              <HandymanRounded sx={{ color: "#fff" }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>
                {editLog ? "Edit Maintenance Log" : "Record Maintenance Log"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {editLog ? selectedAsset?.name : "Select an asset and describe the service"}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setLogDialogOpen(false)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}>
            <CloseRounded />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {/* Asset Selection (Disabled on Edit) */}
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                disabled={!!editLog}
                options={allAssets}
                getOptionLabel={(option) => `${option.name} (${option.category} - ${option.serialNumber || 'No Serial'})`}
                value={selectedAsset}
                onChange={(event, newValue) => {
                  setSelectedAsset(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Asset *"
                    placeholder="Search asset by name or serial..."
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" label="Service Date *" type="date"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                value={logForm.serviceDate}
                onChange={e => setLogForm(f => ({ ...f, serviceDate: e.target.value }))}
                slotProps={{
                  inputLabel: { shrink: true }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" label="Next Service Date (optional)" type="date"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                value={logForm.nextServiceDate}
                onChange={e => setLogForm(f => ({ ...f, nextServiceDate: e.target.value }))}
                slotProps={{
                  inputLabel: { shrink: true }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}>
                <InputLabel>Status *</InputLabel>
                <Select
                  value={logForm.status}
                  label="Status *"
                  onChange={e => setLogForm(f => ({ ...f, status: e.target.value }))}
                >
                  <MenuItem value="Scheduled">Scheduled</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" label="Cost (₹)" type="number"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                value={logForm.cost}
                onChange={e => setLogForm(f => ({ ...f, cost: e.target.value }))}
                onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth size="small" label="Description *" multiline rows={2}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                value={logForm.description}
                onChange={e => setLogForm(f => ({ ...f, description: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth size="small" label="Notes (optional)" multiline rows={2}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                value={logForm.notes}
                onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <Box sx={{ px: 3, pb: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {logFormError && (
            <Typography fontSize={13} fontWeight={700} color="error">{logFormError}</Typography>
          )}
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
            <Button onClick={() => setLogDialogOpen(false)} sx={{ fontWeight: 700, borderRadius: "12px" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveLog}
              disabled={submittingLog}
              sx={{
                background: "#7777C7",
                color: "#FFFFFF", fontWeight: 800, borderRadius: "12px", boxShadow: "none",
                minWidth: 120,
                '&:hover': { bgcolor: '#6464B8', boxShadow: 'none' }
              }}
            >
              {submittingLog ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : editLog ? "Save Changes" : "Record Log"}
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: '14px', fontWeight: 800 }}>{snackbar}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TechnicianPortal;
