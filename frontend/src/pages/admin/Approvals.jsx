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
  TextField,
  Typography,
  CircularProgress
} from "@mui/material";
import {
  CheckRounded,
  CloseRounded,
  Close,
  VerifiedRounded,
  CancelRounded,
  AccessTimeRounded,
} from "@mui/icons-material";
import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import api from "../../api/axios";

const Approvals = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionType, setActionType] = useState("");
  const [inputVal, setInputVal] = useState(""); // Used for Est Cost or Remarks
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
      setError("Failed to load pending authorizations.");
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (item, type) => {
    setSelectedApproval(item);
    setActionType(type);
    setInputVal("");
    setDialogOpen(true);
  };

  const handleConfirmAction = async () => {
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
            : `${selectedApproval.ticketId} rejected successfully.`,
      });

      setDialogOpen(false);
      setSelectedApproval(null);
      setActionType("");
      setInputVal("");
      fetchTickets(); // Refresh data
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err.response?.data?.message || "Failed to process request."
      });
    } finally {
      setProcessing(false);
    }
  };

  // Helper to map backend status to UI status
  const getDisplayStatus = (backendStatus) => {
    if (backendStatus === "Pending Approval") return "Pending";
    if (backendStatus === "Rejected") return "Rejected";
    return "Authorized"; // Covers Vendor Assigned, Under Repair, Resolved
  };

  const getStatusStyle = (status) => {
    if (status === "Authorized") {
      return {
        icon: <VerifiedRounded />,
        bg: "rgba(15,118,110,0.10)",
        color: "#0F766E",
        border: "rgba(15,118,110,0.25)",
      };
    }

    if (status === "Rejected") {
      return {
        icon: <CancelRounded />,
        bg: "rgba(220,38,38,0.10)",
        color: "#DC2626",
        border: "rgba(220,38,38,0.25)",
      };
    }

    return {
      icon: <AccessTimeRounded />,
      bg: "rgba(245,158,11,0.12)",
      color: "#D97706",
      border: "rgba(245,158,11,0.25)",
    };
  };

  const pendingCount = tickets.filter(t => getDisplayStatus(t.status) === "Pending").length;
  const authorizedCount = tickets.filter(t => getDisplayStatus(t.status) === "Authorized").length;
  const rejectedCount = tickets.filter(t => getDisplayStatus(t.status) === "Rejected").length;

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="Pending Authorizations"
        subtitle="Review and authorize departmental repair workflows before vendor escalation or financial commitment."
      />

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px", fontWeight: 600 }}>{error}</Alert>}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        <SummaryCard title="Pending" value={pendingCount} />
        <SummaryCard title="Authorized" value={authorizedCount} />
        <SummaryCard title="Rejected" value={rejectedCount} />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="30vh">
          <CircularProgress sx={{ color: "#0F766E" }} />
        </Box>
      ) : tickets.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: "24px", bgcolor: "#ffffff", border: "1px dashed #CBD5E1" }}>
          <Typography color="#64748b" fontWeight={600} fontSize="16px">No approval requests found in the system.</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
          {tickets.map((item) => {
            const displayStatus = getDisplayStatus(item.status);
            const statusStyle = getStatusStyle(displayStatus);
            const isCompleted = displayStatus !== "Pending";

            return (
              <Paper
                key={item._id}
                sx={{
                  p: { xs: 2.5, md: 4 },
                  borderRadius: "24px",
                  bgcolor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
                  display: "flex",
                  alignItems: { xs: "flex-start", md: "center" },
                  justifyContent: "space-between",
                  gap: 3,
                  flexDirection: { xs: "column", lg: "row" },
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: "rgba(15,118,110,0.35)",
                    transform: "translateY(-3px)",
                    boxShadow: "0 24px 48px rgba(15,23,42,0.10)",
                  },
                }}
              >
                <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start", width: "100%", flex: 1 }}>
                  <Avatar
                    sx={{
                      background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", width: 64, height: 64,
                      fontWeight: 900, fontSize: "24px", boxShadow: "0 14px 28px rgba(15,118,110,0.22)",
                    }}
                  >
                    {item.raisedBy?.name?.charAt(0) || "S"}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1, flexWrap: "wrap" }}>
                      <Typography sx={{ fontFamily: "monospace", fontSize: "14px", color: "#1E3A8A", fontWeight: 900 }}>
                        {item.ticketId}
                      </Typography>

                      <StatusChip label={item.priority} />

                      <Box
                        sx={{
                          display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.4, py: 0.55, borderRadius: "999px",
                          bgcolor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`,
                          fontSize: "12px", fontWeight: 900,
                        }}
                      >
                        {React.cloneElement(statusStyle.icon, { sx: { fontSize: 16 } })}
                        {displayStatus}
                      </Box>
                    </Box>

                    <Typography sx={{ fontWeight: 950, color: "#0F172A", fontSize: { xs: "18px", md: "22px" }, letterSpacing: "-0.6px", lineHeight: 1.3 }}>
                      {item.issue}
                    </Typography>

                    <Typography sx={{ fontSize: "14px", color: "#64748B", mt: 0.8, fontWeight: 600, lineHeight: 1.6 }}>
                      {item.asset?.name || "Unknown Asset"} • {item.asset?.department || "N/A"} • Requested by{" "}
                      <strong style={{ color: "#0F172A" }}>{item.raisedBy?.name || "System"}</strong>{" "}
                      on {new Date(item.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex", gap: 2, alignItems: { xs: "stretch", sm: "center" }, flexWrap: "wrap",
                    width: { xs: "100%", lg: "auto" }, justifyContent: { xs: "space-between", lg: "flex-end" },
                  }}
                >
                  <Box sx={{ textAlign: { xs: "left", lg: "right" }, minWidth: { xs: "100%", sm: "120px" } }}>
                    <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Est. Cost
                    </Typography>
                    <Typography sx={{ fontWeight: 950, color: "#0F172A", fontSize: "24px" }}>
                      {item.estimatedCost ? `₹ ${item.estimatedCost.toLocaleString()}` : "—"}
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    startIcon={<CloseRounded />}
                    disabled={isCompleted}
                    onClick={() => handleActionClick(item, "reject")}
                    sx={{
                      borderRadius: "14px", fontWeight: 900, textTransform: "none", px: 3, py: 1.15,
                      color: "#DC2626", borderColor: "#FCA5A5", width: { xs: "100%", sm: "auto" },
                      "&:hover": { bgcolor: "#FEF2F2", borderColor: "#DC2626" },
                    }}
                  >
                    Reject
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={<CheckRounded />}
                    disabled={isCompleted}
                    onClick={() => handleActionClick(item, "authorize")}
                    sx={{
                      background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", fontWeight: 900, textTransform: "none",
                      borderRadius: "14px", px: 3, py: 1.15, width: { xs: "100%", sm: "auto" }, boxShadow: "0 14px 26px rgba(15,118,110,0.25)",
                      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 20px 36px rgba(15,118,110,0.34)", background: "linear-gradient(135deg, #1D4ED8, #0D9488)" },
                    }}
                  >
                    Authorize
                  </Button>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "26px", overflow: "hidden", border: "1px solid #E2E8F0", boxShadow: "0 28px 70px rgba(15,23,42,0.22)" } }}
      >
        {selectedApproval && (
          <>
            <DialogTitle
              sx={{
                p: 0,
                background: actionType === "authorize"
                    ? "linear-gradient(135deg, rgba(15,118,110,0.10), #FFFFFF)"
                    : "linear-gradient(135deg, rgba(220,38,38,0.08), #FFFFFF)",
              }}
            >
              <Box sx={{ p: 3, display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box
                  sx={{
                    width: 54, height: 54, borderRadius: "16px",
                    background: actionType === "authorize" ? "linear-gradient(135deg, #1E3A8A, #0F766E)" : "linear-gradient(135deg, #991B1B, #DC2626)",
                    color: "#FFFFFF", display: "grid", placeItems: "center", flexShrink: 0,
                  }}
                >
                  {actionType === "authorize" ? <CheckRounded /> : <CloseRounded />}
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 950, fontSize: "24px", color: "#0F172A" }}>
                    {actionType === "authorize" ? "Authorize Request" : "Reject Request"}
                  </Typography>
                  <Typography sx={{ mt: 0.5, color: "#64748B", fontWeight: 600 }}>
                    {selectedApproval.ticketId} • {selectedApproval.asset?.name || "Unknown"}
                  </Typography>
                </Box>

                <IconButton onClick={() => setDialogOpen(false)}>
                  <Close />
                </IconButton>
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

              <TextField
                fullWidth
                type={actionType === "authorize" ? "number" : "text"}
                multiline={actionType !== "authorize"}
                rows={actionType !== "authorize" ? 4 : 1}
                label={actionType === "authorize" ? "Estimated Cost (₹)" : "Rejection Reason"}
                placeholder={actionType === "authorize" ? "Example: 5000" : "Example: Please verify warranty before paid repair."}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "16px", bgcolor: "#FFFFFF", fontWeight: 600 },
                  "& .MuiInputLabel-root": { fontWeight: 700 },
                }}
              />

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4, flexWrap: "wrap" }}>
                <Button onClick={() => setDialogOpen(false)} sx={{ color: "#64748B", fontWeight: 900, textTransform: "none", px: 3, borderRadius: "12px" }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  disabled={processing}
                  onClick={handleConfirmAction}
                  startIcon={processing ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{
                    background: actionType === "authorize" ? "linear-gradient(135deg, #1E3A8A, #0F766E)" : "linear-gradient(135deg, #991B1B, #DC2626)",
                    color: "#FFFFFF", fontWeight: 900, textTransform: "none", px: 4, py: 1.2, borderRadius: "12px",
                  }}
                >
                  {processing ? "Processing..." : `Confirm ${actionType === "authorize" ? "Authorization" : "Rejection"}`}
                </Button>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: "14px", fontWeight: 800 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const SummaryCard = ({ title, value }) => (
  <Paper sx={{ p: 2.5, borderRadius: "20px", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 12px 30px rgba(15,23,42,0.05)" }}>
    <Typography sx={{ color: "#64748B", fontSize: "13px", fontWeight: 900 }}>{title}</Typography>
    <Typography sx={{ mt: 0.7, color: "#1E3A8A", fontSize: "30px", fontWeight: 950 }}>{value}</Typography>
  </Paper>
);

export default Approvals;