import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Grid, TextField, InputAdornment,
  List, ListItemButton, Chip, IconButton, Dialog, DialogContent,
  Button, MenuItem, Select, FormControl, InputLabel, CircularProgress,
  Divider, Tooltip, Skeleton, Autocomplete, ListItemText, DialogTitle
} from "@mui/material";
import {
  BuildRounded, SearchRounded, AddRounded, EditRounded, DeleteRounded,
  CloseRounded, EngineeringRounded, CalendarTodayRounded, AttachMoneyRounded,
  EventRepeatRounded, PersonRounded, PhoneRounded, StorefrontRounded,
  NotesRounded, InventoryRounded,
} from "@mui/icons-material";
import api from "../../api/axios";

const TYPE_OPTIONS = ["Preventive", "Corrective", "Inspection", "Upgrade", "Other"];
const STATUS_OPTIONS = ["Scheduled", "In Progress", "Completed", "Cancelled"];

const TYPE_COLOR = {
  Preventive:  { bg: "rgba(34,197,94,0.12)",  color: "#22C55E" },
  Corrective:  { bg: "rgba(245,158,11,0.12)", color: "#F59E0B" },
  Inspection:  { bg: "rgba(59,130,246,0.12)", color: "#3B82F6" },
  Upgrade:     { bg: "rgba(17,24,39,0.12)", color: "text.primary" },
  Other:       { bg: "rgba(107,114,128,0.12)",color: "#6B7280" },
};

const STATUS_COLOR = {
  Scheduled:    { bg: "rgba(107,114,128,0.12)", color: "#6B7280" },
  "In Progress":{ bg: "rgba(59,130,246,0.12)",  color: "#3B82F6" },
  Completed:    { bg: "rgba(34,197,94,0.12)",   color: "#22C55E" },
  Cancelled:    { bg: "rgba(239,68,68,0.12)",   color: "#EF4444" },
};

const KPI_DEFS = [
  { key: "total",    label: "Total Services", color: "text.primary", icon: <BuildRounded sx={{ fontSize: 20 }} /> },
  { key: "cost",     label: "Total Cost",     color: "#FBBF24", icon: <AttachMoneyRounded sx={{ fontSize: 20 }} /> },
  { key: "last",     label: "Last Serviced",  color: "#FBBF24", icon: <CalendarTodayRounded sx={{ fontSize: 20 }} /> },
  { key: "next",     label: "Next Due",       color: "#FBBF24", icon: <EventRepeatRounded sx={{ fontSize: 20 }} /> },
];

const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: "12px" } };

