// frontend/src/components/AssetTimelineDrawer.jsx
// Complete event history for a single asset — tickets, assignments, transfers, maintenance, audit logs
import { useState, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton, Divider, Chip,
  CircularProgress, Alert, Paper
} from '@mui/material';
import {
  CloseRounded, AddCircleRounded, ConfirmationNumberRounded,
  AssignmentIndRounded, SwapHorizRounded, BuildRounded,
  ManageHistoryRounded, InventoryRounded
} from '@mui/icons-material';
import api from '../api/axios';

const ACCENT = '#111827';
const DARK = '#111827';

const ICON_MAP = {
  ticket: <ConfirmationNumberRounded sx={{ fontSize: 16 }} />,
  assignment: <AssignmentIndRounded sx={{ fontSize: 16 }} />,
  transfer: <SwapHorizRounded sx={{ fontSize: 16 }} />,
  maintenance: <BuildRounded sx={{ fontSize: 16 }} />,
  audit: <ManageHistoryRounded sx={{ fontSize: 16 }} />,
  asset_created: <AddCircleRounded sx={{ fontSize: 16 }} />,
};

function fmt(date) {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function TimeEvent({ event, last }) {
  return (
    <Box sx={{ display: 'flex', position: 'relative', pb: last ? 0 : 3.5 }}>
      {/* Connector Line */}
      {!last && (
        <Box sx={{
          position: 'absolute',
          left: 17, // centered under the dot
          top: 36,
          bottom: 0,
          width: '2px',
          bgcolor: 'divider'
        }} />
      )}

      {/* Left side: Icon Dot */}
      <Box sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        bgcolor: event.color || '#64748b',
        boxShadow: `0 0 0 3px ${event.color || '#64748b'}25`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        mr: 2.5,
        flexShrink: 0,
        zIndex: 1
      }}>
        {ICON_MAP[event.icon] || <InventoryRounded sx={{ fontSize: 16 }} />}
      </Box>

      {/* Right side: Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Date and Title */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.8, flexWrap: 'wrap', gap: 1 }}>
          <Typography fontWeight={800} fontSize={13.5} color="text.primary">
            {event.title}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10.5, fontWeight: 600 }}>
            {fmt(event.date)}
          </Typography>
        </Box>

        <Paper sx={{
          p: 1.8, borderRadius: 2.5, border: '1px solid', borderColor: 'divider',
          '&:hover': { borderColor: event.color || ACCENT, bgcolor: `${event.color || ACCENT}05` },
          transition: 'all 0.2s',
          bgcolor: 'background.paper'
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block', fontSize: 12.5, whiteSpace: 'pre-line' }}>
            {event.description}
          </Typography>
          {event.meta?.cost > 0 && (
            <Chip label={`₹${Number(event.meta.cost).toLocaleString('en-IN')}`} size="small"
              sx={{ mt: 0.8, height: 18, fontSize: 10, fontWeight: 700, bgcolor: '#422006', color: '#fb923c' }} />
          )}
          {event.meta?.priority && (
            <Chip label={event.meta.priority} size="small"
              sx={{
                mt: 0.8, ml: event.meta?.cost > 0 ? 0.5 : 0, height: 18, fontSize: 10, fontWeight: 700,
                bgcolor: event.meta.priority === 'Critical' ? '#450a0a' : event.meta.priority === 'High' ? '#450a0a' : '#422006',
                color: event.meta.priority === 'Critical' ? '#f87171' : event.meta.priority === 'High' ? '#f87171' : '#fb923c'
              }} />
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default function AssetTimelineDrawer({ open, assetId, assetName, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || !assetId) return;
    setLoading(true);
    setError('');
    setData(null);
    api.get(`/assets/${assetId}/timeline`)
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load asset timeline.'))
      .finally(() => setLoading(false));
  }, [open, assetId]);

  const asset = data?.asset;
  const events = data?.events || [];
  const counts = data?.counts || {};

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: {
        sx: {
          width: { xs: '100vw', sm: 520 },
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
        }
      } }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', bgcolor: DARK }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: `${ACCENT}18`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <ManageHistoryRounded sx={{ color: ACCENT, fontSize: 20 }} />
          </Box>
          <Box>
            <Typography fontWeight={900} fontSize={16} color="white">Asset Timeline</Typography>
            <Typography variant="caption" color="#888" sx={{ maxWidth: 320, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {assetName || 'Loading...'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#666', '&:hover': { color: 'white' } }}>
          <CloseRounded />
        </IconButton>
      </Box>

      {/* Asset Quick Info */}
      {asset && (
        <Box sx={{ px: 2.5, py: 1.8, bgcolor: DARK, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={asset.category} size="small" sx={{ bgcolor: `${ACCENT}18`, color: ACCENT, fontWeight: 700, fontSize: 11 }} />
            <Chip label={asset.department} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#aaa', fontWeight: 600, fontSize: 11 }} />
            <Chip label={asset.status} size="small" sx={{ bgcolor: asset.status === 'Active' ? '#14532d' : '#450a0a', color: asset.status === 'Active' ? '#4ade80' : '#f87171', fontWeight: 700, fontSize: 11 }} />
            {asset.serialNumber && (
              <Chip label={`SN: ${asset.serialNumber}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#777', fontWeight: 600, fontSize: 11 }} />
            )}
          </Box>
        </Box>
      )}

      {/* Event counts */}
      {data && (
        <Box sx={{ px: 2.5, py: 1.5, display: 'flex', gap: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Events', value: events.length, color: ACCENT },
            { label: 'Tickets', value: counts.tickets, color: '#f87171' },
            { label: 'Assignments', value: counts.assignments, color: '#60a5fa' },
            { label: 'Maintenance', value: counts.maintenance, color: '#f59e0b' },
          ].map(s => (
            <Box key={s.label} textAlign="left">
              <Typography fontWeight={900} fontSize={16} color={s.color} sx={{ lineHeight: 1.2 }}>{s.value ?? 0}</Typography>
              <Typography variant="caption" color="text.disabled" fontWeight={700} fontSize={9.5} textTransform="uppercase" letterSpacing="0.2px">{s.label}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, gap: 2, flexDirection: 'column' }}>
            <CircularProgress sx={{ color: ACCENT }} size={30} />
            <Typography color="text.secondary" fontSize={13}>Loading timeline...</Typography>
          </Box>
        )}
        {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
        {!loading && !error && events.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <InventoryRounded sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary" fontWeight={600}>No events recorded yet</Typography>
          </Box>
        )}
        {!loading && events.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {events.map((ev, i) => (
              <TimeEvent key={i} event={ev} last={i === events.length - 1} />
            ))}
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
