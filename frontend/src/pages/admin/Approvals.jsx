import React, { useState, useEffect } from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Alert,
  Tab,
  Tabs,
  TextField,
  Typography,
  CircularProgress,
  Chip
} from "@mui/material";
import {
  CheckRounded,
  CloseRounded,
  Close,
  VerifiedRounded,
  CancelRounded,
  AccessTimeRounded,
  DevicesRounded,
  BuildRounded,
} from "@mui/icons-material";
import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import api from "../../api/axios";

const Approvals = () => {
  const [activeTab, setActiveTab] = useState(0);

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const [deviceRequests, setDeviceRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [error, setError] = useState(null);

  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionType, setActionType] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestAction, setRequestAction] = useState("");
  const [requestRemarks, setRequestRemarks] = useState("");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestProcessing, setRequestProcessing] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchTickets();
    fetchDeviceRequests();
  }, []);

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setError("Failed to load repair authorizations.");
    } finally {
      setTicketsLoading(false);
    }
  };

  const fetchDeviceRequests = async () => {
    setRequestsLoading(true);
    try {
      const response = await api.get('/device-requests');
      setDeviceRequests(response.data);
    } catch (err) {
      console.error("Failed to fetch device requests:", err);
    } finally {
      setRequestsLoading(false);
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

  const handleRequestActionClick = (item, type) => {
    setSelectedRequest(item);
    setRequestAction(type);
    setRequestRemarks("");
    setRequestDialogOpen(true);
  };

  const handleConfirmRequestAction = async () => {
    setRequestProcessing(true);
    try {
      await api.put(`/device-requests/${selectedRequest._id}/review`, {
        status: requestAction === "approve" ? "Approved" : "Rejected",
        adminRemarks: requestRemarks
      });
      setSnackbar({
        open: true,
        severity: requestAction === "approve" ? "success" : "error",
        message: requestAction === "approve"
          ? `Request ${selectedRequest.requestId} approved.`
          : `Request ${selectedRequest.requestId} rejected.`,
      });
      setRequestDialogOpen(false);
      setSelectedRequest(null);
      setRequestRemarks("");
      fetchDeviceRequests();
    } catch (err) {
      setSnackbar({ open: true, severity: "error", message: err.response?.data?.message || "Failed to process request." });
    } finally {
      setRequestProcessing(false);
    }
  };

  const getTicketDisplayStatus = (status) => {
    if (status === "Pending Approval") return "Pending";
    if (status === "Rejected") return "Rejected";
    return "Authorized";
  };

  const getStatusStyle = (status) => {
    if (status === "Authorized" || status === "Approved") {
      return { icon: <VerifiedRounded />, bg: "rgba(15,118,110,0.10)", color: "#0F766E", border: "rgba(15,118,110,0.25)" };
    }
    if (status === "Rejected") {
      return { icon: <CancelRounded />, bg: "rgba(220,38,38,0.10)", color: "#DC2626", border: "rgba(220,38,38,0.25)" };
    }
    return { icon: <AccessTimeRounded />, bg: "rgba(245,158,11,0.12)", color: "#D97706", border: "rgba(245,158,11,0.25)" };
  };

  const urgencyColor = (u) => {
    if (u === "High") return "#DC2626";
    if (u === "Medium") return "#D97706";
    return "#0F766E";
  };

  const ticketPendingCount = tickets.filter(t => getTicketDisplayStatus(t.status) === "Pending").length;
  const ticketAuthorizedCount = tickets.filter(t => getTicketDisplayStatus(t.status) === "Authorized").length;
  const ticketRejectedCount = tickets.filter(t => getTicketDisplayStatus(t.status) === "Rejected").length;

  const reqPendingCount = deviceRequests.filter(r => r.status === "Pending").length;
  const reqApprovedCount = deviceRequests.filter(r => r.status === "Approved").length;
  const reqRejectedCount = deviceRequests.filter(r => r.status === "Rejected").length;

  const cardSx = {
    p: { xs: 2.5, md: 4 }, borderRadius: "24px", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0",
    boxShadow: "0 14px 34px rgba(15,23,42,0.06)", display: "flex", alignItems: { xs: "flex-start", md: "center" },
    justifyContent: "space-between", gap: 3, flexDirection: { xs: "column", lg: "row" }, transition: "all 0.3s ease",
    "&:hover": { borderColor: "rgba(15,118,110,0.35)", transform: "translateY(-3px)", boxShadow: "0 24px 48px rgba(15,23,42,0.10)" },
  };

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="Pending Authorizations"
        subtitle="Review and authorize departmental repair workflows and device procurement requests."
      />

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px", fontWeight: 600 }}>{error}</Alert>}

      <Tabs
        value={activeTab} onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3, "& .MuiTab-root": { fontWeight: 800, textTransform: "none", fontSize: "15px" }, "& .Mui-selected": { color: "#0F766E" }, "& .MuiTabs-indicator": { bgcolor: "#0F766E" } }}
      >
        <Tab icon={<BuildRounded fontSize="small" />} iconPosition="start" label={`Repair Tickets${ticketPendingCount > 0 ? ` (${ticketPendingCount} pending)` : ''}`} />
        <Tab icon={<DevicesRounded fontSize="small" />} iconPosition="start" label={`Device Requests${reqPendingCount > 0 ? ` (${reqPendingCount} pending)` : ''}`} />
      </Tabs>

      {activeTab === 0 && (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
            <SummaryCard title="Pending" value={ticketPendingCount} />
            <SummaryCard title="Authorized" value={ticketAuthorizedCount} />
            <SummaryCard title="Rejected" value={ticketRejectedCount} />
          </Box>

          {ticketsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="30vh">
              <CircularProgress sx={{ color: "#0F766E" }} />
            </Box>
          ) : tickets.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: "center", borderRadius: "24px", bgcolor: "#ffffff", border: "1px dashed #CBD5E1" }}>
              <Typography color="#64748b" fontWeight={600} fontSize="16px">No repair tickets found in the system.</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
              {tickets.map((item) => {
                const displayStatus = getTicketDisplayStatus(item.status);
                const statusStyle = getStatusStyle(displayStatus);
                const isCompleted = displayStatus !== "Pending";
                return (
                  <Paper key={item._id} sx={cardSx}>
                    <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start", width: "100%", flex: 1 }}>
                      <Avatar sx={{ background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", width: 64, height: 64, fontWeight: 900, fontSize: "24px", boxShadow: "0 14px 28px rgba(15,118,110,0.22)" }}>
                        {item.raisedBy?.name?.charAt(0) || "S"}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1, flexWrap: "wrap" }}>
                          <Typography sx={{ fontFamily: "monospace", fontSize: "14px", color: "#1E3A8A", fontWeight: 900 }}>{item.ticketId}</Typography>
                          <StatusChip label={item.priority} />
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.4, py: 0.55, borderRadius: "999px", bgcolor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontSize: "12px", fontWeight: 900 }}>
                            {React.cloneElement(statusStyle.icon, { sx: { fontSize: 16 } })}
                            {displayStatus}
                          </Box>
                        </Box>
                        <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: { xs: "18px", md: "22px" }, letterSpacing: "-0.6px", lineHeight: 1.3 }}>
                          {item.issue}
                        </Typography>
                        <Typography sx={{ fontSize: "14px", color: "#64748B", mt: 0.8, fontWeight: 600, lineHeight: 1.6 }}>
                          {item.asset?.name || "Unknown Asset"} • {item.asset?.department || "N/A"} • Requested by{" "}
                          <strong style={{ color: "#0F172A" }}>{item.raisedBy?.name || "System"}</strong>{" "}
                          on {new Date(item.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, alignItems: { xs: "stretch", sm: "center" }, flexWrap: "wrap", width: { xs: "100%", lg: "auto" }, justifyContent: { xs: "space-between", lg: "flex-end" } }}>
                      <Box sx={{ textAlign: { xs: "left", lg: "right" }, minWidth: { xs: "100%", sm: "120px" } }}>
                        <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px" }}>Est. Cost</Typography>
                        <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: "24px" }}>{item.estimatedCost ? `₹ ${item.estimatedCost.toLocaleString()}` : "—"}</Typography>
                      </Box>
                      <Button variant="outlined" startIcon={<CloseRounded />} disabled={isCompleted} onClick={() => handleTicketActionClick(item, "reject")}
                        sx={{ borderRadius: "14px", fontWeight: 900, textTransform: "none", px: 3, py: 1.15, color: "#DC2626", borderColor: "#FCA5A5", width: { xs: "100%", sm: "auto" }, "&:hover": { bgcolor: "#FEF2F2", borderColor: "#DC2626" } }}>
                        Reject
                      </Button>
                      <Button variant="contained" startIcon={<CheckRounded />} disabled={isCompleted} onClick={() => handleTicketActionClick(item, "authorize")}
                        sx={{ background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", fontWeight: 900, textTransform: "none", borderRadius: "14px", px: 3, py: 1.15, width: { xs: "100%", sm: "auto" }, boxShadow: "0 14px 26px rgba(15,118,110,0.25)", "&:hover": { transform: "translateY(-2px)", background: "linear-gradient(135deg, #1D4ED8, #0D9488)" } }}>
                        Authorize
                      </Button>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </>
      )}

      {activeTab === 1 && (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
            <SummaryCard title="Pending" value={reqPendingCount} />
            <SummaryCard title="Approved" value={reqApprovedCount} />
            <SummaryCard title="Rejected" value={reqRejectedCount} />
          </Box>

          {requestsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="30vh">
              <CircularProgress sx={{ color: "#0F766E" }} />
            </Box>
          ) : deviceRequests.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: "center", borderRadius: "24px", bgcolor: "#ffffff", border: "1px dashed #CBD5E1" }}>
              <Typography color="#64748b" fontWeight={600} fontSize="16px">No device requests found.</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
              {deviceRequests.map((req) => {
                const statusStyle = getStatusStyle(req.status);
                const isCompleted = req.status !== "Pending";
                return (
                  <Paper key={req._id} sx={cardSx}>
                    <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start", width: "100%", flex: 1 }}>
                      <Avatar sx={{ background: "linear-gradient(135deg, #4f46e5, #0ea5e9)", color: "#FFFFFF", width: 64, height: 64, fontWeight: 900, fontSize: "22px", boxShadow: "0 14px 28px rgba(79,70,229,0.22)" }}>
                        {req.raisedBy?.name?.charAt(0) || "E"}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1, flexWrap: "wrap" }}>
                          <Typography sx={{ fontFamily: "monospace", fontSize: "14px", color: "#4f46e5", fontWeight: 900 }}>{req.requestId}</Typography>
                          <Chip label={req.requestType} size="small" sx={{ bgcolor: "#EEF2FF", color: "#4338CA", fontWeight: 800, fontSize: "11px", borderRadius: "6px" }} />
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.4, py: 0.55, borderRadius: "999px", bgcolor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontSize: "12px", fontWeight: 900 }}>
                            {React.cloneElement(statusStyle.icon, { sx: { fontSize: 16 } })}
                            {req.status}
                          </Box>
                        </Box>
                        <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: { xs: "18px", md: "20px" }, letterSpacing: "-0.4px", lineHeight: 1.3 }}>
                          {req.itemRequested}
                        </Typography>
                        <Typography sx={{ fontSize: "14px", color: "#64748B", mt: 0.8, fontWeight: 600, lineHeight: 1.6 }}>
                          Reason: {req.reason} • Urgency:{" "}
                          <strong style={{ color: urgencyColor(req.urgency) }}>{req.urgency}</strong> • By{" "}
                          <strong style={{ color: "#0F172A" }}>{req.raisedBy?.name || "Employee"}</strong>{" "}
                          on {new Date(req.createdAt).toLocaleDateString()}
                        </Typography>
                        {req.adminRemarks && (
                          <Typography sx={{ fontSize: "13px", color: "#64748B", mt: 0.5, fontStyle: "italic" }}>
                            Admin Remarks: "{req.adminRemarks}"
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, alignItems: { xs: "stretch", sm: "center" }, flexWrap: "wrap", width: { xs: "100%", lg: "auto" }, justifyContent: { xs: "space-between", lg: "flex-end" } }}>
                      <Button variant="outlined" startIcon={<CloseRounded />} disabled={isCompleted} onClick={() => handleRequestActionClick(req, "reject")}
                        sx={{ borderRadius: "14px", fontWeight: 900, textTransform: "none", px: 3, py: 1.15, color: "#DC2626", borderColor: "#FCA5A5", width: { xs: "100%", sm: "auto" }, "&:hover": { bgcolor: "#FEF2F2", borderColor: "#DC2626" } }}>
                        Reject
                      </Button>
                      <Button variant="contained" startIcon={<CheckRounded />} disabled={isCompleted} onClick={() => handleRequestActionClick(req, "approve")}
                        sx={{ background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", fontWeight: 900, textTransform: "none", borderRadius: "14px", px: 3, py: 1.15, width: { xs: "100%", sm: "auto" }, boxShadow: "0 14px 26px rgba(15,118,110,0.25)", "&:hover": { transform: "translateY(-2px)", background: "linear-gradient(135deg, #1D4ED8, #0D9488)" } }}>
                        Approve
                      </Button>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </>
      )}

      {/* Ticket Action Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "26px", overflow: "hidden", border: "1px solid #E2E8F0", boxShadow: "0 28px 70px rgba(15,23,42,0.22)" } }}>
        {selectedApproval && (
          <>
            <DialogTitle sx={{ p: 0, background: actionType === "authorize" ? "linear-gradient(135deg, rgba(15,118,110,0.10), #FFFFFF)" : "linear-gradient(135deg, rgba(220,38,38,0.08), #FFFFFF)" }}>
              <Box sx={{ p: 3, display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box sx={{ width: 54, height: 54, borderRadius: "16px", background: actionType === "authorize" ? "linear-gradient(135deg, #1E3A8A, #0F766E)" : "linear-gradient(135deg, #991B1B, #DC2626)", color: "#FFFFFF", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  {actionType === "authorize" ? <CheckRounded /> : <CloseRounded />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: "24px", color: "#0F172A" }}>{actionType === "authorize" ? "Authorize Repair" : "Reject Ticket"}</Typography>
                  <Typography sx={{ mt: 0.5, color: "#64748B", fontWeight: 600 }}>{selectedApproval.ticketId} • {selectedApproval.asset?.name || "Unknown"}</Typography>
                </Box>
                <IconButton onClick={() => setDialogOpen(false)}><Close /></IconButton>
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 3 }}>
              <Paper sx={{ p: 2.3, mb: 3, borderRadius: "18px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <Typography sx={{ fontWeight: 900, color: "#0F172A", mb: 0.8 }}>Request Summary</Typography>
                <Typography sx={{ color: "#64748B", fontWeight: 600, lineHeight: 1.7 }}>
                  Asset: {selectedApproval.asset?.name || "N/A"}<br />
                  Department: {selectedApproval.asset?.department || "N/A"}<br />
                  Issue: {selectedApproval.issue}
                </Typography>
              </Paper>
              <TextField fullWidth type={actionType === "authorize" ? "number" : "text"} multiline={actionType !== "authorize"} rows={actionType !== "authorize" ? 4 : 1}
                label={actionType === "authorize" ? "Estimated Cost (₹)" : "Rejection Reason"}
                placeholder={actionType === "authorize" ? "Example: 5000" : "Please verify warranty before paid repair."}
                value={inputVal} onChange={(e) => setInputVal(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "16px", bgcolor: "#FFFFFF", fontWeight: 600 }, "& .MuiInputLabel-root": { fontWeight: 700 } }}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4, flexWrap: "wrap" }}>
                <Button onClick={() => setDialogOpen(false)} sx={{ color: "#64748B", fontWeight: 900, textTransform: "none", px: 3, borderRadius: "12px" }}>Cancel</Button>
                <Button variant="contained" disabled={processing} onClick={handleConfirmTicketAction}
                  startIcon={processing ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{ background: actionType === "authorize" ? "linear-gradient(135deg, #1E3A8A, #0F766E)" : "linear-gradient(135deg, #991B1B, #DC2626)", color: "#FFFFFF", fontWeight: 900, textTransform: "none", px: 4, py: 1.2, borderRadius: "12px" }}>
                  {processing ? "Processing..." : `Confirm ${actionType === "authorize" ? "Authorization" : "Rejection"}`}
                </Button>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Device Request Action Dialog */}
      <Dialog open={requestDialogOpen} onClose={() => setRequestDialogOpen(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "26px", overflow: "hidden", border: "1px solid #E2E8F0", boxShadow: "0 28px 70px rgba(15,23,42,0.22)" } }}>
        {selectedRequest && (
          <>
            <DialogTitle sx={{ p: 0, background: requestAction === "approve" ? "linear-gradient(135deg, rgba(15,118,110,0.10), #FFFFFF)" : "linear-gradient(135deg, rgba(220,38,38,0.08), #FFFFFF)" }}>
              <Box sx={{ p: 3, display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box sx={{ width: 54, height: 54, borderRadius: "16px", background: requestAction === "approve" ? "linear-gradient(135deg, #1E3A8A, #0F766E)" : "linear-gradient(135deg, #991B1B, #DC2626)", color: "#FFFFFF", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  {requestAction === "approve" ? <CheckRounded /> : <CloseRounded />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: "24px", color: "#0F172A" }}>{requestAction === "approve" ? "Approve Request" : "Reject Request"}</Typography>
                  <Typography sx={{ mt: 0.5, color: "#64748B", fontWeight: 600 }}>{selectedRequest.requestId} • {selectedRequest.itemRequested}</Typography>
                </Box>
                <IconButton onClick={() => setRequestDialogOpen(false)}><Close /></IconButton>
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 3 }}>
              <Paper sx={{ p: 2.3, mb: 3, borderRadius: "18px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <Typography sx={{ fontWeight: 900, color: "#0F172A", mb: 0.8 }}>Request Summary</Typography>
                <Typography sx={{ color: "#64748B", fontWeight: 600, lineHeight: 1.7 }}>
                  Type: {selectedRequest.requestType}<br />
                  Item: {selectedRequest.itemRequested}<br />
                  Reason: {selectedRequest.reason}<br />
                  Urgency: {selectedRequest.urgency}
                </Typography>
              </Paper>
              <TextField fullWidth multiline rows={3}
                label={requestAction === "approve" ? "Approval Remarks (optional)" : "Rejection Reason"}
                placeholder={requestAction === "approve" ? "e.g. Approved as per budget allocation." : "e.g. Does not meet procurement policy."}
                value={requestRemarks} onChange={(e) => setRequestRemarks(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "16px", bgcolor: "#FFFFFF", fontWeight: 600 }, "& .MuiInputLabel-root": { fontWeight: 700 } }}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4, flexWrap: "wrap" }}>
                <Button onClick={() => setRequestDialogOpen(false)} sx={{ color: "#64748B", fontWeight: 900, textTransform: "none", px: 3, borderRadius: "12px" }}>Cancel</Button>
                <Button variant="contained" disabled={requestProcessing} onClick={handleConfirmRequestAction}
                  startIcon={requestProcessing ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{ background: requestAction === "approve" ? "linear-gradient(135deg, #1E3A8A, #0F766E)" : "linear-gradient(135deg, #991B1B, #DC2626)", color: "#FFFFFF", fontWeight: 900, textTransform: "none", px: 4, py: 1.2, borderRadius: "12px" }}>
                  {requestProcessing ? "Processing..." : `Confirm ${requestAction === "approve" ? "Approval" : "Rejection"}`}
                </Button>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: "14px", fontWeight: 800 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

const SummaryCard = ({ title, value }) => (
  <Paper sx={{ p: 2.5, borderRadius: "20px", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 12px 30px rgba(15,23,42,0.05)" }}>
    <Typography sx={{ color: "#64748B", fontSize: "13px", fontWeight: 900 }}>{title}</Typography>
    <Typography sx={{ mt: 0.7, color: "#1E3A8A", fontSize: "30px", fontWeight: 900 }}>{value}</Typography>
  </Paper>
);

export default Approvals;
