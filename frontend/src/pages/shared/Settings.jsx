import { useState } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, TextField, Button, Alert, Switch,
  FormControlLabel, CircularProgress, Divider, Chip, Grid, MenuItem, Select,
  FormControl, InputLabel, InputAdornment, IconButton, Snackbar
} from '@mui/material';
import {
  PersonRounded, PaletteRounded, AssessmentRounded, SecurityRounded,
  DownloadRounded, Visibility, VisibilityOff, DarkModeRounded, LightModeRounded,
  SaveRounded, LockRounded, DataObjectRounded, RefreshRounded
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

// ─── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ currentUser }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Change password
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurr, setShowCurr] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      await api.put('/settings/profile', { name, phone });
      setMsg('Profile updated successfully.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  const handleChangePass = async () => {
    setPassMsg('');
    if (newPass.length < 6) { setPassMsg('New password must be at least 6 characters.'); return; }
    if (newPass !== confirm) { setPassMsg('Passwords do not match.'); return; }
    setPassLoading(true);
    try {
      await api.put('/settings/change-password', { currentPassword: current, newPassword: newPass });
      setPassMsg('✓ Password changed successfully.');
      setCurrent(''); setNewPass(''); setConfirm('');
    } catch (err) {
      setPassMsg(err.response?.data?.message || 'Failed to change password.');
    } finally { setPassLoading(false); }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography fontWeight={700} fontSize={16} mb={2.5}>Personal Information</Typography>
          <TextField label="Full Name" value={name} onChange={e => setName(e.target.value)} fullWidth sx={{ mb: 2 }} />
          <TextField label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} fullWidth sx={{ mb: 2 }} placeholder="+91 98765 43210" />
          <TextField label="Email Address" value={currentUser?.email || ''} fullWidth sx={{ mb: 2 }} disabled helperText="Email cannot be changed" />
          <TextField label="Role" value={currentUser?.role || ''} fullWidth sx={{ mb: 3 }} disabled />
          {msg && <Alert severity={msg.includes('success') ? 'success' : 'error'} sx={{ mb: 2 }}>{msg}</Alert>}
          <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
            onClick={handleSave} disabled={saving} sx={{ fontWeight: 700, borderRadius: 2 }}>
            Save Changes
          </Button>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography fontWeight={700} fontSize={16} mb={2.5}>Change Password</Typography>
          <TextField
            label="Current Password" type={showCurr ? 'text' : 'password'}
            value={current} onChange={e => setCurrent(e.target.value)} fullWidth sx={{ mb: 2 }}
            InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowCurr(v => !v)}>{showCurr ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }}
          />
          <TextField
            label="New Password" type={showNew ? 'text' : 'password'}
            value={newPass} onChange={e => setNewPass(e.target.value)} fullWidth sx={{ mb: 2 }}
            InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowNew(v => !v)}>{showNew ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }}
          />
          <TextField
            label="Confirm New Password" type="password"
            value={confirm} onChange={e => setConfirm(e.target.value)} fullWidth sx={{ mb: 2 }}
            error={confirm.length > 0 && newPass !== confirm}
            helperText={confirm.length > 0 && newPass !== confirm ? 'Passwords do not match' : ''}
          />
          {passMsg && <Alert severity={passMsg.startsWith('✓') ? 'success' : 'error'} sx={{ mb: 2 }}>{passMsg}</Alert>}
          <Button variant="outlined" startIcon={passLoading ? <CircularProgress size={16} /> : <LockRounded />}
            onClick={handleChangePass} disabled={passLoading || !current || !newPass || !confirm}
            sx={{ fontWeight: 700, borderRadius: 2 }}>
            Change Password
          </Button>
        </Paper>
      </Grid>
    </Grid>
  );
}

