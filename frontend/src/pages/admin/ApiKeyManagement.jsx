import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Alert, Skeleton, Tooltip, Stack, Snackbar, Chip,
  Switch, FormControlLabel
} from '@mui/material';
import {
  VpnKeyRounded, AddRounded, DeleteRounded, ContentCopyRounded,
  CloseRounded, CheckRounded, VisibilityRounded, WarningRounded
} from '@mui/icons-material';
import api from '../../api/axios';

const SCOPE_OPTIONS = ['read', 'write', 'admin'];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never';
const fmtRelative = (d) => {
  if (!d) return 'Never used';
  const diff = (new Date() - new Date(d)) / 1000;
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function ApiKeyManagement() {
  const [keys, setKeys]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm]       = useState({ name: '', scopes: ['read'], expiresAt: '' });
  const [saving, setSaving]   = useState(false);
  const [newKey, setNewKey]   = useState(null); // shown once after creation
  const [copied, setCopied]   = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/apikeys');
      setKeys(data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load API keys.', severity: 'error' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { name: form.name, scopes: form.scopes };
      if (form.expiresAt) payload.expiresAt = form.expiresAt;
      const { data } = await api.post('/apikeys', payload);
      setNewKey(data.fullKey);
      setKeys(prev => [{ ...data, isActive: true }, ...prev]);
      setForm({ name: '', scopes: ['read'], expiresAt: '' });
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to create key.', severity: 'error' });
    } finally { setSaving(false); }
  };

  const toggleActive = async (key) => {
    try {
      const { data } = await api.put(`/apikeys/${key._id}`, { isActive: !key.isActive });
      setKeys(prev => prev.map(k => k._id === data._id ? data : k));
    } catch {
      setSnackbar({ open: true, message: 'Failed to update.', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/apikeys/${deleteTarget._id}`);
      setKeys(prev => prev.filter(k => k._id !== deleteTarget._id));
      setSnackbar({ open: true, message: 'API key deleted.', severity: 'success' });
      setDeleteTarget(null);
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete.', severity: 'error' });
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(124,58,237,0.12)' }}>
            <VpnKeyRounded sx={{ color: '#A855F7' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">API Key Management</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Generate and manage API keys for integrations</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => { setNewKey(null); setAddOpen(true); }}
          sx={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#fff', fontWeight: 800, borderRadius: '12px', px: 2.5 }}>
          Generate Key
        </Button>
      </Box>

      {/* Info banner */}
      <Paper sx={{ p: 2.5, borderRadius: '16px', border: 1, borderColor: 'rgba(168,85,247,0.3)', bgcolor: 'rgba(168,85,247,0.06)', mb: 3, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <WarningRounded sx={{ color: '#A855F7', flexShrink: 0, mt: 0.2 }} />
        <Box>
          <Typography fontWeight={800} fontSize={14} sx={{ color: '#A855F7', mb: 0.3 }}>Secret keys are shown only once</Typography>
          <Typography fontSize={13} color="text.secondary">After creation, only the key prefix is displayed. Store your key securely — it cannot be recovered later. Pass it as the <code style={{ background: 'rgba(168,85,247,0.1)', padding: '1px 6px', borderRadius: 4 }}>X-API-Key</code> header in requests.</Typography>
        </Box>
      </Paper>

      {/* Table */}
      {loading ? (
        <Stack spacing={1.5}>{[...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: '12px' }} />)}</Stack>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '20px', border: 1, borderColor: 'divider', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                {['Name', 'Key Prefix', 'Scopes', 'Last Used', 'Expires', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.6px', py: 1.5, borderBottom: 2, borderColor: 'divider' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {keys.length === 0 ? (
                <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: 'text.disabled', fontWeight: 600 }}>No API keys yet. Generate one to get started.</TableCell></TableRow>
              ) : keys.map(key => (
                <TableRow key={key._id} hover sx={{ '&:last-child td': { borderBottom: 0 }, opacity: key.isActive ? 1 : 0.5 }}>
                  <TableCell sx={{ py: 1.5, fontWeight: 700, fontSize: 13 }}>{key.name}</TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Box sx={{ fontFamily: 'monospace', fontSize: 13, bgcolor: 'action.hover', px: 1.5, py: 0.5, borderRadius: '8px', display: 'inline-block', color: '#A855F7', fontWeight: 700 }}>
                      {key.prefix}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Stack direction="row" gap={0.5} flexWrap="wrap">
                      {key.scopes?.map(s => (
                        <Box key={s} sx={{ px: 1, py: 0.2, borderRadius: '8px', fontSize: 11, fontWeight: 800, bgcolor: s === 'admin' ? 'rgba(239,68,68,0.12)' : s === 'write' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)', color: s === 'admin' ? '#DC2626' : s === 'write' ? '#D97706' : '#16A34A' }}>{s}</Box>
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ py: 1.5, fontSize: 12, color: 'text.secondary' }}>{fmtRelative(key.lastUsed)}</TableCell>
                  <TableCell sx={{ py: 1.5, fontSize: 12, color: key.expiresAt && new Date(key.expiresAt) < new Date() ? '#EF4444' : 'text.secondary' }}>
                    {key.expiresAt ? fmtDate(key.expiresAt) : 'Never'}
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Switch size="small" checked={key.isActive} onChange={() => toggleActive(key)}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#A855F7' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#A855F7' } }} />
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Tooltip title="Delete key">
                      <IconButton size="small" onClick={() => setDeleteTarget(key)} sx={{ borderRadius: '8px', color: '#DC2626' }}><DeleteRounded fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create dialog */}
      <Dialog open={addOpen} onClose={() => { if (!saving) { setAddOpen(false); setNewKey(null); } }} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Typography fontWeight={800} fontSize={18}>Generate API Key</Typography>
          <IconButton onClick={() => { setAddOpen(false); setNewKey(null); }} sx={{ bgcolor: 'action.hover', borderRadius: '10px' }}><CloseRounded /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {newKey ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>Key generated! Copy it now — it won't be shown again.</Alert>
              <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'action.hover', border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ flex: 1, fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all', color: '#A855F7', fontWeight: 700 }}>{newKey}</Typography>
                <Tooltip title={copied ? 'Copied!' : 'Copy key'}>
                  <IconButton onClick={copyKey} sx={{ flexShrink: 0, bgcolor: copied ? 'rgba(34,197,94,0.1)' : 'action.hover', borderRadius: '10px', color: copied ? '#22C55E' : 'text.secondary' }}>
                    {copied ? <CheckRounded /> : <ContentCopyRounded />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleCreate}>
              <Stack spacing={2}>
                <TextField required label="Key Name" placeholder="e.g. Zapier Integration" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} sx={inputSx} />
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel>Scopes</InputLabel>
                  <Select multiple value={form.scopes} label="Scopes"
                    onChange={e => setForm(f => ({ ...f, scopes: e.target.value }))}
                    renderValue={selected => (
                      <Stack direction="row" gap={0.5}>{selected.map(s => <Chip key={s} label={s} size="small" sx={{ fontWeight: 700 }} />)}</Stack>
                    )}>
                    {SCOPE_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Expires At (optional)" type="date" value={form.expiresAt}
                  onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} sx={inputSx}
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Leave blank for no expiry" />
              </Stack>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button onClick={() => setAddOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700, borderRadius: '10px' }}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={saving}
                  sx={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#fff', fontWeight: 800, borderRadius: '10px', px: 3 }}>
                  {saving ? 'Generating…' : 'Generate Key'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        {newKey && (
          <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button variant="contained" onClick={() => { setAddOpen(false); setNewKey(null); }}
              sx={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#fff', fontWeight: 800, borderRadius: '10px', px: 3 }}>
              Done
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle component="div"><Typography fontWeight={800} fontSize={17}>Delete API Key?</Typography></DialogTitle>
        <DialogContent><Typography color="text.secondary">Deleting <strong>{deleteTarget?.name}</strong> will immediately revoke access for any integration using it.</Typography></DialogContent>
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
