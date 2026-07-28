import { useState, useEffect } from "react";
import {
  Box, Button, CircularProgress, Divider, Grid, Paper, Snackbar, Alert,
  Chip, Typography
} from "@mui/material";
import {
  AddRounded, LaptopMacRounded, PhoneIphoneRounded, SupportAgentRounded
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

const EmployeePortal = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchMyAssets();
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

  return (
    <Box sx={{ pb: 5 }}>
      <PageHeader
        title={`Welcome, ${currentUser?.name?.split(' ')[0] || 'User'}`}
        subtitle="Manage your assigned equipment and track your active service requests."
        action={
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained" startIcon={<AddRounded />}
              onClick={() => navigate("/tickets")}
              sx={{ background: "#FBBF24", color: "#111827", fontWeight: 900, px: 3, py: 1.2, borderRadius: "10px", "&:hover": { background: "#F5A623" } }}
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

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: "14px", fontWeight: 800 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeePortal;