// ─── Appearance Tab ────────────────────────────────────────────────────────────
function AppearanceTab() {
  const { mode, toggleMode, isDark } = useAppTheme();
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography fontWeight={700} fontSize={16} mb={1}>Theme</Typography>
          <Typography fontSize={13} color="text.secondary" mb={3}>
            Choose between light and dark mode for the application interface.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {['light', 'dark'].map(m => (
              <Box
                key={m}
                onClick={mode !== m ? toggleMode : undefined}
                sx={{
                  flex: 1, border: '2px solid', borderRadius: 3, p: 2.5, cursor: mode !== m ? 'pointer' : 'default',
                  borderColor: mode === m ? '#4f46e5' : '#e2e8f0',
                  bgcolor: mode === m ? '#eef2ff' : 'transparent',
                  textAlign: 'center', transition: 'all 0.2s',
                  '&:hover': mode !== m ? { borderColor: '#c7d2fe' } : {}
                }}
              >
                {m === 'light' ? <LightModeRounded sx={{ fontSize: 32, color: mode === m ? '#4f46e5' : '#94a3b8' }} /> : <DarkModeRounded sx={{ fontSize: 32, color: mode === m ? '#4f46e5' : '#94a3b8' }} />}
                <Typography fontWeight={700} fontSize={14} color={mode === m ? '#4f46e5' : 'text.secondary'} mt={1}>
                  {m.charAt(0).toUpperCase() + m.slice(1)} Mode
                </Typography>
                {mode === m && <Chip label="Active" size="small" sx={{ mt: 1, bgcolor: '#4f46e5', color: 'white', fontWeight: 700, height: 20, fontSize: 11 }} />}
              </Box>
            ))}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}

