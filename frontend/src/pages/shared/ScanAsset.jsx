import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Button, Typography, Paper, CircularProgress,
  Dialog, DialogContent, TextField, MenuItem, Stack,
  IconButton, Alert, Chip, Snackbar
} from "@mui/material";
import {
  Inventory2Rounded, LocationOnRounded, ApartmentRounded,
  QrCodeScannerRounded, AssignmentRounded, CloseRounded,
  UploadFileRounded, CheckCircleRounded, TagRounded,
  LoginRounded
} from "@mui/icons-material";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: "12px" } };

const statusColor = (s) => {
  if (s === "Active")         return { bg: "rgba(22,163,74,0.12)", color: "#16a34a", border: "rgba(22,163,74,0.3)" };
  if (s === "Under Repair")   return { bg: "rgba(234,88,12,0.12)", color: "#ea580c", border: "rgba(234,88,12,0.3)" };
  if (s === "In Storage")     return { bg: "rgba(100,116,139,0.12)", color: "#475569", border: "rgba(100,116,139,0.3)" };
  return                             { bg: "rgba(239,68,68,0.12)", color: "#dc2626", border: "rgba(239,68,68,0.3)" };
};

export default function ScanAsset() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [asset, setAsset]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [raiseOpen, setRaiseOpen]   = useState(false);
  const [issue, setIssue]           = useState("");
  const [priority, setPriority]     = useState("Medium");
  const [imageFile, setImageFile]   = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");
  const [snack, setSnack]           = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    api.get(`/assets/scan/${assetId}`)
      .then(({ data }) => setAsset(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [assetId]);

  const handleActionClick = () => {
    if (!currentUser) {
      navigate(`/login?return=/scan/${assetId}`);
      return;
    }
    setIssue("");
    setPriority("Medium");
    setImageFile(null);
    setFormError("");
    setRaiseOpen(true);
  };

  const submitTicket = async (e) => {
    e.preventDefault();
    if (!issue.trim()) { setFormError("Please describe the issue."); return; }
    setSubmitting(true); setFormError("");
    try {
      const { data: ticket } = await api.post("/tickets", {
        assetId, issue: issue.trim(), priority
      }, { timeout: 20000 });

      if (imageFile) {
        const fd = new FormData();
        fd.append("files", imageFile);
        await api.post(`/tickets/${ticket._id}/attachments`, fd, {
          headers: { "Content-Type": "multipart/form-data" }, timeout: 30000
        });
      }

      setSnack({ open: true, message: `Service request ${ticket.ticketId || ""} registered successfully!`, severity: "success" });
      setRaiseOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to submit ticket. Please try again.");
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "background.default" }}>
      <CircularProgress sx={{ color: "#7777C7" }} />
    </Box>
  );

  if (notFound) return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3, bgcolor: "background.default" }}>
      <Paper sx={{ p: { xs: 3, sm: 5 }, borderRadius: "20px", border: 1, borderColor: "divider", textAlign: "center", maxWidth: 420 }}>
        <Typography fontSize={48} mb={1}>🔍</Typography>
        <Typography fontWeight={900} fontSize={20} mb={1}>Asset Not Found</Typography>
        <Typography color="text.secondary" fontWeight={500} fontSize={14}>
          This QR code doesn't match any registered asset. It may have been removed or the code is damaged.
        </Typography>
      </Paper>
    </Box>
  );

  const sc = statusColor(asset.status);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 2, sm: 3 } }}>
      <Box sx={{ width: "100%", maxWidth: 480 }}>

        {/* QR Scan badge */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 2.5 }}>
          <QrCodeScannerRounded sx={{ color: "#7777C7", fontSize: 24 }} />
          <Typography fontSize={13} fontWeight={800} color="#64748B" sx={{ textTransform: "uppercase", letterSpacing: "1px" }}>
            Asset Scanned
          </Typography>
        </Box>

        {/* Asset Card */}
        <Paper sx={{ borderRadius: "24px", border: 1, borderColor: "divider", overflow: "hidden", mb: 2.5, boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}>
          {/* Top accent bar */}
          <Box sx={{ height: 6, background: "linear-gradient(90deg, #7777C7, #9B9BE3)" }} />

          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            {/* Icon + name */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: "16px", bgcolor: "rgba(119, 119, 199, 0.12)", border: "1.5px solid rgba(119, 119, 199, 0.25)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Inventory2Rounded sx={{ fontSize: 28, color: "#7777C7" }} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontWeight={900} fontSize={{ xs: 20, sm: 22 }} sx={{ lineHeight: 1.25, letterSpacing: "-0.5px" }} noWrap>
                  {asset.name}
                </Typography>
                <Chip
                  label={asset.status}
                  size="small"
                  sx={{ mt: 0.8, fontWeight: 800, fontSize: 11, bgcolor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                />
              </Box>
            </Box>

            {/* Details list */}
            <Stack spacing={1.5}>
              {[
                { icon: <TagRounded sx={{ fontSize: 18 }} />,           label: "Serial Number", value: asset.serialNumber },
                { icon: <ApartmentRounded sx={{ fontSize: 18 }} />,     label: "Department",    value: asset.department || "—" },
                { icon: <LocationOnRounded sx={{ fontSize: 18 }} />,    label: "Location",      value: asset.location || "—" },
                { icon: <Inventory2Rounded sx={{ fontSize: 18 }} />,    label: "Category",      value: asset.category || "—" },
              ].map(row => (
                <Box key={row.label} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "14px", bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                  <Box sx={{ color: "#7777C7", display: "flex", alignItems: "center", flexShrink: 0 }}>{row.icon}</Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontSize={11} fontWeight={800} color="#475569" sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {row.label}
                    </Typography>
                    <Typography fontSize={14} fontWeight={700} sx={{ wordBreak: "break-word" }}>
                      {row.value}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </Paper>

        {/* Action Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={currentUser ? <AssignmentRounded sx={{ color: "#FFFFFF" }} /> : <LoginRounded sx={{ color: "#FFFFFF" }} />}
          onClick={handleActionClick}
          sx={{
            bgcolor: "#7777C7",
            color: "#FFFFFF",
            fontWeight: 800,
            fontSize: 16,
            borderRadius: "16px",
            py: 1.8,
            boxShadow: "0 8px 24px rgba(119, 119, 199, 0.35)",
            textTransform: "none",
            letterSpacing: "-0.2px",
            "&:hover": {
              bgcolor: "#6464B8",
              boxShadow: "0 12px 32px rgba(119, 119, 199, 0.45)"
            }
          }}
        >
          {currentUser ? "Register a Service Request" : "Log In to Register Request"}
        </Button>

        <Typography textAlign="center" fontSize={12} color="#64748B" fontWeight={600} mt={1.8}>
          {currentUser
            ? <>Issue will be reported against <strong>{asset.name}</strong></>
            : <>Sign in to submit a service or repair ticket for this asset.</>}
        </Typography>
      </Box>

      {/* Raise Ticket Dialog */}
      <Dialog
        open={raiseOpen}
        onClose={() => !submitting && setRaiseOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: "20px", border: 1, borderColor: "divider", bgcolor: "background.paper", m: { xs: 2, sm: 3 } } } }}
      >
        <Box sx={{ p: 2.5, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: "rgba(119, 119, 199, 0.12)", border: "1px solid rgba(119, 119, 199, 0.25)", display: "grid", placeItems: "center" }}>
              <AssignmentRounded sx={{ color: "#7777C7", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography fontWeight={900} fontSize={17}>Register Service Request</Typography>
              <Typography fontSize={12} color="text.secondary" fontWeight={600}>{asset.name}</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setRaiseOpen(false)} disabled={submitting} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}>
            <CloseRounded />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Box component="form" onSubmit={submitTicket} noValidate>
            <Stack spacing={2.5}>
              {/* Pre-filled asset info */}
              <Paper sx={{ p: 2, borderRadius: "12px", bgcolor: "rgba(119, 119, 199, 0.06)", border: "1px solid rgba(119, 119, 199, 0.2)" }}>
                <Typography fontSize={11} fontWeight={800} color="#7777C7" sx={{ textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.5 }}>
                  Scanned Asset
                </Typography>
                <Typography fontWeight={800} fontSize={15}>{asset.name}</Typography>
                <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                  {asset.serialNumber} · {asset.department || "No Department"}
                </Typography>
              </Paper>

              <TextField
                fullWidth required multiline rows={4}
                label="Describe the Issue"
                placeholder="e.g. Screen flickering, keyboard not responding, strange noise, power failure…"
                value={issue}
                onChange={e => setIssue(e.target.value)}
                sx={inputSx}
              />

              <TextField
                fullWidth select required label="Severity / Urgency" value={priority}
                onChange={e => setPriority(e.target.value)} sx={inputSx}
              >
                <MenuItem value="Low">Low — Minor issue, not urgent</MenuItem>
                <MenuItem value="Medium">Medium — Affects work moderately</MenuItem>
                <MenuItem value="High">High — Blocking my work</MenuItem>
                <MenuItem value="Critical" sx={{ color: "#EF4444", fontWeight: 700 }}>Critical — Complete failure</MenuItem>
              </TextField>

              {/* Image upload */}
              <Box>
                <Button
                  component="label"
                  variant="outlined"
                  fullWidth
                  startIcon={<UploadFileRounded />}
                  sx={{
                    py: 1.5, border: "1px dashed", borderColor: "divider",
                    borderRadius: "12px", textTransform: "none", fontWeight: 700,
                    color: "text.secondary", "&:hover": { borderColor: "#7777C7", color: "text.primary", bgcolor: "rgba(119, 119, 199, 0.04)" }
                  }}
                >
                  {imageFile ? imageFile.name : "Attach Photo / Screenshot (Optional)"}
                  <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && setImageFile(e.target.files[0])} />
                </Button>
                {imageFile && (
                  <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: "8px", bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                    <Typography fontSize={12} fontWeight={600} flex={1} noWrap>{imageFile.name}</Typography>
                    <IconButton size="small" onClick={() => setImageFile(null)} sx={{ color: "error.main" }}>
                      <CloseRounded fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {formError && <Alert severity="error" sx={{ borderRadius: "12px", fontWeight: 600 }}>{formError}</Alert>}

              <Box sx={{ display: "flex", gap: 2, pt: 1 }}>
                <Button
                  onClick={() => setRaiseOpen(false)}
                  disabled={submitting}
                  sx={{ fontWeight: 800, color: "text.secondary", flex: 1, borderRadius: "12px" }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircleRounded />}
                  sx={{
                    flex: 2,
                    bgcolor: "#7777C7",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    borderRadius: "12px",
                    boxShadow: "none",
                    textTransform: "none",
                    py: 1.3,
                    "&:hover": { bgcolor: "#6464B8" },
                    "&:disabled": { bgcolor: "#A5A5D8", color: "#FFFFFF" }
                  }}
                >
                  {submitting ? "Submitting…" : "Submit Request"}
                </Button>
              </Box>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={6000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: "14px", fontWeight: 800 }}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
