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
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddRounded,
  ApartmentRounded,
  CloseRounded,
  DeleteRounded,
  EditRounded,
  EmailRounded,
  LocationOnRounded,
  PhoneRounded,
  SaveRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import PageHeader from "../../components/PageHeader";
import api from "../../api/axios";

const initialForm = {
  name: "",
  code: "",
  hodName: "",
  hodEmail: "",
  hodPhone: "",
  location: "",
  floor: "",
  approvalRequired: true,
  approvalLevel: "HOD Only",
  status: "Active",
  description: "",
};

const approvalLevels = ["HOD Only", "HOD + Admin", "HOD + Finance", "Admin Only"];

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [mode, setMode] = useState("add");
  const [selectedDept, setSelectedDept] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/departments");
      setDepartments(res.data || []);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error?.response?.data?.message || "Failed to fetch departments.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    return {
      total: departments.length,
      active: departments.filter((d) => d.status === "Active").length,
      approval: departments.filter((d) => d.approvalRequired).length,
    };
  }, [departments]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openAddForm = () => {
    setMode("add");
    setSelectedDept(null);
    setFormData(initialForm);
    setFormOpen(true);
  };

  const openEditForm = (dept) => {
    setMode("edit");
    setSelectedDept(dept);
    setFormData({
      ...initialForm,
      ...dept,
    });
    setFormOpen(true);
  };

  const validateForm = () => {
    if (!formData.name || !formData.code || !formData.hodName || !formData.hodEmail) {
      setSnackbar({
        open: true,
        message: "Please fill department name, code, HOD name and HOD email.",
        severity: "error",
      });
      return false;
    }

    return true;
  };

  const handleSaveDepartment = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      if (mode === "edit" && selectedDept?._id) {
        await api.put(`/departments/${selectedDept._id}`, formData);
        setSnackbar({
          open: true,
          message: "Department updated successfully.",
          severity: "success",
        });
      } else {
        await api.post("/departments", formData);
        setSnackbar({
          open: true,
          message: "Department added successfully.",
          severity: "success",
        });
      }

      setFormOpen(false);
      setSelectedDept(null);
      setFormData(initialForm);
      fetchDepartments();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error?.response?.data?.message || "Failed to save department.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDept?._id) return;

    try {
      await api.delete(`/departments/${selectedDept._id}`);

      setSnackbar({
        open: true,
        message: "Department deleted successfully.",
        severity: "success",
      });

      setDeleteOpen(false);
      setSelectedDept(null);
      fetchDepartments();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error?.response?.data?.message || "Failed to delete department.",
        severity: "error",
      });
    }
  };

  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#FFFFFF",
      borderRadius: "14px",
      fontWeight: 700,
      color: "#0F172A",
      "& fieldset": { borderColor: "#CBD5E1" },
      "&:hover fieldset": { borderColor: "#0F766E" },
      "&.Mui-focused fieldset": {
        borderColor: "#0F766E",
        borderWidth: "2px",
      },
    },
    "& .MuiInputLabel-root": {
      color: "#64748B",
      fontWeight: 700,
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#0F766E",
    },
  };

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="Departments"
        subtitle="Manage department-wise asset ownership, HOD approvals and service accountability."
        action={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={openAddForm}
            sx={{
              background: "linear-gradient(135deg, #1E3A8A, #0F766E)",
              color: "#FFFFFF",
              fontWeight: 900,
              textTransform: "none",
              borderRadius: "14px",
              px: 3,
              py: 1.2,
            }}
          >
            Add Department
          </Button>
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <SummaryCard title="Total Departments" value={summary.total} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard title="Active Departments" value={summary.active} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard title="Approval Required" value={summary.approval} warning />
        </Grid>
      </Grid>

      {loading ? (
        <Box display="flex" justifyContent="center" pt={5}>
          <CircularProgress />
        </Box>
      ) : departments.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: "24px" }}>
          <ApartmentRounded sx={{ fontSize: 56, color: "#94A3B8", mb: 1 }} />
          <Typography fontWeight={900} fontSize={22}>
            No departments added yet
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Add departments to manage approvals and asset ownership.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {departments.map((dept) => (
            <Grid item xs={12} sm={6} lg={4} key={dept._id}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: "26px",
                  bgcolor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  height: "100%",
                  boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
                }}
              >
                <Box display="flex" justifyContent="space-between" gap={2}>
                  <Box
                    sx={{
                      width: 58,
                      height: 58,
                      borderRadius: "18px",
                      background: "rgba(15,118,110,0.10)",
                      color: "#0F766E",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <ApartmentRounded sx={{ fontSize: 32 }} />
                  </Box>

                  <Chip
                    label={dept.status}
                    size="small"
                    sx={{
                      fontWeight: 900,
                      bgcolor: dept.status === "Active" ? "#DCFCE7" : "#F1F5F9",
                      color: dept.status === "Active" ? "#166534" : "#475569",
                    }}
                  />
                </Box>

                <Typography sx={{ fontWeight: 950, fontSize: 21, mt: 2, color: "#0F172A" }}>
                  {dept.name}
                </Typography>

                <Typography
                  sx={{
                    color: "#1E3A8A",
                    fontSize: 13,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    mt: 0.5,
                    mb: 2,
                  }}
                >
                  {dept.code}
                </Typography>

                <InfoRow icon={<ApartmentRounded fontSize="small" />} text={`HOD: ${dept.hodName}`} />
                <InfoRow icon={<EmailRounded fontSize="small" />} text={dept.hodEmail} />
                <InfoRow icon={<PhoneRounded fontSize="small" />} text={dept.hodPhone || "-"} />
                <InfoRow icon={<LocationOnRounded fontSize="small" />} text={dept.location || "-"} />

                <Divider sx={{ my: 2 }} />

                <Typography sx={{ fontWeight: 800, color: "#64748B", fontSize: 13 }}>
                  Approval Flow
                </Typography>
                <Typography sx={{ fontWeight: 950, color: "#0F172A", mt: 0.3 }}>
                  {dept.approvalRequired ? dept.approvalLevel : "Approval not required"}
                </Typography>

                <Box display="flex" gap={1.2} mt={2.5}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<VisibilityRounded />}
                    onClick={() => {
                      setSelectedDept(dept);
                      setDetailOpen(true);
                    }}
                    sx={smallBtn}
                  >
                    View
                  </Button>

                  <IconButton
                    onClick={() => openEditForm(dept)}
                    sx={{ border: "1px solid #CBD5E1", borderRadius: "12px", color: "#0F766E" }}
                  >
                    <EditRounded />
                  </IconButton>

                  <IconButton
                    onClick={() => {
                      setSelectedDept(dept);
                      setDeleteOpen(true);
                    }}
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
        PaperProps={{
          sx: {
            borderRadius: "26px",
            bgcolor: "#FFFFFF",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
          <Typography fontWeight={950} fontSize={24}>
            {mode === "add" ? "Add Department" : "Update Department"}
          </Typography>
          <Typography sx={{ color: "#64748B", fontWeight: 700, fontSize: 14, mt: 0.5 }}>
            Add department, HOD contact and approval flow details.
          </Typography>

          <IconButton
            onClick={() => setFormOpen(false)}
            sx={{ position: "absolute", right: 14, top: 14 }}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: "#F8FAFC", p: 3 }}>
          <FormBlock title="Department Details">
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Department Name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  sx={inputStyles}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Department Code"
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  sx={inputStyles}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  sx={inputStyles}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Floor / Building"
                  value={formData.floor}
                  onChange={(e) => handleChange("floor", e.target.value)}
                  sx={inputStyles}
                />
              </Grid>
            </Grid>
          </FormBlock>

          <FormBlock title="HOD / Approval Owner">
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="HOD Name"
                  value={formData.hodName}
                  onChange={(e) => handleChange("hodName", e.target.value)}
                  sx={inputStyles}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="HOD Email"
                  value={formData.hodEmail}
                  onChange={(e) => handleChange("hodEmail", e.target.value)}
                  sx={inputStyles}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="HOD Phone"
                  value={formData.hodPhone}
                  onChange={(e) => handleChange("hodPhone", e.target.value)}
                  sx={inputStyles}
                />
              </Grid>
            </Grid>
          </FormBlock>

          <FormBlock title="Approval Settings">
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    height: "100%",
                    minHeight: 56,
                    px: 2,
                    borderRadius: "14px",
                    bgcolor: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography fontWeight={900}>Approval Required</Typography>
                  <Switch
                    checked={formData.approvalRequired}
                    onChange={(e) => handleChange("approvalRequired", e.target.checked)}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Approval Level"
                  value={formData.approvalLevel}
                  onChange={(e) => handleChange("approvalLevel", e.target.value)}
                  disabled={!formData.approvalRequired}
                  sx={inputStyles}
                >
                  {approvalLevels.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  sx={inputStyles}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Description / Notes"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  sx={inputStyles}
                />
              </Grid>
            </Grid>
          </FormBlock>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
          <Button
            onClick={() => setFormOpen(false)}
            sx={{ fontWeight: 900, textTransform: "none", color: "#475569" }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            startIcon={<SaveRounded />}
            onClick={handleSaveDepartment}
            disabled={saving}
            sx={{
              background: "linear-gradient(135deg, #1E3A8A, #0F766E)",
              fontWeight: 900,
              textTransform: "none",
              borderRadius: "12px",
              px: 3,
            }}
          >
            {saving ? "Saving..." : mode === "add" ? "Save Department" : "Update Department"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950 }}>
          Department Details
          <IconButton
            onClick={() => setDetailOpen(false)}
            sx={{ position: "absolute", right: 12, top: 10 }}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedDept && (
            <Box>
              <Typography fontWeight={950} fontSize={24}>
                {selectedDept.name}
              </Typography>

              <Typography color="text.secondary" fontWeight={800} sx={{ mb: 2 }}>
                {selectedDept.code}
              </Typography>

              <DetailRow label="HOD Name" value={selectedDept.hodName} />
              <DetailRow label="HOD Email" value={selectedDept.hodEmail} />
              <DetailRow label="HOD Phone" value={selectedDept.hodPhone} />
              <DetailRow label="Location" value={selectedDept.location} />
              <DetailRow label="Floor / Building" value={selectedDept.floor} />
              <DetailRow label="Approval Required" value={selectedDept.approvalRequired ? "Yes" : "No"} />
              <DetailRow label="Approval Level" value={selectedDept.approvalLevel} />
              <DetailRow label="Status" value={selectedDept.status} />
              <DetailRow label="Description" value={selectedDept.description} />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 950 }}>Delete Department</DialogTitle>

        <DialogContent>
          <Typography sx={{ color: "#475569", fontWeight: 700 }}>
            Are you sure you want to delete{" "}
            <strong>{selectedDept?.name}</strong>?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ fontWeight: 900 }}>
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteDepartment}
            sx={{ fontWeight: 900, textTransform: "none", borderRadius: "12px" }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const SummaryCard = ({ title, value, warning = false }) => (
  <Paper
    sx={{
      p: 2.5,
      borderRadius: "22px",
      bgcolor: "#FFFFFF",
      border: "1px solid #E2E8F0",
      boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
    }}
  >
    <Typography sx={{ color: "#64748B", fontSize: 13, fontWeight: 900 }}>
      {title}
    </Typography>
    <Typography
      sx={{
        mt: 0.6,
        color: warning ? "#D97706" : "#1E3A8A",
        fontSize: 30,
        fontWeight: 950,
      }}
    >
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
      bgcolor: "#FFFFFF",
      border: "1px solid #E2E8F0",
    }}
  >
    <Typography sx={{ fontWeight: 950, fontSize: 17, mb: 2, color: "#1E3A8A" }}>
      {title}
    </Typography>
    {children}
  </Paper>
);

const InfoRow = ({ icon, text }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.3, mb: 1.3, color: "#475569" }}>
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
      borderBottom: "1px solid #F1F5F9",
    }}
  >
    <Typography sx={{ fontWeight: 900, color: "#475569" }}>{label}</Typography>
    <Typography sx={{ fontWeight: 700, textAlign: "right", color: "#0F172A" }}>
      {value || "-"}
    </Typography>
  </Box>
);

const smallBtn = {
  borderColor: "#CBD5E1",
  color: "#1E3A8A",
  fontWeight: 900,
  textTransform: "none",
  borderRadius: "12px",
  "&:hover": {
    borderColor: "#0F766E",
    color: "#0F766E",
    bgcolor: "rgba(15,118,110,0.08)",
  },
};

export default Departments;