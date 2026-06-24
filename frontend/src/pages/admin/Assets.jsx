import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Divider,
  Tooltip,
  Autocomplete
} from "@mui/material";
import { AddRounded, DownloadRounded, VisibilityRounded, CloseRounded, EditRounded, DeleteOutlineRounded, PersonAddRounded, PersonRemoveRounded } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import api from "../../api/axios";

const CATEGORIES = ["IT Asset", "Electrical", "Electronic", "Furniture"];
const STATUSES = ["Active", "Under Repair", "Decommissioned", "In Storage"];
const FORM_FACTORS = ["Movable", "Fixed"];

const Assets = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Assign employee state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignAssetTarget, setAssignAssetTarget] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchAssets();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/users/employees');
      setEmployees(data);
    } catch {}
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/assets');
      setAssets(response.data);
    } catch {
      setSnackbar({ open: true, message: "Failed to load assets. Please refresh.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const getWarrantyStatus = (warrantyEnd) => {
    if (!warrantyEnd) return "N/A";
    return new Date(warrantyEnd) > new Date() ? "In Warranty" : "Expired";
  };

  const inputStyles = {
    "& .MuiOutlinedInput-root": { borderRadius: "12px" },
  };

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter((asset) => {
      const matchesSearch =
        asset.name?.toLowerCase().includes(search.toLowerCase()) ||
        asset._id?.toLowerCase().includes(search.toLowerCase()) ||
        asset.serialNumber?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || asset.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category, assets]);

  const handleExportCSV = () => {
    if (filteredAssets.length === 0) return;
    const headers = ["Asset ID", "Name", "Serial Number", "Category", "Form Factor", "Department", "Location", "Status", "Warranty Status"];
    const rows = filteredAssets.map(asset => [
      `AST-${asset._id.slice(-5).toUpperCase()}`,
      `"${asset.name || ''}"`,
      `"${asset.serialNumber || ''}"`,
      `"${asset.category || ''}"`,
      `"${asset.formFactor || ''}"`,
      `"${asset.department || ''}"`,
      `"${asset.location || 'Unassigned'}"`,
      `"${asset.status || ''}"`,
      `"${getWarrantyStatus(asset.warrantyEnd)}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `Asset_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Edit handlers
  const handleEditClick = (asset) => {
    setEditAsset(asset);
    setEditForm({
      name: asset.name || "",
      serialNumber: asset.serialNumber || "",
      category: asset.category || "",
      formFactor: asset.formFactor || "Movable",
      department: asset.department || "",
      location: asset.location || "",
      vendor: asset.vendor || "",
      status: asset.status || "Active",
      warrantyEnd: asset.warrantyEnd ? asset.warrantyEnd.split('T')[0] : "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      await api.put(`/assets/${editAsset._id}`, editForm);
      setSnackbar({ open: true, message: "Asset updated successfully.", severity: "success" });
      setEditDialogOpen(false);
      setEditAsset(null);
      fetchAssets();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || "Failed to update asset.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const handleDeleteClick = (asset) => {
    setDeleteTarget(asset);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/assets/${deleteTarget._id}`);
      setSnackbar({ open: true, message: `${deleteTarget.name} deleted successfully.`, severity: "success" });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      if (selected?._id === deleteTarget._id) setSelected(null);
      fetchAssets();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || "Failed to delete asset.", severity: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenAssign = (asset) => {
    setAssignAssetTarget(asset);
    setSelectedEmployee(null);
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedEmployee) return;
    setAssigning(true);
    try {
      // Use existing assignment endpoint
      await api.post('/asset-assignments', {
        department: selectedEmployee.department,
        asset: assignAssetTarget._id,
        employeeName: selectedEmployee.name,
        employeeEmail: selectedEmployee.email,
        employeePhone: selectedEmployee.phone || '',
        assignedDate: new Date().toISOString(),
      });
      setSnackbar({ open: true, message: `Asset assigned to ${selectedEmployee.name} successfully.`, severity: "success" });
      setAssignDialogOpen(false);
      setSelected(null);
      fetchAssets();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || "Failed to assign asset.", severity: "error" });
    } finally { setAssigning(false); }
  };

  const handleRevokeAssignment = async (asset) => {
    try {
      // Find the active assignment and return it
      const { data } = await api.get('/asset-assignments');
      const active = data.find(a => a.asset?._id === asset._id && a.status === 'Assigned');
      if (active) {
        await api.put(`/asset-assignments/return/${active._id}`);
        setSnackbar({ open: true, message: "Assignment revoked successfully.", severity: "success" });
        setSelected(null);
        fetchAssets();
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to revoke assignment.", severity: "error" });
    }
  };

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="Asset Registry"
        subtitle="Centralized database for hardware telemetry, lifecycle tracking, and maintenance operations."
        action={
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="outlined" startIcon={<DownloadRounded />} onClick={handleExportCSV} disabled={filteredAssets.length === 0}
              sx={{ borderColor: "divider", color: "text.primary", borderRadius: "10px", fontWeight: 700, "&:hover": { bgcolor: "action.hover", borderColor: "text.secondary" } }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained" startIcon={<AddRounded />} onClick={() => navigate("/admin/assets/add")}
              sx={{ bgcolor: "#111111", color: "#CBFA57", fontWeight: 900, px: 3, borderRadius: "10px", "&:hover": { bgcolor: "#222222" } }}
            >
              Provision Asset
            </Button>
          </Box>
        }
      />

      <Paper sx={{ p: 3, borderRadius: "16px", mb: 4, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <TextField fullWidth sx={inputStyles} label="Search by asset name, ID or serial number" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth select sx={inputStyles} label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <MenuItem value="All">All Categories</MenuItem>
              {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="outlined" onClick={() => { setSearch(""); setCategory("All"); }}
              sx={{ height: "100%", minHeight: "56px", borderColor: "divider", color: "text.secondary", borderRadius: "12px", fontWeight: 700, "&:hover": { bgcolor: "action.hover", color: "text.primary", borderColor: "text.secondary" } }}>
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ borderRadius: "16px", overflow: "hidden", bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
        <Box sx={{ overflowX: "auto" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={5} minHeight="300px">
              <CircularProgress color="inherit" />
            </Box>
          ) : filteredAssets.length === 0 ? (
            <Box p={5} textAlign="center">
              <Typography color="#64748b" fontWeight={600} fontSize="16px">No assets found. Click "Provision Asset" to add one.</Typography>
            </Box>
          ) : (
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  {["Asset Identification", "Category", "Department", "Location", "Warranty", "Status", "Actions"].map((head) => (
                    <TableCell key={head} sx={{ color: "text.secondary", fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset._id} sx={{ "&:hover": { bgcolor: "action.hover" }, "& td": { borderBottom: "1px solid", borderColor: "divider" }, transition: "background-color 0.2s ease" }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: "15px" }}>{asset.name}</Typography>
                      <Typography sx={{ fontSize: "13px", color: "text.secondary", fontFamily: "monospace", mt: 0.5 }}>
                        AST-{asset._id.slice(-5).toUpperCase()} • {asset.serialNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: "text.primary", fontWeight: 500 }}>{asset.category}</TableCell>
                    <TableCell sx={{ color: "text.primary", fontWeight: 500 }}>{asset.department}</TableCell>
                    <TableCell sx={{ color: "text.secondary", fontWeight: 500 }}>{asset.location || "Unassigned"}</TableCell>
                    <TableCell><StatusChip label={getWarrantyStatus(asset.warrantyEnd)} /></TableCell>
                    <TableCell><StatusChip label={asset.status} /></TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Inspect">
                          <Button size="small" variant="outlined" startIcon={<VisibilityRounded />} onClick={() => setSelected(asset)}
                            sx={{ borderColor: "divider", color: "text.primary", textTransform: "none", borderRadius: "8px", fontWeight: 700, "&:hover": { bgcolor: "action.hover", borderColor: "text.secondary" } }}>
                            View
                          </Button>
                        </Tooltip>
                        <Tooltip title="Edit Asset">
                          <IconButton size="small" onClick={() => handleEditClick(asset)} sx={{ color: "text.secondary", "&:hover": { color: "text.primary", bgcolor: "action.hover" } }}>
                            <EditRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Asset">
                          <IconButton size="small" onClick={() => handleDeleteClick(asset)} sx={{ color: "text.secondary", "&:hover": { color: "#DC2626", bgcolor: "#FEF2F2" } }}>
                            <DeleteOutlineRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Paper>

      {/* Detail Drawer */}
      <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)}
        PaperProps={{ sx: { bgcolor: "background.paper", color: "text.primary", borderLeft: "1px solid", borderColor: "divider" } }}>
        <Box sx={{ width: { xs: "100vw", sm: 400, md: 450 }, p: { xs: 3, md: 4 } }}>
          {selected && (
            <>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
                <Box>
                  <Typography sx={{ fontWeight: 900, letterSpacing: "-0.5px", fontSize: "24px", color: "text.primary" }}>{selected.name}</Typography>
                  <Typography sx={{ color: "text.secondary", fontFamily: "monospace", fontWeight: 600, mt: 1, fontSize: "16px" }}>
                    AST-{selected._id.slice(-5).toUpperCase()}
                  </Typography>
                </Box>
                <IconButton onClick={() => setSelected(null)} sx={{ color: "text.secondary", bgcolor: "action.hover" }}>
                  <CloseRounded />
                </IconButton>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 5 }}>
                {[
                  ["Category", selected.category],
                  ["Form Factor", selected.formFactor || "Movable"],
                  ["Department", selected.department],
                  ["Location", selected.location || "Unassigned"],
                  ["Vendor", selected.vendor || "Standard OEM"],
                  ["Serial Number", selected.serialNumber],
                  ["Warranty Expiry", selected.warrantyEnd ? new Date(selected.warrantyEnd).toLocaleDateString() : "N/A"],
                  ["Status", selected.status],
                ].map(([label, value]) => (
                  <Box key={label} sx={{ p: 2, borderRadius: "12px", bgcolor: "action.hover", border: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontSize: "13px", color: "text.secondary", fontWeight: 600 }}>{label}</Typography>
                    <Typography sx={{ fontWeight: 700, color: "text.primary", textAlign: "right", maxWidth: "60%" }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
              {/* Assigned to info */}
              {selected.assignedStatus === 'Assigned' && (
                <Box sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#dcfce7', border: '1px solid #bbf7d0' }}>
                  <Typography fontSize={12} fontWeight={700} color="#16a34a" mb={0.5}>Assigned To</Typography>
                  <Typography fontSize={14} fontWeight={700} color="#0f172a">{selected.assignedEmployeeName || '—'}</Typography>
                  <Typography fontSize={12} color="#64748b">{selected.assignedEmployeeEmail}</Typography>
                  <Typography fontSize={12} color="#64748b">{selected.assignedTo?.department || ''}</Typography>
                </Box>
              )}

              <Box display="flex" gap={1.5} flexWrap="wrap">
                <Button variant="outlined" onClick={() => { handleEditClick(selected); setSelected(null); }}
                  sx={{ flex: 1, py: 1.4, borderColor: "divider", color: "text.primary", fontWeight: 700, borderRadius: "12px", "&:hover": { bgcolor: "action.hover" } }}>
                  Edit
                </Button>
                {selected.assignedStatus !== 'Assigned' ? (
                  <Button variant="contained" startIcon={<PersonAddRounded />} onClick={() => { handleOpenAssign(selected); setSelected(null); }}
                    sx={{ flex: 1, py: 1.4, bgcolor: "#111111", color: "#CBFA57", fontWeight: 900, borderRadius: "12px", "&:hover": { bgcolor: "#222222" } }}>
                    Assign
                  </Button>
                ) : (
                  <Button variant="outlined" startIcon={<PersonRemoveRounded />} onClick={() => handleRevokeAssignment(selected)}
                    sx={{ flex: 1, py: 1.4, borderColor: "#dc2626", color: "#dc2626", fontWeight: 700, borderRadius: "12px", "&:hover": { bgcolor: "#fee2e2" } }}>
                    Revoke
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>
      </Drawer>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "24px", overflow: "hidden", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" } }}>
        <DialogTitle sx={{ p: 0, bgcolor: "background.paper" }}>
          <Box sx={{ p: 3, display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: "14px", bgcolor: "#111111", color: "#CBFA57", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <EditRounded />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, fontSize: "22px", color: "text.primary" }}>Edit Asset</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "13px", fontWeight: 600 }}>{editAsset?.name}</Typography>
            </Box>
            <IconButton onClick={() => setEditDialogOpen(false)}><CloseRounded /></IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <TextField label="Asset Name" fullWidth required sx={inputStyles} value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            <TextField label="Serial Number" fullWidth required sx={inputStyles} value={editForm.serialNumber || ""} onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Category" fullWidth select sx={inputStyles} value={editForm.category || ""} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                  {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField label="Form Factor" fullWidth select sx={inputStyles} value={editForm.formFactor || "Movable"} onChange={(e) => setEditForm({ ...editForm, formFactor: e.target.value })}>
                  {FORM_FACTORS.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Department" fullWidth sx={inputStyles} value={editForm.department || ""} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Location" fullWidth sx={inputStyles} value={editForm.location || ""} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Status" fullWidth select sx={inputStyles} value={editForm.status || "Active"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField label="Warranty End" type="date" fullWidth sx={inputStyles} value={editForm.warrantyEnd || ""} onChange={(e) => setEditForm({ ...editForm, warrantyEnd: e.target.value })} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
            <TextField label="Vendor" fullWidth sx={inputStyles} value={editForm.vendor || ""} onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })} />
          </Stack>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
            <Button onClick={() => setEditDialogOpen(false)} sx={{ color: "text.secondary", fontWeight: 800, px: 3 }}>Cancel</Button>
            <Button variant="contained" disabled={saving} onClick={handleEditSave} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
              sx={{ bgcolor: "#111111", color: "#CBFA57", fontWeight: 900, px: 4, py: 1.2, borderRadius: "12px", "&:hover": { bgcolor: "#222222" } }}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: "20px", p: 2, maxWidth: "400px", bgcolor: "background.paper" } }}>
        <DialogTitle sx={{ fontWeight: 900, color: "text.primary", pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "#FEE2E2", color: "#DC2626", display: "grid", placeItems: "center" }}><DeleteOutlineRounded /></Box>
          Delete Asset
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" fontWeight={600} lineHeight={1.6}>
            Are you sure you want to permanently delete <strong>{deleteTarget?.name}</strong>? This will also affect linked tickets.
          </Typography>
        </DialogContent>
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: "text.secondary", fontWeight: 800, borderRadius: "10px" }}>Cancel</Button>
          <Button onClick={confirmDelete} disabled={deleting} variant="contained"
            sx={{ bgcolor: "#EF4444", color: "#fff", fontWeight: 800, borderRadius: "10px", "&:hover": { bgcolor: "#DC2626" } }}>
            {deleting ? "Deleting..." : "Delete Asset"}
          </Button>
        </Box>
      </Dialog>

      {/* Assign Employee Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" } }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "#111111", color: "#CBFA57", display: "grid", placeItems: "center" }}>
              <PersonAddRounded />
            </Box>
            <Box>
              <Typography fontWeight={900} fontSize={20}>Assign to Employee</Typography>
              <Typography fontSize={13} color="text.secondary">{assignAssetTarget?.name}</Typography>
            </Box>
            <IconButton sx={{ ml: 'auto' }} onClick={() => setAssignDialogOpen(false)}><CloseRounded /></IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          <Typography fontSize={14} color="text.secondary" mb={2}>
            Select a registered employee to assign this asset. Only active employees are shown.
          </Typography>
          <Autocomplete
            options={employees}
            getOptionLabel={(e) => `${e.name} — ${e.email} (${e.department})`}
            value={selectedEmployee}
            onChange={(_, val) => setSelectedEmployee(val)}
            renderInput={(params) => <TextField {...params} label="Select Employee" fullWidth />}
            renderOption={(props, e) => (
              <Box component="li" {...props} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important', py: 1.5 }}>
                <Typography fontWeight={700} fontSize={14}>{e.name}</Typography>
                <Typography fontSize={12} color="text.secondary">{e.email} · {e.department} · {e.role}</Typography>
              </Box>
            )}
          />
          {selectedEmployee && (
            <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
              <Typography fontSize={13} fontWeight={700} mb={1}>Assignment Preview</Typography>
              {[['Name', selectedEmployee.name], ['Email', selectedEmployee.email], ['Department', selectedEmployee.department], ['Role', selectedEmployee.role]].map(([k, v]) => (
                <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography fontSize={13} color="text.secondary">{k}</Typography>
                  <Typography fontSize={13} fontWeight={600}>{v}</Typography>
                </Box>
              ))}
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={() => setAssignDialogOpen(false)} sx={{ color: "text.secondary", fontWeight: 700 }}>Cancel</Button>
            <Button variant="contained" disabled={!selectedEmployee || assigning} onClick={handleAssignSubmit}
              startIcon={assigning ? <CircularProgress size={16} color="inherit" /> : <PersonAddRounded />}
              sx={{ bgcolor: "#111111", color: "#CBFA57", fontWeight: 900, borderRadius: "10px", "&:hover": { bgcolor: "#222222" } }}>
              {assigning ? "Assigning..." : "Confirm Assignment"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: "14px", fontWeight: 800 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Assets;
