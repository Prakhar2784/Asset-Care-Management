import React, { useState, useEffect } from "react";
import {
  Avatar,
  Autocomplete,
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
  Chip,
  Grid
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
  InventoryRounded,
  CheckCircleRounded,
  HourglassEmptyRounded,
  ThumbDownRounded,
} from "@mui/icons-material";
import StatusChip from "../../components/StatusChip";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const Approvals = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const [deviceRequests, setDeviceRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [trackings, setTrackings] = useState({});

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
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAssetForApproval, setSelectedAssetForApproval] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchTickets();
    fetchDeviceRequests();
    fetchAvailableAssets();
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

  const fetchDeviceRequests = async () => {
    setRequestsLoading(true);
    try {
      const response = await api.get('/device-requests');
      setDeviceRequests(response.data);
      fetchTrackings(response.data);
    } catch {
      setSnackbar({ open: true, severity: "error", message: "Failed to load device requests." });
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchTrackings = async (requests) => {
    const underReviewReqs = requests.filter(r => r.status === 'Under Review');
    const newTrackings = {};
    for (const r of underReviewReqs) {
      try {
        const { data } = await api.get(`/device-requests/${r._id}/workflow-tracking`);
        newTrackings[r._id] = data;
      } catch (err) {
        console.error("Error loading workflow tracking:", err);
      }
    }
    setTrackings(newTrackings);
  };

  const fetchAvailableAssets = async () => {
    try {
      const { data } = await api.get('/assets');
      setAvailableAssets(data.filter(a => a.assignedStatus !== 'Assigned'));
    } catch {}
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
    setSelectedAssetForApproval(null);
    setRequestDialogOpen(true);
  };

  const handleConfirmRequestAction = async () => {
    setRequestProcessing(true);
    try {
      if (selectedRequest.status === "Under Review") {
        await api.put(`/device-requests/${selectedRequest._id}/workflow-action`, {
          status: requestAction === "approve" ? "Approved" : "Rejected",
          remarks: requestRemarks,
          assetId: requestAction === "approve" && selectedAssetForApproval ? selectedAssetForApproval._id : undefined,
        });
      } else {
        await api.put(`/device-requests/${selectedRequest._id}/review`, {
          status: requestAction === "approve" ? "Approved" : "Rejected",
          adminRemarks: requestRemarks,
          assetId: requestAction === "approve" && selectedAssetForApproval ? selectedAssetForApproval._id : undefined,
        });
      }
      const assetMsg = requestAction === "approve" && selectedAssetForApproval
        ? ` ${selectedAssetForApproval.name} assigned to ${selectedRequest.raisedBy?.name}.`
        : '';
      setSnackbar({
        open: true,
        severity: requestAction === "approve" ? "success" : "error",
        message: requestAction === "approve"
          ? `Request ${selectedRequest.requestId} approved.${assetMsg}`
          : `Request ${selectedRequest.requestId} rejected.`,
      });
      setRequestDialogOpen(false);
      setSelectedRequest(null);
      setRequestRemarks("");
      setSelectedAssetForApproval(null);
      fetchDeviceRequests();
      if (requestAction === "approve" && selectedAssetForApproval) fetchAvailableAssets();
    } catch (err) {
      setSnackbar({ open: true, severity: "error", message: err.response?.data?.message || "Failed to process request." });
    } finally {
      setRequestProcessing(false);
    }
  };

  const getIsAuthorizedForWorkflow = (reqId) => {
    const tracking = trackings[reqId];
    if (!tracking) return false;

    const activeStage = tracking.history.find(h => h.stageIndex === tracking.currentStageIndex);
    if (!activeStage || activeStage.action !== 'Pending') return false;

    let isMatch = currentUser?.role === activeStage.assignedRole;
    if (activeStage.assignedRole === 'hod') {
      const reqItem = deviceRequests.find(r => r._id === reqId);
      isMatch = currentUser?.role === 'hod' && currentUser?.department === reqItem?.raisedBy?.department;
    }

    if (currentUser?.role === 'super_admin') {
      isMatch = true;
    }

    return isMatch;
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

  const urgencyColor = (u) => {
    if (u === "High") return "#EF4444";
    if (u === "Medium") return "#F59E0B";
    return "#22C55E";
  };

  const priorityBorderColor = (priority) => {
    if (priority === "High" || priority === "Critical") return "#EF4444";
    if (priority === "Medium") return "#F59E0B";
    return "#22C55E";
  };

  const ticketPendingCount = tickets.filter(t => getTicketDisplayStatus(t.status) === "Pending").length;
  const ticketAuthorizedCount = tickets.filter(t => getTicketDisplayStatus(t.status) === "Authorized").length;
  const ticketRejectedCount = tickets.filter(t => getTicketDisplayStatus(t.status) === "Rejected").length;

  const reqPendingCount = deviceRequests.filter(r => r.status === "Pending" || r.status === "Under Review").length;
  const reqApprovedCount = deviceRequests.filter(r => r.status === "Approved").length;
  const reqRejectedCount = deviceRequests.filter(r => r.status === "Rejected").length;

  const ticketKpis = [
    { label: "Pending Approval", value: ticketPendingCount, color: "#F59E0B", icon: <HourglassEmptyRounded fontSize="small" /> },
    { label: "Authorized", value: ticketAuthorizedCount, color: "#22C55E", icon: <CheckCircleRounded fontSize="small" /> },
    { label: "Rejected", value: ticketRejectedCount, color: "#EF4444", icon: <ThumbDownRounded fontSize="small" /> },
  ];

  const reqKpis = [
    { label: "Pending / Under Review", value: reqPendingCount, color: "#F59E0B", icon: <HourglassEmptyRounded fontSize="small" /> },
    { label: "Approved", value: reqApprovedCount, color: "#22C55E", icon: <CheckCircleRounded fontSize="small" /> },
    { label: "Rejected", value: reqRejectedCount, color: "#EF4444", icon: <ThumbDownRounded fontSize="small" /> },
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
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Review and authorize repair workflows and device procurement requests</Typography>
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px", fontWeight: 600 }}>{error}</Alert>}

      {/* Styled Tabs */}
      <Paper sx={{ borderRadius: "14px", border: 1, borderColor: "divider", mb: 3, p: 0.5, display: "inline-flex" }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            minHeight: 40,
            "& .MuiTabs-indicator": { height: "100%", borderRadius: "10px", background: "linear-gradient(135deg,#7C3AED,#A855F7)", zIndex: 0 },
            "& .MuiTab-root": { minHeight: 40, fontWeight: 800, fontSize: 13, textTransform: "none", zIndex: 1, borderRadius: "10px", transition: "color 0.2s", color: "text.secondary", "&.Mui-selected": { color: "#fff" } },
          }}
        >
          <Tab icon={<BuildRounded fontSize="small" />} iconPosition="start" label={`Repair Tickets${ticketPendingCount > 0 ? ` (${ticketPendingCount})` : ''}`} />
          <Tab icon={<DevicesRounded fontSize="small" />} iconPosition="start" label={`Device Requests${reqPendingCount > 0 ? ` (${reqPendingCount})` : ''}`} />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
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
      )}

      {activeTab === 1 && (
        <>
          {/* KPI Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {reqKpis.map(k => (
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

          {requestsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "30vh" }}>
              <CircularProgress sx={{ color: "#A855F7" }} />
            </Box>
          ) : deviceRequests.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: "center", borderRadius: "20px", border: "1px dashed", borderColor: "divider" }}>
              <Typography color="text.secondary" fontWeight={600} fontSize="16px">No device requests found.</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {deviceRequests.map((req) => {
                const statusStyle = getStatusStyle(req.status);
                const isCompleted = req.status !== "Pending" && req.status !== "Under Review";
                const isWorkflow = req.status === "Under Review";
                const canAction = !isCompleted && (!isWorkflow || getIsAuthorizedForWorkflow(req._id));
                const tracking = trackings[req._id];

                return (
                  <Paper key={req._id} sx={{ ...cardSx, pl: { xs: 2.5, md: 3.5 } }}>
                    <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: urgencyColor(req.urgency) }} />
                    <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start", width: "100%", flex: 1 }}>
                      <Avatar sx={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#FFFFFF", width: 48, height: 48, fontWeight: 900, fontSize: "18px", flexShrink: 0 }}>
                        {req.raisedBy?.name?.charAt(0) || "E"}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8, flexWrap: "wrap" }}>
                          <Typography sx={{ fontFamily: "monospace", fontSize: "12px", color: "text.secondary", fontWeight: 900 }}>{req.requestId}</Typography>
                          <Chip label={req.requestType} size="small" sx={{ bgcolor: "action.selected", color: "text.primary", fontWeight: 800, fontSize: "11px", borderRadius: "6px", height: 22 }} />
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.2, py: 0.4, borderRadius: "999px", bgcolor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontSize: "11px", fontWeight: 900 }}>
                            {React.cloneElement(statusStyle.icon, { sx: { fontSize: 14 } })}
                            {req.status}
                          </Box>
                        </Box>
                        <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: { xs: "16px", md: "18px" }, letterSpacing: "-0.4px", lineHeight: 1.3, mb: 0.5 }}>
                          {req.itemRequested}
                        </Typography>
                        <Typography sx={{ fontSize: "13px", color: "text.secondary", fontWeight: 600, lineHeight: 1.6 }}>
                          Reason: {req.reason} · Urgency: <strong style={{ color: urgencyColor(req.urgency) }}>{req.urgency}</strong> · By <strong>{req.raisedBy?.name || "Employee"}</strong> on {new Date(req.createdAt).toLocaleDateString()}
                        </Typography>
                        {req.adminRemarks && (
                          <Typography sx={{ fontSize: "12px", color: "text.disabled", mt: 0.5, fontStyle: "italic" }}>
                            Admin Remarks: "{req.adminRemarks}"
                          </Typography>
                        )}

                        {/* Stepper timeline rendering */}
                        {isWorkflow && tracking && (
                          <Box sx={{ mt: 2.5, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                            <Typography sx={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "text.secondary", mb: 1.5, letterSpacing: "0.5px" }}>
                              Workflow Approvals Path
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", overflowX: "auto", pb: 1, gap: 1 }}>
                              {tracking.history.map((stage, idx) => {
                                const isCurrent = idx === tracking.currentStageIndex;
                                const isStageCompleted = stage.action === 'Approved';
                                const isStageRejected = stage.action === 'Rejected';

                                let circleColor = "transparent";
                                let circleBorder = "2px solid";
                                let borderColor = "divider";
                                let statusIcon = <Typography sx={{ fontSize: 11, fontWeight: 900, color: "text.secondary" }}>{idx + 1}</Typography>;
                                let labelColor = "text.secondary";

                                if (isStageCompleted) {
                                  circleColor = "rgba(22,163,74,0.12)";
                                  circleBorder = "none";
                                  statusIcon = <CheckRounded sx={{ fontSize: 16, color: "#16a34a" }} />;
                                  labelColor = "#16a34a";
                                } else if (isStageRejected) {
                                  circleColor = "rgba(220,38,38,0.12)";
                                  circleBorder = "none";
                                  statusIcon = <CloseRounded sx={{ fontSize: 16, color: "#DC2626" }} />;
                                  labelColor = "#DC2626";
                                } else if (isCurrent) {
                                  circleColor = "rgba(217,119,6,0.12)";
                                  circleBorder = "none";
                                  statusIcon = <CircularProgress size={16} sx={{ color: "#D97706" }} />;
                                  labelColor = "#D97706";
                                }

                                return (
                                  <Box key={idx} sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 }}>
                                      <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: circleColor, border: circleBorder, borderColor: borderColor, display: "grid", placeItems: "center" }}>
                                        {statusIcon}
                                      </Box>
                                      <Typography sx={{ fontSize: "11px", fontWeight: 800, mt: 0.8, color: labelColor }}>{stage.label}</Typography>
                                      <Typography sx={{ fontSize: "9px", fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                                        {stage.assignedRole === 'hod' ? 'HOD' : stage.assignedRole.replace('_', ' ')}
                                      </Typography>
                                      {stage.actionedBy && (
                                        <Typography sx={{ fontSize: "9px", color: "text.secondary", mt: 0.2, fontWeight: 500 }}>{stage.actionedBy.name}</Typography>
                                      )}
                                    </Box>
                                    {idx < tracking.history.length - 1 && (
                                      <Box sx={{ width: 40, height: "2px", bgcolor: isStageCompleted ? "#16a34a" : "divider", mb: 4 }} />
                                    )}
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
                      {isWorkflow && !canAction && (
                        <Typography sx={{ fontSize: "12px", color: "text.secondary", fontStyle: "italic", fontWeight: 700 }}>
                          Pending: {tracking?.history[tracking.currentStageIndex]?.label}
                        </Typography>
                      )}
                      {(req.status === "Pending" || canAction) && (
                        <>
                          <Button variant="outlined" startIcon={<CloseRounded />} disabled={isCompleted} onClick={() => handleRequestActionClick(req, "reject")}
                            sx={{ borderRadius: "10px", fontWeight: 800, textTransform: "none", px: 2, color: "#EF4444", borderColor: "#FCA5A5", fontSize: 13, "&:hover": { bgcolor: "rgba(239,68,68,0.08)", borderColor: "#EF4444" } }}>
                            Reject
                          </Button>
                          <Button variant="contained" startIcon={<CheckRounded />} disabled={isCompleted} onClick={() => handleRequestActionClick(req, "approve")}
                            sx={{ fontWeight: 800, borderRadius: "10px", px: 2.5, fontSize: 13, background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff", boxShadow: "none" }}>
                            Approve
                          </Button>
                        </>
                      )}
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

      {/* Device Request Action Dialog */}
      <Dialog open={requestDialogOpen} onClose={() => setRequestDialogOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: "20px", overflow: "hidden", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" } } }}>
        {selectedRequest && (
          <>
            <Box sx={{ p: 3, background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(168,85,247,0.05))", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: requestAction === "approve" ? "linear-gradient(135deg,#7C3AED,#A855F7)" : "#EF4444", display: "grid", placeItems: "center" }}>
                  {requestAction === "approve" ? <CheckRounded sx={{ color: "#fff", fontSize: 22 }} /> : <CloseRounded sx={{ color: "#fff", fontSize: 22 }} />}
                </Box>
                <Box>
                  <Typography fontWeight={900} fontSize={18}>{requestAction === "approve" ? "Approve Request" : "Reject Request"}</Typography>
                  <Typography fontSize={12} color="text.secondary">{selectedRequest.requestId} · {selectedRequest.itemRequested}</Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setRequestDialogOpen(false)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}><CloseRounded /></IconButton>
            </Box>
            <DialogContent sx={{ p: 3 }}>
              <Paper sx={{ p: 2, mb: 3, borderRadius: "12px", bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                <Typography sx={{ fontWeight: 800, color: "text.primary", mb: 0.8, fontSize: 14 }}>Request Summary</Typography>
                <Typography sx={{ color: "text.secondary", fontWeight: 600, lineHeight: 1.7, fontSize: 13 }}>
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
                sx={inputSx}
              />

              {requestAction === "approve" && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <InventoryRounded sx={{ fontSize: 16, color: "#22C55E" }} />
                    <Typography fontWeight={800} fontSize={14} color="text.primary">Assign from Inventory</Typography>
                    <Chip label="Optional" size="small" sx={{ fontSize: 10, height: 18, bgcolor: "action.selected", color: "text.secondary", fontWeight: 700 }} />
                  </Box>
                  <Typography fontSize={12} color="text.secondary" mb={1.5}>
                    If this item is already in stock, select it here to assign it to the employee immediately.
                  </Typography>
                  <Autocomplete
                    options={availableAssets}
                    getOptionLabel={(a) => `${a.name} — ${a.serialNumber} (${a.category})`}
                    value={selectedAssetForApproval}
                    onChange={(_, val) => setSelectedAssetForApproval(val)}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Asset (optional)" placeholder="Search by asset name or serial…" sx={inputSx} />
                    )}
                    renderOption={(props, a) => (
                      <Box component="li" {...props} sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start !important", py: 1.5 }}>
                        <Typography fontWeight={700} fontSize={14}>{a.name}</Typography>
                        <Typography fontSize={12} color="text.secondary">{a.serialNumber} · {a.category} · {a.department || "No Dept"}</Typography>
                      </Box>
                    )}
                    noOptionsText="No unassigned assets found"
                  />
                  {selectedAssetForApproval && (
                    <Paper sx={{ mt: 1.5, p: 2, borderRadius: "10px", bgcolor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
                      <Typography fontSize={13} fontWeight={700} sx={{ color: '#22C55E' }}>
                        ✓ {selectedAssetForApproval.name} will be assigned to {selectedRequest?.raisedBy?.name} on approval
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
                <Button onClick={() => setRequestDialogOpen(false)} sx={{ color: "text.secondary", fontWeight: 800, px: 3, borderRadius: "10px" }}>Cancel</Button>
                <Button variant="contained" disabled={requestProcessing} onClick={handleConfirmRequestAction}
                  startIcon={requestProcessing ? <CircularProgress size={18} color="inherit" /> : null}
                  sx={{ background: requestAction === "approve" ? "linear-gradient(135deg,#7C3AED,#A855F7)" : "#EF4444", color: "#fff", fontWeight: 800, px: 3.5, borderRadius: "12px", boxShadow: "none" }}>
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

export default Approvals;
