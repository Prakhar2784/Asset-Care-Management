import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddRounded,
  BusinessRounded,
  CloseRounded,
  DeleteRounded,
  EditRounded,
  EmailRounded,
  HandshakeRounded,
  LocationOnRounded,
  PhoneRounded,
  VerifiedRounded,
  VisibilityRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
import api from "../../api/axios";

const initialVendorForm = {
  name: "",
  vendorType: "Service Provider",
  serviceCategory: "IT Hardware",
  contactPerson: "",
  phone: "",
  alternatePhone: "",
  email: "",
  supportEmail: "",
  supportPhone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gstNumber: "",
  panNumber: "",
  serviceCoverage: "On-site",
  slaResponseTime: "24 Hours",
  escalationName: "",
  escalationPhone: "",
  escalationEmail: "",
  contractStartDate: "",
  contractEndDate: "",
  paymentTerms: "30 Days",
  status: "Active",
  remarks: "",
};

const vendorTypes = ["OEM", "Dealer", "Service Provider", "AMC Vendor", "Warranty Provider", "Other"];
const serviceCategories = ["IT Hardware", "Software", "Electrical", "Electronics", "Networking", "CCTV & Security", "Furniture", "Vehicle", "Building Maintenance", "Other"];
const coverageOptions = ["On-site", "Remote", "Pickup & Drop", "Hybrid"];
const slaOptions = ["2 Hours", "4 Hours", "8 Hours", "24 Hours", "48 Hours", "Best Effort"];
const paymentOptions = ["Immediate", "15 Days", "30 Days", "45 Days", "60 Days", "As per contract"];
const statusOptions = ["Active", "Inactive", "Blacklisted"];

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    fontWeight: 700,
    color: "text.primary",
    "& fieldset": { borderColor: "divider" },
  },
  "& .MuiInputLabel-root": { color: "text.secondary", fontWeight: 700 },
};

