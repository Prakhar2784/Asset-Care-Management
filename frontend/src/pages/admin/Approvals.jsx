import React, { useState, useEffect } from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  Snackbar,
  Alert,
  TextField,
  Typography,
  CircularProgress,
  Grid
} from "@mui/material";
import {
  CheckRounded,
  CloseRounded,
  VerifiedRounded,
  CancelRounded,
  AccessTimeRounded,
  CheckCircleRounded,
  HourglassEmptyRounded,
  ThumbDownRounded,
} from "@mui/icons-material";
import StatusChip from "../../components/StatusChip";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const Approvals = () => {
  const { currentUser } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const [error, setError] = useState(null);

  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionType, setActionType] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch {
      setError("Failed to load repair authorizations.");
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleTicketActionClick = (item, type) => {
    setSelectedApproval(item);
    setActionType(type);
    setInputVal("");
    setDialogOpen(true);
  };

  const handleConfirmTicketAction = async () => {
    setProcessing(true);
    const newStatus = actionType === "authorize" ? "Vendor Assigned" : "Rejected";
    try {
      await api.put(`/tickets/${selectedApproval._id}/status`, {
        status: newStatus,
        estimatedCost: actionType === "authorize" && inputVal ? Number(inputVal) : 0
      });
      setSnackbar({
        open: true,
        severity: actionType === "authorize" ? "success" : "error",
        message: actionType === "authorize"
          ? `${selectedApproval.ticketId} authorized successfully.`
          : `${selectedApproval.ticketId} rejected.`,
      });
      setDialogOpen(false);
      setSelectedApproval(null);
      setInputVal("");
      fetchTickets();
    } catch (err) {
      setSnackbar({ open: true, severity: "error", message: err.response?.data?.message || "Failed to process request." });
    } finally {
      setProcessing(false);
    }
  };

  const getTicketDisplayStatus = (status) => {
    if (status === "Pending Approval") return "Pending";
    if (status === "Rejected") return "Rejected";
    return "Authorized";
  };

  const getStatusStyle = (status) => {
    if (status === "Authorized" || status === "Approved") {
      return { icon: <VerifiedRounded />, bg: "rgba(22,163,74,0.10)", color: "#16a34a", border: "rgba(22,163,74,0.25)" };
    }
    if (status === "Rejected") {
      return { icon: <CancelRounded />, bg: "rgba(220,38,38,0.10)", color: "#DC2626", border: "rgba(220,38,38,0.25)" };
    }
    if (status === "Under Review") {
      return { icon: <AccessTimeRounded />, bg: "rgba(217,119,6,0.10)", color: "#D97706", border: "rgba(217,119,6,0.25)" };
    }
    return { icon: <AccessTimeRounded />, bg: "rgba(245,158,11,0.12)", color: "#D97706", border: "rgba(245,158,11,0.25)" };
  };

  const priorityBorderColor = (priority) => {
    if (priority === "High" || priority === "Critical") return "#EF4444";
    if (priority === "Medium") return "#F59E0B";
    return "#22C55E";
  };

  const ticketPendingCount = tickets.filter(t => getTicketDisplayStatus(t.status) === "Pending").length;
  const ticketAuthorizedCount = tickets.filter(t => getTicketDisplayStatus(t.status) === "Authorized").length;
  const ticketRejectedCount = tickets.filter(t => getTicketDisplayStatus(t.status) === "Rejected").length;

  const ticketKpis = [
    { label: "Pending Approval", value: ticketPendingCount, color: "#F59E0B", icon: <HourglassEmptyRounded fontSize="small" /> },
    { label: "Authorized", value: ticketAuthorizedCount, color: "#22C55E", icon: <CheckCircleRounded fontSize="small" /> },
    { label: "Rejected", value: ticketRejectedCount, color: "#EF4444", icon: <ThumbDownRounded fontSize="small" /> },
  ];

  const cardSx = {
    p: { xs: 2.5, md: 3 },
    borderRadius: "16px",
    bgcolor: "background.paper",
    border: "1px solid",
    borderColor: "divider",
    display: "flex",
    alignItems: { xs: "flex-start", md: "center" },
    justifyContent: "space-between",
    gap: 3,
    flexDirection: { xs: "column", lg: "row" },
    transition: "all 0.25s ease",
    position: "relative",
    overflow: "hidden",
    "&:hover": { borderColor: "rgba(168,85,247,0.30)", transform: "translateY(-2px)", boxShadow: "0 12px 32px rgba(124,58,237,0.10)" },
  };

  const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: "12px" } };

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: "rgba(124,58,237,0.12)" }}>
            <CheckCircleRounded sx={{ color: "#A855F7" }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Pending Authorizations</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Review and authorize repair ticket costs before technician assignment</Typography>
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px", fontWeight: 600 }}>{error}</Alert>}

      <>
          {/* KPI Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {ticketKpis.map(k => (
              <Grid size={{ xs: 12, sm: 4 }} key={k.label}>
                <Paper sx={{ p: 2.5, borderRadius: "16px", border: 1, borderColor: "divider", position: "relative", overflow: "hidden" }}>
                  <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: k.color }} />
                  <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: `${k.color}18`, display: "grid", placeItems: "center", mb: 1.5 }}>
                    <Box sx={{ color: k.color }}>{k.icon}</Box>
                  </Box>
                  <Typography fontSize={28} fontWeight={950} color="text.primary" lineHeight={1} letterSpacing="-1px">{k.value}</Typography>
                  <Typography fontSize={13} fontWeight={700} color="text.primary" mt={0.3}>{k.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {ticketsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "30vh" }}>
              <CircularProgress sx={{ color: "#A855F7" }} />
            </Box>
          ) : tickets.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: "center", borderRadius: "20px", border: "1px dashed", borderColor: "divider" }}>
              <Typography color="text.secondary" fontWeight={600} fontSize="16px">No repair tickets found in the system.</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {tickets.map((item) => {
                const displayStatus = getTicketDisplayStatus(item.status);
                const statusStyle = getStatusStyle(displayStatus);
                const isCompleted = displayStatus !== "Pending";
                const borderColor = priorityBorderColor(item.priority);
                return (
                  <Paper key={item._id} sx={{ ...cardSx, pl: { xs: 2.5, md: 3.5 } }}>
                    <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: borderColor }} />
                    <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start", width: "100%", flex: 1 }}>
                      <Avatar sx={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#FFFFFF", width: 48, height: 48, fontWeight: 900, fontSize: "18px", flexShrink: 0 }}>
                        {item.raisedBy?.name?.charAt(0) || "S"}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8, flexWrap: "wrap" }}>
                          <Typography sx={{ fontFamily: "monospace", fontSize: "12px", color: "text.secondary", fontWeight: 900 }}>{item.ticketId}</Typography>
                          <StatusChip label={item.priority} />
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.2, py: 0.4, borderRadius: "999px", bgcolor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontSize: "11px", fontWeight: 900 }}>
                            {React.cloneElement(statusStyle.icon, { sx: { fontSize: 14 } })}
                            {displayStatus}
                          </Box>
                        </Box>
                        <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: { xs: "16px", md: "18px" }, letterSpacing: "-0.4px", lineHeight: 1.3, mb: 0.5 }}>
                          {item.issue}
                        </Typography>
                        <Typography sx={{ fontSize: "13px", color: "text.secondary", fontWeight: 600, lineHeight: 1.6 }}>
                          {item.asset?.name || "Unknown Asset"} · {item.asset?.department || "N/A"} · Requested by <strong>{item.raisedBy?.name || "System"}</strong> on {new Date(item.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
                      <Box sx={{ textAlign: "right", mr: 1 }}>
                        <Typography sx={{ fontSize: "11px", color: "text.secondary", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Est. Cost</Typography>
                        <Typography sx={{ fontWeight: 900, color: "text.primary", fontSize: "20px" }}>{item.estimatedCost ? `₹ ${item.estimatedCost.toLocaleString()}` : "—"}</Typography>
                      </Box>
                      <Button variant="outlined" startIcon={<CloseRounded />} disabled={isCompleted} onClick={() => handleTicketActionClick(item, "reject")}
                        sx={{ borderRadius: "10px", fontWeight: 800, textTransform: "none", px: 2, color: "#EF4444", borderColor: "#FCA5A5", fontSize: 13, "&:hover": { bgcolor: "rgba(239,68,68,0.08)", borderColor: "#EF4444" } }}>
                        Reject
                      </Button>
                      <Button variant="contained" startIcon={<CheckRounded />} disabled={isCompleted} onClick={() => handleTicketActionClick(item, "authorize")}
                        sx={{ fontWeight: 800, borderRadius: "10px", px: 2.5, fontSize: 13, background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff", boxShadow: "none" }}>
                        Authorize
                      </Button>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </>

      {/* Ticket Action Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: "20px", overflow: "hidden", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" } } }}>
        {selectedApproval && (
          <>
            <Box sx={{ p: 3, background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(168,85,247,0.05))", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: actionType === "authorize" ? "linear-gradient(135deg,#7C3AED,#A855F7)" : "#EF4444", display: "grid", placeItems: "center" }}>
                  {actionType === "authorize" ? <CheckRounded sx={{ color: "#fff", fontSize: 22 }} /> : <CloseRounded sx={{ color: "#fff", fontSize: 22 }} />}
                </Box>
                <Box>
                  <Typography fontWeight={900} fontSize={18}>{actionType === "authorize" ? "Authorize Repair" : "Reject Ticket"}</Typography>
                  <Typography fontSize={12} color="text.secondary">{selectedApproval.ticketId} · {selectedApproval.asset?.name || "Unknown"}</Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setDialogOpen(false)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}><CloseRounded /></IconButton>
            </Box>
            <DialogContent sx={{ p: 3 }}>
              <Paper sx={{ p: 2, mb: 3, borderRadius: "12px", bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                <Typography sx={{ fontWeight: 800, color: "text.primary", mb: 0.8, fontSize: 14 }}>Request Summary</Typography>
                <Typography sx={{ color: "text.secondary", fontWeight: 600, lineHeight: 1.7, fontSize: 13 }}>
                  Asset: {selectedApproval.asset?.name || "N/A"}<br />
                  Department: {selectedApproval.asset?.department || "N/A"}<br />
                  Issue: {selectedApproval.issue}
                </Typography>
              </Paper>
              <TextField fullWidth type={actionType === "authorize" ? "number" : "text"} multiline={actionType !== "authorize"} rows={actionType !== "authorize" ? 4 : 1}
                label={actionType === "authorize" ? "Estimated Cost (₹)" : "Rejection Reason"}
                placeholder={actionType === "authorize" ? "Example: 5000" : "Please verify warranty before paid repair."}
                value={inputVal} onChange={(e) => setInputVal(e.target.value)}
                sx={inputSx}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
                <Button onClick={() => setDialogOpen(false)} sx={{ color: "text.secondary", fontWeight: 800, px: 3, borderRadius: "10px" }}>Cancel</Button>
                <Button variant="contained" disabled={processing} onClick={handleConfirmTicketAction}
                  startIcon={processing ? <CircularProgress size={18} color="inherit" /> : null}
                  sx={{ background: actionType === "authorize" ? "linear-gradient(135deg,#7C3AED,#A855F7)" : "#EF4444", color: "#fff", fontWeight: 800, px: 3.5, borderRadius: "12px", boxShadow: "none" }}>
                  {processing ? "Processing..." : `Confirm ${actionType === "authorize" ? "Authorization" : "Rejection"}`}
                </Button>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: "14px", fontWeight: 800 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Approvals;
