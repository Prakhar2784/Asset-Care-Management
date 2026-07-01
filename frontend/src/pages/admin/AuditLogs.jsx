import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton, Alert, Select,
  MenuItem, FormControl, InputLabel, Button, TextField, Pagination, IconButton, Tooltip
} from '@mui/material';
import { HistoryRounded, FilterListRounded, RefreshRounded, ClearAllRounded, SearchRounded } from '@mui/icons-material';
import api from '../../api/axios';

const ACTION_META = {
  ticket_created:        { label: 'Ticket Created',        color: '#60A5FA', bg: 'rgba(37,99,235,0.12)' },
  ticket_status_changed: { label: 'Status Changed',        color: '#A78BFA', bg: 'rgba(124,58,237,0.12)' },
  ticket_deleted:        { label: 'Ticket Deleted',        color: '#F87171', bg: 'rgba(220,38,38,0.12)' },
  asset_created:         { label: 'Asset Created',         color: '#4ADE80', bg: 'rgba(22,163,74,0.12)' },
  asset_updated:         { label: 'Asset Updated',         color: '#FBBF24', bg: 'rgba(217,119,6,0.12)' },
  asset_deleted:         { label: 'Asset Deleted',         color: '#F87171', bg: 'rgba(220,38,38,0.12)' },
  asset_assigned:        { label: 'Asset Assigned',        color: '#22D3EE', bg: 'rgba(8,145,178,0.12)' },
  asset_revoked:         { label: 'Asset Revoked',         color: '#FBBF24', bg: 'rgba(217,119,6,0.12)' },
  request_approved:      { label: 'Request Approved',      color: '#4ADE80', bg: 'rgba(22,163,74,0.12)' },
  request_rejected:      { label: 'Request Rejected',      color: '#F87171', bg: 'rgba(220,38,38,0.12)' },
  user_created:          { label: 'User Created',          color: '#22D3EE', bg: 'rgba(8,145,178,0.12)' },
  user_updated:          { label: 'User Updated',          color: '#FBBF24', bg: 'rgba(217,119,6,0.12)' },
};

const ENTITY_COLORS = {
  ticket:         { color: '#60A5FA', bg: 'rgba(37,99,235,0.10)' },
  asset:          { color: '#4ADE80', bg: 'rgba(22,163,74,0.10)' },
  device_request: { color: '#A78BFA', bg: 'rgba(124,58,237,0.10)' },
  user:           { color: '#22D3EE', bg: 'rgba(8,145,178,0.10)' },
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, px: 1, py: 0.25, borderRadius: '6px', bgcolor: 'action.selected', color: 'text.secondary', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {changes.from}
        </Typography>
        <Typography fontSize={11} color="text.disabled" fontWeight={700}>→</Typography>
        <Typography sx={{ fontSize: 11, fontWeight: 700, px: 1, py: 0.25, borderRadius: '6px', bgcolor: 'rgba(22,163,74,0.15)', color: '#4ADE80', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {changes.to}
        </Typography>
      </Box>
    );
  }

  const visible = entries.slice(0, 3);
  const hidden = entries.length - 3;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
      {visible.map(([key, val]) => (
        <Typography key={key} fontSize={11} color="text.secondary" fontWeight={500}
          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
          <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
          {String(val)}
        </Typography>
      ))}
      {hidden > 0 && (
        <Typography fontSize={10} color="text.disabled" fontWeight={700}>+{hidden} more fields</Typography>
      )}
    </Box>
  );
};

const ROLE_COLORS = { admin: '#A855F7', hod: '#A78BFA', employee: '#60A5FA', it_support: '#22D3EE', vendor: '#FBBF24' };

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
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(124,58,237,0.12)' }}>
            <HistoryRounded sx={{ color: '#A855F7' }} />
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

      {/* Filter Bar */}
      <Paper sx={{ p: 2, borderRadius: '16px', border: 1, borderColor: 'divider', mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
          <FilterListRounded fontSize="small" />
          <Typography fontSize={13} fontWeight={700}>Filters</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Entity Type</InputLabel>
          <Select value={filterEntity} label="Entity Type" onChange={e => setFilterEntity(e.target.value)}
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
          onChange={e => setFilterAction(e.target.value)}
          placeholder="e.g. created, updated"
          slotProps={{ input: { startAdornment: <Box sx={{ mr: 0.5, color: 'text.disabled', display: 'flex' }}><SearchRounded fontSize="small" /></Box> } }}
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
          <Box sx={{ width: 72, height: 72, borderRadius: '20px', bgcolor: 'rgba(124,58,237,0.08)', display: 'grid', placeItems: 'center', mx: 'auto', mb: 2 }}>
            <HistoryRounded sx={{ fontSize: 36, color: '#A855F7' }} />
          </Box>
          <Typography variant="h6" fontWeight={800} color="text.primary">No audit logs found</Typography>
          <Typography fontSize={14} color="text.secondary" mt={0.5}>Try changing the filters or refreshing.</Typography>
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
                    <TableRow key={log._id} hover sx={{
                      '&:last-child td': { borderBottom: 0 },
                      bgcolor: idx % 2 === 0 ? 'transparent' : 'action.hover',
                    }}>
                      <TableCell sx={{ py: 1.5, minWidth: 95 }}>
                        <Typography fontSize={11} fontWeight={700} color="text.primary" sx={{ whiteSpace: 'nowrap' }}>{ts.date}</Typography>
                        <Typography fontSize={10} color="text.disabled" fontWeight={600}>{ts.time}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography fontSize={12} fontWeight={700} color="text.primary" sx={{ whiteSpace: 'nowrap' }}>{log.actorName}</Typography>
                        <Typography fontSize={10} fontWeight={700} sx={{ color: ROLE_COLORS[log.actorRole] || 'text.disabled', textTransform: 'capitalize' }}>
                          {log.actorRole?.replace(/_/g, ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{
                          display: 'inline-flex', px: 1.2, py: 0.3, borderRadius: '20px',
                          bgcolor: meta?.bg || 'action.selected',
                          color: meta?.color || 'text.secondary',
                          fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap'
                        }}>
                          {meta?.label || log.action.replace(/_/g, ' ')}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{
                          display: 'inline-flex', px: 1.2, py: 0.25, borderRadius: '20px', border: '1px solid',
                          borderColor: entityMeta?.color || 'divider',
                          color: entityMeta?.color || 'text.secondary',
                          bgcolor: entityMeta?.bg || 'transparent',
                          fontSize: 11, fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap'
                        }}>
                          {log.entity?.replace(/_/g, ' ')}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.5, maxWidth: 140 }}>
                        <Typography fontSize={12} fontWeight={600} color="text.primary"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.entityLabel || log.entityId || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5, maxWidth: 200 }}>
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
                  '& .Mui-selected': { background: 'linear-gradient(135deg,#7C3AED,#A855F7) !important', color: '#FFFFFF !important' }
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
