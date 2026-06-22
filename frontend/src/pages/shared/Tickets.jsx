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

const Tickets = () => {
  // UI State
  const [open, setOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Data & Filter State
  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Form State
  const [formData, setFormData] = useState({
    assetId: "",
    issue: "",
    priority: "Medium",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, assetsRes] = await Promise.all([
        api.get('/tickets'),
        api.get('/assets')
      ]);
      setTickets(ticketsRes.data);
      setAssets(assetsRes.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load breakdown tickets. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch = 
        ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.asset?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.post('/tickets', formData);
      setSnackbarMessage("Ticket raised successfully.");
      setOpen(false);
      setFormData({ assetId: "", issue: "", priority: "Medium" });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (ticket) => {
    setSelectedTicket(ticket);
    setDeleteDialogOpen(true);
  };

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

  const handleTimelineOpen = (ticket) => {
    setSelectedTicket(ticket);
    setTimelineOpen(true);
  };

  const handleTimelineClose = () => {
    setTimelineOpen(false);
    setSelectedTicket(null);
  };

  const generateTimeline = (ticket) => {
    const isApproved = ticket.status !== "Pending Approval" && ticket.status !== "Rejected";
    const isAssigned = ticket.status === "Vendor Assigned" || ticket.status === "Under Repair" || ticket.status === "Resolved";
    const isResolved = ticket.status === "Resolved";

    return [
      { title: "Ticket Raised", desc: "Issue reported to the system.", time: new Date(ticket.createdAt).toLocaleDateString(), done: true },
      { title: "System Approval", desc: ticket.status === "Rejected" ? "Ticket was rejected." : "Department HOD approval.", time: isApproved ? "Done" : (ticket.status === "Rejected" ? "Rejected" : "Pending"), done: isApproved },
      { title: "Vendor Assignment", desc: "Technician assigned for repair.", time: isAssigned ? "Done" : "Upcoming", done: isAssigned },
      { title: "Service Closure", desc: "User confirmed issue resolved.", time: isResolved ? new Date(ticket.updatedAt).toLocaleDateString() : "Pending", done: isResolved },
    ];
  };

  // Dynamic Status Color Helper
  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending Approval': return { bg: '#FEF3C7', color: '#D97706' }; // Amber
      case 'Vendor Assigned': return { bg: '#E0F2FE', color: '#0284C7' }; // Blue
      case 'Under Repair': return { bg: '#F3E8FF', color: '#9333EA' }; // Purple
      case 'Resolved': return { bg: '#DCFCE7', color: '#16A34A' }; // Green
      case 'Rejected': return { bg: '#FEE2E2', color: '#DC2626' }; // Red
      default: return { bg: '#F1F5F9', color: '#475569' }; // Gray
    }
  };

  // Dynamic Priority Color Helper
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Critical': return { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' };
      case 'High': return { bg: '#FFF7ED', color: '#EA580C', border: '#FDBA74' };
      case 'Medium': return { bg: '#F0FDF4', color: '#16A34A', border: '#86EFAC' };
      case 'Low': return { bg: '#F8FAFC', color: '#64748B', border: '#CBD5E1' };
      default: return { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
    }
  };

  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#F8FAFC", color: "#0F172A", borderRadius: "12px", fontWeight: 600,
      "& fieldset": { borderColor: "#E2E8F0" },
      "&:hover fieldset": { borderColor: "#CBD5E1" },
      "&.Mui-focused fieldset": { borderColor: "#0F766E", borderWidth: "2px" },
    },
    "& .MuiInputLabel-root": { color: "#64748B", fontWeight: 700 },
    "& .MuiInputLabel-root.Mui-focused": { color: "#0F766E" },
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
                sx={{ bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", transition: "all 0.2s", "&:hover": { bgcolor: "#F8FAFC", transform: "rotate(180deg)" } }}
              >
                <RefreshRounded sx={{ color: "#0F172A" }} />
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

      {/* Sleek Filter Bar */}
      <Paper sx={{ p: 2.5, borderRadius: "20px", mb: 4, bgcolor: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(15, 23, 42, 0.03)" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              sx={inputStyles} 
              placeholder="Search by Ticket ID or Asset Name..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              InputProps={{ startAdornment: <SearchRounded sx={{ color: "#94A3B8", mr: 1 }} /> }}
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
            <Button fullWidth variant="outlined" onClick={() => { setSearchQuery(""); setStatusFilter("All"); }} sx={{ height: "56px", borderColor: "#e2e8f0", color: "#64748b", borderRadius: "12px", fontWeight: 700, textTransform: "none", "&:hover": { bgcolor: "#F1F5F9", borderColor: "#CBD5E1" } }}>
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
        <Paper sx={{ p: 6, textAlign: "center", borderRadius: "24px", bgcolor: "#ffffff", border: "1px dashed #CBD5E1" }}>
          <AssignmentRounded sx={{ fontSize: 60, color: "#E2E8F0", mb: 2 }} />
          <Typography color="#0F172A" fontWeight={800} fontSize="18px">No Tickets Found</Typography>
          <Typography color="#64748b" fontWeight={500} fontSize="15px" mt={1}>There are no breakdown tickets matching your current criteria.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
          <AnimatePresence>
            {filteredTickets.map((ticket) => (
              <Grid item xs={12} md={6} lg={4} key={ticket._id} component={motion.div} variants={itemVariants} layout exit={{ opacity: 0, scale: 0.9 }}>
                <Paper
                  sx={{
                    p: 3.5, borderRadius: "24px", height: "100%", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0",
                    borderTop: `6px solid ${getStatusColor(ticket.status).color}`, // Top accent border
                    boxShadow: "0 10px 30px rgba(15,23,42,0.04)", display: "flex", flexDirection: "column", transition: "all 0.3s ease",
                    position: "relative",
                    "&:hover": { 
                      transform: "translateY(-6px)", 
                      boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
                      "& .delete-btn": { opacity: 1, visibility: "visible" } // Show delete button on hover
                    },
                  }}
                >
                  {/* Delete Button - Appears on Hover */}
                  <Tooltip title="Delete Ticket">
                    <IconButton 
                      className="delete-btn"
                      onClick={() => handleDeleteClick(ticket)} 
                      sx={{ position: "absolute", top: 12, right: 12, color: "#94A3B8", opacity: 0, visibility: "hidden", transition: "all 0.2s", "&:hover": { color: "#EF4444", bgcolor: "#FEF2F2" } }}
                    >
                      <DeleteOutlineRounded />
                    </IconButton>
                  </Tooltip>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "#F1F5F9", color: "#475569", display: "grid", placeItems: "center" }}>
                        <BuildRounded sx={{ fontSize: 22 }} />
                      </Box>
                      <Box>
                        <Typography color="#0F172A" fontSize={18} fontWeight={900} letterSpacing="-0.5px" sx={{ lineHeight: 1.2, color:'black' }}>
                          {ticket.asset?.name || "Unknown Asset"}
                        </Typography>
                        <Typography color="#64748B" fontSize={13} fontWeight={600} sx={{color:'black'}}>
                          {ticket.ticketId} • {new Date(ticket.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Typography sx={{ mt: 1, fontSize: "15px", color: "#334155", flex: 1, lineHeight: 1.6, fontWeight: 500 }}>
                    "{ticket.issue}"
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 3, mb: 3 }}>
                    <Chip 
                      label={ticket.status} 
                      size="small" 
                      sx={{ bgcolor: getStatusColor(ticket.status).bg, color: getStatusColor(ticket.status).color, fontWeight: 800, borderRadius: "8px" }} 
                    />
                    <Chip 
                      label={`${ticket.priority} Priority`}
                      size="small" 
                      variant="outlined"
                      sx={{ bgcolor: getPriorityColor(ticket.priority).bg, color: getPriorityColor(ticket.priority).color, borderColor: getPriorityColor(ticket.priority).border, fontWeight: 800, borderRadius: "8px" }} 
                    />
                  </Box>

                  <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography fontSize={12} color="#64748B" fontWeight={600}>
                      Raised by: <span style={{ color: "#0F172A", fontWeight: 800 }}>{ticket.raisedBy?.name || "System"}</span>
                    </Typography>
                    <Button
                      variant="text"
                      endIcon={<TimelineRounded />}
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

      {/* --- Raise Ticket Dialog --- */}
      {/* FIXED: Removed Grid, using Stack to prevent horizontal squishing */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        fullWidth 
        maxWidth="sm" 
        PaperProps={{ sx: { bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "28px", boxShadow: "0 28px 70px rgba(15,23,42,0.22)", overflow: "hidden" } }} 
        BackdropProps={{ sx: { backgroundColor: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" } }}
      >
        <DialogTitle sx={{ p: 0, background: "linear-gradient(135deg, #F8FAFC, #FFFFFF)" }}>
          <Box sx={{ p: 3.5, display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box sx={{ width: 54, height: 54, borderRadius: "16px", background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <AssignmentRounded />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 950, fontSize: "24px", color: "#0F172A" }}>Raise Breakdown Ticket</Typography>
              <Typography sx={{ mt: 0.5, color: "#64748B", fontSize: "14px", fontWeight: 600, lineHeight: 1.5 }}>
                Select an asset and detail the issue to create a new service request.
              </Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)} sx={{ bgcolor: "#F1F5F9" }}><CloseRounded /></IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 4, bgcolor: "#FFFFFF" }}>
          <form onSubmit={handleSubmitTicket}>
            {/* FIXED LAYOUT: Vertical Stack instead of Grid */}
            <Stack spacing={3}>
              
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748B", mb: 1, display: "block", textTransform: "uppercase" }}>Select Hardware Asset</Typography>
                <TextField fullWidth select required sx={inputStyles} name="assetId" value={formData.assetId} onChange={handleInputChange}>
                  {assets.length === 0 && <MenuItem disabled value="">No assets available</MenuItem>}
                  {assets.map(asset => (<MenuItem key={asset._id} value={asset._id} sx={{ fontWeight: 600 }}>{asset.name} (SN: {asset.serialNumber})</MenuItem>))}
                </TextField>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748B", mb: 1, display: "block", textTransform: "uppercase" }}>Issue Description</Typography>
                <TextField fullWidth required sx={inputStyles} multiline rows={4} name="issue" value={formData.issue} onChange={handleInputChange} placeholder="Describe the breakdown details clearly..." />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748B", mb: 1, display: "block", textTransform: "uppercase" }}>Severity Level</Typography>
                <TextField fullWidth select required sx={inputStyles} name="priority" value={formData.priority} onChange={handleInputChange}>
                  <MenuItem value="Low" sx={{ fontWeight: 600 }}>Low</MenuItem>
                  <MenuItem value="Medium" sx={{ fontWeight: 600 }}>Medium</MenuItem>
                  <MenuItem value="High" sx={{ fontWeight: 600 }}>High</MenuItem>
                  <MenuItem value="Critical" sx={{ fontWeight: 600, color: "#DC2626" }}>Critical</MenuItem>
                </TextField>
              </Box>

            </Stack>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 5, pt: 3, borderTop: "1px solid #F1F5F9" }}>
              <Button onClick={() => setOpen(false)} sx={{ color: "#64748B", fontWeight: 800, textTransform: "none", px: 3 }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null} sx={{ background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", fontWeight: 900, textTransform: "none", px: 4, py: 1.2, borderRadius: "12px", boxShadow: "0 8px 20px rgba(15,118,110,0.25)" }}>
                {submitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Delete Confirmation Dialog --- */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: "24px", p: 2, maxWidth: "400px", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" } }}>
        <DialogTitle sx={{ fontWeight: 900, color: "#0F172A", pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "#FEE2E2", color: "#DC2626", display: "grid", placeItems: "center" }}><DeleteOutlineRounded /></Box>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography color="#475569" fontWeight={600} lineHeight={1.6}>
            Are you sure you want to permanently delete ticket <strong style={{ color: "#0F172A" }}>{selectedTicket?.ticketId}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: "#64748B", fontWeight: 800, textTransform: "none", borderRadius: "10px" }}>Cancel</Button>
          <Button onClick={confirmDelete} disabled={deleting} variant="contained" sx={{ bgcolor: "#EF4444", color: "#fff", fontWeight: 800, textTransform: "none", borderRadius: "10px", boxShadow: "0 6px 15px rgba(239, 68, 68, 0.3)", "&:hover": { bgcolor: "#DC2626" } }}>
            {deleting ? "Deleting..." : "Permanently Delete"}
          </Button>
        </Box>
      </Dialog>

      {/* --- Timeline Dialog --- */}
      <Dialog open={timelineOpen} onClose={handleTimelineClose} fullWidth maxWidth="md" PaperProps={{ sx: { bgcolor: "#FFFFFF", borderRadius: "28px", border: "1px solid #E2E8F0", boxShadow: "0 28px 70px rgba(15,23,42,0.25)", overflow: "hidden" } }} BackdropProps={{ sx: { backgroundColor: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" } }}>
        {selectedTicket && (
          <>
            <DialogTitle sx={{ p: 0, background: "linear-gradient(135deg, #F8FAFC, #FFFFFF)" }}>
              <Box sx={{ p: 3.5, display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: "16px", background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", display: "grid", placeItems: "center", flexShrink: 0 }}><TimelineRounded /></Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 950, fontSize: "24px", color: "#0F172A" }}>Ticket Timeline</Typography>
                  <Typography sx={{ color: "#64748B", fontSize: "14px", fontWeight: 700, mt: 0.5 }}>{selectedTicket.ticketId} • {selectedTicket.asset?.name || "Unknown Asset"}</Typography>
                </Box>
                <IconButton onClick={handleTimelineClose} sx={{ bgcolor: "#F1F5F9" }}><CloseRounded /></IconButton>
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: { xs: 2.5, md: 4 } }}>
              
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ p: 2, borderRadius: "16px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <Typography fontSize="12px" color="#64748B" fontWeight={800} textTransform="uppercase">Status</Typography>
                    <Typography mt={0.5} color={getStatusColor(selectedTicket.status).color} fontWeight={900}>{selectedTicket.status}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ p: 2, borderRadius: "16px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <Typography fontSize="12px" color="#64748B" fontWeight={800} textTransform="uppercase">Priority</Typography>
                    <Typography mt={0.5} color={getPriorityColor(selectedTicket.priority).color} fontWeight={900}>{selectedTicket.priority}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ p: 2, borderRadius: "16px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <Typography fontSize="12px" color="#64748B" fontWeight={800} textTransform="uppercase">Department</Typography>
                    <Typography mt={0.5} color="#0F172A" fontWeight={900}>{selectedTicket.asset?.department || "N/A"}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ p: 2, borderRadius: "16px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <Typography fontSize="12px" color="#64748B" fontWeight={800} textTransform="uppercase">Raised By</Typography>
                    <Typography mt={0.5} color="#0F172A" fontWeight={900}>{selectedTicket.raisedBy?.name || "System"}</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box>
                {generateTimeline(selectedTicket).map((step, index) => (
                  <Box key={step.title} sx={{ display: "flex", gap: 2.5, position: "relative", pb: index === 3 ? 0 : 4 }}>
                    {index !== 3 && <Box sx={{ position: "absolute", left: "22px", top: "48px", bottom: 0, width: "2px", bgcolor: step.done ? "#0F766E" : "#E2E8F0" }} />}
                    <Box sx={{ width: 46, height: 46, borderRadius: "50%", bgcolor: step.done ? "#F0FDFA" : "#F8FAFC", color: step.done ? "#0F766E" : "#94A3B8", display: "grid", placeItems: "center", flexShrink: 0, border: step.done ? "2px solid #0F766E" : "2px solid #E2E8F0", zIndex: 1, boxShadow: step.done ? "0 0 0 4px rgba(15,118,110,0.1)" : "none" }}>
                      {step.done ? <CheckCircleRounded /> : <PendingActionsRounded />}
                    </Box>
                    <Box sx={{ pt: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography sx={{ fontWeight: 900, color: step.done ? "#0F172A" : "#64748B", fontSize: "16px" }}>{step.title}</Typography>
                        <Typography sx={{ fontSize: "13px", color: step.done ? "#0F766E" : "#94A3B8", fontWeight: 800, bgcolor: step.done ? "#F0FDFA" : "#F1F5F9", px: 1.5, py: 0.5, borderRadius: "6px" }}>{step.time}</Typography>
                      </Box>
                      <Typography sx={{ color: "#64748B", fontWeight: 600, mt: 0.5, fontSize: "15px" }}>{step.desc}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Snackbar open={!!snackbarMessage} autoHideDuration={4000} onClose={() => setSnackbarMessage("")} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" sx={{ bgcolor: "#0F766E", color: "#FFFFFF", borderRadius: "14px", fontWeight: 800, boxShadow: "0 10px 30px rgba(15,118,110,0.3)" }}>{snackbarMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Tickets;