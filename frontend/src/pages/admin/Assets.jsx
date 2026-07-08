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
  Select,
  Snackbar,
  Alert,
  Stack,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Divider,
  Tooltip,
  Autocomplete,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import {
  AddRounded,
  DownloadRounded,
  VisibilityRounded,
  CloseRounded,
  EditRounded,
  DeleteOutlineRounded,
  PersonAddRounded,
  PersonRemoveRounded,
  HistoryRounded,
  UploadFileRounded,
  Inventory2Rounded,
  SearchRounded,
  CheckCircleRounded,
  BuildRounded,
  DevicesRounded,
  HelpOutlineRounded,
} from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import StatusChip from "../../components/StatusChip";
import api from "../../api/axios";
import BulkImportDialog from "../../components/BulkImportDialog";
import AssetTimelineDrawer from "../../components/AssetTimelineDrawer";

const CATEGORIES = ["IT Asset", "Electrical", "Electronic", "Furniture", "Networking", "Other"];
const STATUSES = ["Active", "Under Repair", "Decommissioned", "In Storage"];
const FORM_FACTORS = ["Movable", "Fixed"];

const Assets = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const warrantyFilter = searchParams.get("filter") === "warranty";
  const { currentUser } = useAuth();

  // Permission helpers
  const customPerms = currentUser?.customPermissions || [];
  const adminRoles = ['admin', 'super_admin', 'hod', 'manager'];
  const isAdminTier = adminRoles.includes(currentUser?.role);
  const hasPerm = (feature) => {
    if (isAdminTier) return true;
    const entry = customPerms.find(p => p.feature === feature);
    return entry?.allowed === true;
  };
  const canView     = hasPerm('View All Assets') || hasPerm('Register Assets') || hasPerm('Edit / Delete Assets') || hasPerm('Assign Assets');
  const canRegister = hasPerm('Register Assets');
  const canEdit     = hasPerm('Edit / Delete Assets');
  const canDelete   = hasPerm('Edit / Delete Assets');
  const canAssign   = hasPerm('Assign Assets');
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [departments, setDepartments] = useState([]);
  const [selected, setSelected] = useState(null);

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
  const [activeTab, setActiveTab] = useState("all");

  const isIncomplete = (asset) => {
    const optionalFields = [
      "vendor",
      "modelNumber",
      "purchaseCost",
      "procurementDate",
      "warrantyStart",
      "warrantyEnd",
      "servicePartnerName",
      "servicePartnerContact",
      "supportPhone",
      "supportEmail",
      "location",
      "notes",
      "purchaseFromName",
      "purchaseFromAddress",
      "purchaseFromPhone",
      "purchaseFromEmail",
      "purchaseFromGst"
    ];
    return optionalFields.some(field => !asset[field] || asset[field].toString().trim() === "");
  };

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Bulk import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Asset timeline state
  const [timelineAsset, setTimelineAsset] = useState(null);

  const [editCustomFieldConfigs, setEditCustomFieldConfigs] = useState([]);

  useEffect(() => {
    if (!editDialogOpen || !editForm.category) return;
    const fetchEditCustomFields = async () => {
      try {
        const { data } = await api.get(`/custom-fields?category=${encodeURIComponent(editForm.category)}`);
        setEditCustomFieldConfigs(data.data || []);
      } catch (err) {
        console.error("Failed to load edit custom fields configs:", err);
      }
    };
    fetchEditCustomFields();
  }, [editForm.category, editDialogOpen]);

  useEffect(() => {
    fetchAssets();
    fetchEmployees();
    api.get('/departments').then(({ data }) => setDepartments(data || [])).catch(() => {});
  }, []);

  // Deep-link support: open an asset's detail drawer directly (e.g. from Global Search)
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (!highlightId || assets.length === 0) return;
    const match = assets.find(a => a._id === highlightId);
    if (match) {
      setSelected(match);
      navigate("/admin/assets", { replace: true });
    }
  }, [assets, searchParams]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [search, statusFilter, deptFilter]);

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
      const sorted = [...response.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAssets(sorted);
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

  // KPI computations
  const kpis = useMemo(() => {
    const total = assets.length;
    const active = assets.filter(a => a.status === "Active").length;
    const underRepair = assets.filter(a => a.status === "Under Repair").length;
    const unassigned = assets.filter(a => a.assignedStatus !== "Assigned").length;
    const incomplete = assets.filter(isIncomplete).length;
    return { total, active, underRepair, unassigned, incomplete };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    let list = assets.filter((asset) => {
      const matchesSearch =
        asset.name?.toLowerCase().includes(search.toLowerCase()) ||
        asset._id?.toLowerCase().includes(search.toLowerCase()) ||
        asset.serialNumber?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || asset.status === statusFilter;
      const matchesDept = deptFilter === "All" || asset.department?.trim().toLowerCase() === deptFilter.trim().toLowerCase();
      const matchesTab = activeTab === "all" || isIncomplete(asset);
      const matchesWarranty = !warrantyFilter || (asset.warrantyEnd && new Date(asset.warrantyEnd) <= in30Days);
      return matchesSearch && matchesStatus && matchesDept && matchesTab && matchesWarranty;
    });
    if (warrantyFilter) {
      list = [...list].sort((a, b) => new Date(a.warrantyEnd) - new Date(b.warrantyEnd));
    }
    return list;
  }, [search, statusFilter, deptFilter, activeTab, assets, warrantyFilter]);

  const paginatedAssets = useMemo(
    () => filteredAssets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredAssets, page, rowsPerPage]
  );

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
      customFields: asset.customFields || {},
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
      const { data } = await api.get('/asset-assignments');
      const active = data.find(a => a.asset?._id === asset._id && a.status === 'Assigned');
      if (active) {
        await api.put(`/asset-assignments/return/${active._id}`);
        setSnackbar({ open: true, message: "Assignment revoked successfully.", severity: "success" });
        setSelected(null);
        fetchAssets();
      }
    } catch {
      setSnackbar({ open: true, message: "Failed to revoke assignment.", severity: "error" });
    }
  };

  const KPI_CARDS = [
    { label: "Total Assets", value: kpis.total, color: "text.primary", icon: <Inventory2Rounded sx={{ fontSize: 20 }} /> },
    { label: "Active / In-Use", value: kpis.active, color: "#FBBF24", icon: <CheckCircleRounded sx={{ fontSize: 20 }} /> },
    { label: "Under Repair", value: kpis.underRepair, color: "#FBBF24", icon: <BuildRounded sx={{ fontSize: 20 }} /> },
    { label: "Unassigned", value: kpis.unassigned, color: "#FBBF24", icon: <HelpOutlineRounded sx={{ fontSize: 20 }} /> },
  ];

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      {warrantyFilter && (
        <Alert
          severity="warning"
          sx={{ mb: 3, borderRadius: "12px", fontWeight: 600 }}
          action={
            <Button size="small" onClick={() => navigate("/admin/assets")} sx={{ fontWeight: 800, color: "inherit" }}>
              Clear filter
            </Button>
          }
        >
          Showing assets whose warranty is expiring within 30 days or has already expired, sorted by soonest.
        </Alert>
      )}

      {/* Page Header */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: "rgba(17,24,39,0.12)" }}>
            <Inventory2Rounded sx={{ color: "text.primary" }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Asset Registry</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Centralized lifecycle tracking, telemetry and maintenance operations
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadRounded />}
            onClick={handleExportCSV}
            disabled={filteredAssets.length === 0}
            sx={{ borderColor: "divider", color: "text.primary", borderRadius: "10px", fontWeight: 700, "&:hover": { bgcolor: "action.hover", borderColor: "text.secondary" } }}
          >
            Export CSV
          </Button>
          {canRegister && (
            <Button
              variant="outlined"
              startIcon={<UploadFileRounded />}
              onClick={() => setImportDialogOpen(true)}
              sx={{ borderColor: "divider", color: "text.primary", borderRadius: "10px", fontWeight: 700, "&:hover": { bgcolor: "action.hover", borderColor: "text.secondary" } }}
            >
              Import CSV
            </Button>
          )}
          {canRegister && (
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={() => navigate("/admin/assets/add")}
              sx={{ background: "#FBBF24", color: "#111827", fontWeight: 900, px: 3, borderRadius: "10px", boxShadow: "none", "&:hover": { background: "#F5A623", boxShadow: "none" } }}
            >
              Add Asset
            </Button>
          )}
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {KPI_CARDS.map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 6, sm: 3 }}>
            <Paper sx={{ p: 2.5, borderRadius: "16px", border: 1, borderColor: "divider", position: "relative", overflow: "hidden" }}>
              <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: kpi.color }} />
              <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: `${kpi.color}18`, display: "grid", placeItems: "center", mb: 1.5 }}>
                <Box sx={{ color: kpi.color }}>{kpi.icon}</Box>
              </Box>
              <Typography fontSize={28} fontWeight={950} color="text.primary" sx={{ lineHeight: 1, letterSpacing: "-1px" }}>{kpi.value}</Typography>
              <Typography fontSize={13} fontWeight={700} color="text.primary" mt={0.3}>{kpi.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Navigation Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newVal) => { setActiveTab(newVal); setPage(0); }}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTabs-indicator": { bgcolor: "text.primary" },
          "& .MuiTab-root": { fontWeight: 800, textTransform: "none", fontSize: 14 }
        }}
      >
        <Tab label="All Assets" value="all" />
        <Tab label={`Incomplete Data (${kpis.incomplete})`} value="incomplete" sx={{ color: kpis.incomplete > 0 ? "#F97316" : "text.secondary" }} />
      </Tabs>

      {/* Filter Bar */}
      <Paper sx={{ p: 2, borderRadius: "16px", border: 1, borderColor: "divider", mb: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          placeholder="Search by name, ID or serial…"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded sx={{ color: "text.disabled" }} /></InputAdornment> } }}
        />
        <Select
          size="small"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          sx={{ minWidth: 160, borderRadius: "10px", "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          displayEmpty
        >
          <MenuItem value="All">All Departments</MenuItem>
          {departments.map(d => <MenuItem key={d._id} value={d.name}>{d.name}</MenuItem>)}
        </Select>
        <Select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 140, borderRadius: "10px", "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          displayEmpty
        >
          <MenuItem value="All">All Statuses</MenuItem>
          {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </Select>
        {(search || statusFilter !== "All" || deptFilter !== "All") && (
          <Button
            size="small"
            onClick={() => { setSearch(""); setStatusFilter("All"); setDeptFilter("All"); }}
            sx={{ color: "text.secondary", fontWeight: 700, borderRadius: "8px", px: 2, border: 1, borderColor: "divider" }}
          >
            Clear
          </Button>
        )}
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: "20px", border: 1, borderColor: "divider", overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={52} sx={{ mb: 1.5, borderRadius: "10px", opacity: 1 - i * 0.12 }} />
            ))}
          </Box>
        ) : filteredAssets.length === 0 ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography color="text.secondary" fontWeight={600} fontSize="16px">No assets found. Click "Add Asset" to provision one.</Typography>
          </Box>
        ) : (
          <>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "background.default" }}>
                  {["Asset", "Category", "Department", "Location", "Warranty", "Status", "Actions"].map((head) => (
                    <TableCell key={head} sx={{ fontWeight: 800, fontSize: 11, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.6px", py: 1.5, borderBottom: 2, borderColor: "divider" }}>
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedAssets.map((asset) => (
                  <TableRow key={asset._id} hover sx={{ "&:last-child td": { borderBottom: 0 }, cursor: "pointer" }}>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: 14 }}>{asset.name}</Typography>
                        {isIncomplete(asset) && (
                          <Chip label="Incomplete" size="small" sx={{ height: 16, fontSize: 9, bgcolor: "rgba(249,115,22,0.12)", color: "#F97316", fontWeight: 700, border: "1px solid rgba(249,115,22,0.3)" }} />
                        )}
                      </Box>
                      <Typography sx={{ fontSize: 11.5, color: "text.secondary", fontFamily: "monospace", mt: 0.3 }}>
                        AST-{asset._id.slice(-5).toUpperCase()} · {asset.serialNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, color: "text.secondary", fontWeight: 600, fontSize: 13 }}>{asset.category}</TableCell>
                    <TableCell sx={{ py: 1.5, color: "text.primary", fontWeight: 600, fontSize: 13 }}>{asset.department}</TableCell>
                    <TableCell sx={{ py: 1.5, color: "text.secondary", fontWeight: 500, fontSize: 13 }}>{asset.location || "—"}</TableCell>
                    <TableCell sx={{ py: 1.5 }}><StatusChip label={getWarrantyStatus(asset.warrantyEnd)} /></TableCell>
                    <TableCell sx={{ py: 1.5 }}><StatusChip label={asset.status} /></TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="View details">
                          <IconButton size="small" onClick={() => setSelected(asset)} sx={{ color: "text.secondary", "&:hover": { color: "text.primary", bgcolor: "rgba(17,24,39,0.08)" } }}>
                            <VisibilityRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Timeline / History">
                          <IconButton size="small" onClick={() => setTimelineAsset(asset)} sx={{ color: "text.secondary", "&:hover": { color: "#3B82F6", bgcolor: "rgba(59,130,246,0.08)" } }}>
                            <HistoryRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canEdit && (
                          <Tooltip title="Edit Asset">
                            <IconButton size="small" onClick={() => handleEditClick(asset)} sx={{ color: "text.secondary", "&:hover": { color: "text.primary", bgcolor: "action.hover" } }}>
                              <EditRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canAssign && (asset.assignedStatus !== "Assigned" ? (
                          <Tooltip title="Assign to Employee">
                            <IconButton size="small" onClick={() => handleOpenAssign(asset)} sx={{ color: "text.secondary", "&:hover": { color: "#22C55E", bgcolor: "rgba(34,197,94,0.08)" } }}>
                              <PersonAddRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Revoke Assignment">
                            <IconButton size="small" onClick={() => handleRevokeAssignment(asset)} sx={{ color: "text.secondary", "&:hover": { color: "#EF4444", bgcolor: "rgba(239,68,68,0.08)" } }}>
                              <PersonRemoveRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ))}
                        {canDelete && (
                          <Tooltip title="Delete Asset">
                            <IconButton size="small" onClick={() => handleDeleteClick(asset)} sx={{ color: "text.secondary", "&:hover": { color: "#EF4444", bgcolor: "rgba(239,68,68,0.08)" } }}>
                              <DeleteOutlineRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredAssets.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ borderTop: "1px solid", borderColor: "divider", color: "text.secondary" }}
            />
          </>
        )}
      </TableContainer>

      {/* Detail Drawer */}
      <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)}
        slotProps={{ paper: { sx: { bgcolor: "background.paper", color: "text.primary", borderLeft: "1px solid", borderColor: "divider" } } }}>
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
                  ["OEM / Brand", selected.vendor || "Standard OEM"],
                  ["Serial Number", selected.serialNumber],
                  ["Warranty Expiry", selected.warrantyEnd ? new Date(selected.warrantyEnd).toLocaleDateString() : "N/A"],
                  ["Status", selected.status],
                  ["Purchase From", selected.purchaseFromName || "—"],
                  ["Vendor GST", selected.purchaseFromGst || "—"],
                  ["Service Partner", selected.servicePartnerName || "—"],
                  ["Support Contact", selected.servicePartnerContact || "—"],
                ].map(([label, value]) => (
                  <Box key={label} sx={{ p: 2, borderRadius: "12px", bgcolor: "action.hover", border: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontSize: "13px", color: "text.secondary", fontWeight: 600 }}>{label}</Typography>
                    <Typography sx={{ fontWeight: 700, color: "text.primary", textAlign: "right", maxWidth: "60%" }}>{value}</Typography>
                  </Box>
                ))}

                {Object.keys(selected.customFields || {}).length > 0 && (
                  <Box sx={{ mt: 1.5, mb: 0.5 }}>
                    <Divider>
                      <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Custom Specifications
                      </Typography>
                    </Divider>
                  </Box>
                )}

                {Object.entries(selected.customFields || {}).map(([key, val]) => (
                  <Box key={key} sx={{ p: 2, borderRadius: "12px", bgcolor: "action.hover", border: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontSize: "13px", color: "text.secondary", fontWeight: 600 }}>{key}</Typography>
                    <Typography sx={{ fontWeight: 700, color: "text.primary", textAlign: "right", maxWidth: "60%" }}>{val || "—"}</Typography>
                  </Box>
                ))}
              </Box>
              {selected.assignedStatus === 'Assigned' && (
                <Box sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'rgba(22,163,74,0.10)', border: '1px solid rgba(22,163,74,0.25)' }}>
                  <Typography fontSize={12} fontWeight={700} sx={{ color: '#4ADE80', mb: 0.5 }}>Assigned To</Typography>
                  <Typography fontSize={14} fontWeight={700} color="text.primary">{selected.assignedEmployeeName || '—'}</Typography>
                  <Typography fontSize={12} color="text.secondary">{selected.assignedEmployeeEmail}</Typography>
                  <Typography fontSize={12} color="text.secondary">{selected.assignedTo?.department || ''}</Typography>
                </Box>
              )}

              <Button variant="outlined" startIcon={<HistoryRounded />} onClick={() => { setTimelineAsset(selected); setSelected(null); }}
                sx={{ width: "100%", mb: 2, py: 1.4, borderColor: "divider", color: "text.primary", fontWeight: 700, borderRadius: "12px", "&:hover": { bgcolor: "action.hover" } }}>
                View Lifecycle History
              </Button>

              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button variant="outlined" onClick={() => { handleEditClick(selected); setSelected(null); }}
                  sx={{ flex: 1, py: 1.4, borderColor: "divider", color: "text.primary", fontWeight: 700, borderRadius: "12px", "&:hover": { bgcolor: "action.hover" } }}>
                  Edit
                </Button>
                {selected.assignedStatus !== 'Assigned' ? (
                  <Button variant="contained" startIcon={<PersonAddRounded />} onClick={() => { handleOpenAssign(selected); setSelected(null); }}
                    sx={{ flex: 1, py: 1.4, background: "#FBBF24", color: "#111827", fontWeight: 900, borderRadius: "12px", boxShadow: "none", "&:hover": { background: "#F5A623", boxShadow: "none" } }}>
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
        slotProps={{ paper: { sx: { borderRadius: "24px", overflow: "hidden", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" } } }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ p: 3, background: "linear-gradient(135deg,rgba(17,24,39,0.1),rgba(17,24,39,0.05))", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "#111827", display: "grid", placeItems: "center" }}>
                <EditRounded sx={{ color: "#fff" }} />
              </Box>
              <Box>
                <Typography fontWeight={900} fontSize={18}>Edit Asset</Typography>
                <Typography fontSize={12} color="text.secondary">{editAsset?.name}</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setEditDialogOpen(false)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}><CloseRounded /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Asset Name" fullWidth required sx={inputStyles} value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            <TextField label="Serial Number" fullWidth required sx={inputStyles} value={editForm.serialNumber || ""} onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })} />
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField label="Category" fullWidth select sx={inputStyles} value={editForm.category || ""} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                  {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField label="Form Factor" fullWidth select sx={inputStyles} value={editForm.formFactor || "Movable"} onChange={(e) => setEditForm({ ...editForm, formFactor: e.target.value })}>
                  {FORM_FACTORS.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField label="Department" fullWidth select sx={inputStyles} value={editForm.department || ""} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}>
                  <MenuItem value="">— None —</MenuItem>
                  {departments.map(d => <MenuItem key={d._id} value={d.name}>{d.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField label="Location" fullWidth sx={inputStyles} value={editForm.location || ""} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField label="Status" fullWidth select sx={inputStyles} value={editForm.status || "Active"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField label="Warranty End" type="date" fullWidth sx={inputStyles} value={editForm.warrantyEnd || ""} onChange={(e) => setEditForm({ ...editForm, warrantyEnd: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
            </Grid>
            <TextField label="Vendor" fullWidth sx={inputStyles} value={editForm.vendor || ""} onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })} />

            {editCustomFieldConfigs.length > 0 && (
              <Divider sx={{ my: 1.5 }}>
                <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase" }}>
                  Custom Specifications
                </Typography>
              </Divider>
            )}

            <Grid container spacing={2}>
              {editCustomFieldConfigs.map((field) => (
                <Grid key={field._id} size={6}>
                  {field.type === "Select" ? (
                    <TextField
                      select
                      fullWidth
                      required={field.isRequired}
                      label={`${field.name}${field.isRequired ? " *" : ""}`}
                      value={editForm.customFields?.[field.name] || ""}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        customFields: { ...prev.customFields, [field.name]: e.target.value }
                      }))}
                      sx={inputStyles}
                    >
                      {field.options.map((opt) => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <TextField
                      fullWidth
                      required={field.isRequired}
                      type={field.type === "Number" ? "number" : field.type === "Date" ? "date" : "text"}
                      label={`${field.name}${field.isRequired ? " *" : ""}`}
                      value={editForm.customFields?.[field.name] || ""}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        customFields: { ...prev.customFields, [field.name]: e.target.value }
                      }))}
                      sx={inputStyles}
                      slotProps={field.type === "Date" ? { inputLabel: { shrink: true } } : undefined}
                    />
                  )}
                </Grid>
              ))}
            </Grid>
          </Stack>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
            <Button onClick={() => setEditDialogOpen(false)} sx={{ color: "text.secondary", fontWeight: 800, px: 3 }}>Cancel</Button>
            <Button variant="contained" disabled={saving} onClick={handleEditSave} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
              sx={{ background: "#FBBF24", color: "#111827", fontWeight: 800, borderRadius: "12px", boxShadow: "none", px: 4, py: 1.2 }}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: "20px", p: 2, maxWidth: "400px", bgcolor: "background.paper" } } }}>
        <DialogTitle sx={{ fontWeight: 900, color: "text.primary", pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "#FEE2E2", color: "#DC2626", display: "grid", placeItems: "center" }}><DeleteOutlineRounded /></Box>
          Delete Asset
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" fontWeight={600} sx={{ lineHeight: 1.6 }}>
            Are you sure you want to permanently delete <strong>{deleteTarget?.name}</strong>? This will also affect linked tickets.
          </Typography>
        </DialogContent>
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: "text.secondary", fontWeight: 800, borderRadius: "10px" }}>Cancel</Button>
          <Button onClick={confirmDelete} disabled={deleting} variant="contained"
            sx={{ bgcolor: "#EF4444", color: "#fff", fontWeight: 800, borderRadius: "10px", boxShadow: "none", "&:hover": { bgcolor: "#DC2626" } }}>
            {deleting ? "Deleting..." : "Delete Asset"}
          </Button>
        </Box>
      </Dialog>

      {/* Assign Employee Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: "24px", overflow: "hidden", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" } } }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ p: 3, background: "linear-gradient(135deg,rgba(17,24,39,0.1),rgba(17,24,39,0.05))", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "#111827", display: "grid", placeItems: "center" }}>
                <PersonAddRounded sx={{ color: "#fff" }} />
              </Box>
              <Box>
                <Typography fontWeight={900} fontSize={18}>Assign to Employee</Typography>
                <Typography fontSize={12} color="text.secondary">{assignAssetTarget?.name}</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setAssignDialogOpen(false)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}><CloseRounded /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography fontSize={14} color="text.secondary" mb={2} mt={0.5}>
            Select a registered employee to assign this asset. Only active employees are shown.
          </Typography>
          <Autocomplete
            options={employees}
            getOptionLabel={(e) => `${e.name} — ${e.email} (${e.department})`}
            value={selectedEmployee}
            onChange={(_, val) => setSelectedEmployee(val)}
            renderInput={(params) => <TextField {...params} label="Select Employee" fullWidth sx={inputStyles} />}
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
              sx={{ background: "#FBBF24", color: "#111827", fontWeight: 800, borderRadius: "12px", boxShadow: "none" }}>
              {assigning ? "Assigning..." : "Confirm Assignment"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: "14px", fontWeight: 800 }}>{snackbar.message}</Alert>
      </Snackbar>

      <BulkImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={() => {
          setImportDialogOpen(false);
          setSnackbar({ open: true, message: "Assets imported successfully.", severity: "success" });
          fetchAssets();
        }}
      />

      <AssetTimelineDrawer
        open={Boolean(timelineAsset)}
        assetId={timelineAsset?._id}
        assetName={timelineAsset?.name}
        onClose={() => setTimelineAsset(null)}
      />
    </Box>
  );
};

export default Assets;
