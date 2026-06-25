import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  LocationOnRounded,
  PhoneRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import PageHeader from "../../components/PageHeader";
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

const serviceCategories = [
  "IT Hardware",
  "Software",
  "Electrical",
  "Electronics",
  "Networking",
  "CCTV & Security",
  "Furniture",
  "Vehicle",
  "Building Maintenance",
  "Other",
];

const coverageOptions = ["On-site", "Remote", "Pickup & Drop", "Hybrid"];
const slaOptions = ["2 Hours", "4 Hours", "8 Hours", "24 Hours", "48 Hours", "Best Effort"];
const paymentOptions = ["Immediate", "15 Days", "30 Days", "45 Days", "60 Days", "As per contract"];
const statusOptions = ["Active", "Inactive", "Blacklisted"];

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

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get("/vendors");
      setVendors(res.data || []);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error?.response?.data?.message || "Failed to fetch vendors.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    return {
      total: vendors.length,
      active: vendors.filter((v) => v.status === "Active").length,
      amc: vendors.filter((v) => v.vendorType === "AMC Vendor").length,
      oem: vendors.filter((v) => v.vendorType === "OEM").length,
    };
  }, [vendors]);

  const handleInputChange = (field, value) => {
    setVendorForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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
    if (
      !vendorForm.name ||
      !vendorForm.vendorType ||
      !vendorForm.serviceCategory ||
      !vendorForm.contactPerson ||
      !vendorForm.phone ||
      !vendorForm.email ||
      !vendorForm.address
    ) {
      setSnackbar({
        open: true,
        message: "Please fill all required fields.",
        severity: "error",
      });
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
        setSnackbar({
          open: true,
          message: "Vendor updated successfully.",
          severity: "success",
        });
      } else {
        await api.post("/vendors", vendorForm);
        setSnackbar({
          open: true,
          message: "Vendor added successfully.",
          severity: "success",
        });
      }

      setFormOpen(false);
      setVendorForm(initialVendorForm);
      setEditingVendorId(null);
      fetchVendors();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error?.response?.data?.message || "Failed to save vendor.",
        severity: "error",
      });
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

  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "background.paper",
      borderRadius: "14px",
      fontWeight: 700,
      color: "text.primary",
      "& fieldset": { borderColor: "divider" },
    },
    "& .MuiInputLabel-root": { color: "text.secondary", fontWeight: 700 },
  };

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="Vendors & Service Network"
        action={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={openAddForm}
            sx={{ bgcolor: "#111111", color: "#CBFA57", fontWeight: 900, borderRadius: "14px", px: 3, py: 1.2, "&:hover": { bgcolor: "#222222" } }}
          >
            Add Vendor
          </Button>
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard title="Total Vendors" value={summary.total} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard title="Active Vendors" value={summary.active} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard title="AMC Vendors" value={summary.amc} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard title="OEM Vendors" value={summary.oem} />
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 5 }}>
          <CircularProgress />
        </Box>
      ) : vendors.length === 0 ? (
        <Paper
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: "24px",
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <BusinessRounded sx={{ fontSize: 54, color: "#94A3B8", mb: 1 }} />
          <Typography fontWeight={900} fontSize={22}>
            No vendors added yet
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Add OEM, AMC, warranty and service vendors for asset support tracking.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {vendors.map((vendor) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={vendor._id}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: "26px",
                  border: "1px solid",
                  borderColor: "divider",
                  height: "100%",
                  bgcolor: "background.paper",
                  boxShadow: "0 14px 35px rgba(15,23,42,0.07)",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 950, fontSize: 21, color: "text.primary" }}>
                      {vendor.name}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontWeight: 800, mt: 0.5 }}>
                      {vendor.vendorType} • {vendor.serviceCategory}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={vendor.status || "Active"}
                    sx={{
                      fontWeight: 900,
                      bgcolor:
                        vendor.status === "Blacklisted"
                          ? "#FEE2E2"
                          : vendor.status === "Inactive"
                          ? "#F1F5F9"
                          : "#DCFCE7",
                      color:
                        vendor.status === "Blacklisted"
                          ? "#991B1B"
                          : vendor.status === "Inactive"
                          ? "#475569"
                          : "#166534",
                    }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <InfoRow icon={<BusinessRounded fontSize="small" />} text={vendor.contactPerson} />
                <InfoRow icon={<PhoneRounded fontSize="small" />} text={vendor.phone} />
                <InfoRow icon={<EmailRounded fontSize="small" />} text={vendor.email} />
                <InfoRow
                  icon={<LocationOnRounded fontSize="small" />}
                  text={`${vendor.city || ""}${vendor.city && vendor.state ? ", " : ""}${vendor.state || ""}`}
                />

                <Box sx={{ display: "flex", gap: 1.2, mt: 2.5 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<VisibilityRounded />}
                    onClick={() => {
                      setSelectedVendor(vendor);
                      setDetailOpen(true);
                    }}
                    sx={{
                      borderRadius: "12px",
                      fontWeight: 900,
                      textTransform: "none",
                      borderColor: "divider",
                      color: "text.primary",
                    }}
                  >
                    View
                  </Button>

                  <IconButton
                    onClick={() => openEditForm(vendor)}
                    sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", color: "text.secondary" }}
                  >
                    <EditRounded />
                  </IconButton>

                  <IconButton
                    onClick={() => { setVendorToDelete(vendor); setDeleteDialogOpen(true); }}
                    sx={{ border: "1px solid #FCA5A5", borderRadius: "12px", color: "#DC2626" }}
                  >
                    <DeleteRounded />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        fullWidth
        maxWidth="md"
        slotProps={{ paper: {
          sx: {
            borderRadius: "26px",
            bgcolor: "background.paper",
            color: "text.primary",
            overflow: "hidden",
          },
        } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 950,
            fontSize: 24,
            color: "text.primary",
            bgcolor: "background.default",
            borderBottom: "1px solid",
            borderColor: "divider",
            py: 2.2,
          }}
        >
          {editingVendorId ? "Update Vendor" : "Add New Vendor"}
          <Typography sx={{ color: "text.secondary", fontWeight: 700, fontSize: 14, mt: 0.5 }}>
            Add vendor contact, service, warranty, AMC and escalation details.
          </Typography>

          <IconButton
            onClick={() => setFormOpen(false)}
            sx={{
              position: "absolute",
              right: 14,
              top: 14,
              color: "text.secondary",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            pt: 3,
            bgcolor: "background.default",
            borderColor: "divider",
            maxHeight: "70vh",
          }}
        >
          <FormBlock title="Basic Vendor Details">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth required label="Vendor / Company Name" value={vendorForm.name} onChange={(e) => handleInputChange("name", e.target.value)} sx={inputStyles} />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select fullWidth required label="Vendor Type" value={vendorForm.vendorType} onChange={(e) => handleInputChange("vendorType", e.target.value)} sx={inputStyles}>
                  {vendorTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select fullWidth required label="Service Category" value={vendorForm.serviceCategory} onChange={(e) => handleInputChange("serviceCategory", e.target.value)} sx={inputStyles}>
                  {serviceCategories.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select fullWidth label="Status" value={vendorForm.status} onChange={(e) => handleInputChange("status", e.target.value)} sx={inputStyles}>
                  {statusOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </FormBlock>

          <FormBlock title="Contact Details">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth required label="Primary Contact Person" value={vendorForm.contactPerson} onChange={(e) => handleInputChange("contactPerson", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth required label="Primary Phone" value={vendorForm.phone} onChange={(e) => handleInputChange("phone", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Alternate Phone" value={vendorForm.alternatePhone} onChange={(e) => handleInputChange("alternatePhone", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth required label="Primary Email" value={vendorForm.email} onChange={(e) => handleInputChange("email", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Support Email" value={vendorForm.supportEmail} onChange={(e) => handleInputChange("supportEmail", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Support Phone" value={vendorForm.supportPhone} onChange={(e) => handleInputChange("supportPhone", e.target.value)} sx={inputStyles} />
              </Grid>
            </Grid>
          </FormBlock>

          <FormBlock title="Address & Legal Details">
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField fullWidth required multiline minRows={2} label="Address" value={vendorForm.address} onChange={(e) => handleInputChange("address", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="City" value={vendorForm.city} onChange={(e) => handleInputChange("city", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="State" value={vendorForm.state} onChange={(e) => handleInputChange("state", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Pincode" value={vendorForm.pincode} onChange={(e) => handleInputChange("pincode", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="GST Number" value={vendorForm.gstNumber} onChange={(e) => handleInputChange("gstNumber", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="PAN Number" value={vendorForm.panNumber} onChange={(e) => handleInputChange("panNumber", e.target.value)} sx={inputStyles} />
              </Grid>
            </Grid>
          </FormBlock>

          <FormBlock title="Service, Warranty & AMC Details">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField select fullWidth label="Service Coverage" value={vendorForm.serviceCoverage} onChange={(e) => handleInputChange("serviceCoverage", e.target.value)} sx={inputStyles}>
                  {coverageOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField select fullWidth label="SLA Response Time" value={vendorForm.slaResponseTime} onChange={(e) => handleInputChange("slaResponseTime", e.target.value)} sx={inputStyles}>
                  {slaOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField select fullWidth label="Payment Terms" value={vendorForm.paymentTerms} onChange={(e) => handleInputChange("paymentTerms", e.target.value)} sx={inputStyles}>
                  {paymentOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth type="date" label="Contract / AMC Start Date" slotProps={{ inputLabel: { shrink: true } }} value={vendorForm.contractStartDate} onChange={(e) => handleInputChange("contractStartDate", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth type="date" label="Contract / AMC End Date" slotProps={{ inputLabel: { shrink: true } }} value={vendorForm.contractEndDate} onChange={(e) => handleInputChange("contractEndDate", e.target.value)} sx={inputStyles} />
              </Grid>
            </Grid>
          </FormBlock>

          <FormBlock title="Escalation Details">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Escalation Person" value={vendorForm.escalationName} onChange={(e) => handleInputChange("escalationName", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Escalation Phone" value={vendorForm.escalationPhone} onChange={(e) => handleInputChange("escalationPhone", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Escalation Email" value={vendorForm.escalationEmail} onChange={(e) => handleInputChange("escalationEmail", e.target.value)} sx={inputStyles} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth multiline minRows={3} label="Remarks / Notes" value={vendorForm.remarks} onChange={(e) => handleInputChange("remarks", e.target.value)} sx={inputStyles} />
              </Grid>
            </Grid>
          </FormBlock>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            bgcolor: "background.paper",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button onClick={() => setFormOpen(false)} sx={{ fontWeight: 900, textTransform: "none", color: "#475569" }}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSaveVendor}
            disabled={saving}
            sx={{ borderRadius: "12px", bgcolor: "#111111", color: "#CBFA57", fontWeight: 900, px: 3, "&:hover": { bgcolor: "#222222" } }}
          >
            {saving ? "Saving..." : editingVendorId ? "Update Vendor" : "Save Vendor"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: {
          sx: {
            borderRadius: "24px",
            bgcolor: "background.paper",
            color: "text.primary",
          },
        } }}
      >
        <DialogTitle sx={{ fontWeight: 950, bgcolor: "background.default", borderBottom: "1px solid", borderColor: "divider", color: "text.primary" }}>
          Vendor Details
          <IconButton onClick={() => setDetailOpen(false)} sx={{ position: "absolute", right: 12, top: 10, color: "text.secondary" }}>
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: "background.paper" }}>
          {selectedVendor && (
            <Box>
              <Typography fontWeight={950} fontSize={24} color="text.primary">
                {selectedVendor.name}
              </Typography>

              <Typography color="text.secondary" fontWeight={800} sx={{ mb: 2 }}>
                {selectedVendor.vendorType} • {selectedVendor.serviceCategory}
              </Typography>

              <DetailRow label="Contact Person" value={selectedVendor.contactPerson} />
              <DetailRow label="Phone" value={selectedVendor.phone} />
              <DetailRow label="Alternate Phone" value={selectedVendor.alternatePhone} />
              <DetailRow label="Email" value={selectedVendor.email} />
              <DetailRow label="Support Email" value={selectedVendor.supportEmail} />
              <DetailRow label="Support Phone" value={selectedVendor.supportPhone} />
              <DetailRow label="Address" value={selectedVendor.address} />
              <DetailRow label="City / State" value={`${selectedVendor.city || "-"} / ${selectedVendor.state || "-"}`} />
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
      <Dialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setVendorToDelete(null); }}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "20px", bgcolor: "background.paper" } } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "text.primary", pb: 1 }}>Delete Vendor</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" fontWeight={600}>
            Are you sure you want to delete <strong style={{ color: "inherit" }}>{vendorToDelete?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => { setDeleteDialogOpen(false); setVendorToDelete(null); }} sx={{ fontWeight: 900, textTransform: "none", color: "text.secondary" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleDeleteVendor}
            sx={{ bgcolor: "#DC2626", "&:hover": { bgcolor: "#B91C1C" }, fontWeight: 900, textTransform: "none", borderRadius: "10px", px: 3 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

const SummaryCard = ({ title, value }) => (
  <Paper
    sx={{
      p: 2.5,
      borderRadius: "22px",
      bgcolor: "background.paper",
      border: "1px solid",
      borderColor: "divider",
      boxShadow: "0 10px 28px rgba(15,23,42,0.06)",
    }}
  >
    <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 900 }}>
      {title}
    </Typography>
    <Typography sx={{ mt: 0.6, color: "text.primary", fontSize: 30, fontWeight: 950, letterSpacing: "-1px", lineHeight: 1 }}>
      {value}
    </Typography>
  </Paper>
);

const FormBlock = ({ title, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      mb: 2.5,
      borderRadius: "20px",
      bgcolor: "background.paper",
      border: "1px solid",
      borderColor: "divider",
    }}
  >
    <Typography sx={{ fontWeight: 900, fontSize: 16, mb: 2, color: "text.primary" }}>
      {title}
    </Typography>
    {children}
  </Paper>
);

const InfoRow = ({ icon, text }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.3, mb: 1.3, color: "text.secondary" }}>
    {icon}
    <Typography sx={{ fontWeight: 700 }}>{text || "-"}</Typography>
  </Box>
);

const DetailRow = ({ label, value }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      gap: 2,
      py: 1.1,
      borderBottom: "1px solid",
      borderColor: "divider",
    }}
  >
    <Typography sx={{ fontWeight: 900, color: "text.secondary" }}>{label}</Typography>
    <Typography sx={{ fontWeight: 700, textAlign: "right", color: "text.primary" }}>
      {value || "-"}
    </Typography>
  </Box>
);

export default Vendors;