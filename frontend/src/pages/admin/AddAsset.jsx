import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Typography,
  CircularProgress
} from "@mui/material";
import {
  SaveRounded,
  UploadFileRounded,
  MemoryRounded,
  EngineeringRounded,
  BusinessRounded,
  LocationOnRounded,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const AddAsset = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State mapping to Mongoose Schema + File handling
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
    invoiceFile: null, // New state for Invoice
    slaFile: null      // New state for SLA
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  // Handler for File Attachments
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData({ ...formData, [name]: files[0] });
      setError(null);
    }
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
      // Note: If you want to actually upload these files to your Node.js backend, 
      // you will eventually need to switch this to use FormData() and setup 'multer' on your backend.
      // For now, it passes the data identically to your existing setup.
      await api.post('/assets', formData);
      
      setOpen(true);

      setTimeout(() => {
        navigate("/admin/assets");
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to provision asset. Please ensure the serial number is unique.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "background.paper",
      color: "text.primary",
      borderRadius: "16px",
      fontWeight: 600,
      minHeight: "58px",
      "& fieldset": { borderColor: "divider" },
      "&:hover fieldset": { borderColor: "text.disabled" },
      "&.Mui-focused fieldset": { borderColor: "#0F766E", borderWidth: "2px" },
    },
    "& .MuiInputLabel-root": { color: "text.secondary", fontWeight: 700 },
    "& .MuiInputLabel-root.Mui-focused": { color: "#0F766E" },
    "& input": { fontWeight: 700, paddingTop: "17px", paddingBottom: "17px" },
    "& .MuiSelect-select": { fontWeight: 700, paddingTop: "17px", paddingBottom: "17px" },
  };

  const SectionTitle = ({ icon, title, subtitle }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4, flexWrap: "wrap" }}>
      <Box sx={{ width: 58, height: 58, borderRadius: "18px", background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", display: "grid", placeItems: "center", boxShadow: "0 14px 30px rgba(15,118,110,0.25)" }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: { xs: "20px", md: "26px" }, fontWeight: 950, color: "text.primary", letterSpacing: "-0.8px" }}>
          {title}
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: { xs: "14px", md: "16px" }, fontWeight: 700, mt: 0.5 }}>
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );

  // Helper to truncate long file names
  const formatFileName = (file, defaultText) => {
    if (!file) return defaultText;
    return file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name;
  };

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="Register New Asset"
        subtitle="Add a new company asset for warranty monitoring, service tracking and department allocation."
      />

      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Paper
          component="form"
          onSubmit={handleSubmit}
          sx={{ p: { xs: 2.5, md: 5 }, borderRadius: "30px", bgcolor: "background.paper", border: "1px solid", borderColor: "divider", boxShadow: "0 24px 60px rgba(15,23,42,0.08)", overflow: "hidden", position: "relative" }}
        >
          <Box sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: "24px", background: "linear-gradient(135deg, rgba(30,58,138,0.07), rgba(15,118,110,0.07))", border: "1px solid", borderColor: "divider", mb: 5 }}>
            <Typography sx={{ fontSize: { xs: "24px", md: "30px" }, fontWeight: 950, color: "text.primary" }}>
              Asset Information
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", fontWeight: 600, lineHeight: 1.7 }}>
              Fill the asset details carefully. This data will be used for warranty alerts, breakdown tickets and vendor service records.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 4, borderRadius: "12px", fontWeight: 600 }}>
              {error}
            </Alert>
          )}

          <SectionTitle icon={<MemoryRounded />} title="Hardware Specifications" subtitle="Basic technical and identity details of the asset." />

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}><TextField required fullWidth name="name" value={formData.name} onChange={handleChange} sx={inputStyles} label="Asset Name" placeholder="Dell Latitude 5420" /></Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField required fullWidth select name="category" value={formData.category} onChange={handleChange} sx={inputStyles} label="Category">
                <MenuItem value="IT Asset">IT Asset</MenuItem>
                <MenuItem value="Electrical">Electrical</MenuItem>
                <MenuItem value="Electronic">Electronic</MenuItem>
                <MenuItem value="Furniture">Furniture</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField required fullWidth select name="formFactor" value={formData.formFactor} onChange={handleChange} sx={inputStyles} label="Asset Form Factor">
                <MenuItem value="Movable">Movable</MenuItem>
                <MenuItem value="Immovable">Immovable</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}><TextField fullWidth name="vendor" value={formData.vendor} onChange={handleChange} sx={inputStyles} label="OEM / Brand" placeholder="Dell" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth name="modelNumber" value={formData.modelNumber} onChange={handleChange} sx={inputStyles} label="Model Number" placeholder="LAT-5420-X" /></Grid>
            <Grid item xs={12} md={4}><TextField required fullWidth name="serialNumber" value={formData.serialNumber} onChange={handleChange} sx={inputStyles} label="Serial Number / Service Tag" placeholder="8JZ91A" /></Grid>
          </Grid>

          <Divider sx={{ my: 5 }} />

          <SectionTitle icon={<EngineeringRounded />} title="Lifecycle & Vendor Data" subtitle="Warranty, procurement and service partner information." />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}><TextField fullWidth type="date" name="procurementDate" value={formData.procurementDate} onChange={handleChange} sx={inputStyles} label="Procurement Date" InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6} md={4}><TextField fullWidth type="date" name="warrantyStart" value={formData.warrantyStart} onChange={handleChange} sx={inputStyles} label="Warranty Start" InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6} md={4}><TextField fullWidth type="date" name="warrantyEnd" value={formData.warrantyEnd} onChange={handleChange} sx={inputStyles} label="Warranty Expiry" InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth name="vendor" value={formData.vendor} onChange={handleChange} sx={inputStyles} label="Authorized Service Partner" placeholder="Dell ProSupport" /></Grid>
            <Grid item xs={12} sm={6} md={4}><TextField fullWidth name="supportPhone" value={formData.supportPhone} onChange={handleChange} sx={inputStyles} label="Support Contact Phone" placeholder="+91 800-456-7890" /></Grid>
            <Grid item xs={12} sm={6} md={4}><TextField fullWidth type="email" name="supportEmail" value={formData.supportEmail} onChange={handleChange} sx={inputStyles} label="Support Contact Email" placeholder="support@vendor.com" /></Grid>
          </Grid>

          <Divider sx={{ my: 5 }} />

          <SectionTitle icon={<BusinessRounded />} title="Deployment Allocation" subtitle="Department, location and current asset status." />

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField required fullWidth select name="department" value={formData.department} onChange={handleChange} sx={inputStyles} label="Target Department">
                <MenuItem value="Information Technology">Information Technology</MenuItem>
                <MenuItem value="Administration">Administration</MenuItem>
                <MenuItem value="Finance & Accounts">Finance & Accounts</MenuItem>
                <MenuItem value="Operations">Operations</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth name="location" value={formData.location} onChange={handleChange} sx={inputStyles} label="Physical Location" placeholder="Tower B, Floor 4" InputProps={{ startAdornment: (<LocationOnRounded sx={{ color: "#64748B", mr: 1 }} />) }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField required fullWidth select name="status" value={formData.status} onChange={handleChange} sx={inputStyles} label="Current Status">
                <MenuItem value="Active">Active / Deployed</MenuItem>
                <MenuItem value="In Transit">In Transit</MenuItem>
                <MenuItem value="Under Repair">Under Repair</MenuItem>
                <MenuItem value="Scrap">Decommissioned</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 5 }} />

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", width: { xs: "100%", md: "auto" } }}>
              
              {/* FIXED INVOICE ATTACHMENT BUTTON */}
              <Button
                component="label"
                variant="outlined"
                fullWidth
                startIcon={<UploadFileRounded />}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  borderColor: formData.invoiceFile ? "#0F766E" : "#CBD5E1",
                  color: formData.invoiceFile ? "#0F766E" : "#1E3A8A",
                  bgcolor: formData.invoiceFile ? "#F0FDFA" : "transparent",
                  borderRadius: "14px",
                  fontWeight: 800,
                  textTransform: "none",
                  px: 3,
                  py: 1.2,
                }}
              >
                {formatFileName(formData.invoiceFile, "Attach Invoice")}
                <input
                  type="file"
                  name="invoiceFile"
                  hidden
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
              </Button>

              {/* FIXED SLA ATTACHMENT BUTTON */}
              <Button
                component="label"
                variant="outlined"
                fullWidth
                startIcon={<UploadFileRounded />}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  borderColor: formData.slaFile ? "#0F766E" : "#CBD5E1",
                  color: formData.slaFile ? "#0F766E" : "#1E3A8A",
                  bgcolor: formData.slaFile ? "#F0FDFA" : "transparent",
                  borderRadius: "14px",
                  fontWeight: 800,
                  textTransform: "none",
                  px: 3,
                  py: 1.2,
                }}
              >
                {formatFileName(formData.slaFile, "Attach SLA / Warranty")}
                <input
                  type="file"
                  name="slaFile"
                  hidden
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
              </Button>

            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveRounded />}
              sx={{
                width: { xs: "100%", md: "auto" },
                background: "linear-gradient(135deg, #1E3A8A, #0F766E)",
                color: "#FFFFFF",
                fontWeight: 900,
                textTransform: "none",
                borderRadius: "14px",
                px: 4,
                py: 1.25,
                boxShadow: "0 14px 28px rgba(15,118,110,0.26)",
                "&:hover": { background: "linear-gradient(135deg, #1D4ED8, #0D9488)" },
              }}
            >
              {loading ? "Processing..." : "Initialize Asset"}
            </Button>
          </Box>
        </Paper>
      </motion.div>

      <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" sx={{ bgcolor: "#0F766E", color: "#FFFFFF", borderRadius: "14px", fontWeight: 800 }}>
          Asset initialized successfully.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddAsset;