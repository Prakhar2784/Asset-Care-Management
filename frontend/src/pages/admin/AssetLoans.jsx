import { useState, useEffect, useCallback } from "react";
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent,
  FormControl, Grid, IconButton, InputLabel, MenuItem, Paper,
  Select, Skeleton, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup,
  Tooltip, Typography,
} from "@mui/material";
import {
  SwapHorizRounded, CloseRounded, LoginRounded, LogoutRounded,
  RefreshRounded,
} from "@mui/icons-material";
import api from "../../api/axios";

const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "12px" } };

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const isOverdue = (loan) =>
  !loan.actualReturnDate && loan.expectedReturnDate && new Date(loan.expectedReturnDate) < new Date();

const getLoanStatus = (loan) => {
  if (loan.status === "Returned") return "Returned";
  if (isOverdue(loan)) return "Overdue";
  return "Active";
};

const statusColor = { Active: "#3B82F6", Returned: "#22C55E", Overdue: "#EF4444" };

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, loading }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: "16px", border: 1, borderColor: "divider", position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: color }} />
      <Box sx={{ pl: 1.5 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 0.5 }}>{label}</Typography>
        {loading ? (
          <Skeleton width={48} height={36} />
        ) : (
          <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
        )}
      </Box>
    </Paper>
  );
}

