import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box, Button, Dialog, DialogContent, Drawer,
  Grid, MenuItem, Paper, Select, TextField,
  Typography, IconButton, Divider, CircularProgress,
  Alert, Snackbar, Tooltip, Stack, Chip, Skeleton,
  InputAdornment, Avatar, TablePagination
} from "@mui/material";
import {
  AddRounded, BuildRounded, TimelineRounded, CloseRounded,
  AssignmentRounded, CheckCircleRounded, PendingActionsRounded,
  DeleteOutlineRounded, RefreshRounded, SearchRounded,
  ConfirmationNumberRounded, HourglassEmptyRounded, HandymanRounded,
  TaskAltRounded, AttachFileRounded, UploadFileRounded,
  ChatBubbleOutlineRounded, VisibilityRounded, EditRounded,
  ArrowForwardRounded, ChevronRightRounded
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const STATUS_LIST = [
  'Pending HOD Approval', 'Pending Approval', 'Assigned to Technician',
  'Service Center Required', 'Sent to Service Center',
  'Vendor Assigned', 'Resolved', 'Rejected'
];

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending HOD Approval':    return { bg: 'rgba(249,115,22,0.13)',  color: '#FB923C', border: '#F97316' };
    case 'Pending Approval':        return { bg: 'rgba(217,119,6,0.13)',   color: '#FBBF24', border: '#F59E0B' };
    case 'Assigned to Technician':  return { bg: 'rgba(14,165,233,0.13)',  color: '#38BDF8', border: '#0EA5E9' };
    case 'Service Center Required': return { bg: 'rgba(239,68,68,0.13)',   color: '#F87171', border: '#EF4444' };
    case 'Sent to Service Center':  return { bg: 'rgba(59,130,246,0.13)', color: '#60A5FA', border: '#3B82F6' };
    case 'Vendor Assigned':         return { bg: 'rgba(59,130,246,0.13)', color: '#60A5FA', border: '#3B82F6' };
    case 'Under Repair':            return { bg: 'rgba(147,51,234,0.13)', color: '#C084FC', border: '#111827' };
    case 'Resolved':                return { bg: 'rgba(22,163,74,0.13)',  color: '#4ADE80', border: '#22C55E' };
    case 'Rejected':                return { bg: 'rgba(220,38,38,0.13)',  color: '#F87171', border: '#EF4444' };
    default:                        return { bg: 'rgba(71,85,105,0.13)',  color: '#94A3B8', border: '#64748B' };
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Critical': return { bg: 'rgba(220,38,38,0.13)',   color: '#F87171', border: 'rgba(220,38,38,0.3)',   left: '#EF4444' };
    case 'High':     return { bg: 'rgba(234,88,12,0.13)',   color: '#FB923C', border: 'rgba(234,88,12,0.3)',   left: '#F97316' };
    case 'Medium':   return { bg: 'rgba(22,163,74,0.13)',   color: '#4ADE80', border: 'rgba(22,163,74,0.3)',   left: '#22C55E' };
    case 'Low':      return { bg: 'rgba(100,116,139,0.13)', color: '#94A3B8', border: 'rgba(100,116,139,0.3)', left: '#64748B' };
    default:         return { bg: 'rgba(71,85,105,0.13)',   color: '#94A3B8', border: 'rgba(71,85,105,0.3)',   left: '#64748B' };
  }
};

const generateTimeline = (ticket) => {
  const isApproved = !['Pending HOD Approval', 'Pending Approval', 'Rejected'].includes(ticket.status);
  const isAssigned = ['Assigned to Technician', 'Service Center Required', 'Sent to Service Center', 'Vendor Assigned', 'Under Repair', 'Resolved'].includes(ticket.status);
  const needsServiceCenter = ['Service Center Required', 'Sent to Service Center'].includes(ticket.status);
  const sentToSC = ticket.status === 'Sent to Service Center';
  const isResolved = ticket.status === 'Resolved';
  const isConfirmed = !!ticket.userConfirmed;
  return [
    { title: 'Ticket Raised',        desc: 'Issue reported to the system.',                      time: new Date(ticket.createdAt).toLocaleDateString(), done: true },
    { title: 'HOD Approval',         desc: ticket.status === 'Rejected' ? 'Ticket was rejected.' : 'Approved by Department HOD.', time: isApproved ? 'Done' : ticket.status === 'Rejected' ? 'Rejected' : 'Pending', done: isApproved },
    { title: 'Technician Assigned',  desc: ticket.assignedTechnician ? `Assigned to ${ticket.assignedTechnician?.name || 'Technician'}` : 'In-company technician assigned.', time: isAssigned ? 'Done' : 'Upcoming', done: isAssigned },
    { title: 'Service Center',       desc: sentToSC ? 'Sent to external service center.' : needsServiceCenter ? 'Technician escalated — awaiting service center.' : 'Service center not required.', time: sentToSC ? 'Done' : needsServiceCenter ? 'Escalated' : 'N/A', done: sentToSC },
    { title: 'Repair Completed',     desc: 'Technician marked the issue resolved.',               time: isResolved ? 'Done' : 'Pending', done: isResolved },
    { title: 'Service Closure',      desc: isConfirmed ? 'User confirmed resolution and ticket is closed.' : 'Awaiting user confirmation.', time: isConfirmed ? new Date(ticket.userConfirmedAt).toLocaleDateString() : 'Pending', done: isConfirmed },
  ];
};

