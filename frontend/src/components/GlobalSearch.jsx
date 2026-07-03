import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Box, InputBase, Paper, Typography, Chip, CircularProgress,
  Divider, IconButton, ClickAwayListener
} from '@mui/material';
import {
  SearchRounded, CloseRounded, Inventory2Rounded,
  ConfirmationNumberRounded, PersonRounded
} from '@mui/icons-material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  Active: '#16a34a', 'Under Repair': '#d97706', 'Decommissioned': '#64748b',
  Resolved: '#16a34a', 'Pending Approval': '#d97706', 'Vendor Assigned': '#2563EB',
  Rejected: '#dc2626',
};

export default function GlobalSearch() {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const inputRef    = useRef(null);
  const wrapperRef  = useRef(null);
  const navigate    = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = ['admin', 'super_admin', 'hod'].includes(currentUser?.role);
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
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setAnchorEl(wrapperRef.current);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery('');
    setResults(null);
    setAnchorEl(null);
  };

  const goTo = (path) => { navigate(path); handleClose(); };

  const hasResults = results && (results.assets?.length || results.tickets?.length || results.users?.length);

  // Compute dropdown position from anchor
  const getDropdownStyle = () => {
    if (!anchorEl) return {};
    const rect = anchorEl.getBoundingClientRect();
    return {
      position: 'fixed',
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      zIndex: 2100,
    };
  };

  const showDropdown = open && (query.length >= 2 || !query);

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box ref={wrapperRef} sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Collapsed: just icon */}
        {!open && (
          <IconButton
            onClick={handleOpen}
            sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'action.hover' } }}
            title="Search (Ctrl+K)"
          >
            <SearchRounded />
          </IconButton>
        )}

        {/* Expanded: inline search bar */}
        {open && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            bgcolor: 'action.hover',
            border: '1.5px solid',
            borderColor: 'rgba(17,24,39,0.4)',
            borderRadius: '12px',
            px: 1.5, py: 0.6,
            width: { xs: 200, sm: 280, md: 340 },
            transition: 'width 0.2s ease',
          }}>
            <SearchRounded sx={{ fontSize: 18, color: '#111827', flexShrink: 0 }} />
            <InputBase
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assets, tickets, users..."
              fullWidth
              sx={{ fontSize: 13.5, fontWeight: 500, color: 'text.primary' }}
            />
            {loading
              ? <CircularProgress size={14} sx={{ flexShrink: 0 }} />
              : <CloseRounded
                  onClick={handleClose}
                  sx={{ fontSize: 16, color: 'text.disabled', cursor: 'pointer', flexShrink: 0, '&:hover': { color: 'text.primary' } }}
                />
            }
          </Box>
        )}

        {/* Dropdown results via portal */}
        {open && createPortal(
          <Paper
            elevation={16}
            sx={{
              ...getDropdownStyle(),
              borderRadius: '14px',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              minWidth: 320,
            }}
          >
            {query.length >= 2 && (
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {!hasResults && !loading && (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary" fontSize={13}>No results for "{query}"</Typography>
                  </Box>
                )}

                {results?.assets?.length > 0 && (
                  <Box>
                    <Typography fontSize={10} fontWeight={800} color="text.disabled"
                      sx={{ px: 2, pt: 1.5, pb: 0.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      Assets
                    </Typography>
                    {results.assets.map(a => (
                      <Box key={a._id} onClick={() => goTo(`/admin/assets?highlight=${a._id}`)}
                        sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, gap: 1.5 }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(17,24,39,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Inventory2Rounded sx={{ fontSize: 16, color: '#111827' }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontSize={13} fontWeight={600} noWrap>{a.name}</Typography>
                          <Typography fontSize={11} color="text.secondary" noWrap>{a.serialNumber} · {a.department}</Typography>
                        </Box>
                        <Chip label={a.status} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: `${STATUS_COLORS[a.status] || '#64748b'}18`, color: STATUS_COLORS[a.status] || '#64748b' }} />
                      </Box>
                    ))}
                    <Divider />
                  </Box>
                )}

                {results?.tickets?.length > 0 && (
                  <Box>
                    <Typography fontSize={10} fontWeight={800} color="text.disabled"
                      sx={{ px: 2, pt: 1.5, pb: 0.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      Tickets
                    </Typography>
                    {results.tickets.map(t => (
                      <Box key={t._id} onClick={() => goTo(`/tickets?highlight=${t._id}`)}
                        sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, gap: 1.5 }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ConfirmationNumberRounded sx={{ fontSize: 16, color: '#2563EB' }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontSize={13} fontWeight={600}>{t.ticketId}</Typography>
                          <Typography fontSize={11} color="text.secondary" noWrap>{t.issue}</Typography>
                        </Box>
                        <Chip label={t.status} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: `${STATUS_COLORS[t.status] || '#64748b'}18`, color: STATUS_COLORS[t.status] || '#64748b' }} />
                      </Box>
                    ))}
                    {isAdmin && results.users?.length > 0 && <Divider />}
                  </Box>
                )}

                {isAdmin && results?.users?.length > 0 && (
                  <Box>
                    <Typography fontSize={10} fontWeight={800} color="text.disabled"
                      sx={{ px: 2, pt: 1.5, pb: 0.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      Users
                    </Typography>
                    {results.users.map(u => (
                      <Box key={u._id} onClick={() => goTo(`/admin/users?highlight=${u._id}`)}
                        sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, gap: 1.5 }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: 'rgba(217,119,6,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PersonRounded sx={{ fontSize: 16, color: '#d97706' }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontSize={13} fontWeight={600}>{u.name}</Typography>
                          <Typography fontSize={11} color="text.secondary" noWrap>{u.email} · {u.department}</Typography>
                        </Box>
                        <Chip label={u.role} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {!query && (
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography fontSize={12} color="text.secondary">
                  Type to search assets, tickets{isAdmin ? ', and users' : ''}…
                </Typography>
              </Box>
            )}
          </Paper>,
          document.body
        )}
      </Box>
    </ClickAwayListener>
  );
}
