import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Stack,
  Chip
} from "@mui/material";
import {
  AddRounded,
  BuildRounded,
  TimelineRounded,
  CloseRounded,
  AssignmentRounded,
  CheckCircleRounded,
  PendingActionsRounded,
  DeleteOutlineRounded,
  RefreshRounded,
  SearchRounded
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

import PageHeader from "../../components/PageHeader";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const Tickets = () => {
  const { currentUser } = useAuth();
  const isAdminOrHod = currentUser?.role === 'admin' || currentUser?.role === 'hod';

  const [open, setOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [formData, setFormData] = useState({ selectedItem: "", issue: "", priority: "Medium" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const isEmployee = currentUser?.role === 'employee';
      const [ticketsRes, assetsRes] = await Promise.all([
        api.get(isEmployee ? '/tickets/mytickets' : '/tickets'),
        api.get(isEmployee ? '/assets/all-active' : '/assets'),
      ]);
      setTickets(ticketsRes.data);
      setAssets(assetsRes.data);

      if (isEmployee) {
        try {
          const dreqRes = await api.get('/device-requests/my-approved');
          setApprovedRequests(dreqRes.data);
        } catch {
          setApprovedRequests([]);
        }
      }
    } catch {
      setError("Failed to load breakdown tickets. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const itemName = ticket.asset?.name || ticket.itemLabel || ticket.deviceRequestRef?.itemRequested || '';
      const matchesSearch =
        ticket.ticketId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        itemName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { selectedItem, issue, priority } = formData;
      let payload = { issue, priority };
      if (selectedItem.startsWith('asset:')) {
        payload.assetId = selectedItem.replace('asset:', '');
      } else if (selectedItem.startsWith('dreq:')) {
        const [, id, ...labelParts] = selectedItem.split(':');
        payload.deviceRequestId = id;
        payload.itemLabel = labelParts.join(':');
      }
      await api.post('/tickets', payload);
      setSnackbarMessage("Ticket raised successfully.");
      setOpen(false);
      setFormData({ selectedItem: "", issue: "", priority: "Medium" });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (ticket) => { setSelectedTicket(ticket); setDeleteDialogOpen(true); };

  const confirmDelete = async () => {
    if (!selectedTicket) return;
    setDeleting(true);
    try {
      await api.delete(`/tickets/${selectedTicket._id}`);
      setSnackbarMessage(`Ticket ${selectedTicket.ticketId} deleted permanently.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete ticket.");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedTicket(null);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/tickets/${id}/status`, { status: newStatus });
      setTickets(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
      setSnackbarMessage(`Status updated to "${newStatus}"`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status.");
    }
  };

  const handlePriorityUpdate = async (id, newPriority) => {
    try {
      await api.put(`/tickets/${id}/priority`, { priority: newPriority });
      setTickets(prev => prev.map(t => t._id === id ? { ...t, priority: newPriority } : t));
      setSnackbarMessage(`Priority updated to "${newPriority}"`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update priority.");
    }
  };

  const handleTimelineOpen = (ticket) => { setSelectedTicket(ticket); setTimelineOpen(true); };
  const handleTimelineClose = () => { setTimelineOpen(false); setSelectedTicket(null); };

  const generateTimeline = (ticket) => {
    const isApproved = ticket.status !== "Pending Approval" && ticket.status !== "Rejected";
    const isAssigned = ["Vendor Assigned", "Under Repair", "Resolved"].includes(ticket.status);
    const isResolved = ticket.status === "Resolved";
    return [
      { title: "Ticket Raised", desc: "Issue reported to the system.", time: new Date(ticket.createdAt).toLocaleDateString(), done: true },
      { title: "System Approval", desc: ticket.status === "Rejected" ? "Ticket was rejected." : "Department HOD approval.", time: isApproved ? "Done" : (ticket.status === "Rejected" ? "Rejected" : "Pending"), done: isApproved },
      { title: "Vendor Assignment", desc: "Technician assigned for repair.", time: isAssigned ? "Done" : "Upcoming", done: isAssigned },
      { title: "Service Closure", desc: "User confirmed issue resolved.", time: isResolved ? new Date(ticket.updatedAt).toLocaleDateString() : "Pending", done: isResolved },
    ];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending Approval': return { bg: '#FEF3C7', color: '#D97706' };
      case 'Vendor Assigned': return { bg: '#E0F2FE', color: '#0284C7' };
      case 'Under Repair': return { bg: '#F3E8FF', color: '#9333EA' };
      case 'Resolved': return { bg: '#DCFCE7', color: '#16A34A' };
      case 'Rejected': return { bg: '#FEE2E2', color: '#DC2626' };
      default: return { bg: '#F1F5F9', color: '#475569' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' };
      case 'High': return { bg: '#FFF7ED', color: '#EA580C', border: '#FDBA74' };
      case 'Medium': return { bg: '#F0FDF4', color: '#16A34A', border: '#86EFAC' };
      case 'Low': return { bg: '#F8FAFC', color: '#64748B', border: '#CBD5E1' };
      default: return { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
    }
  };

  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px", fontWeight: 600,
      "& fieldset": { borderColor: "divider" },
      "&:hover fieldset": { borderColor: "text.disabled" },
      "&.Mui-focused fieldset": { borderColor: "#0F766E", borderWidth: "2px" },
    },
    "& .MuiInputLabel-root": { fontWeight: 700 },
    "& .MuiInputLabel-root.Mui-focused": { color: "#0F766E" },
  };

  const selectSx = {
    fontSize: '12px', fontWeight: 700, height: '32px',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
    '& .MuiSelect-select': { py: '6px', pl: '10px', pr: '28px !important' },
    borderRadius: '8px',
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } };

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="Breakdown Tickets"
        subtitle="Raise issues, track service activity, and view repair lifecycles across the organization."
        action={
          <Box display="flex" gap={2}>
            <Tooltip title="Refresh Data">
              <IconButton
                onClick={fetchData}
                sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: "12px", transition: "all 0.2s", "&:hover": { bgcolor: "action.hover", transform: "rotate(180deg)" } }}
              >
                <RefreshRounded />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={() => setOpen(true)}
              sx={{
                background: "linear-gradient(135deg, #1E3A8A, #0F766E)",
                color: "#ffffff", fontWeight: 800, textTransform: "none", px: 3, py: 1.2, borderRadius: "12px",
                boxShadow: "0 10px 22px rgba(15,118,110,0.28)",
                "&:hover": { transform: "translateY(-2px)", boxShadow: "0 16px 28px rgba(15,118,110,0.36)", background: "linear-gradient(135deg, #1D4ED8, #0D9488)" },
              }}
            >
              Raise Ticket
            </Button>
          </Box>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: "12px", fontWeight: 600 }}>{error}</Alert>}

      <Paper sx={{ p: 2.5, borderRadius: "20px", mb: 4, bgcolor: "background.paper", border: 1, borderColor: "divider" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth sx={inputStyles}
              placeholder="Search by Ticket ID or Asset Name..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchRounded sx={{ color: "text.disabled", mr: 1 }} /> }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth select sx={inputStyles} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="Pending Approval">Pending Approval</MenuItem>
              <MenuItem value="Vendor Assigned">Vendor Assigned</MenuItem>
              <MenuItem value="Under Repair">Under Repair</MenuItem>
              <MenuItem value="Resolved">Resolved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="outlined" onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}
              sx={{ height: "56px", borderColor: "divider", color: "text.secondary", borderRadius: "12px", fontWeight: 700, textTransform: "none", "&:hover": { bgcolor: "action.hover" } }}>
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress sx={{ color: "#0F766E" }} />
        </Box>
      ) : filteredTickets.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center", borderRadius: "24px", bgcolor: "background.paper", border: "1px dashed", borderColor: "divider" }}>
          <AssignmentRounded sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
          <Typography color="text.primary" fontWeight={800} fontSize="18px">No Tickets Found</Typography>
          <Typography color="text.secondary" fontWeight={500} fontSize="15px" mt={1}>There are no breakdown tickets matching your current criteria.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
          <AnimatePresence>
            {filteredTickets.map((ticket) => (
              <Grid item xs={12} md={6} lg={4} key={ticket._id} component={motion.div} variants={itemVariants} layout exit={{ opacity: 0, scale: 0.9 }}>
                <Paper
                  sx={{
                    p: 3.5, borderRadius: "24px", height: "100%", bgcolor: "background.paper", border: 1, borderColor: "divider",
                    borderTop: `6px solid ${getStatusColor(ticket.status).color}`,
                    display: "flex", flexDirection: "column",
                    transition: "all 0.3s ease", position: "relative",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
                      "& .delete-btn": { opacity: 1, visibility: "visible" }
                    },
                  }}
                >
                  {isAdminOrHod && (
                    <Tooltip title="Delete Ticket">
                      <IconButton
                        className="delete-btn"
                        onClick={() => handleDeleteClick(ticket)}
                        sx={{ position: "absolute", top: 12, right: 12, opacity: 0, visibility: "hidden", transition: "all 0.2s", "&:hover": { color: "#EF4444", bgcolor: "#FEF2F2" } }}
                      >
                        <DeleteOutlineRounded />
                      </IconButton>
                    </Tooltip>
                  )}

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: "action.selected", color: "text.secondary", display: "grid", placeItems: "center" }}>
                      <BuildRounded sx={{ fontSize: 22 }} />
                    </Box>
                    <Box>
                      <Typography color="text.primary" fontSize={18} fontWeight={900} letterSpacing="-0.5px" sx={{ lineHeight: 1.2 }}>
                        {ticket.asset?.name || ticket.itemLabel || ticket.deviceRequestRef?.itemRequested || "Unknown Asset"}
                      </Typography>
                      <Typography color="text.secondary" fontSize={13} fontWeight={600}>
                        {ticket.ticketId} • {new Date(ticket.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography sx={{ mt: 1, fontSize: "15px", color: "text.secondary", flex: 1, lineHeight: 1.6, fontWeight: 500 }}>
                    "{ticket.issue}"
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 3, mb: 2 }}>
                    <Chip label={ticket.status} size="small"
                      sx={{ bgcolor: getStatusColor(ticket.status).bg, color: getStatusColor(ticket.status).color, fontWeight: 800, borderRadius: "8px" }}
                    />
                    <Chip label={`${ticket.priority} Priority`} size="small" variant="outlined"
                      sx={{ bgcolor: getPriorityColor(ticket.priority).bg, color: getPriorityColor(ticket.priority).color, borderColor: getPriorityColor(ticket.priority).border, fontWeight: 800, borderRadius: "8px" }}
                    />
                  </Box>

                  {isAdminOrHod && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: '12px', border: 1, borderColor: 'divider' }}>
                      <Select size="small" value={ticket.status} onChange={(e) => handleStatusUpdate(ticket._id, e.target.value)} sx={{ ...selectSx, flex: 1 }}>
                        <MenuItem value="Pending Approval" sx={{ fontSize: '12px', fontWeight: 700 }}>Pending Approval</MenuItem>
                        <MenuItem value="Vendor Assigned" sx={{ fontSize: '12px', fontWeight: 700 }}>Vendor Assigned</MenuItem>
                        <MenuItem value="Under Repair" sx={{ fontSize: '12px', fontWeight: 700 }}>Under Repair</MenuItem>
                        <MenuItem value="Resolved" sx={{ fontSize: '12px', fontWeight: 700 }}>Resolved</MenuItem>
                        <MenuItem value="Rejected" sx={{ fontSize: '12px', fontWeight: 700 }}>Rejected</MenuItem>
                      </Select>
                      <Select size="small" value={ticket.priority} onChange={(e) => handlePriorityUpdate(ticket._id, e.target.value)} sx={{ ...selectSx, flex: 1 }}>
                        <MenuItem value="Low" sx={{ fontSize: '12px', fontWeight: 700 }}>Low</MenuItem>
                        <MenuItem value="Medium" sx={{ fontSize: '12px', fontWeight: 700 }}>Medium</MenuItem>
                        <MenuItem value="High" sx={{ fontSize: '12px', fontWeight: 700 }}>High</MenuItem>
                        <MenuItem value="Critical" sx={{ fontSize: '12px', fontWeight: 700, color: '#DC2626' }}>Critical</MenuItem>
                      </Select>
                    </Box>
                  )}

                  <Divider sx={{ mb: 2, borderColor: "divider" }} />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                      Raised by: <span style={{ fontWeight: 800 }}>{ticket.raisedBy?.name || "System"}</span>
                    </Typography>
                    <Button
                      variant="text" endIcon={<TimelineRounded />}
                      onClick={() => handleTimelineOpen(ticket)}
                      sx={{ color: "#0F766E", fontWeight: 800, textTransform: "none", p: 0, "&:hover": { background: "none", color: "#0D9488", textDecoration: "underline" } }}
                    >
                      Timeline
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      {/* Raise Ticket Dialog */}
      <Dialog
        open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: "28px", overflow: "hidden" } }}
        BackdropProps={{ sx: { backgroundColor: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" } }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ p: 3.5, display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box sx={{ width: 54, height: 54, borderRadius: "16px", background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <AssignmentRounded />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, fontSize: "24px", color: "text.primary" }}>Raise Breakdown Ticket</Typography>
              <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: "14px", fontWeight: 600, lineHeight: 1.5 }}>
                Select an asset and detail the issue to create a new service request.
              </Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)} sx={{ bgcolor: "action.hover" }}><CloseRounded /></IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmitTicket}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", mb: 1, display: "block", textTransform: "uppercase" }}>Select Asset / Approved Device</Typography>
                <TextField fullWidth select required sx={inputStyles} name="selectedItem" value={formData.selectedItem} onChange={handleInputChange}>
                  {assets.length === 0 && approvedRequests.length === 0 && (
                    <MenuItem disabled value="">No assets available</MenuItem>
                  )}
                  {assets.length > 0 && [
                    <MenuItem key="__assets_header" disabled sx={{ fontSize: "11px", fontWeight: 900, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.6px", pt: 1 }}>
                      — Registered Assets —
                    </MenuItem>,
                    ...assets.map(asset => (
                      <MenuItem key={asset._id} value={`asset:${asset._id}`} sx={{ fontWeight: 600 }}>
                        {asset.name} <span style={{ marginLeft: 6 }}>(SN: {asset.serialNumber})</span>
                      </MenuItem>
                    ))
                  ]}
                  {approvedRequests.length > 0 && [
                    <MenuItem key="__dreq_header" disabled sx={{ fontSize: "11px", fontWeight: 900, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.6px", pt: 1 }}>
                      — Approved Device Requests —
                    </MenuItem>,
                    ...approvedRequests.map(req => (
                      <MenuItem key={req._id} value={`dreq:${req._id}:${req.itemRequested}`} sx={{ fontWeight: 600 }}>
                        {req.itemRequested} <span style={{ color: "#16A34A", marginLeft: 6, fontSize: "12px" }}>({req.requestId})</span>
                      </MenuItem>
                    ))
                  ]}
                </TextField>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", mb: 1, display: "block", textTransform: "uppercase" }}>Issue Description</Typography>
                <TextField fullWidth required sx={inputStyles} multiline rows={4} name="issue" value={formData.issue} onChange={handleInputChange} placeholder="Describe the breakdown details clearly..." />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", mb: 1, display: "block", textTransform: "uppercase" }}>Severity Level</Typography>
                <TextField fullWidth select required sx={inputStyles} name="priority" value={formData.priority} onChange={handleInputChange}>
                  <MenuItem value="Low" sx={{ fontWeight: 600 }}>Low</MenuItem>
                  <MenuItem value="Medium" sx={{ fontWeight: 600 }}>Medium</MenuItem>
                  <MenuItem value="High" sx={{ fontWeight: 600 }}>High</MenuItem>
                  <MenuItem value="Critical" sx={{ fontWeight: 600, color: "#DC2626" }}>Critical</MenuItem>
                </TextField>
              </Box>
            </Stack>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 5, pt: 3, borderTop: 1, borderColor: "divider" }}>
              <Button onClick={() => setOpen(false)} sx={{ color: "text.secondary", fontWeight: 800, textTransform: "none", px: 3 }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", fontWeight: 900, textTransform: "none", px: 4, py: 1.2, borderRadius: "12px", boxShadow: "0 8px 20px rgba(15,118,110,0.25)" }}>
                {submitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: "24px", p: 2, maxWidth: "400px" } }}>
        <DialogTitle sx={{ fontWeight: 900, color: "text.primary", pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "#FEE2E2", color: "#DC2626", display: "grid", placeItems: "center" }}><DeleteOutlineRounded /></Box>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" fontWeight={600} lineHeight={1.6}>
            Are you sure you want to permanently delete ticket <strong>{selectedTicket?.ticketId}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: "text.secondary", fontWeight: 800, textTransform: "none", borderRadius: "10px" }}>Cancel</Button>
          <Button onClick={confirmDelete} disabled={deleting} variant="contained"
            sx={{ bgcolor: "#EF4444", color: "#fff", fontWeight: 800, textTransform: "none", borderRadius: "10px", "&:hover": { bgcolor: "#DC2626" } }}>
            {deleting ? "Deleting..." : "Permanently Delete"}
          </Button>
        </Box>
      </Dialog>

      {/* Timeline Dialog */}
      <Dialog open={timelineOpen} onClose={handleTimelineClose} fullWidth maxWidth="md"
        PaperProps={{ sx: { bgcolor: "background.paper", borderRadius: "28px", border: 1, borderColor: "divider", overflow: "hidden" } }}
        BackdropProps={{ sx: { backgroundColor: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" } }}>
        {selectedTicket && (
          <>
            <DialogTitle sx={{ p: 0 }}>
              <Box sx={{ p: 3.5, display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: "16px", background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", display: "grid", placeItems: "center", flexShrink: 0 }}><TimelineRounded /></Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: "24px", color: "text.primary" }}>Ticket Timeline</Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: "14px", fontWeight: 700, mt: 0.5 }}>{selectedTicket.ticketId} • {selectedTicket.asset?.name || selectedTicket.itemLabel || selectedTicket.deviceRequestRef?.itemRequested || "Unknown Asset"}</Typography>
                </Box>
                <IconButton onClick={handleTimelineClose} sx={{ bgcolor: "action.hover" }}><CloseRounded /></IconButton>
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {[
                  ["Status", selectedTicket.status, getStatusColor(selectedTicket.status).color],
                  ["Priority", selectedTicket.priority, getPriorityColor(selectedTicket.priority).color],
                  ["Department", selectedTicket.asset?.department || selectedTicket.raisedBy?.department || "N/A", null],
                  ["Raised By", selectedTicket.raisedBy?.name || currentUser?.name || "—", null],
                ].map(([label, value, color]) => (
                  <Grid item xs={6} md={3} key={label}>
                    <Box sx={{ p: 2, borderRadius: "16px", bgcolor: "background.default", border: 1, borderColor: "divider" }}>
                      <Typography fontSize="12px" color="text.secondary" fontWeight={800} textTransform="uppercase">{label}</Typography>
                      <Typography mt={0.5} color={color || "text.primary"} fontWeight={900}>{value}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <Box>
                {generateTimeline(selectedTicket).map((step, index) => (
                  <Box key={step.title} sx={{ display: "flex", gap: 2.5, position: "relative", pb: index === 3 ? 0 : 4 }}>
                    {index !== 3 && <Box sx={{ position: "absolute", left: "22px", top: "48px", bottom: 0, width: "2px", bgcolor: step.done ? "#0F766E" : "divider" }} />}
                    <Box sx={{ width: 46, height: 46, borderRadius: "50%", bgcolor: step.done ? "#F0FDFA" : "background.default", color: step.done ? "#0F766E" : "text.disabled", display: "grid", placeItems: "center", flexShrink: 0, border: step.done ? "2px solid #0F766E" : "2px solid", borderColor: step.done ? "#0F766E" : "divider", zIndex: 1 }}>
                      {step.done ? <CheckCircleRounded /> : <PendingActionsRounded />}
                    </Box>
                    <Box sx={{ pt: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography sx={{ fontWeight: 900, color: step.done ? "text.primary" : "text.secondary", fontSize: "16px" }}>{step.title}</Typography>
                        <Typography sx={{ fontSize: "13px", color: step.done ? "#0F766E" : "text.disabled", fontWeight: 800, bgcolor: step.done ? "#F0FDFA" : "background.default", px: 1.5, py: 0.5, borderRadius: "6px" }}>{step.time}</Typography>
                      </Box>
                      <Typography sx={{ color: "text.secondary", fontWeight: 600, mt: 0.5, fontSize: "15px" }}>{step.desc}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Snackbar open={!!snackbarMessage} autoHideDuration={4000} onClose={() => setSnackbarMessage("")} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" sx={{ bgcolor: "#0F766E", color: "#FFFFFF", borderRadius: "14px", fontWeight: 800 }}>{snackbarMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Tickets;
