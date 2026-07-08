import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, MenuItem, Select, FormControl, InputLabel, Alert, Skeleton,
  Tooltip, Stack, InputAdornment, Snackbar, Tabs, Tab,
  Drawer, Divider, CircularProgress, ToggleButtonGroup, ToggleButton, Avatar,
  DialogActions, LinearProgress, Checkbox, TableSortLabel
} from '@mui/material';
import {
  PeopleRounded, EditRounded, BlockRounded, CheckCircleRounded,
  CloseRounded, SearchRounded, PersonAddRounded, Visibility, VisibilityOff,
  EmailRounded, LockRounded, PersonRounded, CalendarMonthRounded,
  LaptopRounded, ConfirmationNumberRounded, DevicesRounded,
  MailOutlineRounded, UploadFileRounded, CheckRounded, ErrorRounded,
  SecurityRounded, HistoryRounded, DownloadRounded,
  FiberManualRecordRounded, DeleteRounded, ManageAccountsRounded,
  AccessTimeRounded, BadgeRounded, CameraAltRounded, ExitToAppRounded,
  ChecklistRounded
} from '@mui/icons-material';
import api, { getFileUrl } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['employee', 'hod', 'admin', 'technician'];
const ROLE_COLORS = {
  admin:      { color: 'text.primary', bg: 'rgba(17,24,39,0.13)' },
  hod:        { color: '#A78BFA', bg: 'rgba(17,24,39,0.13)' },
  employee:   { color: '#60A5FA', bg: 'rgba(37,99,235,0.13)'  },
  technician: { color: '#fb923c', bg: 'rgba(249,115,22,0.13)'  },
};
const STATUS_COLORS = {
  Open: '#EAB308', 'In Progress': '#3B82F6', Resolved: '#22C55E',
  Closed: '#94A3B8', Pending: '#F97316', Approved: '#22C55E', Rejected: '#EF4444',
};
const ACTION_COLORS = {
  CREATE: '#22C55E', UPDATE: '#3B82F6', DELETE: '#EF4444',
  ASSIGN: '#111827', REVOKE: '#F97316', LOGIN: '#14B8A6', APPROVE: '#22C55E', REJECT: '#EF4444',
};

const formatAction = (action) =>
  action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// ── Role Permissions Matrix ───────────────────────────────────────────────────
const DEFAULT_PERMISSION_MATRIX = [
  { feature: 'View Dashboard',          admin: true,  hod: true,  employee: true,  technician: true  },
  { feature: 'Register Assets',         admin: true,  hod: false, employee: false, technician: false },
  { feature: 'Edit / Delete Assets',    admin: true,  hod: false, employee: false, technician: false },
  { feature: 'Assign Assets',           admin: true,  hod: false, employee: false, technician: false },
  { feature: 'View All Assets',         admin: true,  hod: true,  employee: false, technician: true  },
  { feature: 'Raise Tickets',           admin: true,  hod: true,  employee: true,  technician: true  },
  { feature: 'Manage All Tickets',      admin: true,  hod: false, employee: false, technician: true  },
  { feature: 'Approve Device Requests', admin: true,  hod: true,  employee: false, technician: false },
  { feature: 'Manage Users',            admin: true,  hod: false, employee: false, technician: false },
  { feature: 'View Audit Logs',         admin: true,  hod: false, employee: false, technician: false },
  { feature: 'Manage Departments',      admin: true,  hod: false, employee: false, technician: false },
  { feature: 'Settings & Config',       admin: true,  hod: false, employee: false, technician: false },
  { feature: 'Employee Portal',         admin: false, hod: false, employee: true,  technician: false },
  { feature: 'Submit Device Requests',  admin: false, hod: true,  employee: true,  technician: false },
];

const PERM_STORAGE_KEY = 'assetcare_permission_matrix';