const EMPTY_FORM = {
  type: "Preventive", status: "Scheduled", serviceDate: "", description: "",
  technicianName: "", technicianContact: "", vendor: "", cost: "", nextServiceDate: "", notes: "",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtCurrency(v) {
  const n = Number(v);
  if (!n && n !== 0) return "—";
  return "₹" + n.toLocaleString("en-IN");
}

export default function MaintenanceLogs() {
  const [assets, setAssets] = useState([]);
  const [assetSearch, setAssetSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [serviceCenters, setServiceCenters] = useState([]);
  const [scDialogOpen, setScDialogOpen] = useState(false);

  // Load assets & service centers
  useEffect(() => {
    setLoadingAssets(true);
    api.get("/assets").then(({ data }) => {
      setAssets(Array.isArray(data) ? data : data.assets || []);
    }).catch(() => {}).finally(() => setLoadingAssets(false));

    api.get("/service-centers").then(({ data }) => {
      setServiceCenters(Array.isArray(data) ? data : data.serviceCenters || []);
    }).catch((err) => {
      console.error("Failed to load service centers:", err);
    });
  }, []);

  // Load logs for selected asset
  const fetchLogs = useCallback(async (asset) => {
    if (!asset) return;
    setLoadingLogs(true);
    try {
      const { data } = await api.get(`/maintenance/${asset._id}`);
      setLogs(Array.isArray(data) ? data : []);
    } catch { setLogs([]); }
    finally { setLoadingLogs(false); }
  }, []);

  const selectAsset = (asset) => {
    setSelectedAsset(asset);
    fetchLogs(asset);
  };

  // KPIs
  const kpis = (() => {
    const total = logs.length;
    const cost = logs.reduce((s, l) => s + (Number(l.cost) || 0), 0);
    const sorted = [...logs].sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
    const last = sorted[0]?.serviceDate;
    const nextDates = logs.map(l => l.nextServiceDate).filter(Boolean).sort();
    const next = nextDates[0];
    return { total, cost: fmtCurrency(cost), last: fmtDate(last), next: fmtDate(next) };
  })();

  const openAdd = () => {
    setEditLog(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };
  const openEdit = (log) => {
    setEditLog(log);
    setForm({
      type: log.type || "Preventive",
      status: log.status || "Scheduled",
      serviceDate: log.serviceDate ? log.serviceDate.slice(0, 10) : "",
      description: log.description || "",
      technicianName: log.technicianName || "",
      technicianContact: log.technicianContact || "",
      vendor: log.vendor || "",
      cost: log.cost ?? "",
      nextServiceDate: log.nextServiceDate ? log.nextServiceDate.slice(0, 10) : "",
      notes: log.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editLog) {
        await api.put(`/maintenance/log/${editLog._id}`, form);
      } else {
        await api.post(`/maintenance/${selectedAsset._id}`, form);
      }
      setDialogOpen(false);
      fetchLogs(selectedAsset);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/maintenance/log/${id}`);
      setDeleteId(null);
      fetchLogs(selectedAsset);
    } catch { /* silent */ }
  };

  const filteredAssets = assets.filter(a =>
    !assetSearch ||
    (a.name || "").toLowerCase().includes(assetSearch.toLowerCase()) ||
    (a.serialNumber || "").toLowerCase().includes(assetSearch.toLowerCase()) ||
    (a.category || "").toLowerCase().includes(assetSearch.toLowerCase())
  );

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: "rgba(17,24,39,0.12)" }}>
            <BuildRounded sx={{ color: "text.primary" }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Maintenance Logs</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Track service history and schedule upcoming maintenance</Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* LEFT PANEL — Asset selector */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ borderRadius: "16px", border: 1, borderColor: "divider", overflow: "hidden", height: "100%" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Select Asset</Typography>
              <TextField
                fullWidth size="small"
                placeholder="Search assets…"
                value={assetSearch}
                onChange={e => setAssetSearch(e.target.value)}
                sx={inputSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded sx={{ fontSize: 18, color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <List disablePadding sx={{ maxHeight: 560, overflowY: "auto" }}>
              {loadingAssets
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Box key={i} sx={{ px: 2, py: 1.5 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  ))
                : filteredAssets.length === 0
                  ? <Box sx={{ p: 3, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">No assets found</Typography>
                    </Box>
                  : filteredAssets.map(asset => {
                      const selected = selectedAsset?._id === asset._id;
                      return (
                        <ListItemButton
                          key={asset._id}
                          onClick={() => selectAsset(asset)}
                          sx={{
                            px: 2, py: 1.5,
                            borderLeft: `3px solid ${selected ? "#111827" : "transparent"}`,
                            bgcolor: selected ? "rgba(17,24,39,0.08)" : "transparent",
                            "&:hover": { bgcolor: "rgba(17,24,39,0.05)" },
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>{asset.name}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {asset.category} · {asset.serialNumber || "N/A"}
                            </Typography>
                          </Box>
                          {asset.status && (
                            <Chip
                              label={asset.status}
                              size="small"
                              sx={{
                                ml: 1, fontSize: 10, fontWeight: 700, borderRadius: "6px",
                                bgcolor: asset.status === "Active" ? "rgba(34,197,94,0.12)" :
                                         asset.status === "Under Maintenance" ? "rgba(245,158,11,0.12)" :
                                         "rgba(107,114,128,0.12)",
                                color: asset.status === "Active" ? "#22C55E" :
                                       asset.status === "Under Maintenance" ? "#F59E0B" : "#6B7280",
                              }}
                            />
                          )}
                        </ListItemButton>
                      );
                    })
              }
            </List>
          </Paper>
        </Grid>

        {/* RIGHT PANEL */}
        <Grid size={{ xs: 12, md: 8 }}>
          {!selectedAsset ? (
            <Paper sx={{
              borderRadius: "16px", border: 1, borderColor: "divider",
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", minHeight: 400, gap: 2,
            }}>
              <Box sx={{ width: 64, height: 64, borderRadius: "16px", display: "grid", placeItems: "center", bgcolor: "rgba(17,24,39,0.08)" }}>
                <BuildRounded sx={{ color: "text.primary", fontSize: 32 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="text.secondary">Select an asset to view maintenance logs</Typography>
              <Typography variant="body2" color="text.secondary">Choose an asset from the left panel to get started</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Asset info + Add button */}
              <Paper sx={{ p: 2.5, borderRadius: "16px", border: 1, borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: "rgba(17,24,39,0.12)" }}>
                      <InventoryRounded sx={{ color: "text.primary" }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800}>{selectedAsset.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedAsset.serialNumber || "No serial"} · {selectedAsset.category} · {selectedAsset.department?.name || selectedAsset.department || "—"}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddRounded />}
                    onClick={openAdd}
                    sx={{
                      background: "#111827",
                      color: "#fff", fontWeight: 800, borderRadius: "12px", boxShadow: "none",
                    }}
                  >
                    Add Log
                  </Button>
                </Box>
              </Paper>

              {/* KPI Row */}
              <Grid container spacing={2}>
                {KPI_DEFS.map(kpi => (
                  <Grid key={kpi.key} size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, borderRadius: "14px", border: 1, borderColor: "divider", position: "relative", overflow: "hidden" }}>
                      <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: kpi.color }} />
                      <Box sx={{ pl: 0.5 }}>
                        <Box sx={{ color: kpi.color, mb: 0.5 }}>{kpi.icon}</Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{kpi.label}</Typography>
                        <Typography variant="subtitle1" fontWeight={800} noWrap>
                          {kpi.key === "total" ? kpis.total :
                           kpi.key === "cost"  ? kpis.cost  :
                           kpi.key === "last"  ? kpis.last  : kpis.next}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Logs timeline */}
              <Paper sx={{ borderRadius: "16px", border: 1, borderColor: "divider", overflow: "hidden" }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Service History ({logs.length})
                  </Typography>
                </Box>

                {loadingLogs ? (
                  <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Box key={i}>
                        <Skeleton variant="text" width="40%" />
                        <Skeleton variant="text" width="70%" />
                        <Skeleton variant="text" width="30%" />
                      </Box>
                    ))}
                  </Box>
                ) : logs.length === 0 ? (
                  <Box sx={{ p: 5, textAlign: "center" }}>
                    <BuildRounded sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>No maintenance logs yet</Typography>
                    <Typography variant="caption" color="text.disabled">Click "Add Log" to record the first service</Typography>
                  </Box>
                ) : (
                  <Box>
                    {logs.map((log, idx) => {
                      const tc = TYPE_COLOR[log.type] || TYPE_COLOR.Other;
                      const sc = STATUS_COLOR[log.status] || STATUS_COLOR.Scheduled;
                      return (
                        <Box key={log._id}>
                          {idx > 0 && <Divider />}
                          <Box sx={{ px: 2.5, py: 2.5, display: "flex", gap: 2 }}>
                            {/* Timeline dot */}
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", pt: 0.5 }}>
                              <Box sx={{
                                width: 10, height: 10, borderRadius: "50%",
                                bgcolor: tc.color, flexShrink: 0,
                                boxShadow: `0 0 0 3px ${tc.bg}`,
                              }} />
                              {idx < logs.length - 1 && (
                                <Box sx={{ flex: 1, width: 2, bgcolor: "divider", mt: 0.5 }} />
                              )}
                            </Box>

                            {/* Content */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, flexWrap: "wrap", mb: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                  <Chip
                                    label={log.type}
                                    size="small"
                                    sx={{ fontSize: 11, fontWeight: 700, borderRadius: "7px", bgcolor: tc.bg, color: tc.color }}
                                  />
                                  <Chip
                                    label={log.status}
                                    size="small"
                                    sx={{ fontSize: 11, fontWeight: 700, borderRadius: "7px", bgcolor: sc.bg, color: sc.color }}
                                  />
                                </Box>
                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => openEdit(log)}
                                      sx={{ color: "#3B82F6", "&:hover": { bgcolor: "rgba(59,130,246,0.1)" } }}>
                                      <EditRounded sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton size="small" onClick={() => setDeleteId(log._id)}
                                      sx={{ color: "#EF4444", "&:hover": { bgcolor: "rgba(239,68,68,0.1)" } }}>
                                      <DeleteRounded sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>

                              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                                {log.description}
                              </Typography>

                              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                {log.serviceDate && (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <CalendarTodayRounded sx={{ fontSize: 13, color: "text.secondary" }} />
                                    <Typography variant="caption" color="text.secondary">{fmtDate(log.serviceDate)}</Typography>
                                  </Box>
                                )}
                                {log.technicianName && (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <PersonRounded sx={{ fontSize: 13, color: "text.secondary" }} />
                                    <Typography variant="caption" color="text.secondary">{log.technicianName}</Typography>
                                  </Box>
                                )}
                                {log.cost !== undefined && log.cost !== "" && (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <AttachMoneyRounded sx={{ fontSize: 13, color: "text.secondary" }} />
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                      {fmtCurrency(log.cost)}
                                    </Typography>
                                  </Box>
                                )}
                                {log.nextServiceDate && (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <EventRepeatRounded sx={{ fontSize: 13, color: "#F59E0B" }} />
                                    <Typography variant="caption" color="text.secondary">
                                      Next: {fmtDate(log.nextServiceDate)}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>

                              {(log.vendor || log.technicianContact || log.notes) && (
                                <Box sx={{ mt: 1, display: "flex", gap: 2, flexWrap: "wrap" }}>
                                  {log.vendor && (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <StorefrontRounded sx={{ fontSize: 13, color: "text.secondary" }} />
                                      <Typography variant="caption" color="text.secondary">{log.vendor}</Typography>
                                    </Box>
                                  )}
                                  {log.technicianContact && (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <PhoneRounded sx={{ fontSize: 13, color: "text.secondary" }} />
                                      <Typography variant="caption" color="text.secondary">{log.technicianContact}</Typography>
                                    </Box>
                                  )}
                                  {log.notes && (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <NotesRounded sx={{ fontSize: 13, color: "text.secondary" }} />
                                      <Typography variant="caption" color="text.secondary">{log.notes}</Typography>
                                    </Box>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "20px", overflow: "hidden" } } }}
      >
        {/* Dialog header */}
        <Box sx={{
          p: 3,
          background: "linear-gradient(135deg,rgba(17,24,39,0.1),rgba(17,24,39,0.05))",
          borderBottom: "1px solid", borderColor: "divider",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "12px",
              background: "#111827",
              display: "grid", placeItems: "center",
            }}>
              <EngineeringRounded sx={{ color: "#fff" }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>
                {editLog ? "Edit Maintenance Log" : "Add Maintenance Log"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedAsset?.name}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}>
            <CloseRounded />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Type</InputLabel>
                <Select value={form.type} label="Type" onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {TYPE_OPTIONS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Status</InputLabel>
                <Select value={form.status} label="Status" onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" label="Service Date" type="date" sx={inputSx}
                value={form.serviceDate}
                onChange={e => setForm(f => ({ ...f, serviceDate: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" label="Next Service Date (optional)" type="date" sx={inputSx}
                value={form.nextServiceDate}
                onChange={e => setForm(f => ({ ...f, nextServiceDate: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth size="small" label="Description" multiline rows={2} sx={inputSx}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" label="Technician Name" sx={inputSx}
                value={form.technicianName}
                onChange={e => setForm(f => ({ ...f, technicianName: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" label="Technician Contact" sx={inputSx}
                value={form.technicianContact}
                onChange={e => setForm(f => ({ ...f, technicianContact: e.target.value.replace(/[^0-9]/g, '').slice(0, 15) }))}
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" label="Vendor" sx={inputSx}
                value={form.vendor}
                onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => setScDialogOpen(true)}
                          sx={{ fontSize: 11, fontWeight: 800, textTransform: "none", color: "text.primary", minWidth: 0, p: 0.5 }}
                        >
                          Select Registered
                        </Button>
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" label="Cost (₹)" type="number" sx={inputSx}
                value={form.cost}
                onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth size="small" label="Notes (optional)" multiline rows={2} sx={inputSx}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <Box sx={{ px: 3, pb: 3, display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ fontWeight: 700, borderRadius: "12px" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              background: "#111827",
              color: "#fff", fontWeight: 800, borderRadius: "12px", boxShadow: "none",
              minWidth: 120,
            }}
          >
            {saving ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : editLog ? "Save Changes" : "Add Log"}
          </Button>
        </Box>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px" } } }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={800} mb={1}>Delete Log?</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            This maintenance log will be permanently deleted and cannot be recovered.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
            <Button onClick={() => setDeleteId(null)} sx={{ fontWeight: 700, borderRadius: "12px" }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => handleDelete(deleteId)}
              sx={{ bgcolor: "#EF4444", "&:hover": { bgcolor: "#DC2626" }, fontWeight: 800, borderRadius: "12px", boxShadow: "none" }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Service Centers Selector Dialog */}
      <Dialog open={scDialogOpen} onClose={() => setScDialogOpen(false)} fullWidth maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: "20px", overflow: "hidden", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" } } }}>
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
                <ListItemButton
                  key={sc._id}
                  onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      vendor: sc.name,
                      technicianName: sc.contactPerson || "",
                      technicianContact: sc.phone || "",
                    }));
                    setScDialogOpen(false);
                  }}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", p: 1.5 }}
                >
                  <ListItemText
                    primary={<Typography fontWeight={800} fontSize={14}>{sc.name}</Typography>}
                    secondary={
                      <Typography fontSize={12} color="text.secondary" mt={0.5}>
                        {sc.contactPerson ? `Contact: ${sc.contactPerson}` : ""}
                        {sc.phone ? ` · Phone: ${sc.phone}` : ""}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
