import React, { useState, useEffect, useMemo } from "react";
import {
  Avatar, Box, Button, Dialog, DialogContent, IconButton, Paper, Snackbar,
  Alert, TextField, Typography, CircularProgress, Grid, TablePagination, Tabs, Tab, Chip
} from "@mui/material";
import {
  CheckRounded, CloseRounded, VerifiedRounded, CancelRounded, AccessTimeRounded,
  CheckCircleRounded, HourglassEmptyRounded, ThumbDownRounded, DevicesRounded, BuildRounded
} from "@mui/icons-material";
import StatusChip from "../../components/StatusChip";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const Approvals = () => {
  const { currentUser } = useAuth();

  const [tab, setTab] = useState(0);

  // — Repair Tickets —
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketPage, setTicketPage] = useState(0);
  const [ticketRowsPerPage, setTicketRowsPerPage] = useState(10);

  // — Device Requests —
  const [deviceRequests, setDeviceRequests] = useState([]);
  const [drLoading, setDrLoading] = useState(true);
  const [drPage, setDrPage] = useState(0);
  const [drRowsPerPage, setDrRowsPerPage] = useState(10);

  // — Shared action dialog —
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const paginatedTickets = useMemo(
    () => tickets.slice(ticketPage * ticketRowsPerPage, ticketPage * ticketRowsPerPage + ticketRowsPerPage),
    [tickets, ticketPage, ticketRowsPerPage]
  );
  const paginatedDr = useMemo(
    () => deviceRequests.slice(drPage * drRowsPerPage, drPage * drRowsPerPage + drRowsPerPage),
    [deviceRequests, drPage, drRowsPerPage]
  );

  useEffect(() => { fetchTickets(); fetchDeviceRequests(); }, []);

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const { data } = await api.get('/tickets');
      setTickets(data);
    } catch {
      setSnackbar({ open: true, message: "Failed to load repair tickets.", severity: "error" });
    } finally { setTicketsLoading(false); }
  };

  const fetchDeviceRequests = async () => {
    setDrLoading(true);
    try {
      const { data } = await api.get('/device-requests');
      setDeviceRequests(data);
    } catch {
      setSnackbar({ open: true, message: "Failed to load device requests.", severity: "error" });
    } finally { setDrLoading(false); }
  };

  // Ticket actions
  const handleTicketActionClick = (item, type) => { setSelectedItem(item); setActionType(type); setInputVal(""); setDialogOpen(true); };

  const handleConfirmTicketAction = async () => {
    setProcessing(true);
    const newStatus = actionType === "authorize" ? "Vendor Assigned" : "Rejected";
    try {
      await api.put(`/tickets/${selectedItem._id}/status`, {
        status: newStatus,
        estimatedCost: actionType === "authorize" && inputVal ? Number(inputVal) : 0
      });
      setSnackbar({ open: true, severity: actionType === "authorize" ? "success" : "error", message: actionType === "authorize" ? `${selectedItem.ticketId} authorized.` : `${selectedItem.ticketId} rejected.` });
      setDialogOpen(false);
      fetchTickets();
    } catch (err) {
      setSnackbar({ open: true, severity: "error", message: err.response?.data?.message || "Failed to process." });
    } finally { setProcessing(false); }
  };

  // Device request actions
  const handleDrActionClick = (item, type) => { setSelectedItem(item); setActionType(type); setInputVal(""); setDialogOpen(true); };

  const handleConfirmDrAction = async () => {
    setProcessing(true);
    try {
      await api.put(`/device-requests/${selectedItem._id}/review`, {
        status: actionType === "approve" ? "Approved" : "Rejected",
        adminRemarks: inputVal
      });
      setSnackbar({ open: true, severity: actionType === "approve" ? "success" : "error", message: actionType === "approve" ? `${selectedItem.requestId} approved.` : `${selectedItem.requestId} rejected.` });
      setDialogOpen(false);
      fetchDeviceRequests();
    } catch (err) {
      setSnackbar({ open: true, severity: "error", message: err.response?.data?.message || "Failed to process." });
    } finally { setProcessing(false); }
  };

  const getTicketDisplayStatus = (status) => {
    if (status === "Pending Approval") return "Pending";
    if (status === "Rejected") return "Rejected";
    return "Authorized";
  };

  const getStatusStyle = (s) => {
    if (s === "Authorized" || s === "Approved") return { icon: <VerifiedRounded />, bg: "rgba(22,163,74,0.10)", color: "#16a34a", border: "rgba(22,163,74,0.25)" };
    if (s === "Rejected") return { icon: <CancelRounded />, bg: "rgba(220,38,38,0.10)", color: "#DC2626", border: "rgba(220,38,38,0.25)" };
    return { icon: <AccessTimeRounded />, bg: "rgba(245,158,11,0.12)", color: "#D97706", border: "rgba(245,158,11,0.25)" };
  };

  const priorityBorderColor = (p) => p === "High" || p === "Critical" ? "#EF4444" : p === "Medium" ? "#F59E0B" : "#22C55E";

  const urgencyColor = (u) => u === "High" ? "#EF4444" : u === "Medium" ? "#F59E0B" : "#22C55E";

  const ticketPending = tickets.filter(t => getTicketDisplayStatus(t.status) === "Pending").length;
  const drPending = deviceRequests.filter(r => r.status === "Pending").length;

  const cardSx = {
    p: { xs: 2.5, md: 3 }, borderRadius: "16px", bgcolor: "background.paper",
    border: "1px solid", borderColor: "divider",
    display: "flex", alignItems: { xs: "flex-start", md: "center" },
    justifyContent: "space-between", gap: 3, flexDirection: { xs: "column", lg: "row" },
    transition: "all 0.25s ease", position: "relative", overflow: "hidden",
    "&:hover": { borderColor: "rgba(17,24,39,0.30)", transform: "translateY(-2px)", boxShadow: "0 12px 32px rgba(17,24,39,0.10)" },
  };
  const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: "12px" } };

  const isTicketDialog = selectedItem && !selectedItem.requestId;

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: "rgba(17,24,39,0.12)" }}>
          <CheckCircleRounded sx={{ color: "text.primary" }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Approvals</Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>Authorize repair tickets and review device requests</Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, "& .MuiTab-root": { fontWeight: 800, textTransform: "none", fontSize: 14 } }}>
        <Tab label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BuildRounded fontSize="small" /> Repair Tickets
            {ticketPending > 0 && <Chip label={ticketPending} size="small" sx={{ height: 18, fontSize: 11, fontWeight: 900, bgcolor: "#FBBF24", color: "#111827" }} />}
          </Box>
        } />
        <Tab label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DevicesRounded fontSize="small" /> Device Requests
            {drPending > 0 && <Chip label={drPending} size="small" sx={{ height: 18, fontSize: 11, fontWeight: 900, bgcolor: "#FBBF24", color: "#111827" }} />}
          </Box>
        } />
      </Tabs>

      {/* — Tab 0: Repair Tickets — */}
      {tab === 0 && (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {[
              { label: "Pending Approval", value: ticketPending, icon: <HourglassEmptyRounded fontSize="small" /> },
              { label: "Authorized", value: tickets.filter(t => getTicketDisplayStatus(t.status) === "Authorized").length, icon: <CheckCircleRounded fontSize="small" /> },
              { label: "Rejected", value: tickets.filter(t => getTicketDisplayStatus(t.status) === "Rejected").length, icon: <ThumbDownRounded fontSize="small" /> },
            ].map(k => (
              <Grid size={{ xs: 12, sm: 4 }} key={k.label}>
                <Paper sx={{ p: 2.5, borderRadius: "16px", border: 1, borderColor: "divider", position: "relative", overflow: "hidden" }}>
                  <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: "#FBBF24" }} />
                  <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "#FBBF2418", display: "grid", placeItems: "center", mb: 1.5 }}>
                    <Box sx={{ color: "#FBBF24" }}>{k.icon}</Box>
                  </Box>
                  <Typography fontSize={28} fontWeight={950} sx={{ lineHeight: 1, letterSpacing: "-1px" }}>{k.value}</Typography>
                  <Typography fontSize={13} fontWeight={700} mt={0.3}>{k.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {ticketsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
          ) : tickets.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: "center", borderRadius: "20px", border: "1px dashed", borderColor: "divider" }}>
              <Typography color="text.secondary" fontWeight={600}>No repair tickets found.</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {paginatedTickets.map((item) => {
                const displayStatus = getTicketDisplayStatus(item.status);
                const statusStyle = getStatusStyle(displayStatus);
                const isCompleted = displayStatus !== "Pending";
                return (
                  <Paper key={item._id} sx={{ ...cardSx, pl: { xs: 2.5, md: 3.5 } }}>
                    <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: priorityBorderColor(item.priority) }} />
                    <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start", width: "100%", flex: 1 }}>
                      <Avatar sx={{ background: "#FBBF24", color: "#111827", width: 48, height: 48, fontWeight: 900, fontSize: "18px", flexShrink: 0 }}>
                        {item.raisedBy?.name?.charAt(0) || "S"}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8, flexWrap: "wrap" }}>
                          <Typography sx={{ fontFamily: "monospace", fontSize: "12px", color: "text.secondary", fontWeight: 900 }}>{item.ticketId}</Typography>
                          <StatusChip label={item.priority} />
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.2, py: 0.4, borderRadius: "999px", bgcolor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontSize: "11px", fontWeight: 900 }}>
                            {React.cloneElement(statusStyle.icon, { sx: { fontSize: 14 } })} {displayStatus}
                          </Box>
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: { xs: "16px", md: "18px" }, letterSpacing: "-0.4px", lineHeight: 1.3, mb: 0.5 }}>{item.issue}</Typography>
                        <Typography sx={{ fontSize: "13px", color: "text.secondary", fontWeight: 600 }}>
                          {item.asset?.name || "Unknown Asset"} · {item.asset?.department || "N/A"} · <strong>{item.raisedBy?.name || "System"}</strong> · {new Date(item.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexShrink: 0 }}>
                      <Box sx={{ textAlign: "right", mr: 1 }}>
                        <Typography sx={{ fontSize: "11px", color: "text.secondary", fontWeight: 800, textTransform: "uppercase" }}>Est. Cost</Typography>
                        <Typography sx={{ fontWeight: 900, fontSize: "20px" }}>{item.estimatedCost ? `₹ ${item.estimatedCost.toLocaleString()}` : "—"}</Typography>
                      </Box>
                      <Button variant="outlined" startIcon={<CloseRounded />} disabled={isCompleted} onClick={() => handleTicketActionClick(item, "reject")}
                        sx={{ borderRadius: "10px", fontWeight: 800, textTransform: "none", px: 2, color: "#EF4444", borderColor: "#FCA5A5", fontSize: 13 }}>Reject</Button>
                      <Button variant="contained" startIcon={<CheckRounded />} disabled={isCompleted} onClick={() => handleTicketActionClick(item, "authorize")}
                        sx={{ fontWeight: 800, borderRadius: "10px", px: 2.5, fontSize: 13, background: "#FBBF24", color: "#111827", boxShadow: "none" }}>Authorize</Button>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
          {!ticketsLoading && tickets.length > 0 && (
            <TablePagination component="div" count={tickets.length} page={ticketPage}
              onPageChange={(_, p) => setTicketPage(p)} rowsPerPage={ticketRowsPerPage}
              onRowsPerPageChange={(e) => { setTicketRowsPerPage(parseInt(e.target.value, 10)); setTicketPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]} sx={{ color: "text.secondary" }} />
          )}
        </>
      )}

      {/* — Tab 1: Device Requests — */}
      {tab === 1 && (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {[
              { label: "Pending", value: drPending, icon: <HourglassEmptyRounded fontSize="small" /> },
              { label: "Approved", value: deviceRequests.filter(r => r.status === "Approved").length, icon: <CheckCircleRounded fontSize="small" /> },
              { label: "Rejected", value: deviceRequests.filter(r => r.status === "Rejected").length, icon: <ThumbDownRounded fontSize="small" /> },
            ].map(k => (
              <Grid size={{ xs: 12, sm: 4 }} key={k.label}>
                <Paper sx={{ p: 2.5, borderRadius: "16px", border: 1, borderColor: "divider", position: "relative", overflow: "hidden" }}>
                  <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: "#FBBF24" }} />
                  <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "#FBBF2418", display: "grid", placeItems: "center", mb: 1.5 }}>
                    <Box sx={{ color: "#FBBF24" }}>{k.icon}</Box>
                  </Box>
                  <Typography fontSize={28} fontWeight={950} sx={{ lineHeight: 1, letterSpacing: "-1px" }}>{k.value}</Typography>
                  <Typography fontSize={13} fontWeight={700} mt={0.3}>{k.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {drLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
          ) : deviceRequests.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: "center", borderRadius: "20px", border: "1px dashed", borderColor: "divider" }}>
              <Typography color="text.secondary" fontWeight={600}>No device requests found.</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {paginatedDr.map((item) => {
                const statusStyle = getStatusStyle(item.status === "Pending" ? "Pending" : item.status);
                const isCompleted = item.status !== "Pending";
                return (
                  <Paper key={item._id} sx={{ ...cardSx, pl: { xs: 2.5, md: 3.5 } }}>
                    <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: urgencyColor(item.urgency) }} />
                    <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start", width: "100%", flex: 1 }}>
                      <Avatar sx={{ background: "#FBBF24", color: "#111827", width: 48, height: 48, fontWeight: 900, fontSize: "18px", flexShrink: 0 }}>
                        {item.raisedBy?.name?.charAt(0) || "E"}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8, flexWrap: "wrap" }}>
                          <Typography sx={{ fontFamily: "monospace", fontSize: "12px", color: "text.secondary", fontWeight: 900 }}>{item.requestId}</Typography>
                          <Chip label={item.urgency} size="small" sx={{ fontWeight: 800, fontSize: 11, bgcolor: `${urgencyColor(item.urgency)}18`, color: urgencyColor(item.urgency), border: `1px solid ${urgencyColor(item.urgency)}30` }} />
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.2, py: 0.4, borderRadius: "999px", bgcolor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontSize: "11px", fontWeight: 900 }}>
                            {React.cloneElement(statusStyle.icon, { sx: { fontSize: 14 } })} {item.status}
                          </Box>
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: { xs: "16px", md: "18px" }, letterSpacing: "-0.4px", lineHeight: 1.3, mb: 0.5 }}>{item.itemRequested}</Typography>
                        <Typography sx={{ fontSize: "13px", color: "text.secondary", fontWeight: 600 }}>
                          {item.requestType} · <strong>{item.raisedBy?.name || "Employee"}</strong> ({item.raisedBy?.department || "N/A"}) · {new Date(item.createdAt).toLocaleDateString()}
                        </Typography>
                        {item.reason && <Typography sx={{ fontSize: "12px", color: "text.disabled", fontWeight: 600, mt: 0.5 }}>Reason: {item.reason}</Typography>}
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexShrink: 0 }}>
                      <Button variant="outlined" startIcon={<CloseRounded />} disabled={isCompleted} onClick={() => handleDrActionClick(item, "reject")}
                        sx={{ borderRadius: "10px", fontWeight: 800, textTransform: "none", px: 2, color: "#EF4444", borderColor: "#FCA5A5", fontSize: 13 }}>Reject</Button>
                      <Button variant="contained" startIcon={<CheckRounded />} disabled={isCompleted} onClick={() => handleDrActionClick(item, "approve")}
                        sx={{ fontWeight: 800, borderRadius: "10px", px: 2.5, fontSize: 13, background: "#FBBF24", color: "#111827", boxShadow: "none" }}>Approve</Button>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
          {!drLoading && deviceRequests.length > 0 && (
            <TablePagination component="div" count={deviceRequests.length} page={drPage}
              onPageChange={(_, p) => setDrPage(p)} rowsPerPage={drRowsPerPage}
              onRowsPerPageChange={(e) => { setDrRowsPerPage(parseInt(e.target.value, 10)); setDrPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]} sx={{ color: "text.secondary" }} />
          )}
        </>
      )}

      {/* Action Dialog (shared) */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: "20px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" } } }}>
        {selectedItem && (
          <>
            <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: (actionType === "authorize" || actionType === "approve") ? "#111827" : "#EF4444", display: "grid", placeItems: "center" }}>
                  {(actionType === "authorize" || actionType === "approve") ? <CheckRounded sx={{ color: "#fff", fontSize: 22 }} /> : <CloseRounded sx={{ color: "#fff", fontSize: 22 }} />}
                </Box>
                <Box>
                  <Typography fontWeight={900} fontSize={18}>
                    {actionType === "authorize" ? "Authorize Repair" : actionType === "approve" ? "Approve Request" : "Reject"}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary">{selectedItem.ticketId || selectedItem.requestId}</Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setDialogOpen(false)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}><CloseRounded /></IconButton>
            </Box>
            <DialogContent sx={{ p: 3 }}>
              <Paper sx={{ p: 2, mb: 3, borderRadius: "12px", bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                <Typography sx={{ fontWeight: 800, mb: 0.8, fontSize: 14 }}>Summary</Typography>
                <Typography sx={{ color: "text.secondary", fontWeight: 600, lineHeight: 1.7, fontSize: 13 }}>
                  {isTicketDialog ? (
                    <>Asset: {selectedItem.asset?.name || "N/A"}<br />Issue: {selectedItem.issue}</>
                  ) : (
                    <>Item: {selectedItem.itemRequested}<br />Type: {selectedItem.requestType} · Urgency: {selectedItem.urgency}<br />Reason: {selectedItem.reason || "—"}</>
                  )}
                </Typography>
              </Paper>
              <TextField fullWidth type={actionType === "authorize" ? "number" : "text"}
                multiline={actionType !== "authorize"} rows={actionType !== "authorize" ? 3 : 1}
                label={actionType === "authorize" ? "Estimated Cost (₹)" : "Remarks (optional)"}
                placeholder={actionType === "authorize" ? "e.g. 5000" : "Add a note..."}
                value={inputVal} onChange={(e) => setInputVal(e.target.value)} sx={inputSx} />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
                <Button onClick={() => setDialogOpen(false)} sx={{ color: "text.secondary", fontWeight: 800, px: 3, borderRadius: "10px" }}>Cancel</Button>
                <Button variant="contained" disabled={processing}
                  onClick={isTicketDialog ? handleConfirmTicketAction : handleConfirmDrAction}
                  startIcon={processing ? <CircularProgress size={18} color="inherit" /> : null}
                  sx={{ background: (actionType === "authorize" || actionType === "approve") ? "#111827" : "#EF4444", color: "#fff", fontWeight: 800, px: 3.5, borderRadius: "12px", boxShadow: "none" }}>
                  {processing ? "Processing..." : `Confirm ${actionType === "authorize" ? "Authorization" : actionType === "approve" ? "Approval" : "Rejection"}`}
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
