import { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Paper, Grid, TextField, InputAdornment, Button, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack,
  MenuItem, Select, FormControl, InputLabel, CircularProgress, Tooltip,
  Table, TableBody, TableCell, TableHead, TableRow, Tabs, Tab, Divider,
  Autocomplete,
} from "@mui/material";
import {
  SearchRounded, AddRounded, EditRounded, DeleteRounded, CloseRounded,
  StorefrontRounded, PhoneRounded, EmailRounded, LocationOnRounded,
  VerifiedRounded, WarningAmberRounded, BuildRounded, CalendarTodayRounded,
  CategoryRounded, CheckCircleRounded,
} from "@mui/icons-material";
import api from "../../api/axios";


const statusColor = (s) => s === "Active"
  ? { bg: "rgba(34,197,94,0.1)", color: "#22C55E" }
  : { bg: "rgba(239,68,68,0.1)", color: "#EF4444" };

const warrantyDaysLeft = (end) => {
  const d = Math.ceil((new Date(end) - new Date()) / 86400000);
  return d;
};

const warrantyChip = (end) => {
  const d = warrantyDaysLeft(end);
  if (d <= 30) return { label: `${d}d left`, color: "#EF4444", bg: "rgba(239,68,68,0.1)" };
  if (d <= 90) return { label: `${d}d left`, color: "#F59E0B", bg: "rgba(245,158,11,0.1)" };
  return { label: `${d}d left`, color: "#22C55E", bg: "rgba(34,197,94,0.1)" };
};

const emptyForm = {
  name: "", contactPerson: "", phone: "", email: "",
  address: "", city: "", categories: [], brands: [], status: "Active", notes: ""
};

