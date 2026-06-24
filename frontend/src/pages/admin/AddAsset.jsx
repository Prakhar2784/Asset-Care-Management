import React, { useState } from "react";
import {
  Alert, Box, Button, Chip, Divider, Grid, MenuItem,
  Paper, Snackbar, TextField, Typography, CircularProgress,
  LinearProgress
} from "@mui/material";
import {
  SaveRounded, UploadFileRounded, CheckCircleRounded,
  DescriptionRounded, DeleteRounded
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import api from "../../api/axios";

const SECTION_LABEL_SX = {
  display: "flex", alignItems: "center", gap: 1.5,
  mb: 3, mt: 0.5,
};

const SectionLabel = ({ number, title, subtitle }) => (
  <Box sx={SECTION_LABEL_SX}>
    <Box sx={{
      width: 32, height: 32, borderRadius: "10px",
      bgcolor: "#111111", color: "#CBFA57",
      display: "grid", placeItems: "center",
      fontWeight: 900, fontSize: 14, flexShrink: 0,
    }}>
      {number}
    </Box>
    <Box>
      <Typography sx={{ fontWeight: 800, fontSize: 17, color: "text.primary", letterSpacing: "-0.3px" }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ color: "text.secondary", fontSize: 12.5, fontWeight: 500, mt: 0.2 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

const DOC_TYPES = [
  { key: "invoice", label: "Purchase Invoice", accept: ".pdf,.png,.jpg,.jpeg" },
  { key: "warranty", label: "Warranty Card", accept: ".pdf,.png,.jpg,.jpeg" },
  { key: "amc", label: "AMC Contract", accept: ".pdf" },
  { key: "manual", label: "User Manual", accept: ".pdf" },
  { key: "service", label: "Service Report", accept: ".pdf,.docx" },
];

const AddAsset = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "IT Asset",
    formFactor: "Movable",
    vendor: "",
    modelNumber: "",
    serialNumber: "",
    procurementDate: "",
    warrantyStart: "",
    warrantyEnd: "",
    supportPhone: "",
    supportEmail: "",
    department: "Information Technology",
    location: "",
    status: "Active",
    purchaseCost: "",
    notes: "",
  });

  const [docs, setDocs] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleDocChange = (key, file) => {
    setDocs(prev => ({ ...prev, [key]: file }));
  };

  const handleRemoveDoc = (key) => {
    setDocs(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.serialNumber.trim()) {
      setError("Asset Name and Serial Number are required.");
      return;
    }

    if (formData.warrantyStart && formData.warrantyEnd && formData.warrantyEnd < formData.warrantyStart) {
      setError("Warranty expiry date cannot be before the warranty start date.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/assets', formData);
      setOpen(true);
      setTimeout(() => navigate("/admin/assets"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to provision asset. Please ensure the serial number is unique.");
    } finally {
      setLoading(false);
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      bgcolor: "background.paper",
    },
    "& .MuiInputLabel-root": { fontWeight: 600 },
  };

  const docCount = Object.keys(docs).length;

  return (
    <Box sx={{ width: "100%", pb: 6 }}>
      <PageHeader
        title="Register New Asset"
        subtitle="Add a new company asset for warranty monitoring, service tracking and department allocation."
        action={
          <Button variant="outlined" onClick={() => navigate("/admin/assets")}
            sx={{ borderColor: "divider", color: "text.secondary", fontWeight: 700, borderRadius: "10px" }}>
            Cancel
          </Button>
        }
      />

      {loading && <LinearProgress sx={{ borderRadius: 2, mb: 2, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: "#CBFA57" } }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "12px", fontWeight: 600 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

        {/* Section 1 — Hardware */}
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: "20px", bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
          <SectionLabel number="1" title="Hardware Specifications" subtitle="Basic technical and identity details of the asset." />
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={5}>
              <TextField required fullWidth name="name" value={formData.name} onChange={handleChange}
                sx={inputSx} label="Asset Name *" placeholder="e.g. Dell Latitude 5420" />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField required fullWidth select name="category" value={formData.category} onChange={handleChange} sx={inputSx} label="Category *">
                <MenuItem value="IT Asset">IT Asset</MenuItem>
                <MenuItem value="Electrical">Electrical</MenuItem>
                <MenuItem value="Electronic">Electronic</MenuItem>
                <MenuItem value="Furniture">Furniture</MenuItem>
                <MenuItem value="Networking">Networking</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={4}>
              <TextField required fullWidth select name="formFactor" value={formData.formFactor} onChange={handleChange} sx={inputSx} label="Form Factor *">
                <MenuItem value="Movable">Movable</MenuItem>
                <MenuItem value="Fixed">Fixed / Immovable</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth name="vendor" value={formData.vendor} onChange={handleChange}
                sx={inputSx} label="OEM / Brand" placeholder="e.g. Dell" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth name="modelNumber" value={formData.modelNumber} onChange={handleChange}
                sx={inputSx} label="Model Number" placeholder="e.g. LAT-5420-X" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField required fullWidth name="serialNumber" value={formData.serialNumber} onChange={handleChange}
                sx={inputSx} label="Serial Number / Service Tag *" placeholder="e.g. 8JZ91A" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth name="purchaseCost" value={formData.purchaseCost} onChange={handleChange}
                sx={inputSx} label="Purchase Cost (₹)" placeholder="e.g. 85000"
                type="number" inputProps={{ min: 0 }} />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 2 — Lifecycle */}
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: "20px", bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
          <SectionLabel number="2" title="Lifecycle & Vendor Data" subtitle="Warranty period, procurement date and service partner." />
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth type="date" name="procurementDate" value={formData.procurementDate}
                onChange={handleChange} sx={inputSx} label="Procurement Date" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth type="date" name="warrantyStart" value={formData.warrantyStart}
                onChange={handleChange} sx={inputSx} label="Warranty Start" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth type="date" name="warrantyEnd" value={formData.warrantyEnd}
                onChange={handleChange} sx={inputSx} label="Warranty Expiry" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth name="vendor" value={formData.vendor} onChange={handleChange}
                sx={inputSx} label="Authorized Service Partner" placeholder="e.g. Dell ProSupport" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth name="supportPhone" value={formData.supportPhone} onChange={handleChange}
                sx={inputSx} label="Support Phone" placeholder="+91 800-456-7890" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth type="email" name="supportEmail" value={formData.supportEmail}
                onChange={handleChange} sx={inputSx} label="Support Email" placeholder="support@vendor.com" />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 3 — Deployment */}
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: "20px", bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
          <SectionLabel number="3" title="Deployment & Location" subtitle="Assign to a department and set the asset's physical location." />
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={4}>
              <TextField required fullWidth select name="department" value={formData.department}
                onChange={handleChange} sx={inputSx} label="Target Department *">
                <MenuItem value="Information Technology">Information Technology</MenuItem>
                <MenuItem value="Administration">Administration</MenuItem>
                <MenuItem value="Finance & Accounts">Finance & Accounts</MenuItem>
                <MenuItem value="Operations">Operations</MenuItem>
                <MenuItem value="Human Resources">Human Resources</MenuItem>
                <MenuItem value="Sales & Marketing">Sales & Marketing</MenuItem>
                <MenuItem value="Legal">Legal</MenuItem>
                <MenuItem value="Security">Security</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth name="location" value={formData.location} onChange={handleChange}
                sx={inputSx} label="Physical Location" placeholder="e.g. Tower B, Floor 4, Desk 12" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField required fullWidth select name="status" value={formData.status}
                onChange={handleChange} sx={inputSx} label="Current Status *">
                <MenuItem value="Active">Active / Deployed</MenuItem>
                <MenuItem value="In Storage">In Storage</MenuItem>
                <MenuItem value="In Transit">In Transit</MenuItem>
                <MenuItem value="Under Repair">Under Repair</MenuItem>
                <MenuItem value="Decommissioned">Decommissioned</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} name="notes" value={formData.notes}
                onChange={handleChange} sx={inputSx} label="Notes (optional)"
                placeholder="Any additional notes about this asset..." />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 4 — Documents */}
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: "20px", bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 3 }}>
            <Box sx={SECTION_LABEL_SX} style={{ marginBottom: 0 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: "10px", bgcolor: "#111111", color: "#CBFA57", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 14, flexShrink: 0 }}>
                4
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 17, color: "text.primary", letterSpacing: "-0.3px" }}>
                  Document Vault
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 12.5, fontWeight: 500, mt: 0.2 }}>
                  Attach invoice, warranty card, AMC contract, manual and service reports.
                </Typography>
              </Box>
            </Box>
            {docCount > 0 && (
              <Chip label={`${docCount} file${docCount > 1 ? "s" : ""} attached`}
                size="small" sx={{ bgcolor: "#111111", color: "#CBFA57", fontWeight: 800, fontSize: 11 }} />
            )}
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
            {DOC_TYPES.map(({ key, label, accept }) => {
              const file = docs[key];
              return (
                <Box key={key}
                  sx={{
                    p: 2, borderRadius: "14px", border: "1.5px dashed",
                    borderColor: file ? "#111111" : "divider",
                    bgcolor: file ? "action.hover" : "background.default",
                    display: "flex", flexDirection: "column", gap: 1,
                    transition: "all 0.2s ease",
                  }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: file ? "text.primary" : "text.secondary" }}>
                      {label}
                    </Typography>
                    {file && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <CheckCircleRounded sx={{ fontSize: 14, color: "#111111" }} />
                        <Button size="small" onClick={() => handleRemoveDoc(key)}
                          sx={{ minWidth: 0, p: 0.3, color: "#EF4444" }}>
                          <DeleteRounded sx={{ fontSize: 14 }} />
                        </Button>
                      </Box>
                    )}
                  </Box>
                  {file ? (
                    <Typography sx={{ fontSize: 11.5, color: "text.secondary", fontWeight: 500, wordBreak: "break-all" }}>
                      {file.name.length > 28 ? file.name.substring(0, 28) + "…" : file.name}
                    </Typography>
                  ) : (
                    <Button component="label" size="small"
                      startIcon={<UploadFileRounded sx={{ fontSize: 15 }} />}
                      sx={{
                        justifyContent: "flex-start", borderRadius: "8px", fontWeight: 700,
                        fontSize: 12, color: "text.secondary", p: 0,
                        "&:hover": { color: "text.primary", bgcolor: "transparent" }
                      }}>
                      Upload {accept.includes("pdf") ? "PDF" : "file"}
                      <input type="file" hidden accept={accept}
                        onChange={(e) => e.target.files[0] && handleDocChange(key, e.target.files[0])} />
                    </Button>
                  )}
                </Box>
              );
            })}
          </Box>

          <Box sx={{ mt: 2.5, p: 2, borderRadius: "12px", bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
            <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>
              Accepted formats: PDF, PNG, JPG, DOCX &nbsp;·&nbsp; Max 10 MB per file &nbsp;·&nbsp; Documents stored against this asset record
            </Typography>
          </Box>
        </Paper>

        {/* Action row */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={() => navigate("/admin/assets")}
            sx={{ borderColor: "divider", color: "text.secondary", fontWeight: 700, borderRadius: "12px", px: 3, py: 1.2 }}>
            Discard
          </Button>

          <Button type="submit" variant="contained" disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveRounded />}
            sx={{ bgcolor: "#111111", color: "#CBFA57", fontWeight: 900, borderRadius: "12px", px: 4, py: 1.4, fontSize: 15, "&:hover": { bgcolor: "#222222" } }}>
            {loading ? "Registering…" : "Register Asset"}
          </Button>
        </Box>

      </Box>

      <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: "14px", fontWeight: 800 }}>
          Asset registered successfully.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddAsset;
