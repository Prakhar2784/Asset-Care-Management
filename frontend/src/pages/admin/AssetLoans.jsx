import { useState, useEffect } from "react";
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogContent,
  TextField, MenuItem, CircularProgress, Chip, IconButton, Snackbar, Alert
} from "@mui/material";
import {
  SwapHorizRounded, CallMadeRounded, CallReceivedRounded,
  RefreshRounded, CloseRounded, CheckRounded
} from "@mui/icons-material";
import api from "../../api/axios";

const statusColor = (s) => s === "Active" ? { bg: "rgba(234,179,8,0.12)", color: "#ca8a04", border: "rgba(234,179,8,0.3)" }
  : s === "Returned" ? { bg: "rgba(22,163,74,0.10)", color: "#16a34a", border: "rgba(22,163,74,0.25)" }
  : { bg: "rgba(239,68,68,0.10)", color: "#dc2626", border: "rgba(239,68,68,0.25)" };

const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: "12px" } };

export default function AssetLoans() {
  const [loans, setLoans] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [activeLoan, setActiveLoan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const [form, setForm] = useState({
    assetId: "", borrowerId: "", borrowerName: "", borrowerEmail: "",
    purpose: "", expectedReturnDate: "", notes: ""
  });
  const [checkinNotes, setCheckinNotes] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loansRes, assetsRes, usersRes] = await Promise.all([
        api.get("/asset-loans"),
        api.get("/assets"),
        api.get("/users/employees"),
      ]);
      setLoans(loansRes.data || []);
      setAssets(assetsRes.data || []);
      setUsers(usersRes.data || []);
    } catch {
      setSnack({ open: true, message: "Failed to load loan data.", severity: "error" });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUserSelect = (userId) => {
    const u = users.find(u => u._id === userId);
    setForm(f => ({ ...f, borrowerId: userId, borrowerName: u?.name || "", borrowerEmail: u?.email || "" }));
  };

  const submitCheckout = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/asset-loans/${form.assetId}/checkout`, {
        borrowerId: form.borrowerId || undefined,
        borrowerName: form.borrowerName,
        borrowerEmail: form.borrowerEmail,
        purpose: form.purpose,
        expectedReturnDate: form.expectedReturnDate,
        notes: form.notes
      });
      setSnack({ open: true, message: "Asset checked out successfully.", severity: "success" });
      setCheckoutOpen(false);
      setForm({ assetId: "", borrowerId: "", borrowerName: "", borrowerEmail: "", purpose: "", expectedReturnDate: "", notes: "" });
      fetchData();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || "Checkout failed.", severity: "error" });
    } finally { setSaving(false); }
  };

  const submitCheckin = async () => {
    setSaving(true);
    try {
      await api.post(`/asset-loans/${activeLoan.asset._id || activeLoan.asset}/checkin`, { notes: checkinNotes });
      setSnack({ open: true, message: "Asset returned successfully.", severity: "success" });
      setCheckinOpen(false);
      setActiveLoan(null);
      fetchData();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || "Check-in failed.", severity: "error" });
    } finally { setSaving(false); }
  };

  const filtered = filter === "All" ? loans : loans.filter(l => l.status === filter);
  const activeCount = loans.filter(l => l.status === "Active").length;
  const returnedCount = loans.filter(l => l.status === "Returned").length;
  const overdueCount = loans.filter(l => l.status === "Overdue").length;

  return (
    <Box sx={{ pb: 5 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: "rgba(17,24,39,0.12)" }}>
            <SwapHorizRounded sx={{ color: "text.primary" }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Asset Loans</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Track temporary asset lending and returns</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <IconButton onClick={fetchData} sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: "12px" }}>
            <RefreshRounded />
          </IconButton>
          <Button variant="contained" startIcon={<CallMadeRounded />} onClick={() => setCheckoutOpen(true)}
            sx={{ bgcolor: "#FBBF24", color: "#111827", fontWeight: 800, borderRadius: "12px", boxShadow: "none", textTransform: "none" }}>
            Check Out Asset
          </Button>
        </Box>
      </Box>

      {/* KPIs */}
      <Box sx={{ display: "flex", gap: 2.5, mb: 3, flexWrap: "wrap" }}>
        {[
          { label: "Active Loans", value: activeCount, color: "#ca8a04" },
          { label: "Returned", value: returnedCount, color: "#16a34a" },
          { label: "Overdue", value: overdueCount, color: "#dc2626" },
        ].map(k => (
          <Paper key={k.label} sx={{ p: 2.5, borderRadius: "16px", border: 1, borderColor: "divider", minWidth: 160, position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: k.color }} />
            <Typography fontSize={28} fontWeight={950} sx={{ lineHeight: 1, letterSpacing: "-1px", color: k.color }}>{k.value}</Typography>
            <Typography fontSize={13} fontWeight={700} color="text.primary" mt={0.3}>{k.label}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Filter */}
      <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
        {["All", "Active", "Returned", "Overdue"].map(f => (
          <Button key={f} size="small" variant={filter === f ? "contained" : "outlined"}
            onClick={() => setFilter(f)}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", borderColor: "divider", color: filter === f ? "#111827" : "text.secondary", bgcolor: filter === f ? "#FBBF24" : "transparent", boxShadow: "none" }}>
            {f}
          </Button>
        ))}
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "16px", border: 1, borderColor: "divider", overflow: "hidden" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "background.default" }}>
                {["Asset", "Borrower", "Purpose", "Checked Out", "Expected Return", "Status", "Action"].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "text.secondary", py: 1.5, borderBottom: 2, borderColor: "divider" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: "text.secondary", fontWeight: 600 }}>No loans found.</TableCell></TableRow>
              ) : filtered.map(loan => {
                const sc = statusColor(loan.status);
                return (
                  <TableRow key={loan._id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{loan.asset?.name || "—"}<br /><Typography component="span" fontSize={11} color="text.secondary">{loan.asset?.serialNumber}</Typography></TableCell>
                    <TableCell>{loan.borrowerName || loan.borrower?.name || "—"}<br /><Typography component="span" fontSize={11} color="text.secondary">{loan.borrowerEmail || loan.borrower?.email}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 160, color: "text.secondary", fontSize: 13 }}>{loan.purpose || "—"}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{new Date(loan.createdAt).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{loan.expectedReturnDate ? new Date(loan.expectedReturnDate).toLocaleDateString("en-IN") : "—"}</TableCell>
                    <TableCell>
                      <Chip label={loan.status} size="small" sx={{ fontWeight: 800, fontSize: 11, bgcolor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }} />
                    </TableCell>
                    <TableCell>
                      {loan.status === "Active" && (
                        <Button size="small" variant="outlined" startIcon={<CallReceivedRounded />}
                          onClick={() => { setActiveLoan(loan); setCheckinNotes(""); setCheckinOpen(true); }}
                          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", fontSize: 12 }}>
                          Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: "20px", border: 1, borderColor: "divider", bgcolor: "background.paper" } } }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography fontWeight={900} fontSize={18}>Check Out Asset</Typography>
          <IconButton onClick={() => setCheckoutOpen(false)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}><CloseRounded /></IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={submitCheckout} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField select required fullWidth label="Asset" value={form.assetId}
              onChange={(e) => setForm(f => ({ ...f, assetId: e.target.value }))} sx={inputSx}>
              {assets.filter(a => a.status !== "In Transit" && a.assignedStatus !== "Assigned").map(a => (
                <MenuItem key={a._id} value={a._id}>{a.name} — {a.serialNumber}</MenuItem>
              ))}
            </TextField>
            <TextField select fullWidth label="Borrower (from Users)" value={form.borrowerId}
              onChange={(e) => handleUserSelect(e.target.value)} sx={inputSx}>
              <MenuItem value="">— External / Manual Entry —</MenuItem>
              {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name} ({u.department})</MenuItem>)}
            </TextField>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField fullWidth label="Borrower Name" required value={form.borrowerName}
                onChange={(e) => setForm(f => ({ ...f, borrowerName: e.target.value }))} sx={inputSx} />
              <TextField fullWidth label="Borrower Email" value={form.borrowerEmail}
                onChange={(e) => setForm(f => ({ ...f, borrowerEmail: e.target.value }))} sx={inputSx} />
            </Box>
            <TextField fullWidth label="Purpose" value={form.purpose}
              onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))} sx={inputSx} />
            <TextField fullWidth type="date" label="Expected Return Date" required value={form.expectedReturnDate}
              onChange={(e) => setForm(f => ({ ...f, expectedReturnDate: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }} sx={inputSx} />
            <TextField fullWidth label="Notes" multiline rows={2} value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} sx={inputSx} />
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button onClick={() => setCheckoutOpen(false)} sx={{ fontWeight: 800, color: "text.secondary" }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CallMadeRounded />}
                sx={{ bgcolor: "#FBBF24", color: "#111827", fontWeight: 800, borderRadius: "12px", boxShadow: "none", textTransform: "none" }}>
                {saving ? "Checking Out..." : "Check Out"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Checkin Dialog */}
      <Dialog open={checkinOpen} onClose={() => setCheckinOpen(false)} fullWidth maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: "20px", border: 1, borderColor: "divider", bgcolor: "background.paper" } } }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography fontWeight={900} fontSize={18}>Return Asset</Typography>
          <IconButton onClick={() => setCheckinOpen(false)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}><CloseRounded /></IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {activeLoan && (
            <Paper sx={{ p: 2, mb: 3, borderRadius: "12px", bgcolor: "action.hover", border: 1, borderColor: "divider" }}>
              <Typography fontWeight={800} fontSize={14} mb={0.5}>Returning: {activeLoan.asset?.name}</Typography>
              <Typography fontSize={13} color="text.secondary">Borrower: {activeLoan.borrowerName || activeLoan.borrower?.name}</Typography>
            </Paper>
          )}
          <TextField fullWidth label="Return Notes (optional)" multiline rows={3} value={checkinNotes}
            onChange={(e) => setCheckinNotes(e.target.value)} sx={inputSx} />
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
            <Button onClick={() => setCheckinOpen(false)} sx={{ fontWeight: 800, color: "text.secondary" }}>Cancel</Button>
            <Button variant="contained" disabled={saving} onClick={submitCheckin}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckRounded />}
              sx={{ bgcolor: "#111827", color: "#fff", fontWeight: 800, borderRadius: "12px", boxShadow: "none", textTransform: "none" }}>
              {saving ? "Processing..." : "Confirm Return"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: "14px", fontWeight: 800 }}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
