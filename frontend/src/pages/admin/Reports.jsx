import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Chip, Divider, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, ButtonGroup
} from '@mui/material';
import {
  AssessmentRounded, PictureAsPdfRounded, TableChartRounded,
  WarningAmberRounded, InventoryRounded, ConfirmationNumberRounded,
  PeopleRounded
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ['#4f46e5', '#0ea5e9', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0F766E'];

const StatCard = ({ icon, label, value, color, sub }) => (
  <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
    <Box sx={{
      width: 48, height: 48, borderRadius: 2, flexShrink: 0,
      bgcolor: `${color}18`, color: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="h4" fontWeight={800} color="text.primary">{value}</Typography>
      <Typography variant="body2" color="text.secondary" fontWeight={600}>{label}</Typography>
      {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
    </Box>
  </Paper>
);

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

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
        headStyles: { fillColor: [30, 58, 138] }
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
        headStyles: { fillColor: [15, 118, 110] }
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
      <CircularProgress />
    </Box>
  );

  if (error) return <Alert severity="error">{error}</Alert>;

  const assetStatusData = summary.assetsByStatus.map(d => ({ name: d._id || 'Unknown', value: d.count }));
  const assetCategoryData = summary.assetsByCategory.map(d => ({ name: d._id || 'Unknown', count: d.count }));
  const ticketStatusData = summary.ticketsByStatus.map(d => ({ name: d._id || 'Unknown', count: d.count }));
  const ticketPriorityData = summary.ticketsByPriority.map(d => ({ name: d._id || 'Unknown', count: d.count }));

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center',
            background: 'linear-gradient(135deg, #1E3A8A, #0F766E)'
          }}>
            <AssessmentRounded sx={{ color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Reports & Analytics</Typography>
            <Typography variant="body2" color="text.secondary">System-wide data snapshot</Typography>
          </Box>
        </Box>
        <ButtonGroup variant="outlined" disabled={exporting}>
          <Button startIcon={<PictureAsPdfRounded />} onClick={exportPDF} sx={{ fontWeight: 700 }}>
            {exporting ? 'Exporting...' : 'Export PDF'}
          </Button>
          <Button startIcon={<TableChartRounded />} onClick={exportExcel} sx={{ fontWeight: 700 }}>
            Export Excel
          </Button>
        </ButtonGroup>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<InventoryRounded />} label="Total Assets" value={summary.totals.assets} color="#4f46e5" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<ConfirmationNumberRounded />} label="Total Tickets" value={summary.totals.tickets} color="#0ea5e9" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<PeopleRounded />} label="Total Users" value={summary.totals.users} color="#16a34a" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<WarningAmberRounded />}
            label="Warranty Expiring"
            value={summary.warrantyExpiring30}
            color="#d97706"
            sub="within 30 days"
          />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography fontWeight={700} mb={2}>Asset Status Distribution</Typography>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={assetStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {assetStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography fontWeight={700} mb={2}>Assets by Category</Typography>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={assetCategoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography fontWeight={700} mb={2}>Tickets by Status</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ticketStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="name" type="category" fontSize={11} width={110} />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography fontWeight={700} mb={2}>Tickets by Priority</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ticketPriorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {ticketPriorityData.map((entry, i) => (
                    <Cell key={i} fill={
                      entry.name === 'High' ? '#dc2626' :
                      entry.name === 'Medium' ? '#d97706' : '#16a34a'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Department breakdown */}
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Typography fontWeight={700} mb={2}>Assets by Department</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Asset Count</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Share</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.assetsByDept.map((d) => {
                const pct = summary.totals.assets > 0
                  ? ((d.count / summary.totals.assets) * 100).toFixed(1)
                  : 0;
                return (
                  <TableRow key={d._id} hover>
                    <TableCell fontWeight={600}>{d._id || 'Unassigned'}</TableCell>
                    <TableCell align="right">
                      <Chip label={d.count} size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#64748b', fontSize: 13 }}>{pct}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
