import { useState, useEffect } from "react";
import {
  Box, CircularProgress, Grid, Paper, Stack, Typography, Chip, Button, Alert, Snackbar
} from "@mui/material";
import {
  ConfirmationNumberRounded, BuildRounded, TaskAltRounded,
  BuildCircleRounded, HandymanRounded, CheckCircleRounded
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
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, logsRes] = await Promise.all([
        api.get('/tickets'),
        api.get('/maintenance').catch(() => ({ data: [] }))
      ]);
      setTickets(ticketsRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      setError("Failed to load dashboard data.");
      console.error("Failed to load technician dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (ticketId, newStatus) => {
    try {
      await api.put(`/tickets/${ticketId}/status`, { status: newStatus });
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: newStatus } : t));
      setSnackbar(`Ticket marked as "${newStatus}"`);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
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
    { label: "My Assigned Tasks", value: myAssigned.length,      color: "#F59E0B", icon: <ConfirmationNumberRounded /> },
    { label: "In Progress",       value: inProgressRepairs.length, color: "#3B82F6", icon: <BuildCircleRounded /> },
    { label: "Resolved by Me",    value: completedRepairs.length, color: "#10B981", icon: <TaskAltRounded /> }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
        <CircularProgress sx={{ color: '#A855F7' }} />
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
              <Typography fontSize={32} fontWeight={950} lineHeight={1}>{k.value}</Typography>
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
                    <Paper key={ticket._id} sx={{ p: 2, borderRadius: '14px', border: 1, borderColor: 'divider', transition: 'all 0.2s', '&:hover': { borderColor: 'rgba(168,85,247,0.35)', transform: 'translateY(-1px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } }}>
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
            <Typography fontSize={16} fontWeight={800} mb={2.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BuildRounded sx={{ color: '#3B82F6' }} />
              Recent Maintenance Logs
            </Typography>

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
                      <Chip label={log.status || 'N/A'} size="small" sx={{ fontWeight: 800, height: 18, fontSize: 9 }} />
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

      <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: '14px', fontWeight: 800 }}>{snackbar}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TechnicianPortal;
