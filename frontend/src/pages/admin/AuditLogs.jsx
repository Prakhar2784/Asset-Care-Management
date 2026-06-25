import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Skeleton, Alert, Select,
  MenuItem, FormControl, InputLabel, Button, TextField, Pagination, IconButton, Tooltip
} from '@mui/material';
import { HistoryRounded, FilterListRounded, RefreshRounded, ClearAllRounded } from '@mui/icons-material';
import api from '../../api/axios';

const ACTION_META = {
  ticket_created:        { label: 'Ticket Created',        color: '#2563EB', bg: '#EFF6FF' },
  ticket_status_changed: { label: 'Status Changed',        color: '#7C3AED', bg: '#F3E8FF' },
  ticket_deleted:        { label: 'Ticket Deleted',        color: '#DC2626', bg: '#FEF2F2' },
  asset_created:         { label: 'Asset Created',         color: '#16A34A', bg: '#F0FDF4' },
  asset_updated:         { label: 'Asset Updated',         color: '#D97706', bg: '#FFFBEB' },
  asset_deleted:         { label: 'Asset Deleted',         color: '#DC2626', bg: '#FEF2F2' },
  asset_assigned:        { label: 'Asset Assigned',        color: '#0891B2', bg: '#ECFEFF' },
  asset_revoked:         { label: 'Asset Revoked',         color: '#D97706', bg: '#FFFBEB' },
  request_approved:      { label: 'Request Approved',      color: '#16A34A', bg: '#F0FDF4' },
  request_rejected:      { label: 'Request Rejected',      color: '#DC2626', bg: '#FEF2F2' },
  user_created:          { label: 'User Created',          color: '#0891B2', bg: '#ECFEFF' },
  user_updated:          { label: 'User Updated',          color: '#D97706', bg: '#FFFBEB' },
};

const ENTITY_COLORS = {
  ticket: { color: '#2563EB', bg: '#EFF6FF' },
  asset:  { color: '#16A34A', bg: '#F0FDF4' },
  device_request: { color: '#7C3AED', bg: '#F3E8FF' },
  user:   { color: '#0891B2', bg: '#ECFEFF' },
};

const timeStr = (date) => {
  const d = new Date(date);
  return {
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
};

const formatChanges = (changes) => {
  if (!changes || typeof changes !== 'object') return null;
  const entries = Object.entries(changes);
  if (entries.length === 0) return null;

  if ('from' in changes && 'to' in changes) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, px: 1, py: 0.3, borderRadius: 1, bgcolor: 'action.selected', color: 'text.secondary' }}>
          {changes.from}
        </Typography>
        <Typography fontSize={12} color="text.disabled" fontWeight={700}>→</Typography>
        <Typography sx={{ fontSize: 11, fontWeight: 700, px: 1, py: 0.3, borderRadius: 1, bgcolor: '#dcfce7', color: '#16a34a' }}>
          {changes.to}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
      {entries.map(([key, val]) => (
        <Typography key={key} fontSize={11} color="text.secondary" fontWeight={500}>
          <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
          {String(val)}
        </Typography>
      ))}
    </Box>
  );
};

