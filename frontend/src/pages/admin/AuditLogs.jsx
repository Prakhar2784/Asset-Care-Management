import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Alert, Select,
  MenuItem, FormControl, InputLabel, Button, TextField, Pagination
} from '@mui/material';
import { HistoryRounded, FilterListRounded } from '@mui/icons-material';
import api from '../../api/axios';

const ACTION_COLORS = {
  ticket_created: '#4f46e5',
  ticket_status_changed: '#0ea5e9',
  asset_created: '#16a34a',
  asset_updated: '#d97706',
  asset_deleted: '#dc2626',
  request_approved: '#16a34a',
  request_rejected: '#dc2626',
};

const timeStr = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = async (currentPage = page) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: currentPage, limit: 50 });
      if (filterEntity) params.append('entity', filterEntity);
      if (filterAction) params.append('action', filterAction);

      const { data } = await api.get(`/audit?${params}`);
      setLogs(data.logs);
      setTotalPages(data.pages);
    } catch {
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    setPage(1);
  }, [filterEntity, filterAction]);

  const handlePageChange = (_, val) => {
    setPage(val);
    fetchLogs(val);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center',
          background: 'linear-gradient(135deg, #1E3A8A, #0F766E)'
        }}>
          <HistoryRounded sx={{ color: 'white' }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Audit Logs</Typography>
          <Typography variant="body2" color="text.secondary">Complete history of all system actions</Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterListRounded sx={{ color: '#64748b' }} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Entity</InputLabel>
          <Select value={filterEntity} label="Entity" onChange={(e) => setFilterEntity(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="ticket">Ticket</MenuItem>
            <MenuItem value="asset">Asset</MenuItem>
            <MenuItem value="device_request">Device Request</MenuItem>
            <MenuItem value="user">User</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Filter by action"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          placeholder="e.g. created, updated"
          sx={{ minWidth: 200 }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={() => { setFilterEntity(''); setFilterAction(''); }}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Clear
        </Button>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : logs.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <HistoryRounded sx={{ fontSize: 56, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} color="text.secondary">No audit logs found</Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Actor</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Entity</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Reference</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Changes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id} hover>
                    <TableCell sx={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {timeStr(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={13} fontWeight={600}>{log.actorName}</Typography>
                      <Typography fontSize={11} color="text.secondary">{log.actorRole}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action.replace(/_/g, ' ')}
                        size="small"
                        sx={{
                          fontSize: 11, fontWeight: 700, height: 22,
                          bgcolor: `${ACTION_COLORS[log.action] || '#64748b'}18`,
                          color: ACTION_COLORS[log.action] || '#64748b'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={log.entity} size="small" variant="outlined" sx={{ fontSize: 11, height: 20 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{log.entityLabel || log.entityId || '—'}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: '#64748b', maxWidth: 240 }}>
                      {log.changes
                        ? <Typography fontSize={11} sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {JSON.stringify(log.changes, null, 1)}
                          </Typography>
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