const Tickets = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAdminOrHod = ['admin', 'super_admin', 'hod', 'manager'].includes(currentUser?.role);
  const isTechnician = currentUser?.role === 'technician';

  // Employee can withdraw their own ticket only while it's still Pending HOD or Pending Approval
  const canDeleteTicket = (ticket) =>
    isAdminOrHod || (ticket.raisedBy?._id === currentUser?._id && ['Pending HOD Approval', 'Pending Approval'].includes(ticket.status));

  // Ticket raiser confirms the repair is done once it's marked Resolved
  const canConfirmResolution = (ticket) =>
    ticket && ticket.raisedBy?._id === currentUser?._id && ticket.status === 'Resolved' && !ticket.userConfirmed;

  // Technician can act on tickets:
  // 1. Explicitly assigned to them (new flow)
  // 2. No specific technician assigned yet (legacy tickets — any technician can pick them up)
  const canTechnicianAct = (ticket) =>
    isTechnician &&
    ticket.status === 'Assigned to Technician' &&
    (
      !ticket.assignedTechnician ||  // legacy: no technician set, anyone can act
      ticket.assignedTechnician?._id === currentUser?._id  // explicitly assigned
    );

  // HOD can assign service center when ticket is escalated
  const canHodAssignServiceCenter = (ticket) =>
    isAuthorizedApprover(ticket) && ticket.status === 'Service Center Required';

  const isAuthorizedApprover = (ticket) =>
    ['admin', 'super_admin'].includes(currentUser?.role) ||
    (currentUser?.role === 'hod' && ticket?.raisedBy?.department === currentUser.department);

  // List state
  const [tickets, setTickets]               = useState([]);
  const [assets, setAssets]                 = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [technicians, setTechnicians]       = useState([]);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [statusFilter, setStatusFilter]     = useState('Active');
  const [snackbar, setSnackbar]             = useState({ open: false, message: '', severity: 'success' });
  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
  const showError = (message) => showSnackbar(message, 'error');

  // HOD assign-technician state
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  // HOD assign-service-center state
  const [selectedServiceCenterId, setSelectedServiceCenterId] = useState('');
  const [assigningAction, setAssigningAction] = useState(false);

  // Pagination
  const [page, setPage]                     = useState(0);
  const [rowsPerPage, setRowsPerPage]       = useState(9);

  // Raise ticket dialog
  const [raiseOpen, setRaiseOpen]           = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [formData, setFormData]             = useState({ selectedItem: '', issue: '', priority: 'Medium' });
  const [imageFile, setImageFile]           = useState(null);

  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [deleting, setDeleting]             = useState(false);

  // Detail drawer
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetail, setTicketDetail]     = useState(null);
  const [detailLoading, setDetailLoading]   = useState(false);
  const [commentText, setCommentText]       = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [activeTab, setActiveTab]           = useState('timeline'); // 'timeline' | 'comments' | 'attachments'
  const [remarkOpen, setRemarkOpen]         = useState(false);
  const [remarkText, setRemarkText]         = useState('');
  const [remarkSubmitting, setRemarkSubmitting] = useState(false);
  const attachFileRef                       = useRef(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const isEmployee = currentUser?.role === 'employee';
      const isTechRole = currentUser?.role === 'technician';

      // Tickets — technicians and non-employees hit /tickets; employees hit /mytickets
      const ticketsRes = await api.get(isEmployee ? '/tickets/mytickets' : '/tickets');
      setTickets(ticketsRes.data);

      // Assets — technicians don't need the asset list (they can't raise tickets)
      if (!isTechRole) {
        try {
          const assetsRes = await api.get(isEmployee ? '/assets/all-active' : '/assets');
          setAssets(assetsRes.data);
        } catch { setAssets([]); }
      }

      if (isEmployee) {
        try { const r = await api.get('/device-requests/my-approved'); setApprovedRequests(r.data); }
        catch { setApprovedRequests([]); }
      }
      // Fetch technicians & service centers for HOD/admin
      if (!isEmployee && !isTechRole) {
        try {
          const [techRes, scRes] = await Promise.all([
            api.get('/users/employees?role=technician'),
            api.get('/service-centers')
          ]);
          setTechnicians(techRes.data || []);
          setServiceCenters(scRes.data || []);
        } catch { /* non-critical */ }
      }
    } catch (err) { showError(err.response?.data?.message || 'Failed to load tickets. Please check your connection.'); }
    finally { setLoading(false); }
  };

  const filteredTickets = useMemo(() => tickets.filter(t => {
    const name = t.asset?.name || t.itemLabel || t.deviceRequestRef?.itemRequested || '';
    const matchSearch = t.ticketId?.toLowerCase().includes(searchQuery.toLowerCase()) || name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'All' || t.status === statusFilter
      || (statusFilter === 'Active' && !['Resolved', 'Rejected'].includes(t.status));
    return matchSearch && matchStatus;
  }), [tickets, searchQuery, statusFilter]);

  useEffect(() => { setPage(0); }, [searchQuery, statusFilter]);

  const paginatedTickets = useMemo(
    () => filteredTickets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredTickets, page, rowsPerPage]
  );

  const handleSubmitTicket = async (e) => {
    e.preventDefault(); setError(null);
    const { selectedItem, issue, priority } = formData;
    if (!selectedItem) { setError('Please select an asset or device.'); return; }
    if (!issue.trim()) { setError('Please describe the issue.'); return; }
    setSubmitting(true);
    try {
      let payload = { issue, priority };
      if (selectedItem.startsWith('asset:')) payload.assetId = selectedItem.replace('asset:', '');
      else if (selectedItem.startsWith('dreq:')) {
        const [, id, ...labelParts] = selectedItem.split(':');
        payload.deviceRequestId = id;
        payload.itemLabel = labelParts.join(':');
      }
      const response = await api.post('/tickets', payload, { timeout: 20000 });

      if (imageFile) {
        const fd = new FormData();
        fd.append('files', imageFile);
        await api.post(`/tickets/${response.data._id}/attachments`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000,
        });
      }

      showSnackbar('Ticket raised successfully.');
      setRaiseOpen(false);
      setFormData({ selectedItem: '', issue: '', priority: 'Medium' });
      setImageFile(null);
      fetchData();
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timed out. Please try again.');
      } else {
        setError(err.response?.data?.message || 'Failed to submit ticket. Please check your connection.');
      }
    }
    finally { setSubmitting(false); }
  };

  // Deep-link support: open a ticket's detail drawer directly (e.g. from Global Search)
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (!highlightId || tickets.length === 0) return;
    const match = tickets.find(t => t._id === highlightId);
    if (match) {
      setStatusFilter('All');
      openDrawer(match);
      navigate('/tickets', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, searchParams]);

  const openDrawer = async (ticket) => {
    setSelectedTicket(ticket);
    setDrawerOpen(true);
    setActiveTab('timeline');
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/tickets/${ticket._id}`);
      setTicketDetail(data);
    } catch { setTicketDetail(null); }
    finally { setDetailLoading(false); }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => { setSelectedTicket(null); setTicketDetail(null); setCommentText(''); }, 300);
  };

  const handleStatusUpdate = async (id, newStatus, extra = {}) => {
    try {
      await api.put(`/tickets/${id}/status`, { status: newStatus, ...extra });
      setTickets(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : prev);
      showSnackbar(`Status updated to "${newStatus}"`);
      setSelectedTechnicianId('');
      setSelectedServiceCenterId('');
    } catch (err) { showError(err.response?.data?.message || 'Failed to update status.'); }
  };

  const handleConfirmResolution = async (id) => {
    try {
      const { data } = await api.put(`/tickets/${id}/confirm`, {});
      setTickets(prev => prev.map(t => t._id === id ? data : t));
      setSelectedTicket(prev => prev && prev._id === id ? data : prev);
      showSnackbar('Resolution confirmed. Ticket closed.');
    } catch (err) { showError(err.response?.data?.message || 'Failed to confirm resolution.'); }
  };

  const handlePriorityUpdate = async (id, newPriority) => {
    try {
      await api.put(`/tickets/${id}/priority`, { priority: newPriority });
      setTickets(prev => prev.map(t => t._id === id ? { ...t, priority: newPriority } : t));
      setSelectedTicket(prev => prev ? { ...prev, priority: newPriority } : prev);
      showSnackbar(`Priority updated to "${newPriority}"`);
    } catch (err) { showError(err.response?.data?.message || 'Failed to update priority.'); }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const { data } = await api.post(`/tickets/${selectedTicket._id}/comments`, { text: commentText });
      // API returns the full refreshed comments array, not a single comment
      setTicketDetail(prev => ({ ...prev, comments: Array.isArray(data) ? data : [...(prev?.comments || []), data] }));
      setCommentText('');
    } catch { showError('Failed to add comment.'); }
    finally { setCommentSubmitting(false); }
  };

  const handleVendorRemark = async () => {
    if (!remarkText.trim()) return;
    setRemarkSubmitting(true);
    try {
      const { data } = await api.post(`/tickets/${selectedTicket._id}/comments`, {
        text: `[Vendor Remark] ${remarkText.trim()}`,
      });
      setTicketDetail(prev => ({ ...prev, comments: Array.isArray(data) ? data : [...(prev?.comments || []), data] }));
      setRemarkText('');
      setRemarkOpen(false);
      setActiveTab('comments');
    } catch { showError('Failed to save vendor remark.'); }
    finally { setRemarkSubmitting(false); }
  };

  const handleAttachFiles = async (files) => {
    if (!files?.length) return;
    setAttachmentUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach(f => fd.append('files', f));
      const { data } = await api.post(`/tickets/${selectedTicket._id}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTicketDetail(prev => ({ ...prev, attachments: data.attachments }));
    } catch { showError('Failed to upload attachments.'); }
    finally { setAttachmentUploading(false); }
  };

  const handleDeleteAttachment = async (attId) => {
    try {
      await api.delete(`/tickets/${selectedTicket._id}/attachments/${attId}`);
      setTicketDetail(prev => ({ ...prev, attachments: prev.attachments.filter(a => a._id !== attId) }));
    } catch { showError('Failed to delete attachment.'); }
  };

  const confirmDelete = async () => {
    if (!ticketToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/tickets/${ticketToDelete._id}`);
      showSnackbar(`Ticket ${ticketToDelete.ticketId} deleted.`);
      setDeleteDialogOpen(false);
      setTicketToDelete(null);
      if (selectedTicket?._id === ticketToDelete._id) closeDrawer();
      fetchData();
    } catch (err) { showError(err.response?.data?.message || 'Failed to delete ticket.'); }
    finally { setDeleting(false); }
  };

  // KPIs
  const totalCount   = tickets.length;
  const pendingCount = tickets.filter(t => ['Pending HOD Approval', 'Pending Approval'].includes(t.status)).length;
  const repairCount  = tickets.filter(t => ['Under Repair', 'Assigned to Technician', 'Vendor Assigned'].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;
  const kpiStats = [
    { label: 'Total Tickets',    value: totalCount,    color: 'text.primary', icon: <ConfirmationNumberRounded fontSize="small" /> },
    { label: 'Pending Approval', value: pendingCount,  color: '#FBBF24', icon: <HourglassEmptyRounded fontSize="small" /> },
    { label: 'Under Repair',     value: repairCount,   color: '#FBBF24', icon: <HandymanRounded fontSize="small" /> },
    { label: 'Resolved',          value: resolvedCount, color: '#FBBF24', icon: <TaskAltRounded fontSize="small" /> },
  ];

  const inputStyles = { '& .MuiOutlinedInput-root': { borderRadius: '12px', fontWeight: 600 } };
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 15 } } };

  return (
    <Box sx={{ width: '100%', pb: 5 }}>

      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(17,24,39,0.12)' }}>
            <BuildRounded sx={{ color: 'text.primary' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>Breakdown Tickets</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Raise issues, track service activity, and view repair lifecycles</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchData} sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '12px', transition: 'all 0.3s', '&:hover': { transform: 'rotate(180deg)' } }}>
              <RefreshRounded />
            </IconButton>
          </Tooltip>
          {!isTechnician && (
            <Button variant="contained" startIcon={<AddRounded />} onClick={() => { setError(null); setRaiseOpen(true); }}
              sx={{ background: '#FBBF24', color: '#111827', fontWeight: 800, borderRadius: '12px', px: 2.5, boxShadow: 'none' }}>
              Raise Ticket
            </Button>
          )}
        </Box>
      </Box>

      {/* KPI */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {kpiStats.map(k => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={k.label}>
            <Paper sx={{ p: 2.5, borderRadius: '16px', border: 1, borderColor: 'divider', position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: k.color }} />
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${k.color}18`, display: 'grid', placeItems: 'center', mb: 1.5 }}>
                <Box sx={{ color: k.color }}>{k.icon}</Box>
              </Box>
              <Typography fontSize={28} fontWeight={950} sx={{ lineHeight: 1, letterSpacing: "-1px" }}>{k.value}</Typography>
              <Typography fontSize={13} fontWeight={700} color="text.secondary" mt={0.3}>{k.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filter Bar */}
      <Paper sx={{ p: 2, borderRadius: '16px', border: 1, borderColor: 'divider', mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField placeholder="Search by Ticket ID or Asset Name..." size="small"
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> } }}
        />
        <TextField select size="small" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          sx={{ minWidth: 190, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
          <MenuItem value="Active">Active (Open)</MenuItem>
          <MenuItem value="All">All Statuses</MenuItem>
          {STATUS_LIST.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <Button variant="outlined" onClick={() => { setSearchQuery(''); setStatusFilter('Active'); }}
          sx={{ borderColor: 'divider', color: 'text.secondary', borderRadius: '10px', fontWeight: 700, textTransform: 'none', height: 40, px: 2 }}>
          Clear
        </Button>
      </Paper>

      {/* Ticket Cards */}
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(6)].map((_, i) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={i}>
              <Paper sx={{ p: 3, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                  <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px', flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={22} />
                    <Skeleton variant="text" width="40%" height={16} />
                  </Box>
                </Box>
                <Skeleton variant="text" width="90%" /><Skeleton variant="text" width="70%" sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Skeleton variant="rounded" width={90} height={26} sx={{ borderRadius: '8px' }} />
                  <Skeleton variant="rounded" width={110} height={26} sx={{ borderRadius: '8px' }} />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : filteredTickets.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '20px', border: '1px dashed', borderColor: 'divider' }}>
          <AssignmentRounded sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography fontWeight={800} fontSize={18}>No Tickets Found</Typography>
          <Typography color="text.secondary" fontWeight={500} mt={1}>No breakdown tickets match your current filters.</Typography>
        </Paper>
      ) : (
        <>
        <Grid container spacing={3} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
          <AnimatePresence>
            {paginatedTickets.map(ticket => {
              const sc = getStatusColor(ticket.status);
              const pc = getPriorityColor(ticket.priority);
              const slaHours = { Critical: 4, High: 8, Medium: 24, Low: 72 }[ticket.priority] || 24;
              const elapsed = Math.floor((Date.now() - new Date(ticket.createdAt)) / 3600000);
              const slaPct = Math.min(100, Math.round((elapsed / slaHours) * 100));
              const slaBreached = slaPct >= 100;
              const slaWarning = slaPct >= 75;
              const isActive = ticket.status !== 'Resolved' && ticket.status !== 'Rejected';

              return (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={ticket._id} component={motion.div} variants={itemVariants} layout exit={{ opacity: 0, scale: 0.95 }}>
                  <Paper
                    onClick={() => openDrawer(ticket)}
                    sx={{
                      borderRadius: '20px', height: '100%', border: 1, borderColor: 'divider',
                      display: 'flex', flexDirection: 'column', cursor: 'pointer',
                      position: 'relative', overflow: 'hidden',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 20px 48px rgba(15,23,42,0.12)',
                        borderColor: 'rgba(17,24,39,0.35)',
                        '& .arrow-icon': { opacity: 1, transform: 'translateX(0)' },
                        '& .delete-btn': { opacity: 1 },
                      },
                    }}>
                    {/* Priority stripe */}
                    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: pc.left }} />

                    <Box sx={{ p: 3, pl: 3.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Top row: header + delete */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2, pr: 1 }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${pc.left}18`, color: pc.left, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <BuildRounded sx={{ fontSize: 20 }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontSize={15} fontWeight={900} sx={{ lineHeight: 1.3, letterSpacing: '-0.3px' }}>
                            {ticket.asset?.name || ticket.itemLabel || ticket.deviceRequestRef?.itemRequested || 'Unknown Asset'}
                          </Typography>
                          <Typography color="text.disabled" fontSize={11} fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                            {ticket.ticketId} · {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </Typography>
                        </Box>
                        {canDeleteTicket(ticket) && (
                          <Tooltip title={isAdminOrHod ? "Delete ticket" : "Withdraw ticket"}>
                            <IconButton className="delete-btn" size="small"
                              onClick={e => { e.stopPropagation(); setTicketToDelete(ticket); setDeleteDialogOpen(true); }}
                              sx={{ opacity: 0, transition: 'all 0.2s', width: 30, height: 30, borderRadius: '8px', '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.1)' } }}>
                              <DeleteOutlineRounded sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>

                      {/* Issue */}
                      <Typography sx={{ fontSize: 13, color: 'text.secondary', flex: 1, lineHeight: 1.65, fontWeight: 500, mb: 2, fontStyle: 'italic' }}>
                        "{ticket.issue}"
                      </Typography>

                      {/* Status + Priority chips */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip label={ticket.status} size="small"
                          sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 800, borderRadius: '8px', fontSize: 11, border: `1px solid ${sc.border}50` }} />
                        <Chip label={`${ticket.priority} Priority`} size="small" variant="outlined"
                          sx={{ bgcolor: pc.bg, color: pc.color, borderColor: pc.border, fontWeight: 800, borderRadius: '8px', fontSize: 11 }} />
                      </Box>

                      {/* SLA bar */}
                      {isActive && (
                        <Box sx={{ mb: 2.5, p: 1.5, borderRadius: '10px', bgcolor: slaBreached ? 'rgba(239,68,68,0.06)' : 'action.hover', border: '1px solid', borderColor: slaBreached ? 'rgba(239,68,68,0.25)' : 'divider' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.7 }}>
                            <Typography sx={{ fontSize: 10, fontWeight: 800, color: slaBreached ? '#EF4444' : slaWarning ? '#F59E0B' : 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              SLA {slaBreached ? 'BREACHED' : slaWarning ? 'AT RISK' : 'On Track'}
                            </Typography>
                            <Typography sx={{ fontSize: 10, fontWeight: 800, color: slaBreached ? '#EF4444' : 'text.disabled' }}>{elapsed}h / {slaHours}h</Typography>
                          </Box>
                          <Box sx={{ height: 4, bgcolor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', width: `${slaPct}%`, bgcolor: slaBreached ? '#EF4444' : slaWarning ? '#F59E0B' : '#111827', borderRadius: 2 }} />
                          </Box>
                        </Box>
                      )}

                      {canConfirmResolution(ticket) && (
                        <Button fullWidth size="small" variant="contained" startIcon={<CheckCircleRounded />}
                          onClick={e => { e.stopPropagation(); handleConfirmResolution(ticket._id); }}
                          sx={{ mb: 1.5, bgcolor: '#16a34a', color: '#fff', fontWeight: 800, borderRadius: '10px', textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#15803d' } }}>
                          Confirm Resolution
                        </Button>
                      )}
                      {ticket.status === 'Resolved' && ticket.userConfirmed && (
                        <Chip icon={<CheckCircleRounded sx={{ fontSize: 15 }} />} label="Confirmed by you" size="small"
                          sx={{ mb: 1.5, bgcolor: 'rgba(22,163,74,0.12)', color: '#4ade80', fontWeight: 800, borderRadius: '8px', alignSelf: 'flex-start' }} />
                      )}

                      <Divider sx={{ mb: 1.5 }} />

                      {/* Footer */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                          By <span style={{ fontWeight: 800 }}>{ticket.raisedBy?.name || 'System'}</span>
                        </Typography>
                        <Box className="arrow-icon" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.primary', fontSize: 12, fontWeight: 800, opacity: 0, transform: 'translateX(-4px)', transition: 'all 0.2s' }}>
                          <Typography fontSize={12} fontWeight={800} color="text.primary">View Details</Typography>
                          <ChevronRightRounded sx={{ fontSize: 16, color: 'text.primary' }} />
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </AnimatePresence>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <TablePagination
            component="div"
            count={filteredTickets.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[6, 9, 18, 30]}
            sx={{ color: 'text.secondary', '.MuiTablePagination-toolbar': { justifyContent: 'center' } }}
          />
        </Box>
        </>
      )}

      {/* ───── Ticket Detail Drawer ───── */}
      <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 520 }, bgcolor: 'background.paper', border: 0, borderLeft: '1px solid', borderColor: 'divider', boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' } } }}>
        {selectedTicket && (() => {
          const sc = getStatusColor(selectedTicket.status);
          const pc = getPriorityColor(selectedTicket.priority);
          const tl = generateTimeline(ticketDetail || selectedTicket);
          const isAuth = isAuthorizedApprover(selectedTicket);
          return (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Drawer Header */}
              <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', background: 'linear-gradient(135deg,rgba(17,24,39,0.08),rgba(17,24,39,0.04))' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: '#111827', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <BuildRounded sx={{ color: '#fff', fontSize: 22 }} />
                    </Box>
                    <Box>
                      <Typography fontWeight={900} fontSize={17} sx={{ lineHeight: 1.2 }}>
                        {selectedTicket.asset?.name || selectedTicket.itemLabel || 'Unknown Asset'}
                      </Typography>
                      <Typography fontSize={12} color="text.disabled" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                        {selectedTicket.ticketId}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={closeDrawer} sx={{ bgcolor: 'action.hover', borderRadius: '10px', mt: -0.5 }}>
                    <CloseRounded />
                  </IconButton>
                </Box>

                {/* Status + Priority row */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={selectedTicket.status} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 800, borderRadius: '8px', border: `1px solid ${sc.border}50`, fontSize: 12 }} />
                  <Chip label={`${selectedTicket.priority} Priority`} size="small" variant="outlined" sx={{ bgcolor: pc.bg, color: pc.color, borderColor: pc.border, fontWeight: 800, borderRadius: '8px', fontSize: 12 }} />
                </Box>
              </Box>

              {/* ── HOD/Admin Quick Approval Panel (Pending HOD Approval) ── */}
              {selectedTicket.status === 'Pending HOD Approval' && isAuth && (
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(22,163,74,0.03)' }}>
                  <Typography fontSize={10} fontWeight={800} color="text.secondary" mb={1} sx={{ textTransform: 'uppercase', letterSpacing: '0.6px' }}>Assign Technician &amp; Approve</Typography>
                  <Select fullWidth size="small" displayEmpty value={selectedTechnicianId}
                    onChange={e => setSelectedTechnicianId(e.target.value)}
                    sx={{ borderRadius: '10px', fontSize: 13, fontWeight: 700, mb: 1.5 }}>
                    <MenuItem value="" disabled><em>Select a Technician…</em></MenuItem>
                    {technicians.map(t => (
                      <MenuItem key={t._id} value={t._id} sx={{ fontWeight: 600, fontSize: 13 }}>
                        {t.name} <span style={{ marginLeft: 6, color: '#64748B', fontSize: 11 }}>({t.department})</span>
                      </MenuItem>
                    ))}
                    {technicians.length === 0 && <MenuItem disabled>No technicians found</MenuItem>}
                  </Select>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button fullWidth variant="contained" color="success" startIcon={<CheckCircleRounded />}
                      disabled={!selectedTechnicianId}
                      onClick={() => handleStatusUpdate(selectedTicket._id, 'Assigned to Technician', { assignedTechnicianId: selectedTechnicianId })}
                      sx={{ fontWeight: 800, borderRadius: '10px', textTransform: 'none', py: 1, boxShadow: 'none', bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A', boxShadow: 'none' } }}>
                      Approve &amp; Assign
                    </Button>
                    <Button fullWidth variant="outlined" color="error" startIcon={<CloseRounded />}
                      onClick={() => handleStatusUpdate(selectedTicket._id, 'Rejected')}
                      sx={{ fontWeight: 800, borderRadius: '10px', textTransform: 'none', py: 1 }}>
                      Reject
                    </Button>
                  </Box>
                </Box>
              )}

              {selectedTicket.status === 'Pending HOD Approval' && !isAuth && (
                <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(249,115,22,0.03)' }}>
                  <Typography fontSize={12} fontWeight={700} color="#F97316">
                    Awaiting HOD approval from {selectedTicket.raisedBy?.department || 'their respective'} Department.
                  </Typography>
                </Box>
              )}

              {/* ── Technician Action Panel (Assigned to Technician) ── */}
              {canTechnicianAct(selectedTicket) && (
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(14,165,233,0.03)' }}>
                  <Typography fontSize={10} fontWeight={800} color="text.secondary" mb={1.5} sx={{ textTransform: 'uppercase', letterSpacing: '0.6px' }}>Take Action on This Ticket</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button fullWidth variant="contained" startIcon={<TaskAltRounded />}
                      onClick={() => handleStatusUpdate(selectedTicket._id, 'Resolved')}
                      sx={{ fontWeight: 800, borderRadius: '10px', textTransform: 'none', py: 1, boxShadow: 'none', bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A', boxShadow: 'none' } }}>
                      Mark Resolved
                    </Button>
                    <Button fullWidth variant="outlined" startIcon={<HandymanRounded />}
                      onClick={() => handleStatusUpdate(selectedTicket._id, 'Service Center Required')}
                      sx={{ fontWeight: 800, borderRadius: '10px', textTransform: 'none', py: 1, borderColor: '#F97316', color: '#F97316', '&:hover': { bgcolor: 'rgba(249,115,22,0.06)', borderColor: '#F97316' } }}>
                      Service Center Required
                    </Button>
                  </Box>
                </Box>
              )}

              {/* ── HOD Service Center Assignment Panel (Service Center Required) ── */}
              {selectedTicket.status === 'Service Center Required' && isAuth && (
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(239,68,68,0.03)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444', flexShrink: 0 }} />
                    <Typography fontSize={12} fontWeight={700} color="#EF4444">Technician could not resolve this. Please assign a service center.</Typography>
                  </Box>
                  <Typography fontSize={10} fontWeight={800} color="text.secondary" mb={1} sx={{ textTransform: 'uppercase', letterSpacing: '0.6px' }}>Select Service Center</Typography>
                  <Select fullWidth size="small" displayEmpty value={selectedServiceCenterId}
                    onChange={e => setSelectedServiceCenterId(e.target.value)}
                    sx={{ borderRadius: '10px', fontSize: 13, fontWeight: 700, mb: 1.5 }}>
                    <MenuItem value="" disabled><em>Select a Service Center…</em></MenuItem>
                    {serviceCenters.map(sc => (
                      <MenuItem key={sc._id} value={sc._id} sx={{ fontWeight: 600, fontSize: 13 }}>
                        {sc.name} <span style={{ marginLeft: 6, color: '#64748B', fontSize: 11 }}>({sc.city || sc.location || ''})</span>
                      </MenuItem>
                    ))}
                    {serviceCenters.length === 0 && <MenuItem disabled>No service centers found</MenuItem>}
                  </Select>
                  <Button fullWidth variant="contained" disabled={!selectedServiceCenterId || assigningAction}
                    onClick={async () => {
                      setAssigningAction(true);
                      await handleStatusUpdate(selectedTicket._id, 'Sent to Service Center', { assignedVendor: selectedServiceCenterId });
                      setAssigningAction(false);
                    }}
                    sx={{ fontWeight: 800, borderRadius: '10px', textTransform: 'none', py: 1, boxShadow: 'none', background: 'linear-gradient(135deg,#3B82F6,#2563EB)' }}>
                    Send to Service Center
                  </Button>
                </Box>
              )}

              {selectedTicket.status === 'Service Center Required' && !isAuth && (
                <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(239,68,68,0.03)' }}>
                  <Typography fontSize={12} fontWeight={700} color="#EF4444">
                    ⚠️ Technician escalated this ticket — awaiting HOD to assign a service center.
                  </Typography>
                </Box>
              )}

              {/* Admin controls */}
              {isAdminOrHod && (
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontSize={10} fontWeight={800} color="text.secondary" mb={0.8} sx={{ textTransform: 'uppercase', letterSpacing: '0.6px' }}>Change Status</Typography>
                    <Select fullWidth size="small" value={selectedTicket.status}
                      onChange={e => handleStatusUpdate(selectedTicket._id, e.target.value)}
                      sx={{ borderRadius: '10px', fontSize: 13, fontWeight: 700 }}>
                      {STATUS_LIST.map(s => <MenuItem key={s} value={s} sx={{ fontSize: 13, fontWeight: 600 }}>{s}</MenuItem>)}
                    </Select>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontSize={10} fontWeight={800} color="text.secondary" mb={0.8} sx={{ textTransform: 'uppercase', letterSpacing: '0.6px' }}>Priority</Typography>
                    <Select fullWidth size="small" value={selectedTicket.priority}
                      onChange={e => handlePriorityUpdate(selectedTicket._id, e.target.value)}
                      sx={{ borderRadius: '10px', fontSize: 13, fontWeight: 700 }}>
                      {['Low', 'Medium', 'High', 'Critical'].map(p => (
                        <MenuItem key={p} value={p} sx={{ fontSize: 13, fontWeight: 600, color: p === 'Critical' ? '#EF4444' : 'inherit' }}>{p}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Box>
              )}

              {/* ── Vendor Remark ── */}
              {['Vendor Assigned', 'Sent to Service Center', 'Under Repair'].includes(selectedTicket.status) && isAdminOrHod && (
                <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(251,191,36,0.04)' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<span style={{ fontSize: 15 }}>📞</span>}
                    onClick={() => { setRemarkText(''); setRemarkOpen(true); }}
                    sx={{ fontWeight: 800, borderRadius: '10px', textTransform: 'none', fontSize: 13, py: 0.9,
                      borderColor: '#FBBF24', color: '#B45309',
                      '&:hover': { bgcolor: 'rgba(251,191,36,0.08)', borderColor: '#F59E0B' } }}>
                    Add Vendor Remark
                  </Button>
                </Box>
              )}

              {/* Tabs */}
              <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider' }}>
                {[['timeline', 'Timeline'], ['comments', 'Comments'], ['attachments', 'Attachments']].map(([id, label]) => (
                  <Button key={id} onClick={() => setActiveTab(id)}
                    sx={{
                      flex: 1, py: 1.5, borderRadius: 0, fontWeight: 800, fontSize: 13, textTransform: 'none',
                      color: activeTab === id ? 'text.primary' : 'text.secondary',
                      borderBottom: activeTab === id ? '2px solid' : '2px solid transparent',
                      borderColor: activeTab === id ? 'text.primary' : 'transparent',
                      mb: '-1px', transition: 'all 0.2s',
                      '&:hover': { color: 'text.primary', bgcolor: 'rgba(255,255,255,0.03)' }
                    }}>
                    {label}
                    {id === 'comments' && ticketDetail?.comments?.length > 0 && (
                      <Box component="span" sx={{ ml: 1, px: 0.8, py: 0.1, borderRadius: '20px', bgcolor: 'rgba(255,255,255,0.1)', color: 'text.primary', fontSize: 10, fontWeight: 900 }}>
                        {ticketDetail.comments.length}
                      </Box>
                    )}
                    {id === 'attachments' && ticketDetail?.attachments?.length > 0 && (
                      <Box component="span" sx={{ ml: 1, px: 0.8, py: 0.1, borderRadius: '20px', bgcolor: 'rgba(59,130,246,0.12)', color: '#3B82F6', fontSize: 10, fontWeight: 900 }}>
                        {ticketDetail.attachments.length}
                      </Box>
                    )}
                  </Button>
                ))}
              </Box>

              {/* Tab Content */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>

                {/* Quick info cards */}
                <Grid container spacing={1.5} sx={{ mb: 3 }}>
                  {[
                    ['Raised By', selectedTicket.raisedBy?.name || 'System'],
                    ['Department', selectedTicket.asset?.department || selectedTicket.raisedBy?.department || 'N/A'],
                    ['Created', new Date(selectedTicket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
                    ['Issue', selectedTicket.issue],
                  ].map(([label, value]) => (
                    <Grid size={{ xs: 6 }} key={label}>
                      <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                        <Typography fontSize={10} fontWeight={800} color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</Typography>
                        <Typography fontSize={13} fontWeight={700} mt={0.3} sx={{ wordBreak: 'break-word' }}>{value}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* TIMELINE TAB */}
                {activeTab === 'timeline' && (
                  <Box>
                    {tl.map((step, idx) => (
                      <Box key={step.title} sx={{ display: 'flex', gap: 2, position: 'relative', pb: idx === tl.length - 1 ? 0 : 3.5 }}>
                        {idx !== tl.length - 1 && (
                          <Box sx={{ position: 'absolute', left: 21, top: 44, bottom: 0, width: 2, bgcolor: step.done ? '#22C55E' : 'divider' }} />
                        )}
                        <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: step.done ? 'rgba(34,197,94,0.1)' : 'action.hover', color: step.done ? '#22C55E' : 'text.disabled', display: 'grid', placeItems: 'center', flexShrink: 0, border: '2px solid', borderColor: step.done ? '#22C55E' : 'divider', zIndex: 1 }}>
                          {step.done ? <CheckCircleRounded /> : <PendingActionsRounded />}
                        </Box>
                        <Box sx={{ pt: 1.2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Typography fontWeight={900} color={step.done ? 'text.primary' : 'text.secondary'} fontSize={15}>{step.title}</Typography>
                            <Box sx={{ fontSize: 11, color: step.done ? '#22C55E' : 'text.disabled', fontWeight: 800, bgcolor: step.done ? 'rgba(34,197,94,0.1)' : 'action.hover', px: 1.2, py: 0.3, borderRadius: '6px' }}>
                              {step.time}
                            </Box>
                          </Box>
                          <Typography color="text.secondary" fontWeight={500} mt={0.4} fontSize={13}>{step.desc}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* COMMENTS TAB */}
                {activeTab === 'comments' && (
                  <Box>
                    {detailLoading ? (
                      <Stack spacing={1.5}>{[1,2].map(i => <Skeleton key={i} variant="rounded" height={70} sx={{ borderRadius: '12px' }} />)}</Stack>
                    ) : ticketDetail?.comments?.length > 0 ? (
                      <Stack spacing={1.5} sx={{ mb: 3 }}>
                        {ticketDetail.comments.map(c => (
                          <Box key={c._id} sx={{ display: 'flex', gap: 1.5 }}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: 'text.primary', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>
                              {(c.authorName || 'U').charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography fontSize={13} fontWeight={800}>{c.authorName || 'User'}</Typography>
                                <Typography fontSize={11} color="text.disabled">{new Date(c.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Typography>
                              </Box>
                              {c.text?.startsWith('[Vendor Remark]') ? (
                                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 0.5 }}>
                                    <span style={{ fontSize: 13 }}>📞</span>
                                    <Typography fontSize={10} fontWeight={900} sx={{ color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vendor Remark</Typography>
                                  </Box>
                                  <Typography fontSize={13} color="text.secondary" sx={{ lineHeight: 1.6 }}>{c.text.replace('[Vendor Remark] ', '')}</Typography>
                                </Box>
                              ) : (
                                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                                  <Typography fontSize={13} color="text.secondary" sx={{ lineHeight: 1.6 }}>{c.text}</Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Box sx={{ py: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: '12px', border: '1px dashed', borderColor: 'divider', mb: 3 }}>
                        <ChatBubbleOutlineRounded sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                        <Typography fontSize={13} color="text.disabled" fontWeight={600}>No comments yet</Typography>
                      </Box>
                    )}
                    {/* Add comment */}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                      <TextField fullWidth multiline maxRows={4} size="small" placeholder="Add a comment… (Ctrl+Enter to send)"
                        value={commentText} onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddComment(); }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                      <Button variant="contained" onClick={handleAddComment} disabled={commentSubmitting || !commentText.trim()}
                        sx={{ background: '#FBBF24', color: '#111827', fontWeight: 800, borderRadius: '12px', boxShadow: 'none', minWidth: 80, py: 1.1 }}>
                        {commentSubmitting ? <CircularProgress size={18} color="inherit" /> : 'Send'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* ATTACHMENTS TAB */}
                {activeTab === 'attachments' && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                      <Button size="small" variant="outlined" startIcon={attachmentUploading ? <CircularProgress size={14} /> : <UploadFileRounded />}
                        component="label" disabled={attachmentUploading}
                        sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none', borderColor: '#111827', color: 'text.primary', '&:hover': { bgcolor: 'rgba(17,24,39,0.08)' } }}>
                        Upload Files
                        <input type="file" hidden multiple accept="image/*,.pdf,.doc,.docx,.txt,.log"
                          ref={attachFileRef} onChange={e => handleAttachFiles(e.target.files)} />
                      </Button>
                    </Box>
                    {detailLoading ? (
                      <Skeleton variant="rounded" height={80} sx={{ borderRadius: '12px' }} />
                    ) : !ticketDetail?.attachments?.length ? (
                      <Box sx={{ py: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: '12px', border: '1px dashed', borderColor: 'divider' }}>
                        <AttachFileRounded sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                        <Typography fontSize={13} color="text.disabled" fontWeight={600}>No attachments yet</Typography>
                      </Box>
                    ) : (
                      <Stack spacing={1.5}>
                        {ticketDetail.attachments.map(att => (
                          <Box key={att._id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: 'rgba(17,24,39,0.12)', display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden' }}>
                              {['.jpg', '.jpeg', '.png', '.gif', '.webp'].some(ext => att.originalName.toLowerCase().endsWith(ext)) ? (
                                <img src={`http://localhost:5000${att.url}`} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <AttachFileRounded sx={{ fontSize: 18, color: 'text.primary' }} />
                              )}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography fontSize={13} fontWeight={700} noWrap>{att.originalName}</Typography>
                              <Typography fontSize={11} color="text.secondary">{att.uploadedBy?.name} · {(att.size / 1024).toFixed(1)} KB</Typography>
                            </Box>
                            <Tooltip title="Open file">
                              <IconButton size="small" component="a" href={`http://localhost:5000${att.url}`} target="_blank" sx={{ borderRadius: '8px' }}>
                                <VisibilityRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {isAdminOrHod && (
                              <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => handleDeleteAttachment(att._id)} sx={{ borderRadius: '8px', '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)' } }}>
                                  <DeleteOutlineRounded fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                )}
              </Box>

              {/* Drawer Footer */}
              {(canConfirmResolution(selectedTicket) || canDeleteTicket(selectedTicket)) && (
                <Box sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  {canConfirmResolution(selectedTicket) ? (
                    <Button variant="contained" startIcon={<CheckCircleRounded />}
                      onClick={() => handleConfirmResolution(selectedTicket._id)}
                      sx={{ bgcolor: '#16a34a', color: '#fff', fontWeight: 800, borderRadius: '10px', textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#15803d' } }}>
                      Confirm Resolution
                    </Button>
                  ) : <Box />}
                  {canDeleteTicket(selectedTicket) && (
                    <Button variant="outlined" color="error" startIcon={<DeleteOutlineRounded />}
                      onClick={() => { setTicketToDelete(selectedTicket); setDeleteDialogOpen(true); }}
                      sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}>
                      {isAdminOrHod ? 'Delete Ticket' : 'Withdraw Ticket'}
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          );
        })()}
      </Drawer>

      {/* Raise Ticket Dialog */}
      <Dialog open={raiseOpen} onClose={() => setRaiseOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '20px', overflow: 'hidden' } }, backdrop: { sx: { backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' } } }}>
        <Box sx={{ p: 3, background: 'linear-gradient(135deg,rgba(17,24,39,0.1),rgba(17,24,39,0.05))', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: '#111827', display: 'grid', placeItems: 'center' }}>
              <AssignmentRounded sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography fontWeight={900} fontSize={18}>Raise Breakdown Ticket</Typography>
              <Typography fontSize={12} color="text.secondary">Select an asset and describe the issue</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setRaiseOpen(false)} sx={{ bgcolor: 'action.hover', borderRadius: '10px' }}><CloseRounded /></IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {/* noValidate: native validation can't show its bubble on MUI's hidden
              select input, silently blocking submit — JS validation handles it */}
          <form onSubmit={handleSubmitTicket} noValidate>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, display: 'block', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.6px' }}>Select Asset / Device</Typography>
                <TextField fullWidth select required autoFocus sx={inputStyles} name="selectedItem" value={formData.selectedItem} onChange={e => setFormData({ ...formData, selectedItem: e.target.value })}>
                  {assets.length === 0 && approvedRequests.length === 0 && <MenuItem disabled value="">No assets available</MenuItem>}
                  {assets.length > 0 && [
                    <MenuItem key="__ah" disabled sx={{ fontSize: 11, fontWeight: 900, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.6px' }}>— Registered Assets —</MenuItem>,
                    ...assets.map(a => <MenuItem key={a._id} value={`asset:${a._id}`} sx={{ fontWeight: 600 }}>{a.name} <span style={{ marginLeft: 6, color: '#64748B' }}>(SN: {a.serialNumber})</span></MenuItem>)
                  ]}
                  {approvedRequests.length > 0 && [
                    <MenuItem key="__dh" disabled sx={{ fontSize: 11, fontWeight: 900, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.6px' }}>— Approved Device Requests —</MenuItem>,
                    ...approvedRequests.map(r => <MenuItem key={r._id} value={`dreq:${r._id}:${r.itemRequested}`} sx={{ fontWeight: 600 }}>{r.itemRequested} <span style={{ color: '#22C55E', marginLeft: 6, fontSize: 12 }}>({r.requestId})</span></MenuItem>)
                  ]}
                </TextField>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, display: 'block', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.6px' }}>Issue Description</Typography>
                <TextField fullWidth required sx={inputStyles} multiline rows={4} name="issue" value={formData.issue}
                  onChange={e => setFormData({ ...formData, issue: e.target.value })} placeholder="Describe the breakdown in detail…" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, display: 'block', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.6px' }}>Severity Level</Typography>
                <TextField fullWidth select required sx={inputStyles} name="priority" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical" sx={{ color: '#EF4444' }}>Critical</MenuItem>
                </TextField>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, display: 'block', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.6px' }}>Attachment / Image</Typography>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadFileRounded />}
                  sx={{
                    width: "100%",
                    py: 1.5,
                    border: "1px dashed",
                    borderColor: "rgba(17,24,39,0.4)",
                    borderRadius: "12px",
                    textTransform: "none",
                    fontWeight: 700,
                    color: "text.primary",
                    "&:hover": { borderColor: "#111827", bgcolor: "rgba(17,24,39,0.04)" }
                  }}
                >
                  {imageFile ? imageFile.name : "Upload image or screenshot (Optional)"}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                  />
                </Button>
                {imageFile && (
                  <Box sx={{ mt: 1, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "action.hover", p: 1, borderRadius: "8px", border: "1px solid", borderColor: "divider" }}>
                    <Typography fontSize={12} fontWeight={600} noWrap sx={{ maxWidth: "80%" }}>{imageFile.name}</Typography>
                    <IconButton size="small" onClick={() => setImageFile(null)} sx={{ color: "error.main" }}>
                      <CloseRounded fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Stack>
            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 2, borderRadius: '12px', fontWeight: 600 }}>{error}</Alert>}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Button onClick={() => { setRaiseOpen(false); setImageFile(null); setSubmitting(false); setError(null); }} sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'none', px: 3, borderRadius: '10px' }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
                sx={{ background: '#FBBF24', color: '#111827', fontWeight: 800, px: 3.5, borderRadius: '12px', boxShadow: 'none' }}>
                {submitting ? 'Submitting…' : 'Submit Ticket'}
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>

      {/* Vendor Remark Dialog */}
      <Dialog open={remarkOpen} onClose={() => { setRemarkOpen(false); setRemarkText(''); }} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: { borderRadius: '20px', overflow: 'hidden', border: 1, borderColor: 'divider' } } }}>
        <Box sx={{ px: 3, pt: 3, pb: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', display: 'grid', placeItems: 'center', fontSize: 18 }}>
              📞
            </Box>
            <Box>
              <Typography fontWeight={900} fontSize={16}>Vendor Remark</Typography>
              <Typography fontSize={12} color="text.secondary" fontWeight={500}>Note what the vendor said</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => { setRemarkOpen(false); setRemarkText(''); }} sx={{ bgcolor: 'action.hover', borderRadius: '10px' }}><CloseRounded /></IconButton>
        </Box>
        <Box sx={{ p: 3 }}>
          <TextField
            fullWidth multiline rows={4} size="small"
            placeholder="e.g. Vendor confirmed part has been ordered, expected delivery in 3 days…"
            value={remarkText}
            onChange={e => setRemarkText(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: 13 } }}
          />
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
            <Button fullWidth variant="outlined" onClick={() => { setRemarkOpen(false); setRemarkText(''); }}
              sx={{ fontWeight: 700, borderRadius: '10px', textTransform: 'none' }}>
              Cancel
            </Button>
            <Button fullWidth variant="contained" disabled={!remarkText.trim() || remarkSubmitting}
              onClick={handleVendorRemark}
              sx={{ fontWeight: 800, borderRadius: '10px', textTransform: 'none', boxShadow: 'none', background: '#FBBF24', color: '#111827',
                '&:hover': { background: '#F59E0B', boxShadow: 'none' } }}>
              {remarkSubmitting ? <CircularProgress size={18} color="inherit" /> : 'Save Remark'}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setTicketToDelete(null); }}
        slotProps={{ paper: { sx: { borderRadius: '20px', overflow: 'hidden', maxWidth: 400, border: 1, borderColor: 'divider' } } }}>
        <Box sx={{ p: 3, background: 'linear-gradient(135deg,rgba(239,68,68,0.1),rgba(239,68,68,0.05))', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: '#EF4444', display: 'grid', placeItems: 'center' }}>
              <DeleteOutlineRounded sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography fontWeight={900} fontSize={17}>{isAdminOrHod ? 'Delete Ticket' : 'Withdraw Ticket'}</Typography>
              <Typography fontSize={12} color="text.secondary">{ticketToDelete?.ticketId}</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => { setDeleteDialogOpen(false); setTicketToDelete(null); }} sx={{ bgcolor: 'action.hover', borderRadius: '10px' }}><CloseRounded /></IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Typography color="text.secondary" fontWeight={600} fontSize={14} sx={{ lineHeight: 1.7 }}>
            Are you sure you want to permanently delete ticket <strong>{ticketToDelete?.ticketId}</strong>? This action cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={() => { setDeleteDialogOpen(false); setTicketToDelete(null); }} sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'none', borderRadius: '10px' }}>Cancel</Button>
            <Button onClick={confirmDelete} disabled={deleting} variant="contained"
              sx={{ bgcolor: '#EF4444', color: '#fff', fontWeight: 800, textTransform: 'none', borderRadius: '12px', boxShadow: 'none', '&:hover': { bgcolor: '#DC2626' } }}>
              {deleting ? 'Deleting…' : 'Delete Permanently'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: '14px', fontWeight: 800 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Tickets;