const STATUS_STYLE = {
  Active:      { color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  Inactive:    { color: "text.secondary", bg: "action.selected" },
  Blacklisted: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [editingVendorId, setEditingVendorId] = useState(null);

  const [vendorForm, setVendorForm] = useState(initialVendorForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get("/vendors");
      setVendors(res.data || []);
    } catch (error) {
      setSnackbar({ open: true, message: error?.response?.data?.message || "Failed to fetch vendors.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => ({
    total: vendors.length,
    active: vendors.filter(v => v.status === "Active").length,
    amc: vendors.filter(v => v.vendorType === "AMC Vendor").length,
    oem: vendors.filter(v => v.vendorType === "OEM").length,
  }), [vendors]);

  const handleInputChange = (field, value) => {
    setVendorForm(prev => ({ ...prev, [field]: value }));
  };

  const openAddForm = () => {
    setEditingVendorId(null);
    setVendorForm(initialVendorForm);
    setFormOpen(true);
  };

  const openEditForm = (vendor) => {
    setEditingVendorId(vendor._id);
    setVendorForm({
      ...initialVendorForm,
      ...vendor,
      contractStartDate: vendor.contractStartDate ? vendor.contractStartDate.slice(0, 10) : "",
      contractEndDate: vendor.contractEndDate ? vendor.contractEndDate.slice(0, 10) : "",
    });
    setFormOpen(true);
  };

  const validateForm = () => {
    if (!vendorForm.name || !vendorForm.vendorType || !vendorForm.serviceCategory || !vendorForm.contactPerson || !vendorForm.phone || !vendorForm.email || !vendorForm.address) {
      setSnackbar({ open: true, message: "Please fill all required fields.", severity: "error" });
      return false;
    }
    return true;
  };

  const handleSaveVendor = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editingVendorId) {
        await api.put(`/vendors/${editingVendorId}`, vendorForm);
        setSnackbar({ open: true, message: "Vendor updated successfully.", severity: "success" });
      } else {
        await api.post("/vendors", vendorForm);
        setSnackbar({ open: true, message: "Vendor added successfully.", severity: "success" });
      }
      setFormOpen(false);
      setVendorForm(initialVendorForm);
      setEditingVendorId(null);
      fetchVendors();
    } catch (error) {
      setSnackbar({ open: true, message: error?.response?.data?.message || "Failed to save vendor.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    try {
      await api.delete(`/vendors/${vendorToDelete._id}`);
      setSnackbar({ open: true, message: "Vendor deleted successfully.", severity: "success" });
      fetchVendors();
    } catch (error) {
      setSnackbar({ open: true, message: error?.response?.data?.message || "Failed to delete vendor.", severity: "error" });
    } finally {
      setDeleteDialogOpen(false);
      setVendorToDelete(null);
    }
  };

  const kpis = [
    { label: "Total Vendors",  value: summary.total,  color: "#A855F7", icon: <BusinessRounded fontSize="small" /> },
    { label: "Active Vendors", value: summary.active, color: "#22C55E", icon: <VerifiedRounded fontSize="small" /> },
    { label: "AMC Vendors",    value: summary.amc,    color: "#F59E0B", icon: <HandshakeRounded fontSize="small" /> },
    { label: "OEM Vendors",    value: summary.oem,    color: "#3B82F6", icon: <BusinessRounded fontSize="small" /> },
  ];

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: "rgba(124,58,237,0.12)" }}>
            <BusinessRounded sx={{ color: "#A855F7" }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Vendors & Service Network</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Manage OEM, AMC, warranty and service vendor relationships
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddRounded />} onClick={openAddForm}
          sx={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff", fontWeight: 800, borderRadius: "12px", px: 2.5, boxShadow: "none" }}>
          Add Vendor
        </Button>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {kpis.map(k => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={k.label}>
            <Paper sx={{ p: 2.5, borderRadius: "16px", border: 1, borderColor: "divider", position: "relative", overflow: "hidden" }}>
              <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: k.color }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: `${k.color}18`, display: "grid", placeItems: "center" }}>
                  <Box sx={{ color: k.color }}>{k.icon}</Box>
                </Box>
              </Box>
              <Typography sx={{ fontSize: 28, fontWeight: 950, color: "text.primary", lineHeight: 1, letterSpacing: "-1px", mt: 1.5, mb: 0.3 }}>{k.value}</Typography>
              <Typography fontSize={13} fontWeight={700} color="text.primary">{k.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 5 }}>
          <CircularProgress />
        </Box>
      ) : vendors.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: "center", borderRadius: "20px", border: "1px dashed", borderColor: "divider" }}>
          <Box sx={{ width: 72, height: 72, borderRadius: "20px", bgcolor: "rgba(124,58,237,0.08)", display: "grid", placeItems: "center", mx: "auto", mb: 2 }}>
            <BusinessRounded sx={{ fontSize: 36, color: "#A855F7" }} />
          </Box>
          <Typography fontWeight={800} fontSize={20} color="text.primary">No vendors added yet</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Add OEM, AMC, warranty and service vendors for asset support tracking.
          </Typography>
          <Button variant="contained" startIcon={<AddRounded />} onClick={openAddForm}
            sx={{ mt: 3, background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff", fontWeight: 800, borderRadius: "12px", boxShadow: "none" }}>
            Add First Vendor
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {vendors.map(vendor => {
            const st = STATUS_STYLE[vendor.status] || STATUS_STYLE.Active;
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={vendor._id}>
                <Paper sx={{
                  p: 3, borderRadius: "20px", border: "1px solid", borderColor: "divider",
                  height: "100%", bgcolor: "background.paper", position: "relative", overflow: "hidden",
                  transition: "box-shadow 0.2s", "&:hover": { boxShadow: "0 8px 32px rgba(124,58,237,0.12)" }
                }}>
                  <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#7C3AED,#A855F7)" }} />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mt: 0.5, gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 950, fontSize: 18, color: "text.primary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {vendor.name}
                      </Typography>
                      <Typography sx={{ color: "text.secondary", fontWeight: 700, fontSize: 12, mt: 0.3 }}>
                        {vendor.vendorType} · {vendor.serviceCategory}
                      </Typography>
                    </Box>
                    <Box sx={{
                      display: "inline-flex", px: 1.5, py: 0.4, borderRadius: "20px", flexShrink: 0,
                      bgcolor: st.bg, color: st.color, fontSize: 11, fontWeight: 800
                    }}>
                      {vendor.status || "Active"}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <InfoRow icon={<BusinessRounded fontSize="small" />} text={vendor.contactPerson} />
                  <InfoRow icon={<PhoneRounded fontSize="small" />} text={vendor.phone} />
                  <InfoRow icon={<EmailRounded fontSize="small" />} text={vendor.email} />
                  <InfoRow
                    icon={<LocationOnRounded fontSize="small" />}
                    text={`${vendor.city || ""}${vendor.city && vendor.state ? ", " : ""}${vendor.state || ""}` || "—"}
                  />

                  {(vendor.slaResponseTime || vendor.serviceCoverage) && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {vendor.slaResponseTime && (
                        <Box sx={{ display: "inline-flex", px: 1.2, py: 0.3, borderRadius: "20px", bgcolor: "rgba(59,130,246,0.10)", color: "#3B82F6", fontSize: 11, fontWeight: 700 }}>
                          SLA: {vendor.slaResponseTime}
                        </Box>
                      )}
                      {vendor.serviceCoverage && (
                        <Box sx={{ display: "inline-flex", px: 1.2, py: 0.3, borderRadius: "20px", bgcolor: "rgba(124,58,237,0.10)", color: "#A855F7", fontSize: 11, fontWeight: 700 }}>
                          {vendor.serviceCoverage}
                        </Box>
                      )}
                    </Box>
                  )}

                  <Box sx={{ display: "flex", gap: 1.2, mt: 2.5 }}>
                    <Button variant="outlined" fullWidth startIcon={<VisibilityRounded />}
                      onClick={() => { setSelectedVendor(vendor); setDetailOpen(true); }}
                      sx={{ borderRadius: "10px", fontWeight: 800, textTransform: "none", borderColor: "divider", color: "text.primary", fontSize: 13 }}>
                      View
                    </Button>
                    <IconButton onClick={() => openEditForm(vendor)}
                      sx={{ border: "1px solid", borderColor: "divider", borderRadius: "10px", color: "text.secondary", "&:hover": { color: "text.primary", borderColor: "text.secondary" } }}>
                      <EditRounded />
                    </IconButton>
                    <IconButton onClick={() => { setVendorToDelete(vendor); setDeleteDialogOpen(true); }}
                      sx={{ border: "1px solid rgba(239,68,68,0.4)", borderRadius: "10px", color: "#EF4444", "&:hover": { bgcolor: "rgba(239,68,68,0.08)" } }}>
                      <DeleteRounded />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add / Edit Vendor Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: "20px", overflow: "hidden" } } }}>
        <Box sx={{ p: 3, background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(168,85,247,0.05))", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "linear-gradient(135deg,#7C3AED,#A855F7)", display: "grid", placeItems: "center" }}>
              <BusinessRounded sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography fontWeight={900} fontSize={18}>{editingVendorId ? "Update Vendor" : "Add New Vendor"}</Typography>
              <Typography fontSize={12} color="text.secondary">Fill vendor contact, service, warranty, AMC and escalation details</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setFormOpen(false)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}>
            <CloseRounded />
          </IconButton>
        </Box>

        <DialogContent sx={{ pt: 3, bgcolor: "background.default", borderColor: "divider", maxHeight: "70vh" }}>
          <FormBlock title="Basic Vendor Details">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth required label="Vendor / Company Name" value={vendorForm.name} onChange={e => handleInputChange("name", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select fullWidth required label="Vendor Type" value={vendorForm.vendorType} onChange={e => handleInputChange("vendorType", e.target.value)} sx={inputStyles}>
                  {vendorTypes.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select fullWidth required label="Service Category" value={vendorForm.serviceCategory} onChange={e => handleInputChange("serviceCategory", e.target.value)} sx={inputStyles}>
                  {serviceCategories.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select fullWidth label="Status" value={vendorForm.status} onChange={e => handleInputChange("status", e.target.value)} sx={inputStyles}>
                  {statusOptions.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </FormBlock>

          <FormBlock title="Contact Details">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth required label="Primary Contact Person" value={vendorForm.contactPerson} onChange={e => handleInputChange("contactPerson", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth required label="Primary Phone" value={vendorForm.phone} onChange={e => handleInputChange("phone", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Alternate Phone" value={vendorForm.alternatePhone} onChange={e => handleInputChange("alternatePhone", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth required label="Primary Email" value={vendorForm.email} onChange={e => handleInputChange("email", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Support Email" value={vendorForm.supportEmail} onChange={e => handleInputChange("supportEmail", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Support Phone" value={vendorForm.supportPhone} onChange={e => handleInputChange("supportPhone", e.target.value)} sx={inputStyles} />
              </Grid>
            </Grid>
          </FormBlock>

          <FormBlock title="Address & Legal Details">
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField fullWidth required multiline minRows={2} label="Address" value={vendorForm.address} onChange={e => handleInputChange("address", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="City" value={vendorForm.city} onChange={e => handleInputChange("city", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="State" value={vendorForm.state} onChange={e => handleInputChange("state", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Pincode" value={vendorForm.pincode} onChange={e => handleInputChange("pincode", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="GST Number" value={vendorForm.gstNumber} onChange={e => handleInputChange("gstNumber", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="PAN Number" value={vendorForm.panNumber} onChange={e => handleInputChange("panNumber", e.target.value)} sx={inputStyles} />
              </Grid>
            </Grid>
          </FormBlock>

          <FormBlock title="Service, Warranty & AMC Details">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField select fullWidth label="Service Coverage" value={vendorForm.serviceCoverage} onChange={e => handleInputChange("serviceCoverage", e.target.value)} sx={inputStyles}>
                  {coverageOptions.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField select fullWidth label="SLA Response Time" value={vendorForm.slaResponseTime} onChange={e => handleInputChange("slaResponseTime", e.target.value)} sx={inputStyles}>
                  {slaOptions.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField select fullWidth label="Payment Terms" value={vendorForm.paymentTerms} onChange={e => handleInputChange("paymentTerms", e.target.value)} sx={inputStyles}>
                  {paymentOptions.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth type="date" label="Contract / AMC Start Date" slotProps={{ inputLabel: { shrink: true } }} value={vendorForm.contractStartDate} onChange={e => handleInputChange("contractStartDate", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth type="date" label="Contract / AMC End Date" slotProps={{ inputLabel: { shrink: true } }} value={vendorForm.contractEndDate} onChange={e => handleInputChange("contractEndDate", e.target.value)} sx={inputStyles} />
              </Grid>
            </Grid>
          </FormBlock>

          <FormBlock title="Escalation Details">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Escalation Person" value={vendorForm.escalationName} onChange={e => handleInputChange("escalationName", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Escalation Phone" value={vendorForm.escalationPhone} onChange={e => handleInputChange("escalationPhone", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Escalation Email" value={vendorForm.escalationEmail} onChange={e => handleInputChange("escalationEmail", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth multiline minRows={3} label="Remarks / Notes" value={vendorForm.remarks} onChange={e => handleInputChange("remarks", e.target.value)} sx={inputStyles} />
              </Grid>
            </Grid>
          </FormBlock>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setFormOpen(false)} sx={{ fontWeight: 800, textTransform: "none", color: "text.secondary", borderRadius: "10px" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveVendor} disabled={saving}
            sx={{ borderRadius: "12px", background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff", fontWeight: 800, px: 3, boxShadow: "none", textTransform: "none" }}>
            {saving ? "Saving..." : editingVendorId ? "Update Vendor" : "Save Vendor"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vendor Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: "20px", overflow: "hidden" } } }}>
        <Box sx={{ p: 3, background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(168,85,247,0.05))", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "linear-gradient(135deg,#7C3AED,#A855F7)", display: "grid", placeItems: "center" }}>
              <BusinessRounded sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography fontWeight={900} fontSize={18}>Vendor Details</Typography>
              <Typography fontSize={12} color="text.secondary">{selectedVendor?.name}</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDetailOpen(false)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}>
            <CloseRounded />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {selectedVendor && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography fontWeight={950} fontSize={22} color="text.primary">{selectedVendor.name}</Typography>
                <Typography color="text.secondary" fontWeight={800} fontSize={13}>
                  {selectedVendor.vendorType} · {selectedVendor.serviceCategory}
                </Typography>
              </Box>
              <DetailRow label="Contact Person" value={selectedVendor.contactPerson} />
              <DetailRow label="Phone" value={selectedVendor.phone} />
              <DetailRow label="Alternate Phone" value={selectedVendor.alternatePhone} />
              <DetailRow label="Email" value={selectedVendor.email} />
              <DetailRow label="Support Email" value={selectedVendor.supportEmail} />
              <DetailRow label="Support Phone" value={selectedVendor.supportPhone} />
              <DetailRow label="Address" value={selectedVendor.address} />
              <DetailRow label="City / State" value={`${selectedVendor.city || "—"} / ${selectedVendor.state || "—"}`} />
              <DetailRow label="GST Number" value={selectedVendor.gstNumber} />
              <DetailRow label="PAN Number" value={selectedVendor.panNumber} />
              <DetailRow label="Service Coverage" value={selectedVendor.serviceCoverage} />
              <DetailRow label="SLA Response Time" value={selectedVendor.slaResponseTime} />
              <DetailRow label="Payment Terms" value={selectedVendor.paymentTerms} />
              <DetailRow label="Escalation Person" value={selectedVendor.escalationName} />
              <DetailRow label="Escalation Phone" value={selectedVendor.escalationPhone} />
              <DetailRow label="Escalation Email" value={selectedVendor.escalationEmail} />
              <DetailRow label="Status" value={selectedVendor.status} />
              <DetailRow label="Remarks" value={selectedVendor.remarks} />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setVendorToDelete(null); }} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "20px", overflow: "hidden" } } }}>
        <Box sx={{ p: 3, background: "linear-gradient(135deg,rgba(239,68,68,0.08),rgba(239,68,68,0.02))", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: "rgba(239,68,68,0.12)", display: "grid", placeItems: "center" }}>
              <WarningAmberRounded sx={{ color: "#EF4444", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography fontWeight={900} fontSize={17}>Delete Vendor</Typography>
              <Typography fontSize={12} color="text.secondary">This action cannot be undone</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => { setDeleteDialogOpen(false); setVendorToDelete(null); }} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}>
            <CloseRounded />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Typography color="text.secondary" fontWeight={600}>
            Are you sure you want to delete <strong style={{ color: "inherit" }}>{vendorToDelete?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => { setDeleteDialogOpen(false); setVendorToDelete(null); }}
            sx={{ fontWeight: 800, textTransform: "none", color: "text.secondary", borderRadius: "10px" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleDeleteVendor}
            sx={{ bgcolor: "#EF4444", "&:hover": { bgcolor: "#DC2626" }, fontWeight: 800, textTransform: "none", borderRadius: "10px", px: 3, boxShadow: "none" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: "12px" }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

const FormBlock = ({ title, children }) => (
  <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: "16px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
    <Typography sx={{ fontWeight: 900, fontSize: 15, mb: 2, color: "text.primary" }}>{title}</Typography>
    {children}
  </Paper>
);

const InfoRow = ({ icon, text }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.3, mb: 1.2, color: "text.secondary" }}>
    {icon}
    <Typography sx={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text || "—"}</Typography>
  </Box>
);

const DetailRow = ({ label, value }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1.1, borderBottom: "1px solid", borderColor: "divider" }}>
    <Typography sx={{ fontWeight: 800, color: "text.secondary", fontSize: 13, flexShrink: 0 }}>{label}</Typography>
    <Typography sx={{ fontWeight: 700, textAlign: "right", color: "text.primary", fontSize: 13 }}>{value || "—"}</Typography>
  </Box>
);

export default Vendors;
