import { useState, useEffect } from "react";
import {
  Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle,
  Divider, Grid, IconButton, MenuItem, Paper, Snackbar, Alert,
  Stack, TextField, Typography, Chip
} from "@mui/material";
import {
  AddRounded, LaptopMacRounded, PhoneIphoneRounded, SupportAgentRounded,
  DevicesRounded, CloseRounded, AccessTimeRounded, VerifiedRounded, CancelRounded,
  DeleteOutlineRounded
} from "@mui/icons-material";
import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const iconForCategory = (category) => {
  if (!category) return <LaptopMacRounded fontSize="medium" />;
  const lower = category.toLowerCase();
  if (lower.includes("mobile") || lower.includes("phone")) return <PhoneIphoneRounded fontSize="medium" />;
  return <LaptopMacRounded fontSize="medium" />;
};

const REQUEST_TYPES = ["New Device", "Replacement", "Repair Authorization", "Accessory"];
const URGENCIES = ["Low", "Medium", "High"];

const EmployeePortal = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(true);

  const [myRequests, setMyRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [form, setForm] = useState({
    requestType: "New Device",
    itemRequested: "",
    reason: "",
    urgency: "Medium",
    relatedAsset: ""
  });

  useEffect(() => {
    fetchMyAssets();
    fetchMyRequests();
  }, []);

  const fetchMyAssets = async () => {
    setAssetsLoading(true);
    try {
      const res = await api.get('/assets/myassets');
      setAssets(res.data);
    } catch {
      setSnackbar({ open: true, message: "Failed to load your assigned assets. Please refresh.", severity: "error" });
    } finally {
      setAssetsLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await api.get('/device-requests/mine');
      setMyRequests(res.data);
    } catch {
      setSnackbar({ open: true, message: "Failed to load your device requests. Please refresh.", severity: "error" });
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Withdraw this device request?")) return;
    try {
      await api.delete(`/device-requests/${id}`);
      setMyRequests(prev => prev.filter(r => r._id !== id));
      setSnackbar({ open: true, message: "Request withdrawn.", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || "Failed to withdraw request.", severity: "error" });
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.relatedAsset) delete payload.relatedAsset;
      await api.post('/device-requests', payload);
      setSnackbar({ open: true, message: "Request submitted successfully!", severity: "success" });
      setRequestDialogOpen(false);
      setForm({ requestType: "New Device", itemRequested: "", reason: "", urgency: "Medium", relatedAsset: "" });
      fetchMyRequests();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || "Failed to submit request.", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const requestStatusStyle = (status) => {
    if (status === "Approved") return { bg: "rgba(22,163,74,0.13)",  color: "#4ADE80", icon: <VerifiedRounded sx={{ fontSize: 14 }} /> };
    if (status === "Rejected") return { bg: "rgba(220,38,38,0.13)", color: "#F87171", icon: <CancelRounded sx={{ fontSize: 14 }} /> };
    return { bg: "rgba(217,119,6,0.13)", color: "#FBBF24", icon: <AccessTimeRounded sx={{ fontSize: 14 }} /> };
  };

  const inputStyles = {
    "& .MuiOutlinedInput-root": { borderRadius: "12px", fontWeight: 600 },
    "& .MuiInputLabel-root": { fontWeight: 700 },
  };

  return (
    <Box sx={{ pb: 5 }}>
      <PageHeader
        title={`Welcome, ${currentUser?.name?.split(' ')[0] || 'User'}`}
        subtitle="Manage your assigned equipment and track your active service requests."
        action={
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="outlined" startIcon={<DevicesRounded />}
              onClick={() => setRequestDialogOpen(true)}
              sx={{ borderColor: "divider", color: "text.primary", fontWeight: 700, px: 3, py: 1.2, borderRadius: "10px", "&:hover": { bgcolor: "action.hover", borderColor: "text.secondary" } }}
            >
              Request Device
            </Button>
            <Button
              variant="contained" startIcon={<AddRounded />}
              onClick={() => navigate("/tickets")}
              sx={{ background: "#111827", color: "#FFFFFF", fontWeight: 900, px: 3, py: 1.2, borderRadius: "10px", "&:hover": { background: "#1F2937" } }}
            >
              Report an Issue
            </Button>
          </Box>
        }
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, mt: 2 }}>
        <Typography variant="h6" fontWeight={800} color="text.primary" letterSpacing="-0.5px">
          My Assigned Equipment
        </Typography>
        {!assetsLoading && assets.length > 0 && (
          <Chip label={assets.length} size="small" sx={{ bgcolor: "action.selected", color: "text.primary", fontWeight: 800, fontSize: 11, height: 22 }} />
        )}
      </Box>

      {assetsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress color="inherit" /></Box>
      ) : assets.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: "20px", border: "1px dashed", borderColor: "divider", mb: 4 }}>
          <Typography color="text.secondary" fontWeight={600}>No assets assigned to you yet. Contact your admin.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={4} sx={{ mb: 5 }}>
          {assets.map((asset) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={asset._id}>
              <Paper
                sx={{
                  p: { xs: 3, md: 4 }, borderRadius: 4, bgcolor: "background.paper",
                  border: 1, borderColor: "divider",
                  display: "flex", flexDirection: "column", height: "100%", transition: "all 0.3s ease",
                  "&:hover": { borderColor: "text.secondary", transform: "translateY(-6px)", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.08)" }
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: 3, background: "linear-gradient(135deg,rgba(17,24,39,0.18),rgba(17,24,39,0.12))", color: "text.primary", display: "grid", placeItems: "center" }}>
                    {iconForCategory(asset.category)}
                  </Box>
                  <StatusChip label={asset.status} />
                </Box>
                <Box flex={1}>
                  <Typography fontWeight={900} fontSize={20} color="text.primary" letterSpacing="-0.5px" mb={0.5}>
                    {asset.name}
                  </Typography>
                  <Typography color="text.secondary" fontSize={13} fontWeight={800} fontFamily="monospace" letterSpacing="0.5px" mb={2}>
                    {asset.serialNumber}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography color="text.secondary" fontSize={13} fontWeight={500}>
                    Category: <strong>{asset.category}</strong>
                  </Typography>
                  {asset.department && (
                    <Typography color="text.secondary" fontSize={13} fontWeight={500} mt={0.5}>
                      Department: <strong>{asset.department}</strong>
                    </Typography>
                  )}
                  {asset.modelNumber && (
                    <Typography color="text.secondary" fontSize={13} fontWeight={500} mt={0.5}>
                      Model: <strong>{asset.modelNumber}</strong>
                    </Typography>
                  )}
                  {asset.location && (
                    <Typography color="text.secondary" fontSize={13} fontWeight={500} mt={0.5}>
                      Location: <strong>{asset.location}</strong>
                    </Typography>
                  )}
                  {asset.vendor && (
                    <Typography color="text.secondary" fontSize={13} fontWeight={500} mt={0.5}>
                      Vendor: <strong>{asset.vendor}</strong>
                    </Typography>
                  )}
                  {asset.assignedDate && (
                    <Typography color="text.secondary" fontSize={13} fontWeight={500} mt={0.5}>
                      Assigned: <strong>{new Date(asset.assignedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                    </Typography>
                  )}
                  {asset.warrantyEnd && (() => {
                    const daysLeft = Math.ceil((new Date(asset.warrantyEnd) - new Date()) / 86400000);
                    const expired = daysLeft < 0;
                    const soon = !expired && daysLeft <= 90;
                    return (
                      <Box sx={{ mt: 1.5, display: 'inline-flex', alignItems: 'center', px: 1.2, py: 0.4, borderRadius: 1, bgcolor: expired ? 'rgba(220,38,38,0.13)' : soon ? 'rgba(217,119,6,0.13)' : 'rgba(22,163,74,0.13)', color: expired ? '#F87171' : soon ? '#FBBF24' : '#4ADE80' }}>
                        <Typography fontSize={12} fontWeight={700}>
                          {expired ? 'Warranty Expired' : soon ? `Warranty: ${daysLeft}d left` : 'Warranty Valid'}
                        </Typography>
                      </Box>
                    );
                  })()}
                </Box>
                <Button
                  fullWidth variant="outlined" startIcon={<SupportAgentRounded />}
                  onClick={() => navigate("/tickets")}
                  sx={{ mt: 4, borderColor: "divider", color: "text.primary", fontWeight: 700, borderRadius: "8px", textTransform: "none", "&:hover": { borderColor: "#ef4444", color: "#ef4444", bgcolor: "rgba(239,68,68,0.10)" } }}
                >
                  Raise Ticket
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant="h6" fontWeight={800} color="text.primary" mb={3} letterSpacing="-0.5px">
        My Device Requests
      </Typography>

      {requestsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress color="inherit" /></Box>
      ) : myRequests.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: "20px", border: "1px dashed", borderColor: "divider" }}>
          <DevicesRounded sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
          <Typography color="text.secondary" fontWeight={600} mb={1.5}>No device requests yet.</Typography>
          <Button variant="outlined" onClick={() => setRequestDialogOpen(true)} sx={{ borderColor: "divider", color: "text.primary", fontWeight: 700, borderRadius: "10px", px: 3, "&:hover": { bgcolor: "action.hover" } }}>
            Submit a Request
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {myRequests.map((req) => {
            const style = requestStatusStyle(req.status);
            return (
              <Grid size={{ xs: 12, md: 6 }} key={req._id}>
                <Paper sx={{ p: 3, borderRadius: "20px", border: 1, borderColor: "divider", bgcolor: "background.paper" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box>
                      <Typography fontFamily="monospace" fontSize={13} color="text.secondary" fontWeight={900}>{req.requestId}</Typography>
                      <Typography fontWeight={800} fontSize={18} color="text.primary" mt={0.3}>{req.itemRequested}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.4, py: 0.6, borderRadius: "999px", bgcolor: style.bg, color: style.color, fontSize: "12px", fontWeight: 900 }}>
                        {style.icon}
                        {req.status}
                      </Box>
                      {["Pending", "Under Review"].includes(req.status) && (
                        <IconButton size="small" onClick={() => handleDeleteRequest(req._id)}
                          sx={{ color: "text.secondary", "&:hover": { color: "#EF4444", bgcolor: "rgba(239,68,68,0.10)" } }}>
                          <DeleteOutlineRounded fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                    <Chip label={req.requestType} size="small" sx={{ bgcolor: "action.selected", color: "text.primary", fontWeight: 800, fontSize: "11px", borderRadius: "6px" }} />
                    <Chip label={req.urgency} size="small" sx={{ bgcolor: req.urgency === "High" ? "rgba(220,38,38,0.13)" : req.urgency === "Medium" ? "rgba(217,119,6,0.13)" : "rgba(22,163,74,0.13)", color: req.urgency === "High" ? "#F87171" : req.urgency === "Medium" ? "#FBBF24" : "#4ADE80", fontWeight: 800, fontSize: "11px", borderRadius: "6px" }} />
                  </Box>
                  <Typography color="text.secondary" fontSize={13} fontWeight={600}>Reason: {req.reason}</Typography>
                  <Typography color="text.disabled" fontSize={12} mt={0.5}>{new Date(req.createdAt).toLocaleDateString()}</Typography>
                  {req.adminRemarks && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: "background.default", borderRadius: "10px", border: 1, borderColor: "divider" }}>
                      <Typography fontSize={12} fontWeight={800} color="text.secondary">Admin Remarks:</Typography>
                      <Typography fontSize={13} fontWeight={600} color="text.primary" mt={0.3}>"{req.adminRemarks}"</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Request Device Dialog */}
      <Dialog open={requestDialogOpen} onClose={() => setRequestDialogOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: "28px", overflow: "hidden", border: 1, borderColor: "divider", bgcolor: "background.paper" } }, backdrop: { sx: { backgroundColor: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" } } }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ p: 3.5, display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: "14px", background: "linear-gradient(135deg,rgba(17,24,39,0.18),rgba(17,24,39,0.12))", color: "text.primary", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <DevicesRounded />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, fontSize: "24px", color: "text.primary" }}>Request a Device</Typography>
              <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: "14px", fontWeight: 600, lineHeight: 1.5 }}>
                Submit a request for a new device, replacement, or accessory.
              </Typography>
            </Box>
            <IconButton onClick={() => setRequestDialogOpen(false)} sx={{ bgcolor: "action.hover" }}><CloseRounded /></IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmitRequest}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", mb: 1, display: "block", textTransform: "uppercase" }}>Request Type</Typography>
                <TextField fullWidth select required sx={inputStyles} name="requestType" value={form.requestType} onChange={handleFormChange}>
                  {REQUEST_TYPES.map(t => <MenuItem key={t} value={t} sx={{ fontWeight: 600 }}>{t}</MenuItem>)}
                </TextField>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", mb: 1, display: "block", textTransform: "uppercase" }}>Item Requested</Typography>
                <TextField fullWidth required sx={inputStyles} name="itemRequested" value={form.itemRequested} onChange={handleFormChange} placeholder="e.g. Dell Laptop XPS 15, USB-C Docking Station..." />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", mb: 1, display: "block", textTransform: "uppercase" }}>Reason</Typography>
                <TextField fullWidth required multiline rows={3} sx={inputStyles} name="reason" value={form.reason} onChange={handleFormChange} placeholder="Explain why this is needed..." />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", mb: 1, display: "block", textTransform: "uppercase" }}>Urgency</Typography>
                <TextField fullWidth select required sx={inputStyles} name="urgency" value={form.urgency} onChange={handleFormChange}>
                  {URGENCIES.map(u => <MenuItem key={u} value={u} sx={{ fontWeight: 600 }}>{u}</MenuItem>)}
                </TextField>
              </Box>
              {assets.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", mb: 1, display: "block", textTransform: "uppercase" }}>Related Asset (optional)</Typography>
                  <TextField fullWidth select sx={inputStyles} name="relatedAsset" value={form.relatedAsset} onChange={handleFormChange}>
                    <MenuItem value="" sx={{ fontWeight: 600 }}>None</MenuItem>
                    {assets.map(a => <MenuItem key={a._id} value={a._id} sx={{ fontWeight: 600 }}>{a.name} ({a.serialNumber})</MenuItem>)}
                  </TextField>
                </Box>
              )}
            </Stack>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 5, pt: 3, borderTop: 1, borderColor: "divider" }}>
              <Button onClick={() => setRequestDialogOpen(false)} sx={{ color: "text.secondary", fontWeight: 800, textTransform: "none", px: 3 }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ background: "#111827", color: "#FFFFFF", fontWeight: 900, px: 4, py: 1.2, borderRadius: "12px", "&:hover": { background: "#1F2937" } }}>
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: "14px", fontWeight: 800 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeePortal;


