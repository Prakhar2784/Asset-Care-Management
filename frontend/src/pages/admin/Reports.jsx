import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, useTheme, InputAdornment, TextField
} from '@mui/material';
import {
  AssessmentRounded, PictureAsPdfRounded, TableChartRounded,
  WarningAmberRounded, InventoryRounded, ConfirmationNumberRounded,
  PeopleRounded, BusinessRounded, SearchRounded
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ['#111827', '#60A5FA', '#4ADE80', '#FBBF24', '#F87171', '#A78BFA', '#22D3EE'];

export default function Reports() {
  const muiTheme = useTheme();
  const gridColor = muiTheme.palette.divider;
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data } = await api.get('/reports/summary');
        setSummary(data);
      } catch {
        setError('Failed to load report data.');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const exportPDF = async () => {
    setExporting(true);
    try {
      const [assetsRes, ticketsRes] = await Promise.all([
        api.get('/reports/assets'),
        api.get('/reports/tickets')
      ]);
      const assets = assetsRes.data;
      const tickets = ticketsRes.data;

      const doc = new jsPDF('landscape');
      doc.setFontSize(18);
      doc.text('AssetCare Pro — System Report', 14, 20);
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 28);

      doc.setFontSize(13);
      doc.text('Asset Registry', 14, 42);
      autoTable(doc, {
        startY: 46,
        head: [['Name', 'Serial No.', 'Category', 'Status', 'Department', 'Assigned To', 'Warranty End']],
        body: assets.map(a => [
          a.name, a.serialNumber, a.category, a.status, a.department,
          a.assignedTo?.name || 'Unassigned',
          a.warrantyEnd ? new Date(a.warrantyEnd).toLocaleDateString('en-IN') : '—'
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [17, 17, 17] }
      });

      doc.addPage();
      doc.setFontSize(13);
      doc.text('Ticket Log', 14, 20);
      autoTable(doc, {
        startY: 24,
        head: [['Ticket ID', 'Issue', 'Priority', 'Status', 'Asset', 'Raised By', 'Date']],
        body: tickets.map(t => [
          t.ticketId, t.issue?.substring(0, 40), t.priority, t.status,
          t.asset?.name || '—', t.raisedBy?.name || '—',
          new Date(t.createdAt).toLocaleDateString('en-IN')
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [17, 17, 17] }
      });

      doc.save(`AssetCare_Report_${Date.now()}.pdf`);
    } catch {
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const [assetsRes, ticketsRes] = await Promise.all([
        api.get('/reports/assets'),
        api.get('/reports/tickets')
      ]);

      const assetRows = assetsRes.data.map(a => ({
        Name: a.name,
        'Serial No.': a.serialNumber,
        Category: a.category,
        'Form Factor': a.formFactor,
        Vendor: a.vendor || '',
        Status: a.status,
        Department: a.department,
        Location: a.location || '',
        'Assigned To': a.assignedTo?.name || 'Unassigned',
        'Purchase Cost': a.purchaseCost || '',
        'Warranty End': a.warrantyEnd ? new Date(a.warrantyEnd).toLocaleDateString('en-IN') : '',
        'AMC End': a.amcEnd ? new Date(a.amcEnd).toLocaleDateString('en-IN') : '',
      }));

      const ticketRows = ticketsRes.data.map(t => ({
        'Ticket ID': t.ticketId,
        Issue: t.issue,
        Priority: t.priority,
        Status: t.status,
        Asset: t.asset?.name || '',
        'Serial No.': t.asset?.serialNumber || '',
        'Raised By': t.raisedBy?.name || '',
        Department: t.raisedBy?.department || '',
        Date: new Date(t.createdAt).toLocaleDateString('en-IN'),
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assetRows), 'Assets');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ticketRows), 'Tickets');
      XLSX.writeFile(wb, `AssetCare_Report_${Date.now()}.xlsx`);
    } catch {
      alert('Failed to export Excel. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress sx={{ color: 'text.primary' }} />
    </Box>
  );

  if (error) return <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>;

  const assetStatusData = summary.assetsByStatus.map(d => ({ name: d._id || 'Unknown', value: d.count }));
  const assetCategoryData = summary.assetsByCategory.map(d => ({ name: d._id || 'Unknown', count: d.count }));
  const ticketStatusData = summary.ticketsByStatus.map(d => ({ name: d._id || 'Unknown', count: d.count }));
  const ticketPriorityData = summary.ticketsByPriority.map(d => ({ name: d._id || 'Unknown', count: d.count }));

  const kpiStats = [
    { label: 'Total Assets', value: summary.totals.assets, color: 'text.primary', icon: <InventoryRounded fontSize="small" /> },
    { label: 'Total Tickets', value: summary.totals.tickets, color: '#FBBF24', icon: <ConfirmationNumberRounded fontSize="small" /> },
    { label: 'Total Users', value: summary.totals.users, color: '#FBBF24', icon: <PeopleRounded fontSize="small" /> },
    { label: 'Warranty Expiring (30d)', value: summary.warrantyExpiring30, color: '#FBBF24', icon: <WarningAmberRounded fontSize="small" /> },
  ];

  const filteredDepts = summary.assetsByDept.filter(d =>
    (d._id || 'Unassigned').toLowerCase().includes(deptSearch.toLowerCase())
  );

  const SectionHeader = ({ title, subtitle }) => (
    <Box sx={{ mb: 2.5 }}>
      <Typography fontWeight={800} fontSize={15} color="text.primary" letterSpacing="-0.3px">{title}</Typography>
      {subtitle && <Typography fontSize={12} color="text.secondary" fontWeight={600}>{subtitle}</Typography>}
    </Box>
  );

  return (
    <Box sx={{ pb: 5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(17,24,39,0.12)' }}>
            <AssessmentRounded sx={{ color: 'text.primary' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Reports & Analytics</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>System-wide data snapshot and export center</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<TableChartRounded />}
            onClick={exportExcel}
            disabled={exporting}
            sx={{ fontWeight: 700, borderRadius: '12px', borderColor: 'divider', color: 'text.primary', textTransform: 'none', px: 2.5 }}
          >
            Export Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<PictureAsPdfRounded />}
            onClick={exportPDF}
            disabled={exporting}
            sx={{ background: '#111827', color: '#fff', fontWeight: 800, borderRadius: '12px', px: 2.5, boxShadow: 'none', textTransform: 'none' }}
          >
            {exporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {kpiStats.map(k => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={k.label}>
            <Paper sx={{ p: 2.5, borderRadius: '16px', border: 1, borderColor: 'divider', position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: k.color }} />
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${k.color}18`, display: 'grid', placeItems: 'center', mb: 1.5 }}>
                <Box sx={{ color: k.color }}>{k.icon}</Box>
              </Box>
              <Typography fontSize={28} fontWeight={950} color="text.primary" lineHeight={1} letterSpacing="-1px">{k.value}</Typography>
              <Typography fontSize={13} fontWeight={700} color="text.primary" mt={0.3}>{k.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
            <SectionHeader title="Asset Status Distribution" subtitle="Breakdown by current lifecycle state" />
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={assetStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {assetStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '10px', fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
            <SectionHeader title="Assets by Category" subtitle="Count per asset type in inventory" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={assetCategoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '10px', fontWeight: 700 }} />
                <Bar dataKey="count" fill="#111827" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
            <SectionHeader title="Tickets by Status" subtitle="Service request pipeline overview" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ticketStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="name" type="category" fontSize={11} width={110} />
                <Tooltip contentStyle={{ borderRadius: '10px', fontWeight: 700 }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
            <SectionHeader title="Tickets by Priority" subtitle="Severity-level distribution" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ticketPriorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '10px', fontWeight: 700 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {ticketPriorityData.map((entry, i) => (
                    <Cell key={i} fill={
                      entry.name === 'High' ? '#EF4444' :
                      entry.name === 'Medium' ? '#F59E0B' : '#22C55E'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Department breakdown */}
      <Paper sx={{ p: 3, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(17,24,39,0.12)', display: 'grid', placeItems: 'center' }}>
              <BusinessRounded sx={{ color: 'text.primary', fontSize: 18 }} />
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize={15} color="text.primary" letterSpacing="-0.3px">Assets by Department</Typography>
              <Typography fontSize={12} color="text.secondary" fontWeight={600}>Distribution across organizational units</Typography>
            </Box>
          </Box>
          <TextField
            size="small"
            placeholder="Search department..."
            value={deptSearch}
            onChange={(e) => setDeptSearch(e.target.value)}
            sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ color: 'text.disabled', fontSize: 18 }} /></InputAdornment> }}
          />
        </Box>
        <TableContainer sx={{ borderRadius: '14px', border: 1, borderColor: 'divider', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 800, fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.6px', py: 1.5, borderBottom: 2, borderColor: 'divider' }}>Department</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.6px', py: 1.5, borderBottom: 2, borderColor: 'divider' }}>Asset Count</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.6px', py: 1.5, borderBottom: 2, borderColor: 'divider' }}>Share</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.6px', py: 1.5, borderBottom: 2, borderColor: 'divider' }}>Distribution</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDepts.map((d, idx) => {
                const pct = summary.totals.assets > 0
                  ? ((d.count / summary.totals.assets) * 100).toFixed(1)
                  : 0;
                const barColor = COLORS[idx % COLORS.length];
                return (
                  <TableRow key={d._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ py: 1.5, fontWeight: 700, fontSize: 13 }}>{d._id || 'Unassigned'}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <Chip label={d.count} size="small" sx={{ fontWeight: 800, fontSize: 12, bgcolor: `${barColor}18`, color: barColor, border: `1px solid ${barColor}30` }} />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontWeight: 700, color: 'text.secondary', fontSize: 13 }}>{pct}%</TableCell>
                    <TableCell sx={{ py: 1.5, minWidth: 120 }}>
                      <Box sx={{ height: 6, bgcolor: 'action.hover', borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: barColor, borderRadius: 3, transition: 'width 0.3s' }} />
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredDepts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary', fontWeight: 600 }}>No departments match your search.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
