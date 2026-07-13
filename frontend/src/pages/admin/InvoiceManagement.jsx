import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Alert, Skeleton, Tooltip, Stack, InputAdornment, Snackbar,
  Chip, LinearProgress, TablePagination
} from '@mui/material';
import {
  ReceiptRounded, AddRounded, EditRounded, DeleteRounded, SearchRounded,
  UploadFileRounded, OpenInNewRounded, CloseRounded, DownloadRounded,
  AttachMoneyRounded, BusinessRounded, CalendarTodayRounded
} from '@mui/icons-material';
import api from '../../api/axios';

const STATUS_COLORS = {
  Paid:      { color: '#16A34A', bg: '#F0FDF4' },
  Unpaid:    { color: '#D97706', bg: '#FFFBEB' },
  Overdue:   { color: '#DC2626', bg: '#FEF2F2' },
  Cancelled: { color: '#94A3B8', bg: '#F1F5F9' },
};

const fmtCurrency = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
const fmtDate     = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const defaultForm = { invoiceNumber: '', vendor: '', vendorEmail: '', vendorPhone: '', amount: '', invoiceDate: '', dueDate: '', status: 'Unpaid', category: '', notes: '' };

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [addOpen, setAddOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]         = useState(defaultForm);
  const [file, setFile]         = useState(null);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');
  const fileRef = useRef(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const paginatedInvoices = useMemo(
    () => invoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [invoices, page, rowsPerPage]
  );

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search)       params.search = search;
      const { data } = await api.get('/invoices', { params });
      setInvoices(data);
    } catch {
      setError('Failed to load invoices.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); setPage(0); }, [search, statusFilter]);

  const openAdd = () => { setForm(defaultForm); setFile(null); setFormError(''); setEditTarget(null); setAddOpen(true); };
  const openEdit = (inv) => {
    setEditTarget(inv);
    setForm({
      invoiceNumber: inv.invoiceNumber || '',
      vendor:        inv.vendor || '',
      vendorEmail:   inv.vendorEmail || '',
      vendorPhone:   inv.vendorPhone || '',
      amount:        inv.amount || '',
      invoiceDate:   inv.invoiceDate ? inv.invoiceDate.slice(0, 10) : '',
      dueDate:       inv.dueDate    ? inv.dueDate.slice(0, 10)    : '',
      status:        inv.status || 'Unpaid',
      category:      inv.category || '',
      notes:         inv.notes || '',
    });
    setFile(null); setFormError(''); setAddOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setFormError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (file) fd.append('file', file);

      if (editTarget) {
        const { data } = await api.put(`/invoices/${editTarget._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setInvoices(prev => prev.map(i => i._id === data._id ? data : i));
        setSnackbar({ open: true, message: 'Invoice updated.', severity: 'success' });
      } else {
        const { data } = await api.post('/invoices', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setInvoices(prev => [data, ...prev]);
        setSnackbar({ open: true, message: 'Invoice added.', severity: 'success' });
      }
      setAddOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/invoices/${deleteTarget._id}`);
      setInvoices(prev => prev.filter(i => i._id !== deleteTarget._id));
      setSnackbar({ open: true, message: 'Invoice deleted.', severity: 'success' });
      setDeleteTarget(null);
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete.', severity: 'error' });
    }
  };

  const totalAmount    = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const unpaidAmount   = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue').reduce((s, i) => s + (i.amount || 0), 0);

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(17,24,39,0.12)' }}>
            <ReceiptRounded sx={{ color: 'text.primary' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Invoice Management</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Store, link, and track vendor invoices</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddRounded />} onClick={openAdd}
          sx={{ background: '#FBBF24', color: '#111827', fontWeight: 800, borderRadius: '12px', px: 2.5 }}>
          Add Invoice
        </Button>
      </Box>

      {/* Summary cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 2, mb: 3 }}>
        {[
          { label: 'Total Invoices', value: invoices.length, color: 'text.primary' },
          { label: 'Total Value',    value: fmtCurrency(totalAmount), color: '#FBBF24' },
          { label: 'Outstanding',    value: fmtCurrency(unpaidAmount), color: '#FBBF24' },
          { label: 'Paid',           value: invoices.filter(i => i.status === 'Paid').length, color: '#FBBF24' },
        ].map(({ label, value, color }) => (
          <Paper key={label} sx={{ p: 2.5, borderRadius: '16px', border: 1, borderColor: 'divider' }}>
            <Typography fontSize={12} fontWeight={700} color="text.secondary" sx={{ mb: 0.5 }}>{label}</Typography>
            <Typography fontSize={22} fontWeight={900} sx={{ color }}>{value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, borderRadius: '16px', border: 1, borderColor: 'divider', mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField placeholder="Search vendor, invoice #, notes..." value={search} onChange={e => setSearch(e.target.value)} sx={{ ...inputSx, flex: 1, minWidth: 200 }}
          slotProps={{ input: { startAdornment: <SearchRounded sx={{ color: 'text.disabled', mr: 1 }} /> } }} />
        <FormControl sx={{ ...inputSx, minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {['Paid', 'Unpaid', 'Overdue', 'Cancelled'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

      {loading ? (
        <Stack spacing={1.5}>{[...Array(5)].map((_, i) => <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: '12px' }} />)}</Stack>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '20px', border: 1, borderColor: 'divider', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                {['Invoice #', 'Vendor', 'Date', 'Due Date', 'Amount', 'Status', 'Assets', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.6px', py: 1.5, borderBottom: 2, borderColor: 'divider' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: 'text.disabled', fontWeight: 600 }}>No invoices found. Add one to get started.</TableCell></TableRow>
              ) : paginatedInvoices.map(inv => {
                const sc = STATUS_COLORS[inv.status] || STATUS_COLORS.Unpaid;
                return (
                  <TableRow key={inv._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ py: 1.5, fontWeight: 700, fontSize: 13, color: 'text.primary' }}>
                      {inv.invoiceNumber || <span style={{ color: '#94A3B8' }}>—</span>}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessRounded sx={{ fontSize: 15, color: 'text.disabled' }} />
                        <Typography fontSize={13} fontWeight={600}>{inv.vendor}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: 12, color: 'text.secondary' }}>{fmtDate(inv.invoiceDate)}</TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: 12, color: inv.status === 'Overdue' ? '#EF4444' : 'text.secondary' }}>{fmtDate(inv.dueDate)}</TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: 13, fontWeight: 700 }}>{fmtCurrency(inv.amount)}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'inline-flex', px: 1.2, py: 0.3, borderRadius: '20px', fontSize: 11, fontWeight: 800, bgcolor: sc.bg, color: sc.color }}>
                        {inv.status}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: 12, color: 'text.secondary' }}>
                      {inv.assets?.length ? `${inv.assets.length} asset(s)` : '—'}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Stack direction="row" gap={0.5}>
                        {inv.fileUrl && (
                          <Tooltip title="View invoice file">
                            <IconButton size="small" href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${inv.fileUrl}`} target="_blank" sx={{ borderRadius: '8px', color: '#3B82F6' }}>
                              <OpenInNewRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(inv)} sx={{ borderRadius: '8px' }}><EditRounded fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteTarget(inv)} sx={{ borderRadius: '8px', color: '#DC2626' }}><DeleteRounded fontSize="small" /></IconButton></Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={invoices.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: "1px solid", borderColor: "divider", color: "text.secondary" }}
          />
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: '20px' } } }}>
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Typography fontWeight={800} fontSize={18}>{editTarget ? 'Edit Invoice' : 'Add Invoice'}</Typography>
          <IconButton onClick={() => setAddOpen(false)} sx={{ bgcolor: 'action.hover', borderRadius: '10px' }}><CloseRounded /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box component="form" onSubmit={handleSave}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{formError}</Alert>}
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField label="Invoice Number" value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} sx={inputSx} />
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel>Status</InputLabel>
                  <Select value={form.status} label="Status" onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {['Paid', 'Unpaid', 'Overdue', 'Cancelled'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <TextField required label="Vendor Name" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} sx={inputSx} />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField label="Vendor Email" type="email" value={form.vendorEmail} onChange={e => setForm(f => ({ ...f, vendorEmail: e.target.value }))} sx={inputSx} />
                <TextField label="Vendor Phone" value={form.vendorPhone}
                  onChange={e => setForm(f => ({ ...f, vendorPhone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))}
                  sx={inputSx} slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 10 } }} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <TextField label="Amount (₹)" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} sx={inputSx}
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                  onWheel={(e) => e.target.blur()} />
                <TextField label="Invoice Date" type="date" value={form.invoiceDate} onChange={e => setForm(f => ({ ...f, invoiceDate: e.target.value }))} sx={inputSx}
                  slotProps={{ inputLabel: { shrink: true } }} />
                <TextField label="Due Date" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} sx={inputSx}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Box>
              <TextField label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} sx={inputSx} />
              <TextField label="Notes" multiline rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} sx={inputSx} />

              {/* File upload */}
              <Box>
                <Typography fontSize={12} fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>Invoice File (PDF/Image)</Typography>
                <Button component="label" variant="outlined" startIcon={<UploadFileRounded />}
                  sx={{ borderRadius: '10px', fontWeight: 700, borderColor: 'divider', color: 'text.secondary' }}>
                  {file ? file.name : editTarget?.fileName || 'Choose file'}
                  <input ref={fileRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => { setFile(e.target.files[0] || null); if (fileRef.current) fileRef.current.value = ''; }} />
                </Button>
                {editTarget?.fileUrl && !file && (
                  <Typography fontSize={11} color="text.disabled" sx={{ mt: 0.5 }}>Current: {editTarget.fileName}</Typography>
                )}
              </Box>
            </Stack>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button onClick={() => setAddOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700, borderRadius: '10px' }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}
                sx={{ background: '#FBBF24', color: '#111827', fontWeight: 800, borderRadius: '10px', px: 3 }}>
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Invoice'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: '16px' } } }}>
        <DialogTitle component="div"><Typography fontWeight={800} fontSize={17}>Delete Invoice?</Typography></DialogTitle>
        <DialogContent><Typography color="text.secondary">This will permanently delete invoice <strong>{deleteTarget?.invoiceNumber || 'this record'}</strong> from {deleteTarget?.vendor}.</Typography></DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ fontWeight: 700, color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleDelete} sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, fontWeight: 800, borderRadius: '10px' }}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: '12px', fontWeight: 700 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
