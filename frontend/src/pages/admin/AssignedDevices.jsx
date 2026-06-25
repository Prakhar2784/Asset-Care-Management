import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Alert, TextField,
  InputAdornment, Button, Avatar, Select, MenuItem, FormControl,
  InputLabel, Snackbar
} from '@mui/material';
import {
  AssignmentIndRounded, SearchRounded, PersonRemoveRounded,
  LaptopMacRounded, PhoneIphoneRounded, DevicesRounded,
  GroupRounded, ApartmentRounded
} from '@mui/icons-material';
import PageHeader from '../../components/PageHeader';
import api from '../../api/axios';

const categoryIcon = (cat) => {
  if (!cat) return <LaptopMacRounded fontSize="small" />;
  const l = cat.toLowerCase();
  if (l.includes('mobile') || l.includes('phone')) return <PhoneIphoneRounded fontSize="small" />;
  return <LaptopMacRounded fontSize="small" />;
};

const fmt = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const COND = {
  New:     { bg: '#dcfce7', color: '#16a34a' },
  Good:    { bg: '#dbeafe', color: '#2563eb' },
  Average: { bg: '#fef3c7', color: '#d97706' },
  Damaged: { bg: '#fee2e2', color: '#dc2626' },
};

export default function AssignedDevices() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [revoking, setRevoking] = useState(null);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/asset-assignments');
      setAssignments(data.filter(a => a.status === 'Assigned'));
    } catch {
      setError('Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const departments = useMemo(() => {
    const seen = new Set();
    return assignments
      .map(a => a.department?.name)
      .filter(n => n && !seen.has(n) && seen.add(n));
  }, [assignments]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assignments.filter(a =>
      (!q ||
        a.employeeName?.toLowerCase().includes(q) ||
        a.employeeEmail?.toLowerCase().includes(q) ||
        a.asset?.name?.toLowerCase().includes(q) ||
        a.asset?.serialNumber?.toLowerCase().includes(q)) &&
      (!deptFilter || a.department?.name === deptFilter)
    );
  }, [assignments, search, deptFilter]);

  const handleRevoke = async (id, assetName, empName) => {
    setRevoking(id);
    try {
      await api.put(`/asset-assignments/return/${id}`);
      setToast(`${assetName} unassigned from ${empName}.`);
      load();
    } catch {
      setToast('Failed to revoke assignment.');
    } finally {
      setRevoking(null);
    }
  };

  const uniqueEmployees = new Set(assignments.map(a => a.employeeEmail)).size;
  const uniqueDepts = new Set(assignments.map(a => a.department?.name).filter(Boolean)).size;

  return (
    <Box>
      <PageHeader
        label="Asset Management"
        title="Assigned Devices"
        subtitle={`${assignments.length} device${assignments.length !== 1 ? 's' : ''} currently assigned across ${uniqueDepts} department${uniqueDepts !== 1 ? 's' : ''}`}
      />

      {/* Summary stats */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        {[
          { label: 'Devices Assigned', value: assignments.length, icon: <DevicesRounded />,      color: '#111111', bg: '#F5F5F4' },
          { label: 'Employees',        value: uniqueEmployees,    icon: <GroupRounded />,         color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Departments',      value: uniqueDepts,        icon: <ApartmentRounded />,     color: '#16a34a', bg: '#dcfce7' },
        ].map(s => (
          <Paper key={s.label} sx={{ flex: '1 1 160px', p: 3, borderRadius: 3, border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: s.bg, color: s.color, display: 'grid', placeItems: 'center' }}>
              {s.icon}
            </Box>
            <Box>
              <Typography fontWeight={900} fontSize={28} color="text.primary" sx={{ lineHeight: 1 }}>{s.value}</Typography>
              <Typography fontSize={13} color="text.secondary" fontWeight={600}>{s.label}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: 1, borderColor: 'divider', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by employee, asset name or serial number…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded sx={{ color: 'text.disabled', fontSize: 18 }} /></InputAdornment> } }}
          sx={{ flex: 1, minWidth: 260 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Department</InputLabel>
          <Select value={deptFilter} label="Department" onChange={e => setDeptFilter(e.target.value)}>
            <MenuItem value="">All Departments</MenuItem>
            {departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </Select>
        </FormControl>
        {(search || deptFilter) && (
          <Button size="small" variant="outlined" onClick={() => { setSearch(''); setDeptFilter(''); }}
            sx={{ fontWeight: 700, borderRadius: 2 }}>
            Clear
          </Button>
        )}
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
          <AssignmentIndRounded sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} color="text.secondary">
            {assignments.length === 0 ? 'No devices assigned yet' : 'No results match your search'}
          </Typography>
          <Typography fontSize={14} color="text.disabled" mt={1}>
            {assignments.length === 0
              ? 'Go to Asset Registry to assign devices to employees.'
              : 'Try adjusting your search or clearing the department filter.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: 13 }}>Device</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: 13 }}>Assigned To</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: 13 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: 13 }}>Assigned Date</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: 13 }}>Condition</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: 13 }} align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(a => {
                const condStyle = COND[a.conditionAtAssign] || { bg: 'action.selected', color: 'text.secondary' };
                return (
                  <TableRow key={a._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'action.selected', color: 'primary.main', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          {categoryIcon(a.asset?.category)}
                        </Box>
                        <Box>
                          <Typography fontWeight={700} fontSize={14} color="text.primary">{a.asset?.name || '—'}</Typography>
                          <Typography fontWeight={600} fontSize={12} color="primary.main" fontFamily="monospace">{a.asset?.serialNumber || '—'}</Typography>
                          {a.asset?.category && <Typography fontSize={11} color="text.secondary">{a.asset.category}</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, fontSize: 14, fontWeight: 800, bgcolor: 'action.selected', color: 'primary.main' }}>
                          {a.employeeName?.[0]?.toUpperCase() || '?'}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={700} fontSize={14} color="text.primary">{a.employeeName || '—'}</Typography>
                          <Typography fontSize={12} color="text.secondary">{a.employeeEmail || '—'}</Typography>
                          {a.employeePhone && <Typography fontSize={11} color="text.disabled">{a.employeePhone}</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600} fontSize={13} color="text.primary">{a.department?.name || '—'}</Typography>
                      {a.department?.code && <Typography fontSize={11} color="text.secondary">{a.department.code}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={13} color="text.primary">{fmt(a.assignedDate)}</Typography>
                    </TableCell>
                    <TableCell>
                      {a.conditionAtAssign
                        ? <Chip label={a.conditionAtAssign} size="small" sx={{ fontSize: 11, fontWeight: 700, height: 22, bgcolor: condStyle.bg, color: condStyle.color, border: 0 }} />
                        : <Typography fontSize={13} color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small" variant="outlined"
                        startIcon={revoking === a._id ? <CircularProgress size={12} color="inherit" /> : <PersonRemoveRounded />}
                        disabled={revoking === a._id}
                        onClick={() => handleRevoke(a._id, a.asset?.name, a.employeeName)}
                        sx={{
                          fontWeight: 700, fontSize: 12, borderRadius: 2, textTransform: 'none',
                          borderColor: '#fca5a5', color: '#ef4444',
                          '&:hover': { bgcolor: '#fee2e2', borderColor: '#ef4444' }
                        }}
                      >
                        {revoking === a._id ? 'Revoking…' : 'Revoke'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
}
