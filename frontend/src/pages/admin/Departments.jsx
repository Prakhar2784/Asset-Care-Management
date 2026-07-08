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
  InputAdornment,
  Tooltip,
} from "@mui/material";
import {
  AddRounded,
  ApartmentRounded,
  CheckCircleRounded,
  CloseRounded,
  DeleteRounded,
  EditRounded,
  EmailRounded,
  LocationOnRounded,
  PhoneRounded,
  PeopleRounded,
  SaveRounded,
  VisibilityRounded,
  WarningAmberRounded,
  HelpOutlineRounded,
} from "@mui/icons-material";
import api from "../../api/axios";

const initialForm = {
  name: "",
  code: "",
  hodName: "",
  hodEmail: "",
  hodPhone: "",
  location: "",
  floor: "",
  status: "Active",
  description: "",
};

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    fontWeight: 700,
  },
  "& .MuiInputLabel-root": { fontWeight: 700 },
};

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

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/departments");
      setDepartments(res.data || []);
    } catch (error) {
      setSnackbar({ open: true, message: error?.response?.data?.message || "Failed to fetch departments.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => ({
    total: departments.length,
    active: departments.filter(d => d.status === "Active").length,
  }), [departments]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    setFormData({ ...initialForm, ...dept });
    setFormOpen(true);
  };

  const validateForm = () => {
    if (!formData.name || !formData.code || !formData.hodName || !formData.hodEmail) {
      setSnackbar({ open: true, message: "Please fill department name, code, HOD name and HOD email.", severity: "error" });
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
        setSnackbar({ open: true, message: "Department updated successfully.", severity: "success" });
      } else {
        await api.post("/departments", formData);
        setSnackbar({ open: true, message: "Department added successfully.", severity: "success" });
      }
      setFormOpen(false);
      setSelectedDept(null);
      setFormData(initialForm);
      fetchDepartments();
    } catch (error) {
      setSnackbar({ open: true, message: error?.response?.data?.message || "Failed to save department.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDept?._id) return;
    try {
      await api.delete(`/departments/${selectedDept._id}`);
      setSnackbar({ open: true, message: "Department deleted successfully.", severity: "success" });
      setDeleteOpen(false);
      setSelectedDept(null);
      fetchDepartments();
    } catch (error) {
      setSnackbar({ open: true, message: error?.response?.data?.message || "Failed to delete department.", severity: "error" });
    }
  };

  const kpis = [
    { label: "Total Departments", value: summary.total,    color: "text.primary", icon: <ApartmentRounded fontSize="small" /> },
    { label: "Active",            value: summary.active,   color: "#FBBF24", icon: <CheckCircleRounded fontSize="small" /> },
  ];

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: "rgba(17,24,39,0.12)" }}>
            <ApartmentRounded sx={{ color: "text.primary" }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Departments</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Manage HOD approvals and asset ownership by department
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddRounded />} onClick={openAddForm}
          sx={{ background: "#FBBF24", color: "#111827", fontWeight: 800, borderRadius: "12px", px: 2.5, boxShadow: "none" }}>
          Add Department
        </Button>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {kpis.map(k => (
          <Grid size={{ xs: 12, sm: 4 }} key={k.label}>
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
      ) : departments.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: "center", borderRadius: "20px", border: "1px dashed", borderColor: "divider" }}>
          <Box sx={{ width: 72, height: 72, borderRadius: "20px", bgcolor: "rgba(17,24,39,0.08)", display: "grid", placeItems: "center", mx: "auto", mb: 2 }}>
            <ApartmentRounded sx={{ fontSize: 36, color: "text.primary" }} />
          </Box>
          <Typography fontWeight={800} fontSize={20} color="text.primary">No departments added yet</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Add departments to manage approvals and asset ownership.
          </Typography>
          <Button variant="contained" startIcon={<AddRounded />} onClick={openAddForm} sx={{ mt: 3, background: "#FBBF24", color: "#111827", fontWeight: 800, borderRadius: "12px", boxShadow: "none" }}>
            Add First Department
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {departments.map(dept => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={dept._id}>
              <Paper sx={{
                p: 3, borderRadius: "20px", border: "1px solid", borderColor: "divider",
                height: "100%", bgcolor: "background.paper", position: "relative", overflow: "hidden",
                transition: "box-shadow 0.2s", "&:hover": { boxShadow: "0 8px 32px rgba(17,24,39,0.12)" }
              }}>
                {/* Top accent bar */}
                <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#111827" }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mt: 0.5 }}>
                  <Box sx={{ width: 52, height: 52, borderRadius: "14px", bgcolor: "rgba(17,24,39,0.10)", color: "text.primary", display: "grid", placeItems: "center" }}>
                    <ApartmentRounded sx={{ fontSize: 28 }} />
                  </Box>
                  <Box sx={{
                    display: "inline-flex", px: 1.5, py: 0.4, borderRadius: "20px",
                    bgcolor: dept.status === "Active" ? "rgba(34,197,94,0.12)" : "action.selected",
                    color: dept.status === "Active" ? "#22C55E" : "text.secondary",
                    fontSize: 11, fontWeight: 800
                  }}>
                    {dept.status}
                  </Box>
                </Box>

                <Typography sx={{ fontWeight: 900, fontSize: 20, mt: 2, color: "text.primary" }}>
                  {dept.name}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", mt: 0.3, mb: 2, fontFamily: "monospace" }}>
                  {dept.code}
                </Typography>

                <InfoRow icon={<ApartmentRounded fontSize="small" />} text={`HOD: ${dept.hodName || "—"}`} />
                <InfoRow icon={<EmailRounded fontSize="small" />} text={dept.hodEmail || "—"} />
                <InfoRow icon={<PhoneRounded fontSize="small" />} text={dept.hodPhone || "—"} />
                <InfoRow icon={<LocationOnRounded fontSize="small" />} text={dept.location || "—"} />
                <InfoRow icon={<PeopleRounded fontSize="small" />} text={`Employees: ${dept.employeeCount || 0}`} />

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", gap: 1.2 }}>
                  <Button fullWidth variant="outlined" startIcon={<VisibilityRounded />}
                    onClick={() => { setSelectedDept(dept); setDetailOpen(true); }}
                    sx={{ borderRadius: "10px", fontWeight: 800, textTransform: "none", borderColor: "divider", color: "text.primary", fontSize: 13 }}>
                    View
                  </Button>
                  <IconButton onClick={() => openEditForm(dept)}
                    sx={{ border: "1px solid", borderColor: "divider", borderRadius: "10px", color: "text.secondary", "&:hover": { color: "text.primary", borderColor: "text.secondary" } }}>
                    <EditRounded />
                  </IconButton>
                  <IconButton onClick={() => { setSelectedDept(dept); setDeleteOpen(true); }}
                    sx={{ border: "1px solid rgba(239,68,68,0.4)", borderRadius: "10px", color: "#EF4444", "&:hover": { bgcolor: "rgba(239,68,68,0.08)" } }}>
                    <DeleteRounded />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: "20px", overflow: "hidden" } } }}>
        {/* Gradient Header */}
        <Box sx={{ p: 3, background: "linear-gradient(135deg,rgba(17,24,39,0.1),rgba(17,24,39,0.05))", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "#111827", display: "grid", placeItems: "center" }}>
              <ApartmentRounded sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography fontWeight={900} fontSize={18}>{mode === "add" ? "Add Department" : "Update Department"}</Typography>
              <Typography fontSize={12} color="text.secondary">Fill department, HOD contact and approval flow details</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setFormOpen(false)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}>
            <CloseRounded />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, bgcolor: "background.default" }}>
          <FormBlock title="Department Details">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth required autoFocus label="Department Name" value={formData.name} onChange={e => handleChange("name", e.target.value)} sx={inputStyles}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Full name of the department" arrow>
                            <HelpOutlineRounded sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} />
                          </Tooltip>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth required label="Department Code" value={formData.code} onChange={e => handleChange("code", e.target.value)} sx={inputStyles}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Unique short code (e.g., FIN, IT)" arrow>
                            <HelpOutlineRounded sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} />
                          </Tooltip>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Location" value={formData.location} onChange={e => handleChange("location", e.target.value)} sx={inputStyles}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Office campus or branch location" arrow>
                            <HelpOutlineRounded sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} />
                          </Tooltip>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Floor / Building" value={formData.floor} onChange={e => handleChange("floor", e.target.value)} sx={inputStyles}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Floor number or building name" arrow>
                            <HelpOutlineRounded sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} />
                          </Tooltip>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Grid>
            </Grid>
          </FormBlock>

          <FormBlock title="HOD / Approval Owner">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth required label="HOD Name" value={formData.hodName} onChange={e => handleChange("hodName", e.target.value)} sx={inputStyles}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Head of Department name" arrow>
                            <HelpOutlineRounded sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} />
                          </Tooltip>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth required label="HOD Email" value={formData.hodEmail} onChange={e => handleChange("hodEmail", e.target.value)} sx={inputStyles}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Head of Department email" arrow>
                            <HelpOutlineRounded sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} />
                          </Tooltip>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="HOD Phone" value={formData.hodPhone}
                  onChange={e => handleChange("hodPhone", e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  sx={inputStyles}
                  slotProps={{
                    htmlInput: { inputMode: 'numeric', maxLength: 10 },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Head of Department phone number" arrow>
                            <HelpOutlineRounded sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} />
                          </Tooltip>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Grid>
            </Grid>
          </FormBlock>

          <FormBlock title="Notes">
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField fullWidth multiline minRows={3} label="Description / Notes" value={formData.description} onChange={e => handleChange("description", e.target.value)} sx={inputStyles}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Brief details or purpose of this department" arrow>
                            <HelpOutlineRounded sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} />
                          </Tooltip>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Grid>
            </Grid>
          </FormBlock>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setFormOpen(false)} sx={{ fontWeight: 800, color: "text.secondary", textTransform: "none", borderRadius: "10px" }}>
            Cancel
          </Button>
          <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
            onClick={handleSaveDepartment} disabled={saving}
            sx={{ background: "#FBBF24", color: "#111827", fontWeight: 800, borderRadius: "12px", px: 3, boxShadow: "none", textTransform: "none" }}>
            {saving ? "Saving..." : mode === "add" ? "Save Department" : "Update Department"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: "20px", overflow: "hidden" } } }}>
        <Box sx={{ p: 3, background: "linear-gradient(135deg,rgba(17,24,39,0.1),rgba(17,24,39,0.05))", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "#111827", display: "grid", placeItems: "center" }}>
              <ApartmentRounded sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography fontWeight={900} fontSize={18}>Department Details</Typography>
              <Typography fontSize={12} color="text.secondary">{selectedDept?.name}</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDetailOpen(false)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}>
            <CloseRounded />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {selectedDept && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography fontWeight={950} fontSize={22} color="text.primary">{selectedDept.name}</Typography>
                <Typography color="text.secondary" fontWeight={800} fontFamily="monospace" fontSize={13}>{selectedDept.code}</Typography>
              </Box>
              <DetailRow label="HOD Name" value={selectedDept.hodName} />
              <DetailRow label="HOD Email" value={selectedDept.hodEmail} />
              <DetailRow label="HOD Phone" value={selectedDept.hodPhone} />
              <DetailRow label="Location" value={selectedDept.location} />
              <DetailRow label="Floor / Building" value={selectedDept.floor} />
              <DetailRow label="Total Employees" value={String(selectedDept.employeeCount || 0)} />
              <DetailRow label="Status" value={selectedDept.status} />
              <DetailRow label="Description" value={selectedDept.description} />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} fullWidth maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: "20px", overflow: "hidden" } } }}>
        <Box sx={{ p: 3, background: "linear-gradient(135deg,rgba(239,68,68,0.08),rgba(239,68,68,0.02))", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: "rgba(239,68,68,0.12)", display: "grid", placeItems: "center" }}>
              <WarningAmberRounded sx={{ color: "#EF4444", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography fontWeight={900} fontSize={17}>Delete Department</Typography>
              <Typography fontSize={12} color="text.secondary">This action cannot be undone</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDeleteOpen(false)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}>
            <CloseRounded />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Typography color="text.secondary" fontWeight={600}>
            Are you sure you want to delete <strong style={{ color: "inherit" }}>{selectedDept?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ fontWeight: 800, textTransform: "none", color: "text.secondary", borderRadius: "10px" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleDeleteDepartment}
            sx={{ bgcolor: "#EF4444", "&:hover": { bgcolor: "#DC2626" }, fontWeight: 800, textTransform: "none", borderRadius: "10px", px: 3, boxShadow: "none" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: "12px" }}>
          {snackbar.message}
        </Alert>
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
    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{text || "—"}</Typography>
  </Box>
);

const DetailRow = ({ label, value }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1.1, borderBottom: "1px solid", borderColor: "divider" }}>
    <Typography sx={{ fontWeight: 800, color: "text.secondary", fontSize: 13 }}>{label}</Typography>
    <Typography sx={{ fontWeight: 700, textAlign: "right", color: "text.primary", fontSize: 13 }}>{value || "—"}</Typography>
  </Box>
);

export default Departments;