const ROLE_COLORS = { admin: '#111111', hod: '#7C3AED', employee: '#2563EB', it_support: '#0891B2', vendor: '#D97706' };

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = async (currentPage = page) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: currentPage, limit: 20 });
      if (filterEntity) params.append('entity', filterEntity);
      if (filterAction) params.append('action', filterAction);
      const { data } = await api.get(`/audit?${params}`);
      setLogs(data.logs);
      setTotalPages(data.pages);
      setTotalLogs(data.total || data.logs.length);
    } catch {
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(1); setPage(1); }, [filterEntity, filterAction]);

  const handlePageChange = (_, val) => { setPage(val); fetchLogs(val); };

  const clearFilters = () => { setFilterEntity(''); setFilterAction(''); };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: '#111111' }}>
            <HistoryRounded sx={{ color: '#CBFA57' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Audit Logs</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Complete history of all system actions
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={() => fetchLogs(page)}
            sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '12px' }}>
            <RefreshRounded />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: '20px', border: 1, borderColor: 'divider', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
          <FilterListRounded fontSize="small" />
          <Typography fontSize={13} fontWeight={700}>Filters</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Entity Type</InputLabel>
          <Select value={filterEntity} label="Entity Type" onChange={(e) => setFilterEntity(e.target.value)}
            sx={{ borderRadius: '10px', fontSize: 13 }}>
            <MenuItem value="">All Entities</MenuItem>
            <MenuItem value="ticket">Ticket</MenuItem>
            <MenuItem value="asset">Asset</MenuItem>
            <MenuItem value="device_request">Device Request</MenuItem>
            <MenuItem value="user">User</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small" label="Action keyword"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          placeholder="e.g. created, updated"
          sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 13 } }}
        />
        {(filterEntity || filterAction) && (
          <Button size="small" startIcon={<ClearAllRounded />} onClick={clearFilters}
            sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none', color: 'text.secondary', border: 1, borderColor: 'divider' }}>
            Clear
          </Button>
        )}
        {!loading && totalLogs > 0 && (
          <Typography fontSize={12} color="text.disabled" fontWeight={600} sx={{ ml: 'auto' }}>
            {totalLogs} entries
          </Typography>
        )}
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

      {loading ? (
        <Paper sx={{ borderRadius: '20px', border: 1, borderColor: 'divider', overflow: 'hidden' }}>
          {[...Array(8)].map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, p: 2, borderBottom: i < 7 ? 1 : 0, borderColor: 'divider', opacity: 1 - i * 0.08 }}>
              <Skeleton variant="rounded" width={90} height={36} sx={{ borderRadius: '8px', flexShrink: 0 }} />
              <Skeleton variant="text" width="15%" height={20} />
              <Skeleton variant="rounded" width={110} height={24} sx={{ borderRadius: '20px' }} />
              <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '20px' }} />
              <Skeleton variant="text" width="20%" height={20} />
              <Skeleton variant="text" width="25%" height={20} />
            </Box>
          ))}
        </Paper>
      ) : logs.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '20px', border: '1px dashed', borderColor: 'divider' }}>
          <HistoryRounded sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} color="text.secondary">No audit logs found</Typography>
          <Typography fontSize={14} color="text.disabled" mt={0.5}>Try changing the filters or refreshing.</Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: '20px', border: 1, borderColor: 'divider', mb: 3, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  {['Timestamp', 'Actor', 'Action', 'Entity', 'Reference', 'Changes'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.6px', py: 1.5, borderBottom: 2, borderColor: 'divider' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log, idx) => {
                  const ts = timeStr(log.createdAt);
                  const meta = ACTION_META[log.action];
                  const entityMeta = ENTITY_COLORS[log.entity];
                  return (
                    <TableRow key={log._id} hover sx={{ '&:last-child td': { borderBottom: 0 }, transition: 'background 0.15s' }}>
                      <TableCell sx={{ py: 1.5, minWidth: 100 }}>
                        <Typography fontSize={12} fontWeight={700} color="text.primary">{ts.date}</Typography>
                        <Typography fontSize={11} color="text.disabled" fontWeight={600}>{ts.time}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography fontSize={13} fontWeight={700} color="text.primary">{log.actorName}</Typography>
                        <Typography fontSize={11} fontWeight={600}
                          sx={{ color: ROLE_COLORS[log.actorRole] || 'text.disabled', textTransform: 'capitalize' }}>
                          {log.actorRole?.replace(/_/g, ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{
                          display: 'inline-flex', alignItems: 'center',
                          px: 1.2, py: 0.4, borderRadius: '20px',
                          bgcolor: meta?.bg || '#F1F5F9',
                          color: meta?.color || '#64748b',
                          fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap'
                        }}>
                          {meta?.label || log.action.replace(/_/g, ' ')}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{
                          display: 'inline-flex', px: 1.2, py: 0.3, borderRadius: '20px', border: '1px solid',
                          borderColor: entityMeta?.color || 'divider',
                          color: entityMeta?.color || 'text.secondary',
                          bgcolor: entityMeta?.bg || 'transparent',
                          fontSize: 11, fontWeight: 700, textTransform: 'capitalize'
                        }}>
                          {log.entity?.replace(/_/g, ' ')}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.5, maxWidth: 160 }}>
                        <Typography fontSize={12} fontWeight={600} color="text.primary"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.entityLabel || log.entityId || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5, maxWidth: 220 }}>
                        {formatChanges(log.changes) ?? <Typography fontSize={11} color="text.disabled">—</Typography>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages} page={page} onChange={handlePageChange}
                sx={{
                  '& .MuiPaginationItem-root': { fontWeight: 700, borderRadius: '10px' },
                  '& .Mui-selected': { bgcolor: '#111111 !important', color: '#CBFA57' }
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