// ─── Reports Tab (admin only) ──────────────────────────────────────────────────
function ReportsTab() {
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState({ excel: false, pdf: false });
  const [error, setError] = useState('');

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (status !== 'All') params.append('status', status);
    if (priority !== 'All') params.append('priority', priority);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const { data } = await api.get(`/reports/lifecycle?${params}`);
    return data;
  };

  const downloadExcel = async () => {
    setLoading(l => ({ ...l, excel: true })); setError('');
    try {
      const { summary, tickets } = await fetchData();

      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['AssetCare Pro — Ticket Lifecycle Report'],
        ['Generated on', new Date().toLocaleString('en-IN')],
        [],
        ['SUMMARY'],
        ['Total Tickets', summary.total],
        ['Resolved', summary.resolved],
        ['Pending', summary.pending],
        ['In Progress', summary.inProgress],
        ['Rejected', summary.rejected],
        ['Avg. Resolution Time (hrs)', summary.avgResolutionHours ?? 'N/A'],
        ['Total Estimated Cost (₹)', summary.totalCost],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      ws1['!cols'] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

      // Tickets sheet
      const headers = ['Ticket ID', 'Status', 'Priority', 'Issue', 'Asset', 'Serial No.', 'Dept', 'Raised By', 'Email', 'Approved By', 'Raised At', 'Last Updated', 'Resolution (hrs)', 'Est. Cost (₹)', 'Asset Vendor', 'Warranty End'];
      const rows = tickets.map(t => [
        t.ticketId, t.status, t.priority, t.issue, t.assetName, t.assetSerial,
        t.assetDepartment, t.raisedByName, t.raisedByEmail, t.approvedByName,
        t.raisedAt, t.lastUpdated, t.resolutionHours ?? 'N/A', t.estimatedCost,
        t.assetVendor, t.assetWarrantyEnd
      ]);
      const ws2 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws2['!cols'] = headers.map(() => ({ wch: 20 }));
      XLSX.utils.book_append_sheet(wb, ws2, 'Ticket Lifecycle');

      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([buf], { type: 'application/octet-stream' }), `assetcare-ticket-report-${Date.now()}.xlsx`);
    } catch (e) {
      setError('Failed to generate Excel report.');
    } finally { setLoading(l => ({ ...l, excel: false })); }
  };

  const downloadPDF = async () => {
    setLoading(l => ({ ...l, pdf: true })); setError('');
    try {
      const { summary, tickets } = await fetchData();
      const doc = new jsPDF({ orientation: 'landscape' });

      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text('AssetCare Pro — Ticket Lifecycle Report', 14, 16);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 23);

      // Summary box
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Summary', 14, 33);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      const summaryLines = [
        `Total: ${summary.total}  |  Resolved: ${summary.resolved}  |  Pending: ${summary.pending}  |  In Progress: ${summary.inProgress}  |  Rejected: ${summary.rejected}`,
        `Avg. Resolution: ${summary.avgResolutionHours ?? 'N/A'} hrs  |  Total Cost: ₹${summary.totalCost.toLocaleString('en-IN')}`,
      ];
      summaryLines.forEach((l, i) => doc.text(l, 14, 40 + i * 6));

      doc.autoTable({
        startY: 56,
        head: [['Ticket ID', 'Status', 'Priority', 'Issue', 'Asset', 'Dept', 'Raised By', 'Approved By', 'Raised At', 'Res.(hrs)', 'Cost(₹)']],
        body: tickets.map(t => [
          t.ticketId, t.status, t.priority, t.issue.substring(0, 40), t.assetName.substring(0, 20),
          t.assetDepartment, t.raisedByName, t.approvedByName,
          t.raisedAt, t.resolutionHours ?? '—', t.estimatedCost
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(`assetcare-ticket-report-${Date.now()}.pdf`);
    } catch (e) {
      setError('Failed to generate PDF report.');
    } finally { setLoading(l => ({ ...l, pdf: false })); }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
        <Typography fontWeight={700} fontSize={16} mb={0.5}>Ticket Lifecycle Report</Typography>
        <Typography fontSize={13} color="text.secondary" mb={3}>
          Full report of every ticket — from creation to resolution, including asset details, cost, resolution time, and personnel.
        </Typography>

        {/* Filters */}
        <Grid container spacing={2} alignItems="center" mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={e => setStatus(e.target.value)}>
                {['All', 'Pending Approval', 'Vendor Assigned', 'Under Repair', 'Resolved', 'Rejected'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select value={priority} label="Priority" onChange={e => setPriority(e.target.value)}>
                {['All', 'Low', 'Medium', 'High', 'Critical'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField size="small" type="date" label="From Date" value={from} onChange={e => setFrom(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField size="small" type="date" label="To Date" value={to} onChange={e => setTo(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={loading.excel ? <CircularProgress size={16} color="inherit" /> : <DownloadRounded />}
            onClick={downloadExcel}
            disabled={loading.excel || loading.pdf}
            sx={{ fontWeight: 700, borderRadius: 2, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
          >
            Download Excel
          </Button>
          <Button
            variant="contained"
            startIcon={loading.pdf ? <CircularProgress size={16} color="inherit" /> : <DownloadRounded />}
            onClick={downloadPDF}
            disabled={loading.excel || loading.pdf}
            sx={{ fontWeight: 700, borderRadius: 2, bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
          >
            Download PDF
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Typography fontWeight={700} fontSize={16} mb={0.5}>Asset Registry Report</Typography>
        <Typography fontSize={13} color="text.secondary" mb={2}>
          Complete snapshot of all active assets with assignment, warranty, and AMC details.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadRounded />}
          onClick={async () => {
            try {
              const { data } = await api.get('/reports/assets');
              const rows = data.map(a => ({
                Name: a.name, Category: a.category, 'Serial No': a.serialNumber,
                Status: a.status, Department: a.department, Location: a.location || '',
                Vendor: a.vendor || '', Model: a.modelNumber || '',
                'Purchase Cost': a.purchaseCost || '',
                'Warranty End': a.warrantyEnd ? new Date(a.warrantyEnd).toLocaleDateString('en-IN') : '',
                'Assigned To': a.assignedTo?.name || a.assignedEmployeeName || 'Unassigned',
                'Assigned Email': a.assignedTo?.email || a.assignedEmployeeEmail || '',
                'AMC Vendor': a.amcVendor || '', 'AMC End': a.amcEnd ? new Date(a.amcEnd).toLocaleDateString('en-IN') : '',
              }));
              const ws = XLSX.utils.json_to_sheet(rows);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Assets');
              const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
              saveAs(new Blob([buf], { type: 'application/octet-stream' }), `assetcare-asset-registry-${Date.now()}.xlsx`);
            } catch { setError('Failed to download asset report.'); }
          }}
          sx={{ fontWeight: 700, borderRadius: 2 }}
        >
          Download Asset Registry (Excel)
        </Button>
      </Paper>
    </Box>
  );
}

// ─── Data & Privacy Tab ────────────────────────────────────────────────────────
function DataTab({ currentUser }) {
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/settings/export-data');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      saveAs(blob, `assetcare-my-data-${Date.now()}.json`);
      setToast('Data exported successfully.');
    } catch {
      setToast('Export failed. Please try again.');
    } finally { setExporting(false); }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography fontWeight={700} fontSize={16} mb={0.5}>Export My Data</Typography>
          <Typography fontSize={13} color="text.secondary" mb={3}>
            Download a complete copy of all your data — profile, tickets, device requests, notifications, and assigned assets — as a JSON file.
          </Typography>
          <Button
            variant="outlined"
            startIcon={exporting ? <CircularProgress size={16} /> : <DataObjectRounded />}
            onClick={handleExport}
            disabled={exporting}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            {exporting ? 'Exporting...' : 'Export My Data (JSON)'}
          </Button>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography fontWeight={700} fontSize={16} mb={0.5}>Data Retention Policy</Typography>
          <Typography fontSize={13} color="text.secondary" mb={2}>
            Your data is managed according to these retention rules:
          </Typography>
          {[
            ['Audit Logs', 'Auto-purged after 1 year (monthly job)'],
            ['Notifications', 'Retained indefinitely (manually deletable)'],
            ['Tickets', 'Retained indefinitely'],
            ['Assets', 'Soft-deleted (recoverable from trash)'],
          ].map(([label, desc]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2, borderBottom: '1px solid #f1f5f9' }}>
              <Typography fontSize={13} fontWeight={600} color="text.secondary">{label}</Typography>
              <Typography fontSize={13} color="text.primary" textAlign="right" maxWidth={220}>{desc}</Typography>
            </Box>
          ))}
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography fontWeight={700} fontSize={16} mb={0.5}>Account Information</Typography>
          {[
            ['Name', currentUser?.name],
            ['Email', currentUser?.email],
            ['Role', currentUser?.role],
            ['Department', currentUser?.department],
            ['Account Status', currentUser?.isActive ? 'Active' : 'Inactive'],
          ].map(([label, val]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2, borderBottom: '1px solid #f1f5f9' }}>
              <Typography fontSize={13} fontWeight={600} color="text.secondary">{label}</Typography>
              <Typography fontSize={13} fontWeight={700}>{val || '—'}</Typography>
            </Box>
          ))}
        </Paper>
      </Grid>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </Grid>
  );
}

// ─── Main Settings Page ─────────────────────────────────────────────────────────
export default function Settings() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const [tab, setTab] = useState(0);

  const tabs = [
    { label: 'Profile', icon: <PersonRounded fontSize="small" /> },
    { label: 'Appearance', icon: <PaletteRounded fontSize="small" /> },
    ...(isAdmin ? [{ label: 'Reports', icon: <AssessmentRounded fontSize="small" /> }] : []),
    { label: 'Data & Privacy', icon: <SecurityRounded fontSize="small" /> },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #1E3A8A, #0F766E)' }}>
          <PersonRounded sx={{ color: 'white' }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Settings</Typography>
          <Typography variant="body2" color="text.secondary">Manage your profile, preferences, and data</Typography>
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc', '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minHeight: 52 } }}
        >
          {tabs.map((t, i) => (
            <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start" value={i} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tab} index={0}><ProfileTab currentUser={currentUser} /></TabPanel>
          <TabPanel value={tab} index={1}><AppearanceTab /></TabPanel>
          {isAdmin && <TabPanel value={tab} index={2}><ReportsTab /></TabPanel>}
          <TabPanel value={tab} index={isAdmin ? 3 : 2}><DataTab currentUser={currentUser} /></TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