function loadPermMatrix() {
  try {
    const saved = localStorage.getItem(PERM_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_PERMISSION_MATRIX;
}

const defaultForm = { name: '', email: '', password: '', role: 'employee', department: '', phone: '' };

function avatarColor(name = '') {
  const colors = ['#111827', '#2563EB', '#059669', '#D97706', '#DC2626', '#0891B2'];
  return colors[name.charCodeAt(0) % colors.length];
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  const now = new Date();
  const diff = (now - dt) / 1000;
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const RoleChip = ({ role }) => {
  const rc = ROLE_COLORS[role] || { color: '#64748b', bg: '#F1F5F9' };
  return (
    <Box sx={{ display: 'inline-flex', px: 1.2, py: 0.3, borderRadius: '20px', bgcolor: rc.bg, color: rc.color, fontSize: 11, fontWeight: 800, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {role?.replace(/_/g, ' ')}
    </Box>
  );
};


function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
}

// Sortable column header
const SortHead = ({ id, label, sort, onSort, sx = {} }) => (
  <TableCell sortDirection={sort.col === id ? sort.dir : false}
    sx={{ fontWeight: 800, fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.6px', py: 1.5, borderBottom: 2, borderColor: 'divider', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...sx }}>
    <TableSortLabel active={sort.col === id} direction={sort.col === id ? sort.dir : 'asc'} onClick={() => onSort(id)}
      sx={{ '& .MuiTableSortLabel-icon': { fontSize: 14 }, color: 'inherit !important', '&.Mui-active': { color: '#FBBF24 !important' }, '& .MuiTableSortLabel-icon': { color: '#FBBF24 !important', opacity: sort.col === id ? 1 : 0 } }}>
      {label}
    </TableSortLabel>
  </TableCell>
);

export default function UserManagement() {
  const { currentUser: me } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [snackbar, setSnackbar]   = useState({ open: false, message: '', severity: 'success' });
  const [tenant, setTenant]       = useState(null);

  // Sorting
  const [sort, setSort] = useState({ col: 'name', dir: 'asc' });

  // Selection / bulk actions
  const [selected, setSelected]           = useState(new Set());
  const [bulkRoleOpen, setBulkRoleOpen]   = useState(false);
  const [bulkRole, setBulkRole]           = useState('employee');
  const [bulkWorking, setBulkWorking]     = useState(false);

  // Add dialog
  const [addOpen, setAddOpen]     = useState(false);
  const [addMode, setAddMode]     = useState('password');
  const [form, setForm]           = useState(defaultForm);
  const [showPass, setShowPass]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  // Edit dialog
  const [editOpen, setEditOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm]     = useState({ role: '', department: '', phone: '', employeeId: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [departments, setDepartments] = useState([]);

  // Avatar upload
  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Offboarding
  const [offboardTarget, setOffboardTarget] = useState(null);
  const [offboarding, setOffboarding]       = useState(false);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Profile drawer
  const [profileOpen, setProfileOpen]           = useState(false);
  const [profileUser, setProfileUser]           = useState(null);
  const [profileData, setProfileData]           = useState(null);
  const [profileLoading, setProfileLoading]     = useState(false);
  const [profileTab, setProfileTab]             = useState('overview');
  const [activityLogs, setActivityLogs]         = useState([]);
  const [activityLoading, setActivityLoading]   = useState(false);

  // Permissions dialog (role overview — kept for reference)
  const [permOpen, setPermOpen] = useState(false);

  // Per-user permissions dialog
  const [userPermOpen, setUserPermOpen]   = useState(false);
  const [userPermTarget, setUserPermTarget] = useState(null);
  const [userPermState, setUserPermState] = useState([]);
  const [userPermSaved, setUserPermSaved] = useState(false);

  const openUserPerm = (user) => {
    // Load from user's saved DB customPermissions first; fall back to role defaults
    const dbPerms = user.customPermissions?.length
      ? user.customPermissions
      : DEFAULT_PERMISSION_MATRIX.map(row => ({ feature: row.feature, allowed: row[user.role] ?? false }));
    setUserPermState(dbPerms);
    setUserPermTarget(user);
    setUserPermSaved(false);
    setUserPermOpen(true);
  };

  const toggleUserPerm = (idx) => {
    setUserPermState(prev => prev.map((r, i) => i === idx ? { ...r, allowed: !r.allowed } : r));
    setUserPermSaved(false);
  };

  const saveUserPerm = async () => {
    try {
      await api.put(`/users/${userPermTarget._id}/permissions`, { permissions: userPermState });
      setUsers(prev => prev.map(u => u._id === userPermTarget._id ? { ...u, customPermissions: userPermState } : u));
      if (profileUser?._id === userPermTarget._id) setProfileUser(p => ({ ...p, customPermissions: userPermState }));
      if (userPermTarget._id === me?._id) refreshUser();
      setUserPermSaved(true);
      setTimeout(() => setUserPermSaved(false), 2000);
    } catch {
      setSnackbar({ open: true, message: 'Failed to save permissions.', severity: 'error' });
    }
  };

  const resetUserPerm = async () => {
    const roleDefaults = DEFAULT_PERMISSION_MATRIX.map(row => ({
      feature: row.feature,
      allowed: row[userPermTarget.role] ?? false,
    }));
    try {
      await api.put(`/users/${userPermTarget._id}/permissions`, { permissions: roleDefaults });
    } catch { /* ignore */ }
    setUserPermState(roleDefaults);
    setUserPermSaved(false);
    setUsers(prev => prev.map(u => u._id === userPermTarget._id ? { ...u, customPermissions: roleDefaults } : u));
    if (profileUser?._id === userPermTarget._id) setProfileUser(p => ({ ...p, customPermissions: roleDefaults }));
  };

  // CSV import
  const [csvOpen, setCsvOpen]           = useState(false);
  const [csvRows, setCsvRows]           = useState([]);
  const [csvError, setCsvError]         = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult]       = useState(null);
  const csvInputRef = useRef(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load users. Please refresh.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    api.get('/departments').then(({ data }) => setDepartments(data)).catch(() => {});
    api.get('/settings/tenant').then(({ data }) => setTenant(data)).catch(() => {});
  }, []);

  // Deep-link support: open a user's profile drawer directly (e.g. from Global Search)
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (!highlightId || users.length === 0) return;
    const match = users.find(u => u._id === highlightId);
    if (match) {
      openProfile(match);
      navigate('/admin/users', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchParams]);

  const TAB_ROLES = {
    all: null,
    admin: ['admin'],
    hod: ['hod'],
    technician: ['technician'],
    employee: ['employee']
  };

  // Filter then sort
  const filtered = useMemo(() => {
    const roles = TAB_ROLES[activeTab];
    const base = users.filter(u => {
      const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.department?.toLowerCase().includes(search.toLowerCase());
      return matchSearch && (!roles || roles.includes(u.role));
    });
    return [...base].sort((a, b) => {
      let av = '', bv = '';
      if (sort.col === 'name')      { av = a.name?.toLowerCase(); bv = b.name?.toLowerCase(); }
      if (sort.col === 'role')      { av = a.role; bv = b.role; }
      if (sort.col === 'department'){ av = a.department?.toLowerCase(); bv = b.department?.toLowerCase(); }
      if (sort.col === 'lastLogin') { av = a.lastLogin || ''; bv = b.lastLogin || ''; }
      if (sort.col === 'status')    { av = String(a.isActive); bv = String(b.isActive); }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, search, activeTab, sort]);

  const toggleSort = (col) => {
    setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const countFor = (tab) => {
    const roles = TAB_ROLES[tab];
    return roles ? users.filter(u => roles.includes(u.role)).length : users.length;
  };

  // ── Selection helpers ────────────────────────────────────────────────────────
  const allSelected = filtered.length > 0 && filtered.every(u => selected.has(u._id));
  const someSelected = filtered.some(u => selected.has(u._id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => { const n = new Set(prev); filtered.forEach(u => n.delete(u._id)); return n; });
    } else {
      setSelected(prev => { const n = new Set(prev); filtered.forEach(u => n.add(u._id)); return n; });
    }
  };

  const toggleOne = (id) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const clearSelection = () => setSelected(new Set());

  // ── Bulk actions ─────────────────────────────────────────────────────────────
  const bulkDeactivate = async () => {
    setBulkWorking(true);
    try {
      await Promise.all([...selected].map(id => api.put(`/users/${id}`, { isActive: false })));
      setUsers(prev => prev.map(u => selected.has(u._id) ? { ...u, isActive: false } : u));
      setSnackbar({ open: true, message: `${selected.size} user(s) deactivated.`, severity: 'success' });
      clearSelection();
    } catch {
      setSnackbar({ open: true, message: 'Some updates failed.', severity: 'error' });
    } finally { setBulkWorking(false); }
  };

  const bulkChangeRole = async () => {
    setBulkWorking(true);
    try {
      await Promise.all([...selected].map(id => api.put(`/users/${id}`, { role: bulkRole })));
      setUsers(prev => prev.map(u => selected.has(u._id) ? { ...u, role: bulkRole } : u));
      setSnackbar({ open: true, message: `Role updated for ${selected.size} user(s).`, severity: 'success' });
      clearSelection(); setBulkRoleOpen(false);
    } catch {
      setSnackbar({ open: true, message: 'Some updates failed.', severity: 'error' });
    } finally { setBulkWorking(false); }
  };

  const executeBulkDelete = async () => {
    setBulkWorking(true);
    setDeleteConfirmOpen(false);
    try {
      await Promise.all([...selected].map(id => api.delete(`/users/${id}`)));
      setUsers(prev => prev.filter(u => !selected.has(u._id)));
      setSnackbar({ open: true, message: `${selected.size} user(s) permanently deleted.`, severity: 'success' });
      clearSelection();
    } catch {
      setSnackbar({ open: true, message: 'Some deletions failed.', severity: 'error' });
    } finally { setBulkWorking(false); }
  };

  // ── Add user ─────────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault(); setFormError('');
    if (form.phone && form.phone.length !== 10) {
      setFormError('Phone number must be exactly 10 digits.');
      return;
    }
    setSaving(true);
    try {
      if (addMode === 'invite') {
        await api.post('/users/invite', { name: form.name, email: form.email, role: form.role, department: form.department, phone: form.phone });
        setSnackbar({ open: true, message: `Invite sent to ${form.email}.`, severity: 'success' });
        fetchUsers();
      } else {
        const { data } = await api.post('/users', form);
        setUsers(prev => [data, ...prev]);
        setSnackbar({ open: true, message: `User "${data.name}" created.`, severity: 'success' });
      }
      setAddOpen(false); setForm(defaultForm);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed. Please try again.');
    } finally { setSaving(false); }
  };

  // ── Edit user ─────────────────────────────────────────────────────────────────
  const openEdit = (user) => {
    setEditTarget(user);
    setEditForm({ role: user.role, department: user.department, phone: user.phone || '', employeeId: user.employeeId || '' });
    setEditOpen(true);
  };

  const handleAvatarUpload = async (file, userId) => {
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await api.post(`/users/${userId}/avatar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, avatar: data.avatar } : u));
      if (profileUser?._id === userId) setProfileUser(p => ({ ...p, avatar: data.avatar }));
      setSnackbar({ open: true, message: 'Profile photo updated.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to upload photo.', severity: 'error' });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleOffboard = async () => {
    setOffboarding(true);
    try {
      const { data } = await api.post(`/users/${offboardTarget._id}/offboard`);
      setUsers(prev => prev.map(u => u._id === offboardTarget._id ? { ...u, isActive: false } : u));
      if (profileUser?._id === offboardTarget._id) { setProfileUser(p => ({ ...p, isActive: false })); }
      setSnackbar({ open: true, message: data.message, severity: 'success' });
      setOffboardTarget(null);
      setProfileOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Offboarding failed.', severity: 'error' });
    } finally { setOffboarding(false); }
  };

  const { refreshUser } = useAuth();

  const handleEdit = async (e) => {
    e.preventDefault();
    if (editForm.phone && editForm.phone.length !== 10) {
      setSnackbar({ open: true, message: 'Phone number must be exactly 10 digits.', severity: 'error' });
      return;
    }
    setEditSaving(true);
    try {
      const { data } = await api.put(`/users/${editTarget._id}`, editForm);
      setUsers(prev => prev.map(u => u._id === data._id ? data : u));
      if (profileUser?._id === data._id) setProfileUser(data);
      setEditOpen(false);
      setSnackbar({ open: true, message: 'User updated.', severity: 'success' });
      // If admin edited their own account, refresh the session
      if (data._id === me?._id || data.email === me?.email) refreshUser();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed.', severity: 'error' });
    } finally { setEditSaving(false); }
  };

  const toggleActive = async (user) => {
    try {
      const { data } = await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      setUsers(prev => prev.map(u => u._id === data._id ? data : u));
      if (profileUser?._id === data._id) setProfileUser(data);
      setSnackbar({ open: true, message: `User ${data.isActive ? 'activated' : 'deactivated'}.`, severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to update status.', severity: 'error' });
    }
  };

  // ── Profile drawer ────────────────────────────────────────────────────────────
  const openProfile = async (user) => {
    setProfileUser(user); setProfileOpen(true);
    setProfileData(null); setProfileLoading(true); setProfileTab('overview');
    setActivityLogs([]); setActivityLoading(false);
    try {
      const { data } = await api.get(`/users/${user._id}/profile`);
      setProfileData(data);
    } catch { setProfileData({ error: true }); }
    finally { setProfileLoading(false); }
  };

  const loadActivity = async (userId) => {
    if (activityLogs.length > 0) return;
    setActivityLoading(true);
    try {
      const { data } = await api.get(`/users/${userId}/activity`);
      setActivityLogs(data);
    } catch { setActivityLogs([]); }
    finally { setActivityLoading(false); }
  };

  const handleProfileTabChange = (_, tab) => {
    setProfileTab(tab);
    if (tab === 'activity' && profileUser) loadActivity(profileUser._id);
  };

  // ── CSV Import ────────────────────────────────────────────────────────────────
  const handleCsvFile = (file) => {
    if (!file) return;
    setCsvError(''); setCsvRows([]); setCsvResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(e.target.result);
        if (rows.length === 0) { setCsvError('No data rows found. Check your CSV format.'); return; }
        setCsvRows(rows);
      } catch { setCsvError('Failed to parse CSV.'); }
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    setCsvImporting(true); setCsvResult(null);
    try {
      const { data } = await api.post('/users/bulk', { users: csvRows });
      setCsvResult(data);
      fetchUsers();
    } catch (err) {
      setCsvError(err.response?.data?.message || 'Import failed.');
    } finally { setCsvImporting(false); }
  };

  const downloadTemplate = () => {
    const csv = 'name,email,role,department,phone\nJohn Doe,john@company.com,employee,Finance,9876543210\n';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'user_import_template.csv';
    a.click();
  };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };

  return (
    <Box sx={{ pb: 4 }}>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(17,24,39,0.12)' }}>
            <PeopleRounded sx={{ color: 'text.primary' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Portal Users</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Manage who can log in and what they can do</Typography>
          </Box>
        </Box>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>

          <Button variant="outlined" startIcon={<UploadFileRounded />}
            onClick={() => { setCsvOpen(true); setCsvRows([]); setCsvError(''); setCsvResult(null); }}
            sx={{ borderRadius: '12px', fontWeight: 700, borderColor: 'divider', color: 'text.secondary', fontSize: 13 }}>
            Import CSV
          </Button>
          <Button variant="contained" startIcon={<PersonAddRounded />}
            onClick={() => { setAddOpen(true); setFormError(''); setForm(defaultForm); setAddMode('invite'); }}
            sx={{ background: '#FBBF24', color: '#111827', fontWeight: 800, borderRadius: '12px', px: 2.5, '&:hover': { background: '#F5A623' } }}>
            Add User
          </Button>
        </Stack>
      </Box>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 2, borderRadius: '16px', border: 1, borderColor: 'divider', mb: 3 }}>
        <TextField fullWidth placeholder="Search by name, email or department..."
          value={search} onChange={e => setSearch(e.target.value)} sx={inputSx}
          slotProps={{ input: { startAdornment: <SearchRounded sx={{ color: 'text.disabled', mr: 1 }} /> } }} />
      </Paper>

      {/* ── Role tabs ───────────────────────────────────────────────────────── */}
      <Paper sx={{ borderRadius: '16px', border: 1, borderColor: 'divider', mb: 3, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); clearSelection(); }} sx={{
          px: 1,
          '& .MuiTabs-indicator': { bgcolor: 'text.primary', borderRadius: '2px', height: 3 },
          '& .MuiTab-root': { fontWeight: 700, fontSize: 13, textTransform: 'none', minHeight: 48, color: 'text.secondary' },
          '& .Mui-selected': { color: 'text.primary' },
        }}>
          {[
            { value: 'all', label: 'All Users' },
            { value: 'admin', label: 'Admins' },
            { value: 'hod', label: 'HODs' },
            { value: 'technician', label: 'Technicians' },
            { value: 'employee', label: 'Employees' }
          ].map(({ value, label }) => (
            <Tab key={value} value={value} label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {label}
                <Box sx={{ px: 1, py: 0.1, borderRadius: '20px', fontSize: 11, fontWeight: 800, bgcolor: activeTab === value ? '#FBBF24' : 'action.hover', color: activeTab === value ? '#111827' : 'text.disabled' }}>
                  {countFor(value)}
                </Box>
              </Box>
            } />
          ))}
        </Tabs>
      </Paper>

      {/* ── Bulk action toolbar ──────────────────────────────────────────────── */}
      {selected.size > 0 && (
        <Paper sx={{ mb: 2, px: 2.5, py: 1.5, borderRadius: '14px', border: 1, borderColor: 'rgba(17,24,39,0.4)', bgcolor: 'rgba(17,24,39,0.06)', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography fontWeight={800} fontSize={14} color="text.primary">{selected.size} selected</Typography>
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Change role for selected">
            <Button size="small" startIcon={<ManageAccountsRounded />} onClick={() => setBulkRoleOpen(true)} disabled={bulkWorking}
              sx={{ fontWeight: 700, borderRadius: '10px', color: 'text.primary', bgcolor: 'rgba(17,24,39,0.1)', '&:hover': { bgcolor: 'rgba(17,24,39,0.18)' } }}>
              Change Role
            </Button>
          </Tooltip>
          <Tooltip title="Deactivate selected">
            <Button size="small" startIcon={<BlockRounded />} onClick={bulkDeactivate} disabled={bulkWorking}
              sx={{ fontWeight: 700, borderRadius: '10px', color: '#D97706', bgcolor: 'rgba(217,119,6,0.1)', '&:hover': { bgcolor: 'rgba(217,119,6,0.18)' } }}>
              Deactivate
            </Button>
          </Tooltip>
          <Tooltip title="Delete selected">
            <Button size="small" startIcon={<DeleteRounded />} onClick={() => setDeleteConfirmOpen(true)} disabled={bulkWorking}
              sx={{ fontWeight: 700, borderRadius: '10px', color: '#DC2626', bgcolor: 'rgba(220,38,38,0.08)', '&:hover': { bgcolor: 'rgba(220,38,38,0.15)' } }}>
              Delete
            </Button>
          </Tooltip>
          <IconButton size="small" onClick={clearSelection} sx={{ borderRadius: '8px', color: 'text.disabled' }}><CloseRounded fontSize="small" /></IconButton>
        </Paper>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <Paper sx={{ borderRadius: '20px', border: 1, borderColor: 'divider', overflow: 'hidden' }}>
          {[...Array(5)].map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, p: 2, borderBottom: i < 4 ? 1 : 0, borderColor: 'divider', opacity: 1 - i * 0.15 }}>
              <Skeleton variant="circular" width={36} height={36} />
              <Skeleton variant="rounded" width={140} height={20} sx={{ alignSelf: 'center' }} />
              <Skeleton variant="text" width="25%" height={20} sx={{ alignSelf: 'center' }} />
              <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '20px', alignSelf: 'center' }} />
            </Box>
          ))}
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '20px', border: 1, borderColor: 'divider', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell padding="checkbox" sx={{ pl: 1.5, borderBottom: 2, borderColor: 'divider' }}>
                  <Checkbox size="small" checked={allSelected} indeterminate={someSelected} onChange={toggleAll}
                    sx={{ color: 'text.disabled', '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: 'text.primary' } }} />
                </TableCell>
                {[['USER',''], ['ROLE',''], ['MOBILE',''], ['LAST LOGIN',''], ['STATUS',''], ['ACTIONS','']].map(([label]) => (
                  <TableCell key={label} sx={{ fontWeight: 800, fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.6px', py: 1.5, borderBottom: 2, borderColor: 'divider' }}>{label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: 'text.disabled', fontWeight: 600 }}>No users found.</TableCell></TableRow>
              ) : filtered.map(user => {
                const isSelected = selected.has(user._id);
                const isMe = me?._id === user._id || me?.email === user.email;
                return (
                  <TableRow key={user._id} hover selected={isSelected}
                    sx={{ '&:last-child td': { borderBottom: 0 }, opacity: user.isActive ? 1 : 0.55, bgcolor: isSelected ? 'rgba(17,24,39,0.05) !important' : undefined }}>
                    <TableCell padding="checkbox" sx={{ pl: 1.5 }}>
                      <Checkbox size="small" checked={isSelected} onChange={() => toggleOne(user._id)}
                        sx={{ color: 'text.disabled', '&.Mui-checked': { color: 'text.primary' } }} />
                    </TableCell>
                    {/* USER cell — avatar + name + email + (you) */}
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={getFileUrl(user.avatar) || undefined}
                          sx={{ width: 36, height: 36, fontSize: 14, fontWeight: 800, bgcolor: avatarColor(user.name), flexShrink: 0 }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Typography fontSize={13} fontWeight={700} sx={{ color: 'text.primary', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => openProfile(user)}>
                              {user.name}
                            </Typography>
                            {isMe && (
                              <Box sx={{ px: 0.8, py: 0.1, borderRadius: '6px', fontSize: 10, fontWeight: 800, bgcolor: 'rgba(17,24,39,0.12)', color: 'text.primary' }}>you</Box>
                            )}
                          </Box>
                          <Typography fontSize={12} color="text.secondary">{user.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}><RoleChip role={user.role} /></TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: 13, color: 'text.secondary' }}>{user.phone || '—'}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Tooltip title={user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN') : 'Never logged in'}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: user.lastLogin ? 'text.secondary' : 'text.disabled', fontSize: 12 }}>
                          <AccessTimeRounded sx={{ fontSize: 13 }} />
                          <span>{fmtDate(user.lastLogin)}</span>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.2, py: 0.4, borderRadius: '20px', fontSize: 11, fontWeight: 800,
                        bgcolor: user.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(148,163,184,0.12)',
                        color: user.isActive ? '#16A34A' : '#94A3B8' }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }} />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Stack direction="row" gap={0.5}>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(user)} sx={{ borderRadius: '8px' }}><EditRounded fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Custom Permissions"><IconButton size="small" onClick={() => openUserPerm(user)} sx={{ borderRadius: '8px', color: 'text.primary' }}><SecurityRounded fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" onClick={() => toggleActive(user)} sx={{ borderRadius: '8px', color: user.isActive ? '#DC2626' : '#16A34A' }}>
                            {user.isActive ? <BlockRounded fontSize="small" /> : <CheckCircleRounded fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        {user.isActive && !isMe && (
                          <Tooltip title="Offboard — revoke all assets & close tickets">
                            <IconButton size="small" onClick={() => setOffboardTarget(user)} sx={{ borderRadius: '8px', color: '#DC2626' }}>
                              <ExitToAppRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Bulk change-role dialog ──────────────────────────────────────────── */}
      <Dialog open={bulkRoleOpen} onClose={() => setBulkRoleOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Box>
            <Typography fontWeight={800} fontSize={17}>Change Role</Typography>
            <Typography fontSize={12} color="text.secondary">Apply to {selected.size} selected user(s)</Typography>
          </Box>
          <IconButton onClick={() => setBulkRoleOpen(false)} sx={{ bgcolor: 'action.hover', borderRadius: '10px' }}><CloseRounded /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <FormControl fullWidth sx={inputSx}>
            <InputLabel>New Role</InputLabel>
            <Select value={bulkRole} label="New Role" onChange={e => setBulkRole(e.target.value)}>
              {ROLES.map(r => <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r.replace(/_/g, ' ')}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setBulkRoleOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary', borderRadius: '10px' }}>Cancel</Button>
          <Button variant="contained" onClick={bulkChangeRole} disabled={bulkWorking}
            sx={{ background: '#FBBF24', color: '#111827', fontWeight: 800, borderRadius: '10px', px: 3 }}>
            {bulkWorking ? 'Updating…' : 'Apply'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Per-User Permissions Dialog ──────────────────────────────────────── */}
      <Dialog open={userPermOpen} onClose={() => setUserPermOpen(false)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { borderRadius: '20px' } }}>
          <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <SecurityRounded sx={{ color: 'text.primary' }} />
              <Box>
                <Typography fontWeight={800} fontSize={17}>Permissions — {userPermTarget?.name}</Typography>
                <Typography fontSize={12} color="text.secondary">
                  Role: <b style={{ textTransform: 'capitalize' }}>{userPermTarget?.role?.replace(/_/g, ' ')}</b> · Toggle to customise for this user
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setUserPermOpen(false)} sx={{ bgcolor: 'action.hover', borderRadius: '10px' }}><CloseRounded /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: 12, pl: 3 }}>Feature</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: 12, pr: 3 }}>Access</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userPermState.map((row, i) => (
                  <TableRow key={row.feature} sx={{ bgcolor: i % 2 === 0 ? 'transparent' : 'action.hover', '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13, py: 1.2, pl: 3 }}>{row.feature}</TableCell>
                    <TableCell align="center" sx={{ pr: 3 }}>
                      <Box
                        onClick={() => toggleUserPerm(i)}
                        sx={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 36, height: 36, borderRadius: '10px', cursor: 'pointer',
                          border: '1.5px solid',
                          borderColor: row.allowed ? '#22C55E' : 'divider',
                          bgcolor: row.allowed ? 'rgba(34,197,94,0.08)' : 'transparent',
                          transition: 'all 0.15s ease',
                          '&:hover': { borderColor: row.allowed ? '#EF4444' : '#111827', bgcolor: row.allowed ? 'rgba(239,68,68,0.08)' : 'rgba(17,24,39,0.08)' },
                        }}
                      >
                        {row.allowed
                          ? <CheckRounded sx={{ fontSize: 17, color: '#22C55E' }} />
                          : <CloseRounded sx={{ fontSize: 17, color: 'text.disabled', opacity: 0.4 }} />}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
            <Button onClick={resetUserPerm} sx={{ fontWeight: 700, color: 'text.secondary', borderRadius: '10px' }}>
              Reset to Role Default
            </Button>
            <Box sx={{ flex: 1 }} />
            {userPermSaved && <Typography fontSize={13} color="success.main" fontWeight={700}>Saved!</Typography>}
            <Button variant="contained" onClick={saveUserPerm}
              sx={{ fontWeight: 800, borderRadius: '10px', px: 3, background: '#FBBF24', color: '#111827' }}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

      {/* ── Role Permissions Matrix ──────────────────────────────────────────── */}
      <Dialog open={permOpen} onClose={() => setPermOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityRounded sx={{ color: 'text.primary' }} />
            <Box>
              <Typography fontWeight={800} fontSize={18}>Role Permissions Matrix</Typography>
              <Typography fontSize={12} color="text.secondary">Click any cell to toggle access for that role</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setPermOpen(false)} sx={{ bgcolor: 'action.hover', borderRadius: '10px' }}><CloseRounded /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: 12, bgcolor: 'background.paper', minWidth: 200 }}>Feature</TableCell>
                  {['admin', 'hod', 'employee', 'technician'].map(role => {
                    const rc = ROLE_COLORS[role] || { color: '#64748b', bg: '#f1f5f9' };
                    return (
                      <TableCell key={role} align="center" sx={{ fontWeight: 800, fontSize: 11, bgcolor: 'background.paper', textTransform: 'capitalize' }}>
                        <Box sx={{ display: 'inline-flex', px: 1.2, py: 0.3, borderRadius: '20px', bgcolor: rc.bg, color: rc.color, fontSize: 11, fontWeight: 800 }}>
                          {role.replace(/_/g, ' ')}
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {DEFAULT_PERMISSION_MATRIX.map((row, i) => (
                  <TableRow key={row.feature} sx={{ bgcolor: i % 2 === 0 ? 'transparent' : 'action.hover', '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13, py: 1.2 }}>{row.feature}</TableCell>
                    {['admin', 'hod', 'employee', 'technician'].map(role => {
                      const allowed = row[role];
                      return (
                        <TableCell key={role} align="center" sx={{ py: 1.2 }}>
                          {allowed
                            ? <CheckRounded sx={{ fontSize: 18, color: '#22C55E' }} />
                            : <CloseRounded sx={{ fontSize: 18, color: 'text.disabled', opacity: 0.4 }} />}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>

      {/* ── CSV Import Dialog ────────────────────────────────────────────────── */}
      <Dialog open={csvOpen} onClose={() => !csvImporting && setCsvOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <UploadFileRounded sx={{ color: 'text.primary' }} />
            <Box>
              <Typography fontWeight={800} fontSize={18}>Import Users from CSV</Typography>
              <Typography fontSize={12} color="text.secondary">Bulk-create employees and send invite links automatically</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setCsvOpen(false)} disabled={csvImporting} sx={{ bgcolor: 'action.hover', borderRadius: '10px' }}><CloseRounded /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {csvImporting && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}
          {!csvResult && (
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Button variant="outlined" startIcon={<DownloadRounded />} onClick={downloadTemplate}
                sx={{ borderRadius: '10px', fontWeight: 700, borderColor: 'divider', color: 'text.secondary' }}>
                Download Template
              </Button>
              <Button component="label" variant="contained" startIcon={<UploadFileRounded />}
                sx={{ borderRadius: '10px', fontWeight: 700, background: '#FBBF24', color: '#111827' }}>
                Choose CSV File
                <input ref={csvInputRef} type="file" hidden accept=".csv"
                  onChange={e => { e.target.files[0] && handleCsvFile(e.target.files[0]); if (csvInputRef.current) csvInputRef.current.value = ''; }} />
              </Button>
            </Box>
          )}
          {csvRows.length === 0 && !csvResult && (
            <Paper sx={{ p: 2, borderRadius: '12px', bgcolor: 'action.hover', border: 1, borderColor: 'divider', mb: 2 }}>
              <Typography fontSize={12} fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>Expected columns:</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['name *', 'email *', 'role', 'department *', 'phone'].map(c => (
                  <Box key={c} sx={{ px: 1.5, py: 0.4, borderRadius: '8px', bgcolor: 'background.paper', border: 1, borderColor: 'divider', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{c}</Box>
                ))}
              </Box>
              <Typography fontSize={11} color="text.disabled" sx={{ mt: 1 }}>role defaults to "employee" if blank. Each user gets an invite email.</Typography>
            </Paper>
          )}
          {csvError && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{csvError}</Alert>}
          {csvRows.length > 0 && !csvResult && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography fontWeight={700} fontSize={14}>{csvRows.length} users ready to import</Typography>
                <Button size="small" onClick={() => { setCsvRows([]); setCsvError(''); }} sx={{ color: 'text.disabled', fontWeight: 700 }}>Clear</Button>
              </Box>
              <TableContainer component={Paper} sx={{ borderRadius: '12px', border: 1, borderColor: 'divider', maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['#', 'Name', 'Email', 'Role', 'Department', 'Phone'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px', bgcolor: 'background.default' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {csvRows.map((row, i) => (
                      <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell sx={{ fontSize: 12, color: 'text.disabled' }}>{i + 1}</TableCell>
                        <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{row.name || <span style={{ color: '#EF4444' }}>missing</span>}</TableCell>
                        <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{row.email || <span style={{ color: '#EF4444' }}>missing</span>}</TableCell>
                        <TableCell><RoleChip role={row.role || 'employee'} /></TableCell>
                        <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{row.department || <span style={{ color: '#EF4444' }}>missing</span>}</TableCell>
                        <TableCell sx={{ fontSize: 12, color: 'text.disabled' }}>{row.phone || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
          {csvResult && (
            <Stack spacing={2}>
              <Alert severity={csvResult.failed.length === 0 ? 'success' : 'warning'} sx={{ borderRadius: '12px' }}>{csvResult.message}</Alert>
              {csvResult.created.length > 0 && (
                <Box>
                  <Typography fontWeight={700} fontSize={13} sx={{ mb: 1, color: '#16A34A' }}>✓ Created ({csvResult.created.length})</Typography>
                  {csvResult.created.map((u, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                      <CheckRounded sx={{ fontSize: 14, color: '#22C55E' }} />
                      <Typography fontSize={13}>{u.name} — {u.email}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
              {csvResult.failed.length > 0 && (
                <Box>
                  <Typography fontWeight={700} fontSize={13} sx={{ mb: 1, color: '#DC2626' }}>✗ Failed ({csvResult.failed.length})</Typography>
                  {csvResult.failed.map((u, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                      <ErrorRounded sx={{ fontSize: 14, color: '#EF4444' }} />
                      <Typography fontSize={13}>{u.email} — {u.reason}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setCsvOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700, borderRadius: '10px' }}>{csvResult ? 'Close' : 'Cancel'}</Button>
          {csvRows.length > 0 && !csvResult && (
            <Button variant="contained" onClick={handleCsvImport} disabled={csvImporting}
              sx={{ background: '#FBBF24', color: '#111827', fontWeight: 800, borderRadius: '10px', px: 3 }}>
              {csvImporting ? 'Importing…' : `Import ${csvRows.length} Users`}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── User Profile Drawer ──────────────────────────────────────────────── */}
      <Drawer anchor="right" open={profileOpen} onClose={() => setProfileOpen(false)}
        PaperProps={{ sx: { width: { xs: '100vw', sm: 500 }, bgcolor: 'background.default' } }}>
        {profileUser && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, background: 'linear-gradient(135deg,rgba(17,24,39,0.12),rgba(17,24,39,0.06))', borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flexShrink: 0 }}>
                    <Avatar src={getFileUrl(profileUser.avatar) || undefined}
                      sx={{ width: 52, height: 52, fontSize: 22, fontWeight: 800, bgcolor: avatarColor(profileUser.name) }}>
                      {profileUser.name?.charAt(0).toUpperCase()}
                    </Avatar>
                  </Box>
                  <Box>
                    <Typography fontWeight={800} fontSize={18}>{profileUser.name}</Typography>
                    <Typography fontSize={13} color="text.secondary">{profileUser.email}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.8 }}>
                      <RoleChip role={profileUser.role} />
                      <Box sx={{ display: 'inline-flex', px: 1.2, py: 0.3, borderRadius: '20px', fontSize: 11, fontWeight: 800, bgcolor: profileUser.isActive ? '#F0FDF4' : '#F1F5F9', color: profileUser.isActive ? '#16A34A' : '#94A3B8' }}>
                        {profileUser.isActive ? 'Active' : 'Inactive'}
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <IconButton onClick={() => setProfileOpen(false)} sx={{ bgcolor: 'action.hover', borderRadius: '10px' }}><CloseRounded /></IconButton>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: 'text.secondary', fontSize: 12, fontWeight: 600 }}>
                  <PersonRounded sx={{ fontSize: 14 }} />{profileUser.department}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: 'text.secondary', fontSize: 12, fontWeight: 600 }}>
                  <CalendarMonthRounded sx={{ fontSize: 14 }} />Joined {new Date(profileUser.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: 'text.secondary', fontSize: 12, fontWeight: 600 }}>
                  <AccessTimeRounded sx={{ fontSize: 14 }} />Last login: {fmtDate(profileUser.lastLogin)}
                </Box>
                {profileUser.employeeId && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: 'text.secondary', fontSize: 12, fontWeight: 600 }}>
                    <BadgeRounded sx={{ fontSize: 14 }} />ID: {profileUser.employeeId}
                  </Box>
                )}
              </Box>
            </Box>

            <Tabs value={profileTab} onChange={handleProfileTabChange} sx={{
              borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper',
              '& .MuiTabs-indicator': { bgcolor: 'text.primary' },
              '& .MuiTab-root': { fontWeight: 700, fontSize: 12, textTransform: 'none', minHeight: 44 },
              '& .Mui-selected': { color: 'text.primary' },
            }}>
              <Tab value="overview" label="Overview" icon={<LaptopRounded sx={{ fontSize: 15 }} />} iconPosition="start" />
              <Tab value="activity" label="Activity Log" icon={<HistoryRounded sx={{ fontSize: 15 }} />} iconPosition="start"
                onClick={() => loadActivity(profileUser._id)} />
            </Tabs>

            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              {profileTab === 'overview' && (
                profileLoading ? (
                  <Stack spacing={2}>{[...Array(3)].map((_, i) => <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: '12px' }} />)}</Stack>
                ) : profileData?.error ? (
                  <Alert severity="error">Failed to load profile data.</Alert>
                ) : profileData && (
                  <Stack spacing={3}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <LaptopRounded sx={{ fontSize: 18, color: 'text.primary' }} />
                        <Typography fontWeight={800} fontSize={14}>Assigned Assets</Typography>
                        <Box sx={{ ml: 'auto', px: 1, py: 0.2, borderRadius: '20px', bgcolor: 'rgba(17,24,39,0.12)', color: 'text.primary', fontSize: 11, fontWeight: 800 }}>{profileData.assignments.length}</Box>
                      </Box>
                      {profileData.assignments.length === 0
                        ? <Typography fontSize={13} color="text.disabled" sx={{ pl: 1 }}>No assets assigned.</Typography>
                        : <Stack spacing={1}>{profileData.assignments.map(a => (
                          <Paper key={a._id} sx={{ p: 1.5, borderRadius: '12px', border: 1, borderColor: 'divider' }}>
                            <Typography fontSize={13} fontWeight={700}>{a.asset?.name || '—'}</Typography>
                            <Typography fontSize={11} color="text.disabled">{a.asset?.serialNumber} · {a.asset?.category}</Typography>
                          </Paper>
                        ))}</Stack>}
                    </Box>
                    <Divider />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <ConfirmationNumberRounded sx={{ fontSize: 18, color: '#3B82F6' }} />
                        <Typography fontWeight={800} fontSize={14}>Recent Tickets</Typography>
                        <Box sx={{ ml: 'auto', px: 1, py: 0.2, borderRadius: '20px', bgcolor: 'rgba(59,130,246,0.12)', color: '#3B82F6', fontSize: 11, fontWeight: 800 }}>{profileData.tickets.length}</Box>
                      </Box>
                      {profileData.tickets.length === 0
                        ? <Typography fontSize={13} color="text.disabled" sx={{ pl: 1 }}>No tickets raised.</Typography>
                        : <Stack spacing={1}>{profileData.tickets.map(t => (
                          <Paper key={t._id} sx={{ p: 1.5, borderRadius: '12px', border: 1, borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography fontSize={13} fontWeight={700} sx={{ flex: 1, mr: 1 }}>{t.title}</Typography>
                              <Box sx={{ px: 1, py: 0.2, borderRadius: '20px', fontSize: 10, fontWeight: 800, bgcolor: `${STATUS_COLORS[t.status] || '#94A3B8'}22`, color: STATUS_COLORS[t.status] || '#94A3B8', whiteSpace: 'nowrap' }}>{t.status}</Box>
                            </Box>
                            <Typography fontSize={11} color="text.disabled" mt={0.3}>{new Date(t.createdAt).toLocaleDateString('en-IN')} · {t.priority}</Typography>
                          </Paper>
                        ))}</Stack>}
                    </Box>
                    <Divider />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <DevicesRounded sx={{ fontSize: 18, color: '#22C55E' }} />
                        <Typography fontWeight={800} fontSize={14}>Device Requests</Typography>
                        <Box sx={{ ml: 'auto', px: 1, py: 0.2, borderRadius: '20px', bgcolor: 'rgba(34,197,94,0.12)', color: '#22C55E', fontSize: 11, fontWeight: 800 }}>{profileData.deviceRequests.length}</Box>
                      </Box>
                      {profileData.deviceRequests.length === 0
                        ? <Typography fontSize={13} color="text.disabled" sx={{ pl: 1 }}>No device requests.</Typography>
                        : <Stack spacing={1}>{profileData.deviceRequests.map(d => (
                          <Paper key={d._id} sx={{ p: 1.5, borderRadius: '12px', border: 1, borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography fontSize={13} fontWeight={700}>{d.deviceType}</Typography>
                              <Box sx={{ px: 1, py: 0.2, borderRadius: '20px', fontSize: 10, fontWeight: 800, bgcolor: `${STATUS_COLORS[d.status] || '#94A3B8'}22`, color: STATUS_COLORS[d.status] || '#94A3B8' }}>{d.status}</Box>
                            </Box>
                            <Typography fontSize={11} color="text.disabled" mt={0.3}>{new Date(d.createdAt).toLocaleDateString('en-IN')}</Typography>
                          </Paper>
                        ))}</Stack>}
                    </Box>
                  </Stack>
                )
              )}

              {profileTab === 'activity' && (
                activityLoading ? (
                  <Stack spacing={1.5}>{[...Array(6)].map((_, i) => <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: '10px' }} />)}</Stack>
                ) : activityLogs.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <HistoryRounded sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.disabled" fontWeight={600}>No activity recorded yet.</Typography>
                  </Box>
                ) : (
                  <Stack spacing={0}>
                    {activityLogs.map((log, i) => {
                      const color = ACTION_COLORS[log.action] || '#94A3B8';
                      return (
                        <Box key={log._id} sx={{ display: 'flex', gap: 2, py: 1.5, borderBottom: i < activityLogs.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
                            <FiberManualRecordRounded sx={{ fontSize: 10, color, flexShrink: 0 }} />
                            {i < activityLogs.length - 1 && <Box sx={{ width: 1, flex: 1, bgcolor: 'divider', mt: 0.5 }} />}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Box sx={{ px: 1, py: 0.2, borderRadius: '6px', fontSize: 10, fontWeight: 800, bgcolor: `${color}22`, color }}>{formatAction(log.action)}</Box>
                              <Typography fontSize={12} color="text.secondary" sx={{ textTransform: 'capitalize' }}>{log.entity?.replace(/_/g, ' ')}</Typography>
                              {log.entityLabel && <Typography fontSize={12} fontWeight={600} color="text.primary" noWrap>— {log.entityLabel}</Typography>}
                            </Box>
                            <Typography fontSize={11} color="text.disabled" mt={0.3}>
                              {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                )
              )}
            </Box>

            {/* ── Footer ── */}
            <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
              {/* Onboarding checklist */}
              <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                  <ChecklistRounded sx={{ fontSize: 15, color: 'text.primary' }} />
                  <Typography fontSize={12} fontWeight={800} color="text.primary">Onboarding Checklist</Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                  {[
                    { label: 'Account created',      done: true },
                    { label: 'Welcome email sent',   done: true },
                    { label: 'Asset assigned',        done: profileData?.assignments?.length > 0 },
                    { label: 'First login completed', done: !!profileUser.lastLogin },
                  ].map(({ label, done }) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                      {done
                        ? <CheckRounded sx={{ fontSize: 13, color: '#22C55E', flexShrink: 0 }} />
                        : <CloseRounded sx={{ fontSize: 13, color: 'text.disabled', opacity: 0.4, flexShrink: 0 }} />}
                      <Typography fontSize={11} fontWeight={600} color={done ? 'text.primary' : 'text.disabled'}>{label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Edit / Deactivate */}
              <Box sx={{ px: 2.5, py: 1.5, display: 'flex', gap: 1.5, borderBottom: profileUser.isActive ? 1 : 0, borderColor: 'divider' }}>
                <Button fullWidth variant="outlined" onClick={() => { setProfileOpen(false); openEdit(profileUser); }}
                  startIcon={<EditRounded />} sx={{ borderRadius: '10px', fontWeight: 700, borderColor: 'divider', color: 'text.secondary' }}>
                  Edit
                </Button>
                <Button fullWidth variant="outlined" onClick={() => toggleActive(profileUser)}
                  startIcon={profileUser.isActive ? <BlockRounded /> : <CheckCircleRounded />}
                  sx={{ borderRadius: '10px', fontWeight: 700, borderColor: profileUser.isActive ? '#FCA5A5' : '#86EFAC', color: profileUser.isActive ? '#DC2626' : '#16A34A' }}>
                  {profileUser.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </Box>

              {/* Offboard — only for active users, red standalone row */}
              {profileUser.isActive && (
                <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'rgba(220,38,38,0.04)' }}>
                  <Button fullWidth variant="contained" onClick={() => setOffboardTarget(profileUser)}
                    startIcon={<ExitToAppRounded />}
                    sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, color: '#fff', fontWeight: 800, borderRadius: '10px', fontSize: 13, boxShadow: 'none' }}>
                    Offboard User — Revoke Assets &amp; Close Tickets
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Drawer>

      {/* ── Add User Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: '24px', border: 1, borderColor: 'divider' } } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0 }}>
          <Box>
            <Typography fontWeight={900} fontSize={20}>Add New User</Typography>
            <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.3 }}>An invitation email will be sent to the user to set their password.</Typography>
          </Box>
          <IconButton onClick={() => setAddOpen(false)} sx={{ bgcolor: 'action.hover', borderRadius: '10px' }}><CloseRounded /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Invite / Password toggle — kept for power users */}
          <Box sx={{ mb: 2, p: 2, borderRadius: '14px', bgcolor: 'rgba(17,24,39,0.06)', border: 1, borderColor: 'rgba(17,24,39,0.2)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MailOutlineRounded sx={{ color: 'text.primary', fontSize: 20 }} />
            <Box sx={{ flex: 1 }}>
              <Typography fontSize={13} fontWeight={700} color="text.primary">Invite via email</Typography>
              <Typography fontSize={12} color="text.secondary">User receives an email to create their own password and log in.</Typography>
            </Box>
            <Button size="small" onClick={() => setAddMode(addMode === 'invite' ? 'password' : 'invite')}
              sx={{ fontWeight: 700, fontSize: 11, borderRadius: '8px', color: 'text.disabled', textTransform: 'none', minWidth: 0 }}>
              {addMode === 'invite' ? 'Set password instead' : 'Send invite instead'}
            </Button>
          </Box>
          <Box component="form" onSubmit={handleAdd}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{formError}</Alert>}
            <Stack spacing={2}>
              <TextField required fullWidth autoFocus label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} sx={inputSx} />
              <TextField required fullWidth label="Email Address" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} sx={inputSx} />
              {addMode === 'password' && (
                <TextField required fullWidth label="Temporary Password" type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} sx={inputSx}
                  helperText="Employee will receive this via welcome email"
                  slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPass(s => !s)}>{showPass ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }} />
              )}
              <FormControl required fullWidth sx={inputSx}>
                <InputLabel>Department</InputLabel>
                <Select value={form.department} label="Department" onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                  {departments.map(d => <MenuItem key={d._id} value={d.name}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={inputSx}>
                <InputLabel>Role</InputLabel>
                <Select value={form.role} label="Role" onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r.replace(/_/g, ' ')}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField fullWidth label="Phone (optional)" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))}
                sx={inputSx}
                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 10 } }} />
            </Stack>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button onClick={() => setAddOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700, borderRadius: '10px' }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}
                startIcon={addMode === 'invite' ? <EmailRounded /> : <PersonAddRounded />}
                sx={{ background: '#FBBF24', color: '#111827', fontWeight: 800, borderRadius: '10px', px: 3, '&:hover': { background: '#F5A623' } }}>
                {saving ? 'Please wait…' : addMode === 'invite' ? 'Send Invite' : 'Create User'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ── Edit User Dialog ─────────────────────────────────────────────────── */}
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
              <FormControl fullWidth sx={inputSx}>
                <InputLabel>Department</InputLabel>
                <Select value={editForm.department || ''} label="Department" onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}>
                  {departments.map(d => <MenuItem key={d._id} value={d.name}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField fullWidth label="Phone" value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))}
                  sx={inputSx}
                  slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 10 } }} />
                <TextField fullWidth label="Employee ID" value={editForm.employeeId}
                  onChange={e => setEditForm(f => ({ ...f, employeeId: e.target.value }))} sx={inputSx}
                  slotProps={{ input: { startAdornment: <BadgeRounded sx={{ fontSize: 16, mr: 0.8, color: 'text.disabled' }} /> } }} />
              </Box>
            </Stack>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button onClick={() => setEditOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700, borderRadius: '10px' }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={editSaving}
                sx={{ background: '#FBBF24', color: '#111827', fontWeight: 800, borderRadius: '10px', px: 3 }}>
                {editSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Offboarding confirm dialog */}
      <Dialog open={!!offboardTarget} onClose={() => setOffboardTarget(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle component="div" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ExitToAppRounded sx={{ color: '#DC2626' }} />
            <Typography fontWeight={800} fontSize={17}>Offboard User?</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography color="text.secondary" sx={{ mb: 1.5 }}>
            This will immediately:
          </Typography>
          {['Revoke all active asset assignments', 'Close all open tickets', 'Deactivate the account'].map(item => (
            <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
              <CheckRounded sx={{ fontSize: 14, color: '#EF4444' }} />
              <Typography fontSize={13} fontWeight={600}>{item}</Typography>
            </Box>
          ))}
          <Alert severity="warning" sx={{ mt: 2, borderRadius: '10px', fontSize: 12 }}>
            This action cannot be undone automatically. Assets must be manually reassigned.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setOffboardTarget(null)} sx={{ fontWeight: 700, color: 'text.secondary', borderRadius: '10px' }}>Cancel</Button>
          <Button variant="contained" onClick={handleOffboard} disabled={offboarding}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, fontWeight: 800, borderRadius: '10px', px: 3 }}>
            {offboarding ? 'Processing…' : `Offboard ${offboardTarget?.name?.split(' ')[0]}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permanent Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle component="div" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteRounded sx={{ color: '#DC2626' }} />
            <Typography fontWeight={800} fontSize={17}>Delete User(s)?</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography color="text.secondary">
            Are you sure you want to permanently delete the selected <strong>{selected.size}</strong> user(s)?
          </Typography>
          <Alert severity="error" sx={{ mt: 2.5, borderRadius: '10px', fontSize: 12 }}>
            This will permanently remove their records from the database. This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary', borderRadius: '10px' }}>Cancel</Button>
          <Button variant="contained" onClick={executeBulkDelete} disabled={bulkWorking}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, fontWeight: 800, borderRadius: '10px', px: 3 }}>
            {bulkWorking ? 'Deleting…' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: '12px', fontWeight: 700 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