export default function ServiceCenters() {
  const [centers, setCenters] = useState([]);
  const [warrantyAssets, setWarrantyAssets] = useState([]);
  const [assetCategories, setAssetCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  // Dialog
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, w, a] = await Promise.all([
        api.get("/service-centers"),
        api.get("/service-centers/warranty-assets"),
        api.get("/assets"),
      ]);
      setCenters(c.data);
      setWarrantyAssets(w.data);
      const cats = [...new Set((a.data || []).map(asset => asset.category).filter(Boolean))].sort();
      setAssetCategories(cats);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (c) => { setEditTarget(c); setForm({ ...c, categories: c.categories || [], brands: c.brands || [] }); setOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editTarget) await api.put(`/service-centers/${editTarget._id}`, form);
      else await api.post("/service-centers", form);
      setOpen(false);
      fetchAll();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await api.delete(`/service-centers/${delConfirm._id}`);
    setDelConfirm(null);
    fetchAll();
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  const filteredCenters = useMemo(() =>
    centers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase())),
    [centers, search]);

  const presentCategories = useMemo(() =>
    [...new Set(warrantyAssets.map(a => a.category).filter(Boolean))].sort(),
    [warrantyAssets]);

  const filteredAssets = useMemo(() =>
    warrantyAssets.filter(a => catFilter === "All" || a.category === catFilter),
    [warrantyAssets, catFilter]);

  const expiringSoon = warrantyAssets.filter(a => warrantyDaysLeft(a.warrantyEnd) <= 30).length;
  const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: "12px" } };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography fontWeight={900} fontSize={26} color="text.primary">Service Centers</Typography>
          <Typography fontSize={14} color="text.secondary">Manage service partners and track warranty assets</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRounded />} onClick={openAdd}
          sx={{ fontWeight: 800, borderRadius: "12px", px: 3, background: "#FBBF24", color: "#111827", boxShadow: "none" }}>
          Add Service Center
        </Button>
      </Box>

      {/* KPI strip */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Service Centers", value: centers.length, color: "text.primary", icon: <StorefrontRounded /> },
          { label: "Assets Under Warranty", value: warrantyAssets.length, color: "#FBBF24", icon: <VerifiedRounded /> },
          { label: "Expiring in 30 Days", value: expiringSoon, color: "#FBBF24", icon: <WarningAmberRounded /> },
          { label: "Categories Covered", value: new Set(centers.flatMap(c => c.categories)).size, color: "#FBBF24", icon: <CategoryRounded /> },
        ].map((k) => (
          <Grid size={{ xs: 6, md: 3 }} key={k.label}>
            <Paper sx={{ p: 2.5, borderRadius: "18px", border: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ width: 42, height: 42, borderRadius: "12px", bgcolor: `${k.color}18`, display: "grid", placeItems: "center", color: k.color, flexShrink: 0 }}>
                {k.icon}
              </Box>
              <Box>
                <Typography fontWeight={900} fontSize={22}>{k.value}</Typography>
                <Typography fontSize={12} color="text.secondary">{k.label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ borderRadius: "20px", border: 1, borderColor: "divider", overflow: "hidden" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 1 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ "& .MuiTab-root": { fontWeight: 700, textTransform: "none" } }}>
            <Tab label={`Service Centers (${centers.length})`} />
            <Tab label={`Warranty Assets (${warrantyAssets.length})`} />
          </Tabs>
        </Box>

        {/* Tab 0 — Service Centers */}
        {tab === 0 && (
          <Box sx={{ p: 2.5 }}>
            <TextField placeholder="Search by name or city…" value={search} onChange={e => setSearch(e.target.value)} size="small" sx={{ ...inputSx, mb: 2, width: 320 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> } }} />

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress sx={{ color: "text.primary" }} /></Box>
            ) : filteredCenters.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <StorefrontRounded sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                <Typography color="text.secondary">No service centers yet. Add one to get started.</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredCenters.map(c => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={c._id}>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "16px", height: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                          <Box sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: "rgba(17,24,39,0.1)", display: "grid", placeItems: "center" }}>
                            <StorefrontRounded sx={{ color: "text.primary", fontSize: 19 }} />
                          </Box>
                          <Box>
                            <Typography fontWeight={800} fontSize={14}>{c.name}</Typography>
                            {c.city && <Typography fontSize={12} color="text.secondary">{c.city}</Typography>}
                          </Box>
                        </Box>
                        <Chip label={c.status} size="small" sx={{ fontWeight: 700, fontSize: 11, bgcolor: statusColor(c.status).bg, color: statusColor(c.status).color }} />
                      </Box>

                      <Divider />

                      <Stack spacing={0.6}>
                        {c.contactPerson && <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, fontSize: 13 }}><BuildRounded sx={{ fontSize: 14, color: "text.disabled" }} /><Typography fontSize={13}>{c.contactPerson}</Typography></Box>}
                        {c.phone && <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}><PhoneRounded sx={{ fontSize: 14, color: "text.disabled" }} /><Typography fontSize={13}>{c.phone}</Typography></Box>}
                        {c.email && <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}><EmailRounded sx={{ fontSize: 14, color: "text.disabled" }} /><Typography fontSize={13}>{c.email}</Typography></Box>}
                        {c.address && <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}><LocationOnRounded sx={{ fontSize: 14, color: "text.disabled" }} /><Typography fontSize={13}>{c.address}</Typography></Box>}
                      </Stack>

                      {c.categories?.length > 0 && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                          {c.categories.map(cat => (
                            <Chip key={cat} label={cat} size="small" sx={{ fontSize: 11, fontWeight: 600, bgcolor: "rgba(59,130,246,0.1)", color: "#3B82F6" }} />
                          ))}
                        </Box>
                      )}

                      {c.brands?.length > 0 && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {c.brands.map(b => (
                            <Chip key={b} label={b} size="small" variant="outlined" sx={{ fontSize: 11, fontWeight: 600 }} />
                          ))}
                        </Box>
                      )}

                      {c.notes && <Typography fontSize={12} color="text.secondary" sx={{ fontStyle: "italic", mt: 0.5 }}>{c.notes}</Typography>}

                      <Box sx={{ display: "flex", gap: 1, mt: "auto", pt: 1 }}>
                        <Button size="small" startIcon={<EditRounded />} onClick={() => openEdit(c)}
                          sx={{ flex: 1, borderRadius: "10px", fontWeight: 700, border: 1, borderColor: "divider", color: "text.primary", textTransform: "none" }}>
                          Edit
                        </Button>
                        <IconButton size="small" onClick={() => setDelConfirm(c)} sx={{ border: 1, borderColor: "divider", borderRadius: "10px", color: "#EF4444" }}>
                          <DeleteRounded fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Tab 1 — Warranty Assets */}
        {tab === 1 && (
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
              <FormControl size="small" sx={{ ...inputSx, minWidth: 180 }}>
                <InputLabel>Category</InputLabel>
                <Select value={catFilter} label="Category" onChange={e => setCatFilter(e.target.value)}>
                  <MenuItem value="All">All Categories</MenuItem>
                  {presentCategories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <Chip label={`${expiringSoon} expiring in 30 days`} sx={{ fontWeight: 700, bgcolor: "rgba(239,68,68,0.1)", color: "#EF4444", alignSelf: "center" }} />
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress sx={{ color: "text.primary" }} /></Box>
            ) : filteredAssets.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <VerifiedRounded sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                <Typography color="text.secondary">No assets under active warranty.</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["Asset ID", "Name", "Category", "Serial No.", "Assigned To", "Warranty Start", "Warranty End", "Status"].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 800, fontSize: 12, color: "text.secondary", whiteSpace: "nowrap" }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAssets.map(a => {
                      const chip = warrantyChip(a.warrantyEnd);
                      return (
                        <TableRow key={a._id} hover>
                          <TableCell sx={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: "text.primary" }}>{a.assetId}</TableCell>
                          <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{a.name}</TableCell>
                          <TableCell><Chip label={a.category} size="small" sx={{ fontSize: 11, fontWeight: 600, bgcolor: "rgba(59,130,246,0.1)", color: "#3B82F6" }} /></TableCell>
                          <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>{a.serialNumber}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{a.assignedEmployeeName || "—"}</TableCell>
                          <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{a.warrantyStart ? new Date(a.warrantyStart).toLocaleDateString("en-IN") : "—"}</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{new Date(a.warrantyEnd).toLocaleDateString("en-IN")}</TableCell>
                          <TableCell>
                            <Chip label={chip.label} size="small" sx={{ fontWeight: 700, fontSize: 11, bgcolor: chip.bg, color: chip.color }} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: "24px" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0 }}>
          <Typography fontWeight={900} fontSize={18}>{editTarget ? "Edit Service Center" : "Add Service Center"}</Typography>
          <IconButton onClick={() => setOpen(false)} size="small" sx={{ bgcolor: "action.hover", borderRadius: "10px" }}><CloseRounded /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name *" value={form.name} onChange={set("name")} fullWidth size="small" sx={inputSx} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Contact Person" value={form.contactPerson} onChange={set("contactPerson")} fullWidth size="small" sx={inputSx} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))} fullWidth size="small" sx={inputSx} slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 10 } }} />
              </Grid>
            </Grid>
            <TextField label="Email" value={form.email} onChange={set("email")} fullWidth size="small" sx={inputSx} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField label="Address" value={form.address} onChange={set("address")} fullWidth size="small" sx={inputSx} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="City" value={form.city} onChange={set("city")} fullWidth size="small" sx={inputSx} />
              </Grid>
            </Grid>
            <Autocomplete multiple freeSolo options={[]} value={form.categories}
              onChange={(_, v) => setForm(f => ({ ...f, categories: v }))}
              renderTags={(val, getTagProps) => val.map((opt, i) => {
                const { key, ...tagProps } = getTagProps({ index: i });
                return <Chip key={key} label={opt} size="small" {...tagProps} sx={{ fontWeight: 700 }} />;
              })}
              renderInput={(params) => <TextField {...params} label="Categories Serviced" size="small" sx={inputSx} placeholder="e.g. Laptop, Printer" />} />
            <Autocomplete multiple freeSolo options={[]} value={form.brands}
              onChange={(_, v) => setForm(f => ({ ...f, brands: v }))}
              renderTags={(val, getTagProps) => val.map((opt, i) => {
                const { key, ...tagProps } = getTagProps({ index: i });
                return <Chip key={key} label={opt} size="small" variant="outlined" {...tagProps} />;
              })}
              renderInput={(params) => <TextField {...params} label="Brands Handled" size="small" sx={inputSx} placeholder="Type brand and press Enter" />} />
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Status</InputLabel>
              <Select value={form.status} label="Status" onChange={set("status")}>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Notes" value={form.notes} onChange={set("notes")} fullWidth size="small" sx={inputSx} multiline rows={2} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ fontWeight: 700, borderRadius: "10px", color: "text.secondary" }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()}
            sx={{ fontWeight: 800, borderRadius: "10px", px: 3, background: "#FBBF24", color: "#111827", boxShadow: "none" }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : editTarget ? "Save Changes" : "Add Center"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!delConfirm} onClose={() => setDelConfirm(null)} slotProps={{ paper: { sx: { borderRadius: "20px" } } }}>
        <DialogTitle fontWeight={800}>Delete Service Center?</DialogTitle>
        <DialogContent><Typography color="text.secondary">"{delConfirm?.name}" will be permanently removed.</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDelConfirm(null)} sx={{ fontWeight: 700, color: "text.secondary" }}>Cancel</Button>
          <Button variant="contained" onClick={handleDelete} sx={{ fontWeight: 800, borderRadius: "10px", bgcolor: "#EF4444", "&:hover": { bgcolor: "#DC2626" } }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
