import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, IconButton, InputBase, Paper, Typography, Chip, CircularProgress, Divider
} from '@mui/material';
import {
  SearchRounded, CloseRounded, Inventory2Rounded,
  ConfirmationNumberRounded, PersonRounded
} from '@mui/icons-material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  Active: '#16a34a', 'Under Repair': '#d97706', 'Decommissioned': '#64748b',
  Resolved: '#16a34a', 'Pending Approval': '#d97706', 'Vendor Assigned': '#4f46e5',
  Rejected: '#dc2626',
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    if (q.trim().length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } catch { setResults(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => search(query), 300);
    } else {
      setResults(null);
    }
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleClose = () => { setOpen(false); setQuery(''); setResults(null); };

  const goTo = (path) => { navigate(path); handleClose(); };

  const hasResults = results && (results.assets?.length || results.tickets?.length || results.users?.length);

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{ color: '#64748b', '&:hover': { color: '#4f46e5', bgcolor: '#eef2ff' } }}
        title="Search (Ctrl+K)"
      >
        <SearchRounded />
      </IconButton>

      {open && (
        <Box
          onClick={handleClose}
          sx={{
            position: 'fixed', inset: 0, bgcolor: 'rgba(15,23,42,0.5)',
            zIndex: 1400, display: 'flex', alignItems: 'flex-start',
            justifyContent: 'center', pt: { xs: 4, md: 10 }
          }}
        >
          <Paper
            onClick={(e) => e.stopPropagation()}
            elevation={24}
            sx={{
              width: '100%', maxWidth: 600, mx: 2, borderRadius: 3,
              overflow: 'hidden', border: 1, borderColor: 'divider'
            }}
          >
            {/* Search input */}
            <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <SearchRounded sx={{ color: '#94a3b8', mr: 1.5 }} />
              <InputBase
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search assets, tickets, users..."
                fullWidth
                sx={{ fontSize: 16, fontWeight: 500 }}
              />
              {loading && <CircularProgress size={18} sx={{ mr: 1 }} />}
              <IconButton size="small" onClick={handleClose}>
                <CloseRounded fontSize="small" />
              </IconButton>
            </Box>

            {/* Results */}
            {query.length >= 2 && (
              <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
                {!hasResults && !loading && (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary" fontSize={14}>No results for "{query}"</Typography>
                  </Box>
                )}

                {results?.assets?.length > 0 && (
                  <Box>
                    <Typography fontSize={11} fontWeight={800} color="text.disabled" sx={{ px: 2, pt: 1.5, pb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Assets
                    </Typography>
                    {results.assets.map(a => (
                      <Box
                        key={a._id}
                        onClick={() => goTo('/admin/assets')}
                        sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, gap: 1.5 }}
                      >
                        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Inventory2Rounded sx={{ fontSize: 17, color: '#4f46e5' }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography fontSize={14} fontWeight={600}>{a.name}</Typography>
                          <Typography fontSize={12} color="text.secondary">{a.serialNumber} · {a.department}</Typography>
                        </Box>
                        <Chip label={a.status} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: `${STATUS_COLORS[a.status] || '#64748b'}18`, color: STATUS_COLORS[a.status] || '#64748b' }} />
                      </Box>
                    ))}
                    <Divider />
                  </Box>
                )}

                {results?.tickets?.length > 0 && (
                  <Box>
                    <Typography fontSize={11} fontWeight={800} color="text.disabled" sx={{ px: 2, pt: 1.5, pb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Tickets
                    </Typography>
                    {results.tickets.map(t => (
                      <Box
                        key={t._id}
                        onClick={() => goTo('/tickets')}
                        sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, gap: 1.5 }}
                      >
                        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ConfirmationNumberRounded sx={{ fontSize: 17, color: '#0ea5e9' }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography fontSize={14} fontWeight={600}>{t.ticketId}</Typography>
                          <Typography fontSize={12} color="text.secondary" noWrap sx={{ maxWidth: 300 }}>{t.issue}</Typography>
                        </Box>
                        <Chip label={t.status} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: `${STATUS_COLORS[t.status] || '#64748b'}18`, color: STATUS_COLORS[t.status] || '#64748b' }} />
                      </Box>
                    ))}
                    {isAdmin && results.users?.length > 0 && <Divider />}
                  </Box>
                )}

                {isAdmin && results?.users?.length > 0 && (
                  <Box>
                    <Typography fontSize={11} fontWeight={800} color="text.disabled" sx={{ px: 2, pt: 1.5, pb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Users
                    </Typography>
                    {results.users.map(u => (
                      <Box
                        key={u._id}
                        sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.2, gap: 1.5 }}
                      >
                        <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PersonRounded sx={{ fontSize: 17, color: '#d97706' }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography fontSize={14} fontWeight={600}>{u.name}</Typography>
                          <Typography fontSize={12} color="text.secondary">{u.email} · {u.department}</Typography>
                        </Box>
                        <Chip label={u.role} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {!query && (
              <Box sx={{ px: 2, py: 2 }}>
                <Typography fontSize={13} color="text.secondary">
                  Search across assets, tickets{isAdmin ? ', and users' : ''}. Press <strong>Esc</strong> to close.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </>
  );
}
