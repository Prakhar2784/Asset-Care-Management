import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, IconButton, Button, Chip, CircularProgress,
  List, ListItem, ListItemText, Divider, Alert, Tooltip
} from '@mui/material';
import {
  NotificationsRounded, DoneAllRounded, DeleteOutlineRounded,
  ConfirmationNumberRounded, DevicesRounded, Inventory2Rounded,
  WarningAmberRounded, CheckCircleOutlineRounded, InfoOutlined,
  OpenInNewRounded
} from '@mui/icons-material';
import api from '../../api/axios';

const TYPE_CONFIG = {
  ticket_created:   { icon: <ConfirmationNumberRounded />, color: '#4f46e5', bg: '#eef2ff', label: 'Ticket' },
  ticket_status:    { icon: <ConfirmationNumberRounded />, color: '#0ea5e9', bg: '#e0f2fe', label: 'Ticket' },
  ticket_resolved:  { icon: <CheckCircleOutlineRounded />, color: '#16a34a', bg: '#dcfce7', label: 'Resolved' },
  request_approved: { icon: <CheckCircleOutlineRounded />, color: '#16a34a', bg: '#dcfce7', label: 'Approved' },
  request_rejected: { icon: <InfoOutlined />, color: '#dc2626', bg: '#fee2e2', label: 'Rejected' },
  asset_assigned:   { icon: <Inventory2Rounded />, color: '#0F766E', bg: '#ccfbf1', label: 'Asset' },
  asset_revoked:    { icon: <Inventory2Rounded />, color: '#9333ea', bg: '#f3e8ff', label: 'Asset' },
  warranty_expiry:  { icon: <WarningAmberRounded />, color: '#d97706', bg: '#fef3c7', label: 'Warranty' },
  system:           { icon: <InfoOutlined />, color: '#64748b', bg: '#f1f5f9', label: 'System' },
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const notifyBadge = () => window.dispatchEvent(new Event('notifications-changed'));

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      notifyBadge();
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      notifyBadge();
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      notifyBadge();
    } catch {}
  };

  const handleClick = async (notification) => {
    if (!notification.isRead) await handleMarkRead(notification._id);
    if (notification.link) navigate(notification.link);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center',
            background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)'
          }}>
            <NotificationsRounded sx={{ color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Notifications</Typography>
            <Typography variant="body2" color="text.secondary">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Typography>
          </Box>
        </Box>
        {unreadCount > 0 && (
          <Button
            startIcon={<DoneAllRounded />}
            onClick={handleMarkAllRead}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Mark All Read
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <NotificationsRounded sx={{ fontSize: 56, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} color="text.secondary">No notifications yet</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Activity on your tickets and requests will appear here.
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <List disablePadding>
            {notifications.map((n, idx) => {
              const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
              return (
                <Box key={n._id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      px: 3, py: 2,
                      bgcolor: n.isRead ? 'transparent' : '#fafbff',
                      borderLeft: n.isRead ? '3px solid transparent' : `3px solid ${config.color}`,
                      cursor: n.link ? 'pointer' : 'default',
                      transition: 'background 0.15s',
                      '&:hover': { bgcolor: '#f8fafc' }
                    }}
                    onClick={() => handleClick(n)}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {n.link && (
                          <Tooltip title="Open">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleClick(n); }}>
                              <OpenInNewRounded fontSize="small" sx={{ color: '#94a3b8' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }}>
                            <DeleteOutlineRounded fontSize="small" sx={{ color: '#94a3b8' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <Box sx={{
                      width: 36, height: 36, borderRadius: 2, mr: 2, mt: 0.5, flexShrink: 0,
                      bgcolor: config.bg, color: config.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {config.icon}
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography fontWeight={n.isRead ? 600 : 800} fontSize={14} color="text.primary">
                            {n.title}
                          </Typography>
                          <Chip label={config.label} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: config.bg, color: config.color }} />
                          {!n.isRead && <Chip label="New" size="small" color="error" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" mt={0.3} fontSize={13}>
                            {n.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" mt={0.5} display="block">
                            {timeAgo(n.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {idx < notifications.length - 1 && <Divider />}
                </Box>
              );
            })}
          </List>
        </Paper>
      )}
    </Box>
  );
}
