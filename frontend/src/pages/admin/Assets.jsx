import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
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
  LinearProgress,
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
  QrCode2Rounded,
} from "@mui/icons-material";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import StatusChip from "../../components/StatusChip";
import api, { getFileUrl } from "../../api/axios";
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
  const [qrAsset, setQrAsset]     = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);

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
    const coreFields = ["vendor", "location", "warrantyEnd", "department"];
    return coreFields.some(field => !asset[field] || asset[field].toString().trim() === "");
  };

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Bulk import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Asset timeline state
  const [timelineAsset, setTimelineAsset] = useState(null);

  // Full asset detail (fetched on drawer open for documents + complete fields)
  const [fullAsset, setFullAsset] = useState(null);
  const [fullAssetLoading, setFullAssetLoading] = useState(false);

  useEffect(() => {
    if (!selected) { setFullAsset(null); return; }
    setFullAssetLoading(true);
    api.get(`/assets/${selected._id}`)
      .then(r => setFullAsset(r.data.asset || r.data))
      .catch(() => setFullAsset(selected))
      .finally(() => setFullAssetLoading(false));
  }, [selected?._id]);

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

  useEffect(() => {
    if (!qrAsset) { setQrDataUrl(""); return; }
    const url = `${window.location.origin}/scan/${qrAsset._id}`;
    QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: "#111827", light: "#FFFFFF" } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [qrAsset]);

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAssets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAssets.map(a => a._id)));
    }
  };

  const buildQrCard = (doc, asset, dataUrl, x, y, cardW, cardH) => {
    const pad = 4;
    const textH = 16; // mm reserved for 3 lines of text at bottom
    const qrSize = Math.min(cardW - pad * 2, cardH - pad - textH - 2);
    const qrX = x + (cardW - qrSize) / 2;
    const qrY = y + pad;
    doc.addImage(dataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    const textY = qrY + qrSize + 4;
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    const name = asset.name.length > 24 ? asset.name.slice(0, 23) + "…" : asset.name;
    doc.text(name, x + cardW / 2, textY, { align: "center" });
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    const sub = `${asset.department || "—"}  ·  ${asset.location || "No location"}`;
    doc.text(sub.length > 32 ? sub.slice(0, 31) + "…" : sub, x + cardW / 2, textY + 4.5, { align: "center" });
    doc.setFontSize(5.5);
    doc.setTextColor(156, 163, 175);
    doc.text(asset.serialNumber || "", x + cardW / 2, textY + 9, { align: "center" });
    // card border
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, cardH, 2, 2);
  };

  const downloadQrPdf = async (assetList, filename) => {
    setBulkDownloading(true);
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210, pageH = 297;
      const cols = 3, rows = 4;
      const marginX = 10, marginY = 15, gapX = 5, gapY = 8;
      const cardW = (pageW - marginX * 2 - gapX * (cols - 1)) / cols;
      const cardH = (pageH - marginY * 2 - gapY * (rows - 1)) / rows;
      let col = 0, row = 0, page = 1;

      for (const asset of assetList) {
        if (col === 0 && row === 0 && page > 1) doc.addPage();
        const url = `${window.location.origin}/scan/${asset._id}`;

        // Draw QR onto an HTML canvas then pass canvas directly to jsPDF
        // (avoids jsPDF's PNG decoder which behaves differently in the browser)
        const canvas = document.createElement("canvas");
        await QRCode.toCanvas(canvas, url, { width: 200, margin: 1, color: { dark: "#000000", light: "#ffffff" } });

        const x = marginX + col * (cardW + gapX);
        const y = marginY + row * (cardH + gapY);
        buildQrCard(doc, asset, canvas, x, y, cardW, cardH);
        col++;
        if (col >= cols) { col = 0; row++; }
        if (row >= rows) { col = 0; row = 0; page++; }
      }
      doc.save(filename);
    } catch (err) {
      console.error("QR PDF error:", err);
    } finally {
      setBulkDownloading(false);
    }
  };

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
    navigate(`/admin/assets/edit/${asset._id}`);
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
          <Tooltip title="Download QR codes for every asset as a printable PDF">
            <Button
              variant="outlined"
              startIcon={bulkDownloading ? <CircularProgress size={14} color="inherit" /> : <QrCode2Rounded />}
              disabled={bulkDownloading || assets.length === 0}
              onClick={() => downloadQrPdf(assets, `AssetCare_All_QR_${Date.now()}.pdf`)}
              sx={{ borderColor: "divider", color: "text.primary", borderRadius: "10px", fontWeight: 700, "&:hover": { bgcolor: "action.hover", borderColor: "text.secondary" } }}
            >
              All QR Codes
            </Button>
          </Tooltip>
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
        {(search || deptFilter !== "All") && (
          <Button
            size="small"
            onClick={() => { setSearch(""); setDeptFilter("All"); }}
            sx={{ color: "text.secondary", fontWeight: 700, borderRadius: "8px", px: 2, border: 1, borderColor: "divider" }}
          >
            Clear
          </Button>
        )}
      </Paper>

      {/* Bulk-selection toolbar */}
      {selectedIds.size > 0 && (
        <Paper sx={{ mb: 2, px: 2.5, py: 1.5, borderRadius: "14px", border: "1.5px solid", borderColor: "#FBBF24", bgcolor: "rgba(251,191,36,0.06)", display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Typography fontWeight={800} fontSize={14} sx={{ flex: 1 }}>
            {selectedIds.size} asset{selectedIds.size > 1 ? "s" : ""} selected
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedIds(new Set())}
            sx={{ fontWeight: 700, borderRadius: "8px", borderColor: "divider", color: "text.secondary", textTransform: "none" }}
          >
            Clear
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={bulkDownloading ? <CircularProgress size={14} color="inherit" /> : <QrCode2Rounded />}
            disabled={bulkDownloading}
            onClick={() => {
              const list = assets.filter(a => selectedIds.has(a._id));
              downloadQrPdf(list, `AssetCare_QR_Selected_${Date.now()}.pdf`);
            }}
            sx={{ bgcolor: "#111827", color: "#FBBF24", fontWeight: 800, borderRadius: "8px", textTransform: "none", boxShadow: "none" }}
          >
            Download QR ({selectedIds.size})
          </Button>
        </Paper>
      )}

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
                  <TableCell padding="checkbox" sx={{ borderBottom: 2, borderColor: "divider", pl: 1.5 }}>
                    <Checkbox
                      size="small"
                      checked={filteredAssets.length > 0 && selectedIds.size === filteredAssets.length}
                      indeterminate={selectedIds.size > 0 && selectedIds.size < filteredAssets.length}
                      onChange={toggleSelectAll}
                      sx={{ color: "text.disabled", "&.Mui-checked": { color: "#FBBF24" }, "&.MuiCheckbox-indeterminate": { color: "#FBBF24" } }}
                    />
                  </TableCell>
                  {["Asset", "Category", "Department", "Location", "Warranty", "Status", "Actions"].map((head) => (
                    <TableCell key={head} sx={{ fontWeight: 800, fontSize: 11, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.6px", py: 1.5, borderBottom: 2, borderColor: "divider" }}>
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedAssets.map((asset) => (
                  <TableRow key={asset._id} hover selected={selectedIds.has(asset._id)} sx={{ "&:last-child td": { borderBottom: 0 }, cursor: "pointer", "&.Mui-selected": { bgcolor: "rgba(251,191,36,0.06)" }, "&.Mui-selected:hover": { bgcolor: "rgba(251,191,36,0.1)" } }}>
                    <TableCell padding="checkbox" sx={{ pl: 1.5 }} onClick={e => { e.stopPropagation(); toggleSelect(asset._id); }}>
                      <Checkbox
                        size="small"
                        checked={selectedIds.has(asset._id)}
                        sx={{ color: "text.disabled", "&.Mui-checked": { color: "#FBBF24" } }}
                      />
                    </TableCell>
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
                        <Tooltip title="QR Code">
                          <IconButton size="small" onClick={() => setQrAsset(asset)} sx={{ color: "text.secondary", "&:hover": { color: "#FBBF24", bgcolor: "rgba(251,191,36,0.1)" } }}>
                            <QrCode2Rounded fontSize="small" />
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
        <Box sx={{ width: { xs: "100vw", sm: 520, md: 600 }, height: "100%", display: "flex", flexDirection: "column" }}>
          {selected && (() => {
            const a = fullAsset || selected;
            const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
            const Row = ({ label, value }) => value && value !== '—' ? (
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", py: 1.2, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600, minWidth: 130, flexShrink: 0 }}>{label}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary", textAlign: "right", wordBreak: "break-word" }}>{value}</Typography>
              </Box>
            ) : null;
            const Section = ({ title }) => (
              <Typography sx={{ fontSize: 10, fontWeight: 800, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.8px", mt: 2.5, mb: 0.5 }}>{title}</Typography>
            );
            const DOC_LABELS = { invoice: 'Purchase Invoice', warranty: 'Warranty Card', amc: 'AMC Contract', manual: 'User Manual', service: 'Service Report' };
            const docs = a.documents || [];

            return (
              <>
                {/* Header */}
                <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 20, letterSpacing: "-0.4px", color: "text.primary" }}>{a.name}</Typography>
                    <Typography sx={{ color: "text.secondary", fontFamily: "monospace", fontWeight: 600, fontSize: 13, mt: 0.5 }}>
                      AST-{a._id?.slice(-5).toUpperCase()} · {a.serialNumber}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                      {a.status && <Chip label={a.status} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: a.status === 'Active' ? 'rgba(34,197,94,0.1)' : 'action.hover', color: a.status === 'Active' ? '#16a34a' : 'text.secondary' }} />}
                      {a.category && <Chip label={a.category} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: 'action.hover' }} />}
                      {a.formFactor && <Chip label={a.formFactor} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: 'action.hover' }} />}
                    </Box>
                  </Box>
                  <IconButton onClick={() => setSelected(null)} sx={{ color: "text.secondary", bgcolor: "action.hover", ml: 2, flexShrink: 0 }}><CloseRounded /></IconButton>
                </Box>

                {/* Scrollable body */}
                <Box sx={{ flex: 1, overflowY: "auto", px: 3, pb: 3 }}>
                  {fullAssetLoading && <LinearProgress sx={{ mt: 2, mb: 1, borderRadius: 2 }} />}

                  {/* Hardware */}
                  <Section title="Hardware Specifications" />
                  <Row label="OEM / Brand" value={a.vendor} />
                  <Row label="Model Number" value={a.modelNumber} />
                  <Row label="Serial Number" value={a.serialNumber} />
                  <Row label="Purchase Cost" value={a.purchaseCost ? `₹${Number(a.purchaseCost).toLocaleString('en-IN')}` : null} />

                  {/* Lifecycle */}
                  <Section title="Lifecycle & Warranty" />
                  <Row label="Service Partner" value={a.servicePartnerName} />
                  <Row label="Contact Person" value={a.servicePartnerContact} />
                  <Row label="Support Phone" value={a.supportPhone} />
                  <Row label="Support Email" value={a.supportEmail} />

                  {/* Purchase */}
                  <Section title="Purchase Details" />
                  <Row label="Procurement Date" value={fmt(a.procurementDate)} />
                  <Row label="Warranty Start" value={fmt(a.warrantyStart)} />
                  <Row label="Warranty Expiry" value={fmt(a.warrantyEnd)} />
                  <Row label="Purchased From" value={a.purchaseFromName} />
                  <Row label="Vendor GST" value={a.purchaseFromGst} />
                  <Row label="Vendor Phone" value={a.purchaseFromPhone} />
                  <Row label="Vendor Email" value={a.purchaseFromEmail} />
                  <Row label="Vendor Address" value={a.purchaseFromAddress} />

                  {/* Deployment */}
                  <Section title="Deployment" />
                  <Row label="Department" value={a.department} />
                  <Row label="Status" value={a.status} />
                  {a.notes && <Row label="Notes" value={a.notes} />}

                  {/* Assignment */}
                  {a.assignedStatus === 'Assigned' && (
                    <>
                      <Section title="Assigned To" />
                      <Box sx={{ p: 2, mt: 1, borderRadius: "12px", bgcolor: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
                        <Typography fontSize={14} fontWeight={800} color="text.primary">{a.assignedEmployeeName || '—'}</Typography>
                        <Typography fontSize={12} color="text.secondary">{a.assignedEmployeeEmail}</Typography>
                        <Typography fontSize={12} color="text.secondary">{a.assignedTo?.department || ''}</Typography>
                      </Box>
                    </>
                  )}

                  {/* Custom Fields */}
                  {Object.keys(a.customFields || {}).length > 0 && (
                    <>
                      <Section title="Custom Specifications" />
                      {Object.entries(a.customFields).map(([k, v]) => <Row key={k} label={k} value={v || '—'} />)}
                    </>
                  )}

                  {/* Documents */}
                  <Section title="Documents" />
                  {docs.length === 0 ? (
                    <Typography fontSize={12} color="text.disabled" sx={{ mt: 1, fontStyle: 'italic' }}>No documents attached.</Typography>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
                      {docs.map((doc) => {
                        const url = getFileUrl(doc.url);
                        const isImage = /\.(jpg|jpeg|png|webp)$/i.test(doc.fileName || doc.url || '');
                        const isPdf = /\.pdf$/i.test(doc.fileName || doc.url || '');
                        return (
                          <Box key={doc._id} sx={{ borderRadius: "12px", border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
                            {isImage && (
                              <Box component="img" src={url} alt={doc.originalName}
                                sx={{ width: "100%", maxHeight: 200, objectFit: "contain", bgcolor: "action.hover", display: "block" }} />
                            )}
                            <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                              <Box>
                                <Typography fontSize={11} fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                  {DOC_LABELS[doc.docType] || doc.docType}
                                </Typography>
                                <Typography fontSize={12} fontWeight={600} color="text.primary" sx={{ wordBreak: "break-all" }}>
                                  {doc.originalName || doc.fileName}
                                </Typography>
                              </Box>
                              <Button component="a" href={url} target="_blank" rel="noopener noreferrer" size="small" variant="outlined"
                                sx={{ fontWeight: 700, fontSize: 11, borderRadius: "8px", whiteSpace: "nowrap", flexShrink: 0 }}>
                                {isPdf ? 'Open PDF' : isImage ? 'View' : 'Download'}
                              </Button>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>

                {/* Footer actions */}
                <Box sx={{ p: 2.5, borderTop: "1px solid", borderColor: "divider", flexShrink: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Button variant="outlined" startIcon={<HistoryRounded />} onClick={() => { setTimelineAsset(selected); setSelected(null); }}
                    sx={{ width: "100%", py: 1.2, borderColor: "divider", color: "text.primary", fontWeight: 700, borderRadius: "12px" }}>
                    View Lifecycle History
                  </Button>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button variant="outlined" onClick={() => navigate(`/admin/assets/edit/${selected._id}`)}
                      sx={{ flex: 1, py: 1.2, borderColor: "divider", color: "text.primary", fontWeight: 700, borderRadius: "12px" }}>
                      Edit
                    </Button>
                    {a.assignedStatus !== 'Assigned' ? (
                      <Button variant="contained" startIcon={<PersonAddRounded />} onClick={() => { handleOpenAssign(selected); setSelected(null); }}
                        sx={{ flex: 1, py: 1.2, background: "#FBBF24", color: "#111827", fontWeight: 900, borderRadius: "12px", boxShadow: "none" }}>
                        Assign
                      </Button>
                    ) : (
                      <Button variant="outlined" startIcon={<PersonRemoveRounded />} onClick={() => handleRevokeAssignment(selected)}
                        sx={{ flex: 1, py: 1.2, borderColor: "#dc2626", color: "#dc2626", fontWeight: 700, borderRadius: "12px" }}>
                        Revoke
                      </Button>
                    )}
                  </Box>
                </Box>
              </>
            );
          })()}
        </Box>
      </Drawer>

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

      {/* QR Code Modal */}
      <Dialog open={Boolean(qrAsset)} onClose={() => setQrAsset(null)} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "20px", border: 1, borderColor: "divider" } } }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "rgba(251,191,36,0.12)", display: "grid", placeItems: "center" }}>
              <QrCode2Rounded sx={{ color: "#FBBF24" }} />
            </Box>
            <Box>
              <Typography fontWeight={900} fontSize={16}>Asset QR Code</Typography>
              <Typography fontSize={12} color="text.secondary" fontWeight={600}>{qrAsset?.name}</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setQrAsset(null)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}><CloseRounded /></IconButton>
        </Box>
        <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          {qrDataUrl ? (
            <>
              <Box sx={{ p: 2, borderRadius: "16px", bgcolor: "#fff", border: 1, borderColor: "divider", display: "inline-block" }}>
                <img src={qrDataUrl} alt="QR Code" style={{ width: 240, height: 240, display: "block" }} />
              </Box>

              {/* Label info below QR */}
              <Box sx={{ width: "100%", p: 2, borderRadius: "12px", bgcolor: "action.hover", border: 1, borderColor: "divider", textAlign: "center" }}>
                <Typography fontWeight={900} fontSize={15}>{qrAsset?.name}</Typography>
                <Typography fontSize={12} color="text.secondary" fontWeight={600} mt={0.3}>
                  {qrAsset?.department || "—"}  ·  {qrAsset?.location || "No location"}
                </Typography>
                <Typography fontSize={11} color="text.disabled" fontWeight={700} mt={0.3} sx={{ fontFamily: "monospace" }}>
                  {qrAsset?.serialNumber}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                startIcon={<DownloadRounded />}
                onClick={() => {
                  const qrSize = 300;
                  const pad = 24;
                  const labelH = 100;
                  const canvasW = qrSize + pad * 2;
                  const canvasH = qrSize + pad * 2 + labelH;
                  const canvas = document.createElement("canvas");
                  canvas.width = canvasW;
                  canvas.height = canvasH;
                  const ctx = canvas.getContext("2d");
                  ctx.fillStyle = "#FFFFFF";
                  ctx.fillRect(0, 0, canvasW, canvasH);
                  const img = new Image();
                  img.onload = () => {
                    ctx.drawImage(img, pad, pad, qrSize, qrSize);
                    // divider
                    ctx.strokeStyle = "#E5E7EB";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(pad, qrSize + pad + 12);
                    ctx.lineTo(canvasW - pad, qrSize + pad + 12);
                    ctx.stroke();
                    // asset name
                    const ty = qrSize + pad + 36;
                    ctx.fillStyle = "#111827";
                    ctx.font = "bold 16px Arial, sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText(qrAsset?.name || "", canvasW / 2, ty);
                    // dept · location
                    ctx.font = "13px Arial, sans-serif";
                    ctx.fillStyle = "#6B7280";
                    ctx.fillText(
                      `${qrAsset?.department || "—"}  ·  ${qrAsset?.location || "No location"}`,
                      canvasW / 2, ty + 22
                    );
                    // serial
                    ctx.font = "bold 11px Courier New, monospace";
                    ctx.fillStyle = "#9CA3AF";
                    ctx.fillText(qrAsset?.serialNumber || "", canvasW / 2, ty + 44);
                    const a = document.createElement("a");
                    a.href = canvas.toDataURL("image/png");
                    a.download = `QR_${qrAsset?.serialNumber || qrAsset?._id}.png`;
                    a.click();
                  };
                  img.src = qrDataUrl;
                }}
                sx={{ bgcolor: "#111827", color: "#FBBF24", fontWeight: 900, borderRadius: "12px", boxShadow: "none", textTransform: "none", py: 1.3 }}
              >
                Download QR Code
              </Button>
              <Typography fontSize={11} color="text.disabled" textAlign="center">
                Print and stick this on the physical asset. Scanning will let anyone log in and raise a ticket directly.
              </Typography>
            </>
          ) : (
            <Box sx={{ py: 6 }}><CircularProgress sx={{ color: "#FBBF24" }} /></Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Assets;
