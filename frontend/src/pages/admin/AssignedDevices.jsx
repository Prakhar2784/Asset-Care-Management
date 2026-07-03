import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Alert, TextField,
  InputAdornment, Button, Avatar, Select, MenuItem, FormControl,
  InputLabel, Snackbar, Grid
} from '@mui/material';
import {
  AssignmentIndRounded, SearchRounded, PersonRemoveRounded,
  LaptopMacRounded, PhoneIphoneRounded, DevicesRounded,
  GroupRounded, ApartmentRounded, CategoryRounded
} from '@mui/icons-material';
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
  New:     { bg: 'rgba(22,163,74,0.14)',  color: '#4ADE80' },
  Good:    { bg: 'rgba(37,99,235,0.14)',  color: '#60A5FA' },
  Average: { bg: 'rgba(217,119,6,0.14)', color: '#FBBF24' },
  Damaged: { bg: 'rgba(220,38,38,0.14)', color: '#F87171' },
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

  const categories = useMemo(() => {
    const seen = new Set();
    return assignments
      .map(a => a.asset?.category)
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
  const uniqueCategories = new Set(assignments.map(a => a.asset?.category).filter(Boolean)).size;

  const kpis = [
    { label: 'Total Assigned', value: assignments.length, color: 'text.primary', icon: <DevicesRounded fontSize="small" /> },
    { label: 'Employees',      value: uniqueEmployees,    color: '#FBBF24', icon: <GroupRounded fontSize="small" /> },
    { label: 'Departments',    value: uniqueDepts,        color: '#FBBF24', icon: <ApartmentRounded fontSize="small" /> },
    { label: 'Categories',     value: uniqueCategories,   color: '#FBBF24', icon: <CategoryRounded fontSize="small" /> },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(17,24,39,0.12)' }}>
            <AssignmentIndRounded sx={{ color: 'text.primary' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Assigned Devices</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {assignments.length} device{assignments.length !== 1 ? 's' : ''} assigned across {uniqueDepts} department{uniqueDepts !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {kpis.map(k => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={k.label}>
            <Paper sx={{ p: 2.5, borderRadius: '16px', border: 1, borderColor: 'divider', position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: k.color }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${k.color}18`, display: 'grid', placeItems: 'center' }}>
                  <Box sx={{ color: k.color }}>{k.icon}</Box>
                </Box>
              </Box>
              <Typography sx={{ fontSize: 28, fontWeight: 950, color: 'text.primary', lineHeight: 1, letterSpacing: '-1px', mt: 1.5, mb: 0.3 }}>{k.value}</Typography>
              <Typography fontSize={13} fontWeight={700} color="text.primary">{k.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filter Bar */}
      <Paper sx={{ p: 2, borderRadius: '16px', border: 1, borderColor: 'divider', mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by employee, asset name or serial number…"
          size="small"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 260, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded sx={{ color: 'text.disabled', fontSize: 18 }} /></InputAdornment> } }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Department</InputLabel>
          <Select value={deptFilter} label="Department" onChange={e => setDeptFilter(e.target.value)}
            sx={{ borderRadius: '10px' }}>
            <MenuItem value="">All Departments</MenuItem>
            {departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </Select>
        </FormControl>
        {(search || deptFilter) && (
          <Button size="small" variant="outlined" onClick={() => { setSearch(''); setDeptFilter(''); }}
            sx={{ fontWeight: 700, borderRadius: '10px', textTransform: 'none' }}>
            Clear
          </Button>
        )}
        {!loading && (
          <Typography fontSize={12} color="text.disabled" fontWeight={600} sx={{ ml: 'auto' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </Typography>
        )}
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '20px', border: '1px dashed', borderColor: 'divider' }}>
          <Box sx={{ width: 72, height: 72, borderRadius: '20px', bgcolor: 'rgba(17,24,39,0.08)', display: 'grid', placeItems: 'center', mx: 'auto', mb: 2 }}>
            <AssignmentIndRounded sx={{ fontSize: 36, color: 'text.primary' }} />
          </Box>
          <Typography variant="h6" fontWeight={800} color="text.primary">
            {assignments.length === 0 ? 'No devices assigned yet' : 'No results match your search'}
          </Typography>
          <Typography fontSize={14} color="text.secondary" mt={1}>
            {assignments.length === 0
              ? 'Go to Asset Registry to assign devices to employees.'
              : 'Try adjusting your search or clearing the department filter.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '20px', border: 1, borderColor: 'divider', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                {['Device', 'Assigned To', 'Department', 'Assigned Date', 'Action'].map((h, i) => (
                  <TableCell key={h} align={i === 4 ? 'right' : 'left'}
                    sx={{ fontWeight: 800, fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.6px', py: 1.5, borderBottom: 2, borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(a => {
                const condStyle = COND[a.conditionAtAssign] || { bg: 'action.selected', color: 'text.secondary' };
                return (
                  <TableRow key={a._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: 'rgba(17,24,39,0.08)', color: 'text.primary', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          {categoryIcon(a.asset?.category)}
                        </Box>
                        <Box>
                          <Typography fontWeight={700} fontSize={14} color="text.primary">{a.asset?.name || '—'}</Typography>
                          <Typography fontWeight={600} fontSize={11} color="primary.main" fontFamily="monospace">{a.asset?.serialNumber || '—'}</Typography>
                          {a.asset?.category && <Typography fontSize={11} color="text.secondary">{a.asset.category}</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 800, background: '#FBBF24', color: '#111827' }}>
                          {a.employeeName?.[0]?.toUpperCase() || '?'}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={700} fontSize={13} color="text.primary">{a.employeeName || '—'}</Typography>
                          <Typography fontSize={11} color="text.secondary">{a.employeeEmail || '—'}</Typography>
                          {a.employeePhone && <Typography fontSize={11} color="text.disabled">{a.employeePhone}</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography fontWeight={700} fontSize={13} color="text.primary">{a.department?.name || '—'}</Typography>
                      {a.department?.code && (
                        <Typography fontSize={11} color="text.secondary" fontFamily="monospace">{a.department.code}</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography fontSize={13} fontWeight={600} color="text.primary">{fmt(a.assignedDate)}</Typography>
                    </TableCell>

                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <Button
                        size="small" variant="outlined"
                        startIcon={revoking === a._id ? <CircularProgress size={12} color="inherit" /> : <PersonRemoveRounded />}
                        disabled={revoking === a._id}
                        onClick={() => handleRevoke(a._id, a.asset?.name, a.employeeName)}
                        sx={{
                          fontWeight: 700, fontSize: 12, borderRadius: '10px', textTransform: 'none',
                          borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444',
                          '&:hover': { bgcolor: 'rgba(239,68,68,0.08)', borderColor: '#ef4444' }
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
        autoHideDuration={4000}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
}
