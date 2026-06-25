import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, MenuItem, Select, FormControl, InputLabel, Alert, Skeleton,
  Chip, Tooltip, Stack, InputAdornment, Snackbar
} from '@mui/material';
import {
  PeopleRounded, AddRounded, EditRounded, BlockRounded, CheckCircleRounded,
  CloseRounded, SearchRounded, PersonAddRounded, Visibility, VisibilityOff
} from '@mui/icons-material';
import api from '../../api/axios';

const ROLES = ['employee', 'hod', 'admin', 'it_support', 'vendor'];
const ROLE_COLORS = {
  admin:      { color: '#111111', bg: '#F1F5F9' },
  hod:        { color: '#7C3AED', bg: '#F3E8FF' },
  employee:   { color: '#2563EB', bg: '#EFF6FF' },
  it_support: { color: '#0891B2', bg: '#ECFEFF' },
  vendor:     { color: '#D97706', bg: '#FFFBEB' },
};

const defaultForm = { name: '', email: '', password: '', role: 'employee', department: '', phone: '' };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', department: '', phone: '' });
  const [editSaving, setEditSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const { data } = await api.post('/users', form);
      setUsers(prev => [data, ...prev]);
      setAddOpen(false);
      setForm(defaultForm);
      setSnackbar({ open: true, message: `User "${data.name}" created and welcome email sent.`, severity: 'success' });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (user) => {
    setEditTarget(user);
    setEditForm({ role: user.role, department: user.department, phone: user.phone || '' });
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const { data } = await api.put(`/users/${editTarget._id}`, editForm);
      setUsers(prev => prev.map(u => u._id === data._id ? data : u));
      setEditOpen(false);
      setSnackbar({ open: true, message: 'User updated.', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to update.', severity: 'error' });
    } finally {
      setEditSaving(false);
    }
  };

  const toggleActive = async (user) => {
    try {
      const { data } = await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      setUsers(prev => prev.map(u => u._id === data._id ? data : u));
      setSnackbar({ open: true, message: `User ${data.isActive ? 'activated' : 'deactivated'}.`, severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to update status.', severity: 'error' });
    }
  };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: '#111111' }}>
            <PeopleRounded sx={{ color: '#CBFA57' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">User Management</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Manage employee accounts, roles, and access
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained" startIcon={<PersonAddRounded />}
          onClick={() => { setAddOpen(true); setFormError(''); setForm(defaultForm); }}
          sx={{ bgcolor: '#111111', color: '#CBFA57', fontWeight: 800, borderRadius: '12px', px: 3, '&:hover': { bgcolor: '#222222' } }}
        >
          Add User
        </Button>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, borderRadius: '16px', border: 1, borderColor: 'divider', mb: 3 }}>
        <TextField
          fullWidth placeholder="Search by name, email or department..."
          value={search} onChange={e => setSearch(e.target.value)}
          sx={inputSx}
          slotProps={{ input: { startAdornment: <SearchRounded sx={{ color: 'text.disabled', mr: 1 }} /> } }}
        />
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

      {loading ? (
        <Paper sx={{ borderRadius: '20px', border: 1, borderColor: 'divider', overflow: 'hidden' }}>
          {[...Array(6)].map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, p: 2, borderBottom: i < 5 ? 1 : 0, borderColor: 'divider', opacity: 1 - i * 0.12 }}>
              <Skeleton variant="rounded" width={140} height={20} />
              <Skeleton variant="text" width="25%" height={20} />
              <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '20px' }} />
              <Skeleton variant="text" width="15%" height={20} />
              <Skeleton variant="text" width="10%" height={20} />
            </Box>
          ))}
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '20px', border: 1, borderColor: 'divider', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                {['Name', 'Email', 'Role', 'Department', 'Phone', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.6px', py: 1.5, borderBottom: 2, borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: 'text.disabled', fontWeight: 600 }}>
                    No users found.
                  </TableCell>
                </TableRow>
              ) : filtered.map(user => {
                const rc = ROLE_COLORS[user.role] || { color: '#64748b', bg: '#F1F5F9' };
                return (
                  <TableRow key={user._id} hover sx={{ '&:last-child td': { borderBottom: 0 }, opacity: user.isActive ? 1 : 0.5 }}>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography fontSize={13} fontWeight={700} color="text.primary">{user.name}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, color: 'text.secondary', fontSize: 13 }}>{user.email}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'inline-flex', px: 1.2, py: 0.3, borderRadius: '20px', bgcolor: rc.bg, color: rc.color, fontSize: 11, fontWeight: 800, textTransform: 'capitalize' }}>
                        {user.role?.replace(/_/g, ' ')}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: 13, color: 'text.secondary' }}>{user.department}</TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: 12, color: 'text.disabled' }}>{user.phone || '—'}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{
                        display: 'inline-flex', px: 1.2, py: 0.3, borderRadius: '20px', fontSize: 11, fontWeight: 800,
                        bgcolor: user.isActive ? '#F0FDF4' : '#F1F5F9',
                        color: user.isActive ? '#16A34A' : '#94A3B8'
                      }}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Stack direction="row" gap={0.5}>
                        <Tooltip title="Edit Role / Dept">
                          <IconButton size="small" onClick={() => openEdit(user)}
                            sx={{ borderRadius: '8px', '&:hover': { bgcolor: 'action.hover' } }}>
                            <EditRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" onClick={() => toggleActive(user)}
                            sx={{ borderRadius: '8px', color: user.isActive ? '#DC2626' : '#16A34A', '&:hover': { bgcolor: user.isActive ? '#FEF2F2' : '#F0FDF4' } }}>
                            {user.isActive ? <BlockRounded fontSize="small" /> : <CheckCircleRounded fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add User Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: '24px', border: 1, borderColor: 'divider' } } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0 }}>
          <Typography fontWeight={900} fontSize={20}>Add New User</Typography>
          <IconButton onClick={() => setAddOpen(false)} sx={{ bgcolor: 'action.hover', borderRadius: '10px' }}><CloseRounded /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component="form" onSubmit={handleAdd}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{formError}</Alert>}
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField required fullWidth label="Full Name" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} sx={inputSx} />
              <TextField required fullWidth label="Email Address" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} sx={inputSx} />
              <TextField required fullWidth label="Temporary Password" type={showPass ? 'text' : 'password'} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} sx={inputSx}
                helperText="Employee will receive this via welcome email"
                slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPass(s => !s)}>{showPass ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }} />
              <TextField required fullWidth label="Department" value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))} sx={inputSx} />
              <FormControl fullWidth sx={inputSx}>
                <InputLabel>Role</InputLabel>
                <Select value={form.role} label="Role" onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r.replace(/_/g, ' ')}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField fullWidth label="Phone (optional)" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} sx={inputSx} />
            </Stack>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button onClick={() => setAddOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700, borderRadius: '10px' }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}
                sx={{ bgcolor: '#111111', color: '#CBFA57', fontWeight: 800, borderRadius: '10px', px: 3, '&:hover': { bgcolor: '#222222' } }}>
                {saving ? 'Creating...' : 'Create User'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: '24px', border: 1, borderColor: 'divider' } } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0 }}>
          <Box>
            <Typography fontWeight={900} fontSize={20}>Edit User</Typography>
            <Typography fontSize={13} color="text.secondary">{editTarget?.name}</Typography>
          </Box>
          <IconButton onClick={() => setEditOpen(false)} sx={{ bgcolor: 'action.hover', borderRadius: '10px' }}><CloseRounded /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component="form" onSubmit={handleEdit}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth sx={inputSx}>
                <InputLabel>Role</InputLabel>
                <Select value={editForm.role} label="Role" onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r.replace(/_/g, ' ')}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField fullWidth label="Department" value={editForm.department}
                onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} sx={inputSx} />
              <TextField fullWidth label="Phone" value={editForm.phone}
                onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} sx={inputSx} />
            </Stack>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button onClick={() => setEditOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700, borderRadius: '10px' }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={editSaving}
                sx={{ bgcolor: '#111111', color: '#CBFA57', fontWeight: 800, borderRadius: '10px', px: 3, '&:hover': { bgcolor: '#222222' } }}>
                {editSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: '12px', fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
