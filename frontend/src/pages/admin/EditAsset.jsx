import React, { useState, useEffect } from "react";
import {
  Alert, Box, Button, Chip, Divider, Grid, MenuItem,
  Paper, Snackbar, TextField, Typography, CircularProgress,
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItemButton, ListItemText, InputAdornment, IconButton,
  FormControl, InputLabel, Select
} from "@mui/material";
import {
  SaveRounded, UploadFileRounded, CheckCircleRounded,
  DeleteRounded, CloseRounded, ArrowBackRounded, EditRounded,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import api, { getFileUrl } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const SectionLabel = ({ number, title, subtitle }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3, mt: 0.5 }}>
    <Box sx={{
      width: 34, height: 34, borderRadius: "10px",
      background: "#FBBF24", color: "#111827",
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

const CATEGORIES = ["IT Asset", "Electrical", "Electronic", "Furniture", "Networking", "Vehicle", "Other"];
const STATUSES = ["Active", "In Storage", "In Transit", "Under Repair", "Decommissioned", "Scrap"];

const inputSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "background.paper" },
  "& .MuiInputLabel-root": { fontWeight: 600 },
};

const EditAsset = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "", category: "IT Asset", formFactor: "Movable",
    vendor: "", modelNumber: "", serialNumber: "",
    procurementDate: "", warrantyStart: "", warrantyEnd: "",
    supportPhone: "", supportEmail: "",
    department: "", location: "", status: "Active",
    purchaseCost: "", notes: "",
    purchaseFromName: "", purchaseFromAddress: "",
    purchaseFromPhone: "", purchaseFromEmail: "", purchaseFromGst: "",
    servicePartnerName: "", servicePartnerContact: "",
  });

  const [customFieldConfigs, setCustomFieldConfigs] = useState([]);
  const [customFields, setCustomFields] = useState({});
  const [departments, setDepartments] = useState([]);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [scDialogOpen, setScDialogOpen] = useState(false);
  const [docs, setDocs] = useState({});
  const [existingDocs, setExistingDocs] = useState({});

  // Fetch asset data on mount
  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const { data } = await api.get(`/assets/${id}`);
        const a = data.asset || data;
        const fmt = (d) => {
          if (!d) return "";
          const date = new Date(d);
          if (isNaN(date)) return "";
          return date.toISOString().split("T")[0];
        };
        setFormData({
          name: a.name || "",
          category: a.category || "IT Asset",
          formFactor: a.formFactor || "Movable",
          vendor: a.vendor || "",
          modelNumber: a.modelNumber || "",
          serialNumber: a.serialNumber || "",
          procurementDate: fmt(a.procurementDate),
          warrantyStart: fmt(a.warrantyStart),
          warrantyEnd: fmt(a.warrantyEnd),
          supportPhone: a.supportPhone || "",
          supportEmail: a.supportEmail || "",
          department: a.department || "",
          location: a.location || "",
          status: a.status || "Active",
          purchaseCost: a.purchaseCost != null ? String(a.purchaseCost) : "",
          notes: a.notes || "",
          purchaseFromName: a.purchaseFromName || "",
          purchaseFromAddress: a.purchaseFromAddress || "",
          purchaseFromPhone: a.purchaseFromPhone || "",
          purchaseFromEmail: a.purchaseFromEmail || "",
          purchaseFromGst: a.purchaseFromGst || "",
          servicePartnerName: a.servicePartnerName || "",
          servicePartnerContact: a.servicePartnerContact || "",
        });
        setCustomFields(a.customFields || {});
        const byType = {};
        (a.documents || []).forEach(d => { byType[d.docType] = d; });
        setExistingDocs(byType);
      } catch {
        setError("Failed to load asset.");
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [id]);

  // Fetch departments
  useEffect(() => {
    api.get("/departments").then(r => setDepartments(Array.isArray(r.data) ? r.data : r.data.departments || [])).catch(() => {});
    api.get("/service-centers").then(r => setServiceCenters(Array.isArray(r.data) ? r.data : r.data.serviceCenters || [])).catch(() => {});
  }, []);

  // Fetch custom fields when category changes
  useEffect(() => {
    if (!formData.category) return;
    api.get(`/custom-fields?category=${encodeURIComponent(formData.category)}`)
      .then(r => setCustomFieldConfigs(r.data.data || []))
      .catch(() => {});
  }, [formData.category]);

  const getCompletionPercentage = () => {
    const fields = [
      "name", "category", "formFactor", "vendor", "modelNumber", "serialNumber",
      "purchaseCost", "procurementDate", "warrantyStart", "warrantyEnd",
      "servicePartnerName", "servicePartnerContact", "supportPhone", "supportEmail",
      "department", "location", "purchaseFromName", "purchaseFromAddress",
      "purchaseFromPhone", "purchaseFromEmail", "purchaseFromGst",
    ];
    const requiredCustom = customFieldConfigs.filter(f => f.isRequired);
    const filled = fields.filter(f => formData[f]?.toString().trim()).length +
      requiredCustom.filter(f => customFields[f.name]?.toString().trim()).length;
    const total = fields.length + requiredCustom.length;
    return Math.round((filled / total) * 100);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !formData.serialNumber.trim()) {
      setError("Asset Name and Serial Number are required.");
      return;
    }
    if (formData.warrantyStart && formData.warrantyEnd && formData.warrantyEnd < formData.warrantyStart) {
      setError("Warranty expiry cannot be before warranty start.");
      return;
    }
    const missingRequired = customFieldConfigs.filter(f => f.isRequired && !customFields[f.name]?.toString().trim());
    if (missingRequired.length > 0) {
      setError(`Required custom field(s) missing: ${missingRequired.map(f => f.name).join(", ")}`);
      return;
    }
    setSaving(true);
    try {
      await api.put(`/assets/${id}`, { ...formData, customFields });

      const docEntries = Object.entries(docs);
      if (docEntries.length > 0) {
        const fd = new FormData();
        docEntries.forEach(([key, file]) => {
          fd.append("documents", file);
          fd.append("docTypes", key);
        });
        try {
          await api.post(`/assets/${id}/documents`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        } catch {
          setError("Asset saved, but document upload failed. Try again from the asset detail page.");
        }
      }

      setSuccess(true);
      setTimeout(() => navigate("/admin/assets"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const docCount = new Set([...Object.keys(docs), ...Object.keys(existingDocs)]).size;
  const pct = getCompletionPercentage();

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: "rgba(17,24,39,0.12)" }}>
            <EditRounded sx={{ color: "text.primary" }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Edit Asset</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Update all details for this asset record
            </Typography>
          </Box>
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackRounded />} onClick={() => navigate("/admin/assets")}
          sx={{ borderColor: "divider", color: "text.secondary", fontWeight: 700, borderRadius: "10px" }}>
          Back to Registry
        </Button>
      </Box>

      {saving && <LinearProgress sx={{ borderRadius: 2, mb: 2, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: "text.primary" } }} />}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

        {/* Completion bar */}
        <Paper sx={{
          p: 2.2, borderRadius: "20px", border: "1px solid", borderColor: "divider",
          bgcolor: "background.paper", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2.5
        }}>
          <Typography fontSize={13.5} fontWeight={800} color="text.secondary" sx={{ minWidth: 140 }}>
            Form Completion:
          </Typography>
          <Box sx={{ flex: 1 }}>
            <LinearProgress variant="determinate" value={pct}
              sx={{ height: 10, borderRadius: 5, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: pct === 100 ? "#22C55E" : "text.primary" } }} />
          </Box>
          <Typography fontSize={14} fontWeight={900} color={pct === 100 ? "#22C55E" : "text.primary"}>{pct}%</Typography>
        </Paper>

        {/* Section 1 — Hardware */}
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: "20px", bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
          <SectionLabel number="1" title="Hardware Specifications" subtitle="Basic technical and identity details of the asset." />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField required fullWidth name="name" value={formData.name} onChange={handleChange}
                sx={inputSx} label="Asset Name *" placeholder="e.g. Dell Latitude 5420" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField fullWidth name="assetTag" value={formData.assetTag || ""} onChange={handleChange}
                sx={inputSx} label="Asset ID" placeholder="e.g. ITV001" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField fullWidth name="vendor" value={formData.vendor} onChange={handleChange}
                sx={inputSx} label="OEM / Brand" placeholder="e.g. Dell" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField fullWidth name="modelNumber" value={formData.modelNumber} onChange={handleChange}
                sx={inputSx} label="Model Number" placeholder="e.g. LAT-5420-X" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField required fullWidth name="serialNumber" value={formData.serialNumber} onChange={handleChange}
                sx={inputSx} label="Serial Number / Service Tag *" placeholder="e.g. 8JZ91A" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth name="purchaseCost" value={formData.purchaseCost} onChange={handleChange}
                sx={inputSx} label="Purchase Cost (₹)" placeholder="e.g. 85000"
                type="number" slotProps={{ htmlInput: { min: 0, step: "any" } }}
                onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                onWheel={(e) => e.target.blur()} />
            </Grid>

            {customFieldConfigs.length > 0 && (
              <Grid size={12}>
                <Divider sx={{ my: 1.5 }}>
                  <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Custom CMDB Specifications
                  </Typography>
                </Divider>
              </Grid>
            )}
            {customFieldConfigs.map((field) => (
              <Grid key={field._id} size={{ xs: 12, sm: 6, md: 4 }}>
                {field.type === "Select" ? (
                  <TextField select fullWidth required={field.isRequired}
                    label={`${field.name}${field.isRequired ? " *" : ""}`}
                    value={customFields[field.name] || ""}
                    onChange={(e) => setCustomFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                    sx={inputSx}>
                    {field.options.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                  </TextField>
                ) : (
                  <TextField fullWidth required={field.isRequired}
                    type={field.type === "Number" ? "number" : field.type === "Date" ? "date" : "text"}
                    label={`${field.name}${field.isRequired ? " *" : ""}`}
                    value={customFields[field.name] || ""}
                    onChange={(e) => setCustomFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                    sx={inputSx}
                    slotProps={field.type === "Date" ? { inputLabel: { shrink: true } } : undefined} />
                )}
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Section 2 — Lifecycle */}
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: "20px", bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
          <SectionLabel number="2" title="Lifecycle & Vendor Data" subtitle="Warranty period, procurement date and service partner." />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth name="servicePartnerName" value={formData.servicePartnerName}
                onChange={handleChange} sx={inputSx} label="Authorized Service Partner" placeholder="e.g. Dell ProSupport"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button variant="text" size="small" onClick={() => setScDialogOpen(true)}
                          sx={{ fontSize: 11, fontWeight: 800, textTransform: "none", color: "text.primary", minWidth: 0, p: 0.5 }}>
                          Select Registered
                        </Button>
                      </InputAdornment>
                    )
                  }
                }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth name="servicePartnerContact" value={formData.servicePartnerContact}
                onChange={handleChange} sx={inputSx} label="Contact Person Name" placeholder="e.g. John Doe" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth name="supportPhone" value={formData.supportPhone}
                onChange={e => setFormData(prev => ({ ...prev, supportPhone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))}
                sx={inputSx} label="Support Phone" placeholder="e.g. 9876543210"
                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 10 } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth type="email" name="supportEmail" value={formData.supportEmail}
                onChange={handleChange} sx={inputSx} label="Support Email" placeholder="support@vendor.com" />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 3 — Purchase Details */}
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: "20px", bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
          <SectionLabel number="3" title="Purchase & Transaction Details" subtitle="Vendor purchase details, address, and GST registration." />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth type="date" name="procurementDate" value={formData.procurementDate}
                onChange={handleChange} sx={inputSx} label="Procurement Date" slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth type="date" name="warrantyStart" value={formData.warrantyStart}
                onChange={handleChange} sx={inputSx} label="Warranty Start" slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth type="date" name="warrantyEnd" value={formData.warrantyEnd}
                onChange={handleChange} sx={inputSx} label="Warranty Expiry" slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth name="purchaseFromName" value={formData.purchaseFromName}
                onChange={handleChange} sx={inputSx} label="Purchase From (Vendor Name)" placeholder="e.g. Reliance Retail" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth name="purchaseFromGst" value={formData.purchaseFromGst}
                onChange={handleChange} sx={inputSx} label="Vendor GST Number" placeholder="e.g. 27AAAAA1111A1Z1" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth name="purchaseFromPhone" value={formData.purchaseFromPhone}
                onChange={e => setFormData(prev => ({ ...prev, purchaseFromPhone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))}
                sx={inputSx} label="Vendor Phone" placeholder="e.g. 9876543210"
                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 10 } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth type="email" name="purchaseFromEmail" value={formData.purchaseFromEmail}
                onChange={handleChange} sx={inputSx} label="Vendor Email" placeholder="sales@vendor.com" />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth multiline rows={2} name="purchaseFromAddress" value={formData.purchaseFromAddress}
                onChange={handleChange} sx={inputSx} label="Vendor Address" placeholder="Street, City, State, ZIP" />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 4 — Deployment */}
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: "20px", bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
          <SectionLabel number="4" title="Deployment" subtitle="Assign to a department." />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required sx={inputSx} disabled={currentUser?.role === 'hod'}>
                <InputLabel>Target Department *</InputLabel>
                <Select
                  name="department"
                  value={formData.department}
                  label="Target Department *"
                  onChange={handleChange}
                >
                  {departments.map(d => (
                    <MenuItem key={d._id} value={d.name}>{d.name}</MenuItem>
                  ))}
                  <MenuItem value="Others">Others</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth name="location" value={formData.location}
                onChange={handleChange} sx={inputSx} label="Location"
                placeholder="e.g. 4th Floor, Bengaluru Office" />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth multiline rows={2} name="notes" value={formData.notes}
                onChange={handleChange} sx={inputSx} label="Notes (optional)"
                placeholder="Any additional notes about this asset..." />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 5 — Documents */}
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: "20px", bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 3 }}>
            <SectionLabel number="5" title="Document Vault" subtitle="Attach invoice, warranty card, AMC contract, manual and service reports." />
            {docCount > 0 && (
              <Chip label={`${docCount} file${docCount > 1 ? "s" : ""} attached`}
                size="small" sx={{ background: "#FBBF24", color: "#111827", fontWeight: 800, fontSize: 11 }} />
            )}
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
            {DOC_TYPES.map(({ key, label, accept }) => {
              const file = docs[key];
              const existing = existingDocs[key];
              const attached = file || existing;
              return (
                <Box key={key} sx={{
                  p: 2, borderRadius: "14px", border: "1.5px dashed",
                  borderColor: attached ? "#111827" : "divider",
                  bgcolor: attached ? "rgba(17,24,39,0.04)" : "background.default",
                  display: "flex", flexDirection: "column", gap: 1, transition: "all 0.2s ease",
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: attached ? "#111827" : "text.secondary" }}>{label}</Typography>
                    {file && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <CheckCircleRounded sx={{ fontSize: 14, color: "text.primary" }} />
                        <Button size="small" onClick={() => setDocs(prev => { const n = { ...prev }; delete n[key]; return n; })}
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
                  ) : existing ? (
                    <>
                      <Typography component="a" href={getFileUrl(existing.url)} target="_blank" rel="noopener noreferrer"
                        sx={{ fontSize: 11.5, color: "text.secondary", fontWeight: 500, wordBreak: "break-all", textDecoration: "underline" }}>
                        {existing.originalName.length > 28 ? existing.originalName.substring(0, 28) + "…" : existing.originalName}
                      </Typography>
                      <Button component="label" size="small" startIcon={<UploadFileRounded sx={{ fontSize: 15 }} />}
                        sx={{ justifyContent: "flex-start", borderRadius: "8px", fontWeight: 700, fontSize: 12, color: "text.secondary", p: 0, "&:hover": { color: "text.primary", bgcolor: "transparent" } }}>
                        Replace
                        <input type="file" hidden accept={accept}
                          onChange={(e) => e.target.files[0] && setDocs(prev => ({ ...prev, [key]: e.target.files[0] }))} />
                      </Button>
                    </>
                  ) : (
                    <Button component="label" size="small" startIcon={<UploadFileRounded sx={{ fontSize: 15 }} />}
                      sx={{ justifyContent: "flex-start", borderRadius: "8px", fontWeight: 700, fontSize: 12, color: "text.secondary", p: 0, "&:hover": { color: "text.primary", bgcolor: "transparent" } }}>
                      Upload {accept.includes("pdf") ? "PDF" : "file"}
                      <input type="file" hidden accept={accept}
                        onChange={(e) => e.target.files[0] && setDocs(prev => ({ ...prev, [key]: e.target.files[0] }))} />
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

        {/* Actions */}
        {error && (
          <Alert severity="error" sx={{ borderRadius: "12px", fontWeight: 600 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={() => navigate("/admin/assets")}
            sx={{ borderColor: "divider", color: "text.secondary", fontWeight: 700, borderRadius: "12px", px: 3, py: 1.2 }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveRounded />}
            sx={{ background: "#FBBF24", color: "#111827", fontWeight: 800, borderRadius: "12px", boxShadow: "none", px: 4, py: 1.4, fontSize: 15, "&:hover": { background: "#F5A623", boxShadow: "none" } }}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </Box>
      </Box>

      {/* Service Centers Selector */}
      <Dialog open={scDialogOpen} onClose={() => setScDialogOpen(false)} fullWidth maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: "20px", bgcolor: "background.paper" } } }}>
        <DialogTitle sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={900} fontSize={17}>Select Registered Service Center</Typography>
          <IconButton size="small" onClick={() => setScDialogOpen(false)} sx={{ bgcolor: "action.hover" }}><CloseRounded fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {serviceCenters.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography fontSize={13} color="text.secondary" fontWeight={600}>No registered service centers found.</Typography>
            </Box>
          ) : (
            <List sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {serviceCenters.map(sc => (
                <ListItemButton key={sc._id}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      servicePartnerName: sc.name,
                      servicePartnerContact: sc.contactPerson || "",
                      supportPhone: sc.phone || "",
                      supportEmail: sc.email || "",
                    }));
                    setScDialogOpen(false);
                  }}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", p: 1.5 }}>
                  <ListItemText
                    primary={<Typography fontWeight={800} fontSize={14}>{sc.name}</Typography>}
                    secondary={<Typography fontSize={12} color="text.secondary" mt={0.5}>
                      {sc.contactPerson ? `Contact: ${sc.contactPerson}` : ""}
                      {sc.phone ? ` · Phone: ${sc.phone}` : ""}
                    </Typography>} />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: "14px", fontWeight: 800 }}>
          Asset updated successfully.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditAsset;