// ── Checkout Dialog ───────────────────────────────────────────────────────────
function CheckoutDialog({ open, onClose, assets, employees, onSuccess }) {
  const [form, setForm] = useState({
    assetId: "", borrowerId: "", borrowerName: "", borrowerEmail: "",
    purpose: "", expectedReturnDate: "", notes: "",
  });
  const [useManual, setUseManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setForm({ assetId: "", borrowerId: "", borrowerName: "", borrowerEmail: "", purpose: "", expectedReturnDate: "", notes: "" });
    setUseManual(false);
    setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleBorrowerSelect = (e) => {
    const emp = employees.find((u) => u._id === e.target.value);
    if (emp) {
      setForm((f) => ({ ...f, borrowerId: emp._id, borrowerName: emp.name || emp.fullName || "", borrowerEmail: emp.email || "" }));
    }
  };

  const handleSubmit = async () => {
    if (!form.assetId) { setError("Please select an asset."); return; }
    if (!form.borrowerName || !form.borrowerEmail) { setError("Borrower name and email are required."); return; }
    if (!form.purpose) { setError("Purpose is required."); return; }
    if (!form.expectedReturnDate) { setError("Expected return date is required."); return; }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        borrowerName: form.borrowerName,
        borrowerEmail: form.borrowerEmail,
        purpose: form.purpose,
        expectedReturnDate: form.expectedReturnDate,
        notes: form.notes,
      };
      if (form.borrowerId) payload.borrowerId = form.borrowerId;
      await api.post(`/asset-loans/${form.assetId}/checkout`, payload);
      reset();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Checkout failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "20px" } }}>
      {/* Header */}
      <Box sx={{ p: 3, background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(168,85,247,0.05))", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "linear-gradient(135deg,#7C3AED,#A855F7)", display: "grid", placeItems: "center" }}>
            <LogoutRounded sx={{ color: "#fff" }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800}>Checkout Asset</Typography>
            <Typography variant="caption" color="text.secondary">Loan an asset to a borrower</Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}><CloseRounded /></IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Asset picker */}
          <FormControl fullWidth sx={fieldSx}>
            <InputLabel>Asset</InputLabel>
            <Select value={form.assetId} onChange={set("assetId")} label="Asset">
              {assets.map((a) => (
                <MenuItem key={a._id} value={a._id}>
                  {a.name} {a.serialNumber ? `— ${a.serialNumber}` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Borrower picker */}
          {!useManual && employees.length > 0 && (
            <FormControl fullWidth sx={fieldSx}>
              <InputLabel>Borrower (select employee)</InputLabel>
              <Select value={form.borrowerId} onChange={handleBorrowerSelect} label="Borrower (select employee)">
                {employees.map((u) => (
                  <MenuItem key={u._id} value={u._id}>
                    {u.name || u.fullName} — {u.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button variant="text" size="small" sx={{ alignSelf: "flex-start", color: "text.secondary", textTransform: "none", p: 0 }}
            onClick={() => { setUseManual((v) => !v); setForm((f) => ({ ...f, borrowerId: "", borrowerName: "", borrowerEmail: "" })); }}>
            {useManual ? "← Pick from employee list" : "Enter borrower details manually →"}
          </Button>

          {(useManual || employees.length === 0) && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Borrower Name" value={form.borrowerName} onChange={set("borrowerName")} sx={fieldSx} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Borrower Email" type="email" value={form.borrowerEmail} onChange={set("borrowerEmail")} sx={fieldSx} />
              </Grid>
            </Grid>
          )}

          <TextField fullWidth label="Purpose" value={form.purpose} onChange={set("purpose")} sx={fieldSx} />

          <TextField fullWidth label="Expected Return Date" type="date" value={form.expectedReturnDate} onChange={set("expectedReturnDate")}
            InputLabelProps={{ shrink: true }} inputProps={{ min: new Date().toISOString().split("T")[0] }} sx={fieldSx} />

          <TextField fullWidth label="Notes (optional)" value={form.notes} onChange={set("notes")} multiline rows={3} sx={fieldSx} />

          {error && <Typography variant="body2" color="error">{error}</Typography>}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: "12px", textTransform: "none" }}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={submitting} variant="contained"
          sx={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff", fontWeight: 800, borderRadius: "12px", boxShadow: "none", textTransform: "none" }}>
          {submitting ? "Checking out…" : "Checkout Asset"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Check-in Dialog ───────────────────────────────────────────────────────────
function CheckinDialog({ open, loan, onClose, onSuccess }) {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => { setNotes(""); setError(""); onClose(); };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/asset-loans/${loan.asset?._id}/checkin`, { notes, loanId: loan._id });
      setNotes("");
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Check-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loan) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "20px" } }}>
      <Box sx={{ p: 3, background: "linear-gradient(135deg,rgba(34,197,94,0.08),rgba(34,197,94,0.02))", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: "#22C55E", display: "grid", placeItems: "center" }}>
            <LoginRounded sx={{ color: "#fff" }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800}>Check In Asset</Typography>
            <Typography variant="caption" color="text.secondary">{loan.asset?.name}</Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}><CloseRounded /></IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 2, p: 2, bgcolor: "background.default", borderRadius: "12px" }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>Borrowed by</Typography>
          <Typography fontWeight={700}>{loan.borrowerName}</Typography>
          <Typography variant="body2" color="text.secondary">{loan.borrowerEmail}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
            Checked out: <b>{fmtDate(loan.checkoutDate)}</b> · Due: <b style={{ color: isOverdue(loan) ? "#EF4444" : "inherit" }}>{fmtDate(loan.expectedReturnDate)}</b>
          </Typography>
        </Box>
        <TextField fullWidth label="Return notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={3} sx={fieldSx} />
        {error && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{error}</Typography>}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: "12px", textTransform: "none" }}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={submitting} variant="contained"
          sx={{ bgcolor: "#22C55E", "&:hover": { bgcolor: "#16A34A" }, color: "#fff", fontWeight: 800, borderRadius: "12px", boxShadow: "none", textTransform: "none" }}>
          {submitting ? "Checking in…" : "Confirm Check-in"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AssetLoans() {
  const [loans, setLoans] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkinLoan, setCheckinLoan] = useState(null);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "All" ? { status: filter } : {};
      const res = await api.get("/asset-loans", { params });
      setLoans(res.data?.loans || res.data || []);
    } catch {
      setLoans([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchSupport = useCallback(async () => {
    try {
      const [aRes, uRes] = await Promise.allSettled([
        api.get("/assets"),
        api.get("/users/employees"),
      ]);
      if (aRes.status === "fulfilled") setAssets(aRes.value.data?.assets || aRes.value.data || []);
      if (uRes.status === "fulfilled") setEmployees(uRes.value.data?.employees || uRes.value.data || []);
    } catch { /* non-blocking */ }
  }, []);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);
  useEffect(() => { fetchSupport(); }, [fetchSupport]);

  // KPI counts derived from ALL loans (fetch all for KPI bar)
  const [allLoans, setAllLoans] = useState([]);
  useEffect(() => {
    api.get("/asset-loans").then((r) => setAllLoans(r.data?.loans || r.data || [])).catch(() => {});
  }, [loans]); // refresh whenever loans change

  const kpi = {
    total: allLoans.length,
    active: allLoans.filter((l) => getLoanStatus(l) === "Active").length,
    overdue: allLoans.filter((l) => getLoanStatus(l) === "Overdue").length,
    returned: allLoans.filter((l) => getLoanStatus(l) === "Returned").length,
  };

  const displayLoans = loans.filter((l) => {
    if (filter === "All") return true;
    if (filter === "Overdue") return getLoanStatus(l) === "Overdue";
    if (filter === "Active") return getLoanStatus(l) === "Active";
    return getLoanStatus(l) === filter;
  });

  const handleSuccess = () => {
    setCheckoutOpen(false);
    setCheckinLoan(null);
    fetchLoans();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: "rgba(124,58,237,0.12)" }}>
            <SwapHorizRounded sx={{ color: "#A855F7" }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Asset Loans</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Check-in & Check-out management</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchLoans} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}><RefreshRounded /></IconButton>
          </Tooltip>
          <Button
            startIcon={<LogoutRounded />}
            onClick={() => setCheckoutOpen(true)}
            sx={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff", fontWeight: 800, borderRadius: "12px", boxShadow: "none", textTransform: "none" }}>
            Checkout Asset
          </Button>
        </Box>
      </Box>

      {/* KPI Row */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: "Total Loans", value: kpi.total, color: "#A855F7" },
          { label: "Active Loans", value: kpi.active, color: "#3B82F6" },
          { label: "Overdue", value: kpi.overdue, color: "#EF4444" },
          { label: "Returned", value: kpi.returned, color: "#22C55E" },
        ].map((k) => (
          <Grid key={k.label} size={{ xs: 6, sm: 3 }}>
            <KpiCard {...k} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* Filter Tabs */}
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, v) => { if (v) setFilter(v); }}
          size="small"
          sx={{ "& .MuiToggleButton-root": { borderRadius: "10px !important", px: 2.5, fontWeight: 700, textTransform: "none", border: "1px solid", borderColor: "divider", mx: 0.5 }, "& .Mui-selected": { bgcolor: "rgba(168,85,247,0.12) !important", color: "#A855F7 !important", borderColor: "#A855F7 !important" } }}>
          {["All", "Active", "Overdue", "Returned"].map((tab) => (
            <ToggleButton key={tab} value={tab}>{tab}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Loans Table */}
      <TableContainer component={Paper} sx={{ borderRadius: "20px", border: 1, borderColor: "divider", overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "background.default" }}>
              {["Asset", "Borrower", "Purpose", "Checked Out", "Expected Return", "Status", "Actions"].map((col) => (
                <TableCell key={col} sx={{ fontWeight: 800, fontSize: 11, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.6px", py: 1.5, borderBottom: 2, borderColor: "divider" }}>
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}><Skeleton variant="text" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : displayLoans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  No loans found.
                </TableCell>
              </TableRow>
            ) : (
              displayLoans.map((loan) => {
                const status = getLoanStatus(loan);
                const overdue = status === "Overdue";
                return (
                  <TableRow key={loan._id}
                    sx={{ bgcolor: overdue ? "rgba(239,68,68,0.04)" : "inherit", "&:hover": { bgcolor: overdue ? "rgba(239,68,68,0.08)" : "action.hover" }, transition: "background 0.15s" }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{loan.asset?.name || "—"}</Typography>
                      {loan.asset?.serialNumber && (
                        <Typography variant="caption" color="text.secondary">{loan.asset.serialNumber}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{loan.borrowerName}</Typography>
                      <Typography variant="caption" color="text.secondary">{loan.borrowerEmail}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loan.purpose || "—"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{fmtDate(loan.checkoutDate)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: overdue ? "#EF4444" : "inherit", fontWeight: overdue ? 700 : 400 }}>
                        {fmtDate(loan.expectedReturnDate)}
                        {overdue && " ⚠"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status}
                        size="small"
                        sx={{ bgcolor: `${statusColor[status]}18`, color: statusColor[status], fontWeight: 700, fontSize: 11, borderRadius: "8px" }}
                      />
                    </TableCell>
                    <TableCell>
                      {status !== "Returned" && (
                        <Button
                          size="small"
                          startIcon={<LoginRounded sx={{ fontSize: 14 }} />}
                          onClick={() => setCheckinLoan(loan)}
                          sx={{ bgcolor: "rgba(34,197,94,0.1)", color: "#22C55E", fontWeight: 700, borderRadius: "8px", textTransform: "none", fontSize: 12, px: 1.5, "&:hover": { bgcolor: "rgba(34,197,94,0.2)" } }}>
                          Check In
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogs */}
      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        assets={assets}
        employees={employees}
        onSuccess={handleSuccess}
      />
      <CheckinDialog
        open={!!checkinLoan}
        loan={checkinLoan}
        onClose={() => setCheckinLoan(null)}
        onSuccess={handleSuccess}
      />
    </Box>
  );
}
