import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Chip, Divider, Tab, Tabs, Select, MenuItem, FormControl,
  InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, LinearProgress, Tooltip, ButtonGroup
} from '@mui/material';
import {
  TrendingUpRounded, InventoryRounded, ConfirmationNumberRounded,
  ShoppingCartRounded, AccountBalanceWalletRounded, ApartmentRounded,
  WarningAmberRounded, BarChartRounded, PictureAsPdfRounded,
  TableChartRounded, CalculateRounded, HealthAndSafetyRounded,
  MonetizationOnRounded, TimerRounded, CheckCircleRounded
} from '@mui/icons-material';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts';
import api from '../../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ACCENT = '#111827';
const DARK = '#111827';
const PALETTE = ['#111827', '#60a5fa', '#4ade80', '#f59e0b', '#a78bfa', '#f87171', '#22d3ee', '#fb923c'];

const fmt = (n) => n?.toLocaleString('en-IN') || '0';
const fmtCurr = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, color, trend }) {
  return (
    <Paper sx={{
      p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider',
      position: 'relative', overflow: 'hidden',
    }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', bgcolor: color }} />
      <Box sx={{ pl: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing="0.7px">
            {label}
          </Typography>
        </Box>
        <Typography variant="h4" fontWeight={900} color="text.primary" letterSpacing="-1px">{value}</Typography>
        {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
        {trend !== undefined && (
          <Chip
            label={`${trend >= 0 ? '▲' : '▼'} ${Math.abs(trend)}%`}
            size="small"
            sx={{ mt: 0.5, height: 18, fontSize: 10, bgcolor: trend >= 0 ? '#14532d' : '#450a0a', color: trend >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}
          />
        )}
      </Box>
    </Paper>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, sub }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
      <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: DARK, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {icon && <Box sx={{ color: ACCENT, display: 'flex' }}>{icon}</Box>}
      </Box>
      <Box>
        <Typography fontWeight={800} fontSize={16} color="text.primary">{title}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </Box>
    </Box>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', minWidth: 140 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography>
      {payload.map((entry, i) => (
        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 0.5 }}>
          <Typography variant="caption" sx={{ color: entry.color }}>{entry.name}</Typography>
          <Typography variant="caption" fontWeight={800} color="text.primary">
            {currency ? fmtCurr(entry.value) : fmt(entry.value)}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
};

export default function Analytics() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dMethod, setDMethod] = useState('slm');
  const [dLife, setDLife] = useState(5);
  const [exporting, setExporting] = useState(false);

  const [overview, setOverview] = useState(null);
  const [assetCost, setAssetCost] = useState(null);
  const [procurement, setProcurement] = useState(null);
  const [ticketTrends, setTicketTrends] = useState(null);
  const [depreciation, setDepreciation] = useState(null);
  const [deptScorecard, setDeptScorecard] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [ovRes, acRes, prRes, ttRes, dpRes, dsRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/asset-cost'),
        api.get('/analytics/procurement-trends'),
        api.get('/analytics/ticket-trends'),
        api.get(`/analytics/depreciation?method=${dMethod}&usefulLifeYears=${dLife}`),
        api.get('/analytics/department-scorecard'),
      ]);
      setOverview(ovRes.data);
      setAssetCost(acRes.data);
      setProcurement(prRes.data);
      setTicketTrends(ttRes.data);
      setDepreciation(dpRes.data);
      setDeptScorecard(dsRes.data);
    } catch {
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dMethod, dLife]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const exportExcel = async () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      if (depreciation?.assets) {
        const rows = depreciation.assets.map(a => ({
          'Asset Name': a.name,
          'Category': a.category,
          'Department': a.department,
          'Serial No.': a.serialNumber,
          'Purchase Cost': a.purchaseCost,
          'Age (Years)': a.ageYears,
          'Book Value': a.bookValue,
          'Accumulated Depreciation': a.accumulated,
          'Depreciation %': `${a.depreciationPct}%`,
          'Fully Depreciated': a.fullyDepreciated ? 'Yes' : 'No',
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Depreciation');
      }

      if (deptScorecard?.departments) {
        const rows = deptScorecard.departments.map(d => ({
          'Department': d.department,
          'Total Assets': d.totalAssets,
          'Active': d.active,
          'Under Repair': d.underRepair,
          'Total Cost': d.totalCost,
          'Health Rate %': `${d.healthRate}%`,
          'Total Tickets': d.totalTickets,
          'Resolution Rate %': `${d.resolutionRate}%`,
          'Repair Cost': d.totalRepairCost,
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Department Scorecard');
      }

      if (procurement?.byVendor) {
        const rows = procurement.byVendor.map(v => ({
          'Vendor': v.name,
          'Total Spend': v.totalSpend,
          'Order Count': v.orderCount,
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Vendor Spend');
      }

      XLSX.writeFile(wb, `AssetCare_Analytics_${Date.now()}.xlsx`);
    } catch {
      alert('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress sx={{ color: ACCENT }} />
      <Typography color="text.secondary" fontWeight={600}>Loading Analytics...</Typography>
    </Box>
  );

  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;

  const { kpis, assetAgeBrackets } = overview || {};

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: DARK, display: 'grid', placeItems: 'center', boxShadow: `0 0 0 3px ${ACCENT}30` }}>
            <BarChartRounded sx={{ color: ACCENT, fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={900} letterSpacing="-0.5px">Business Intelligence</Typography>
            <Typography variant="body2" color="text.secondary">Asset Portfolio · Procurement · Tickets · Depreciation</Typography>
          </Box>
        </Box>
        <Button id="analytics-export-btn" variant="outlined" startIcon={<TableChartRounded />}
          onClick={exportExcel} disabled={exporting}
          sx={{ fontWeight: 700, borderRadius: '10px', borderColor: ACCENT, color: ACCENT, '&:hover': { bgcolor: `${ACCENT}10` } }}>
          {exporting ? 'Exporting...' : 'Export Excel'}
        </Button>
      </Box>

      {/* ─── Top KPIs ─── */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { icon: <InventoryRounded sx={{ fontSize: 18 }} />, label: 'Total Assets', value: fmt(kpis?.totalAssets), color: ACCENT },
          { icon: <MonetizationOnRounded sx={{ fontSize: 18 }} />, label: 'Portfolio Value', value: fmtCurr(kpis?.totalPortfolioValue), color: '#4ade80' },
          { icon: <ConfirmationNumberRounded sx={{ fontSize: 18 }} />, label: 'Open Tickets', value: fmt(kpis?.openTickets), color: '#f87171' },
          { icon: <CheckCircleRounded sx={{ fontSize: 18 }} />, label: 'Resolution Rate', value: `${kpis?.ticketResolutionRate || 0}%`, color: '#FBBF24' },
          { icon: <WarningAmberRounded sx={{ fontSize: 18 }} />, label: 'Warranty Expiring', value: fmt(kpis?.warrantyExpiring30), sub: 'within 30 days', color: '#f59e0b' },
          { icon: <TimerRounded sx={{ fontSize: 18 }} />, label: 'Maintenance Due', value: fmt(kpis?.pendingMaintenance), sub: 'within 7 days', color: '#FBBF24' },
        ].map(card => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <KPICard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* ─── Navigation Tabs ─── */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
        mb: 3, borderBottom: '1px solid', borderColor: 'divider',
        '& .MuiTab-root': { fontWeight: 700, fontSize: 13, textTransform: 'none', minHeight: 44 },
        '& .MuiTabs-indicator': { bgcolor: ACCENT, height: 3, borderRadius: '2px 2px 0 0' }
      }}>
        <Tab id="tab-assets" label="Asset Portfolio" />
        <Tab id="tab-procurement" label="Procurement" />
        <Tab id="tab-tickets" label="Tickets & SLA" />
        <Tab id="tab-depreciation" label="Depreciation" />
        <Tab id="tab-departments" label="Dept. Scorecard" />
      </Tabs>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 0 — Asset Portfolio */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Asset Cost by Category (Bar) */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <SectionHeader icon={<InventoryRounded sx={{ fontSize: 18 }} />} title="Asset Value by Category" sub="Purchase cost distribution" />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={assetCost?.byCategory || []} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} fontSize={11} />
                    <YAxis dataKey="name" type="category" fontSize={11} width={90} />
                    <RTooltip content={<CustomTooltip currency />} />
                    <Bar dataKey="totalCost" name="Total Cost" fill={ACCENT} radius={[0, 4, 4, 0]}>
                      {assetCost?.byCategory?.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Asset Status (Pie) */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <SectionHeader icon={<HealthAndSafetyRounded sx={{ fontSize: 18 }} />} title="Asset Status" sub="Current fleet health" />
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={assetCost?.byStatus || []} cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                      dataKey="count" nameKey="name" paddingAngle={3}
                      label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                      labelLine={false}>
                      {assetCost?.byStatus?.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <RTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Asset Age Breakdown */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <SectionHeader icon={<TimerRounded sx={{ fontSize: 18 }} />} title="Fleet Age Distribution" sub="Years since procurement" />
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={assetAgeBrackets || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <RTooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Assets" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Top Departments by Cost */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <SectionHeader icon={<ApartmentRounded sx={{ fontSize: 18 }} />} title="Top Departments by Asset Value" sub="Total purchase cost" />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        {['Department', 'Assets', 'Total Cost', 'Avg Cost'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', py: 1.2 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assetCost?.byDepartment?.map((d, i) => (
                        <TableRow key={i} hover>
                          <TableCell><Typography fontWeight={600} fontSize={13}>{d.name}</Typography></TableCell>
                          <TableCell><Chip label={d.count} size="small" sx={{ fontWeight: 700, height: 20 }} /></TableCell>
                          <TableCell><Typography fontWeight={700} fontSize={13} sx={{ color: ACCENT }}>{fmtCurr(d.totalCost)}</Typography></TableCell>
                          <TableCell><Typography fontSize={12} color="text.secondary">{fmtCurr(Math.round(d.totalCost / d.count))}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1 — Procurement */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <Box>
          {/* Monthly Spend Area Chart */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
            <SectionHeader icon={<ShoppingCartRounded sx={{ fontSize: 18 }} />} title="Monthly Procurement Spend" sub="Last 12 months" />
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={procurement?.monthlySpend || []}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" fontSize={11} />
                <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} fontSize={11} />
                <RTooltip content={<CustomTooltip currency />} />
                <Area type="monotone" dataKey="totalSpend" name="Total Spend" stroke={ACCENT} fill="url(#spendGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: ACCENT }} />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>

          <Grid container spacing={3}>
            {/* Vendor Spend */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <SectionHeader icon={<AccountBalanceWalletRounded sx={{ fontSize: 18 }} />} title="Spend by Vendor" sub="Top 8 vendors" />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={procurement?.byVendor || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" fontSize={10} tick={{ angle: -20, textAnchor: 'end' }} height={50} />
                    <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} fontSize={11} />
                    <RTooltip content={<CustomTooltip currency />} />
                    <Bar dataKey="totalSpend" name="Total Spend" radius={[4, 4, 0, 0]}>
                      {procurement?.byVendor?.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Top Items */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <SectionHeader icon={<TrendingUpRounded sx={{ fontSize: 18 }} />} title="Top Procured Items" sub="By total cost" />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        {['Item', 'Qty', 'Total Cost'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', py: 1.2 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {procurement?.topItems?.map((item, i) => (
                        <TableRow key={i} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                              <Typography fontSize={13} fontWeight={600}>{item.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Typography fontSize={12}>{fmt(item.totalQty)}</Typography></TableCell>
                          <TableCell><Typography fontWeight={700} fontSize={13} sx={{ color: ACCENT }}>{fmtCurr(item.totalCost)}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2 — Tickets & SLA */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <Box>
          {/* Monthly Volume */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
            <SectionHeader icon={<ConfirmationNumberRounded sx={{ fontSize: 18 }} />} title="Ticket Volume — Raised vs Resolved" sub="Last 12 months" />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ticketTrends?.monthlyVolume || []} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" fontSize={11} />
                <YAxis fontSize={11} />
                <RTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="raised" name="Raised" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#4ade80" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          <Grid container spacing={3}>
            {/* Avg Resolution Time */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <SectionHeader icon={<TimerRounded sx={{ fontSize: 18 }} />} title="Avg. Resolution Time" sub="By priority (hours)" />
                <Box sx={{ mt: 1 }}>
                  {ticketTrends?.avgResolutionByPriority?.map((p, i) => (
                    <Box key={i} sx={{ mb: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography fontSize={13} fontWeight={700}>{p.name} Priority</Typography>
                        <Typography fontSize={13} fontWeight={900} color={p.name === 'High' ? '#f87171' : p.name === 'Medium' ? '#f59e0b' : '#4ade80'}>
                          {p.avgHours}h
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (p.avgHours / 200) * 100)}
                        sx={{
                          height: 8, borderRadius: 4,
                          bgcolor: 'rgba(255,255,255,0.07)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: p.name === 'High' ? '#f87171' : p.name === 'Medium' ? '#f59e0b' : '#4ade80',
                            borderRadius: 4,
                          }
                        }}
                      />
                    </Box>
                  ))}
                  {(!ticketTrends?.avgResolutionByPriority?.length) && (
                    <Typography color="text.disabled" textAlign="center" py={4}>No resolved tickets yet</Typography>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Tickets by Category */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <SectionHeader icon={<InventoryRounded sx={{ fontSize: 18 }} />} title="Tickets by Asset Category" sub="Issue frequency & repair cost" />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        {['Category', 'Tickets', 'Repair Cost'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', py: 1.2 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ticketTrends?.byCategory?.map((cat, i) => (
                        <TableRow key={i} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                              <Typography fontSize={13} fontWeight={600}>{cat.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={cat.count} size="small" sx={{ fontWeight: 700, height: 20, bgcolor: '#1e293b', color: '#60a5fa' }} />
                          </TableCell>
                          <TableCell><Typography fontSize={13} fontWeight={700} sx={{ color: ACCENT }}>{fmtCurr(cat.totalCost)}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3 — Depreciation */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 3 && (
        <Box>
          {/* Controls */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Depreciation Method</InputLabel>
              <Select id="depr-method" value={dMethod} label="Depreciation Method"
                onChange={e => setDMethod(e.target.value)}>
                <MenuItem value="slm">Straight Line (SLM)</MenuItem>
                <MenuItem value="wdv">Written Down Value (WDV)</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Useful Life (Years)</InputLabel>
              <Select id="depr-life" value={dLife} label="Useful Life (Years)"
                onChange={e => setDLife(e.target.value)}>
                {[3, 4, 5, 7, 10].map(y => <MenuItem key={y} value={y}>{y} Years</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* Depreciation KPIs */}
          {depreciation && (
            <>
              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {[
                  { label: 'Original Cost', value: fmtCurr(depreciation.summary.totalOriginalCost), color: '#FBBF24' },
                  { label: 'Current Book Value', value: fmtCurr(depreciation.summary.totalBookValue), color: ACCENT },
                  { label: 'Accumulated Depreciation', value: fmtCurr(depreciation.summary.totalAccumulated), color: '#f59e0b' },
                  { label: 'Overall Depreciation', value: `${depreciation.summary.overallDepreciationPct}%`, color: '#f87171' },
                  { label: 'Fully Depreciated Assets', value: fmt(depreciation.summary.fullyDepreciatedCount), color: '#FBBF24' },
                ].map(card => (
                  <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4, lg: 'auto' }} sx={{ flex: 1 }}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight={900} color={card.color}>{card.value}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing="0.5px">
                        {card.label}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* By Category */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <SectionHeader icon={<CalculateRounded sx={{ fontSize: 18 }} />} title="Depreciation by Category" />
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={depreciation.byCategory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" fontSize={10} />
                        <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} fontSize={11} />
                        <RTooltip content={<CustomTooltip currency />} />
                        <Bar dataKey="originalCost" name="Original Cost" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="bookValue" name="Book Value" fill={ACCENT} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                {/* Asset Depreciation Table */}
                <Grid size={{ xs: 12, md: 7 }}>
                  <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <SectionHeader icon={<CalculateRounded sx={{ fontSize: 18 }} />} title="Asset Depreciation Ledger" sub="Top 10 by accumulated depreciation" />
                    <TableContainer sx={{ maxHeight: 300 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            {['Asset', 'Cost', 'Age', 'Book Value', 'Depr.'].map(h => (
                              <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', py: 1.2, bgcolor: 'background.paper' }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {depreciation.assets.slice(0, 10).map((a, i) => (
                            <TableRow key={i} hover>
                              <TableCell>
                                <Typography fontSize={12} fontWeight={600}>{a.name}</Typography>
                                <Typography fontSize={10} color="text.disabled">{a.category}</Typography>
                              </TableCell>
                              <TableCell><Typography fontSize={12}>{fmtCurr(a.purchaseCost)}</Typography></TableCell>
                              <TableCell><Typography fontSize={12}>{a.ageYears}y</Typography></TableCell>
                              <TableCell><Typography fontSize={12} fontWeight={700} sx={{ color: ACCENT }}>{fmtCurr(a.bookValue)}</Typography></TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={a.depreciationPct}
                                    sx={{
                                      flex: 1, height: 6, borderRadius: 3,
                                      bgcolor: 'rgba(255,255,255,0.07)',
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: a.fullyDepreciated ? '#f87171' : a.depreciationPct > 70 ? '#f59e0b' : '#4ade80',
                                        borderRadius: 3,
                                      }
                                    }}
                                  />
                                  <Typography fontSize={11} fontWeight={700} sx={{ minWidth: 30 }}>{a.depreciationPct}%</Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4 — Department Scorecard */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 4 && (
        <Box>
          <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ p: 3, pb: 2 }}>
              <SectionHeader icon={<ApartmentRounded sx={{ fontSize: 18 }} />} title="Department Performance Scorecard" sub="Asset health, ticket load, and repair costs per department" />
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    {['Department', 'Assets', 'Active', 'Under Repair', 'Asset Health', 'Tickets', 'Resolution Rate', 'Total Cost', 'Repair Cost'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'text.secondary', py: 1.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deptScorecard?.departments?.map((d, i) => (
                    <TableRow key={i} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                          <Typography fontWeight={700} fontSize={13}>{d.department}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography fontWeight={700}>{d.totalAssets}</Typography></TableCell>
                      <TableCell><Chip label={d.active} size="small" sx={{ bgcolor: '#14532d', color: '#4ade80', fontWeight: 700, height: 20 }} /></TableCell>
                      <TableCell>
                        {d.underRepair > 0
                          ? <Chip label={d.underRepair} size="small" sx={{ bgcolor: '#450a0a', color: '#f87171', fontWeight: 700, height: 20 }} />
                          : <Typography fontSize={12} color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress variant="determinate" value={d.healthRate}
                            sx={{
                              flex: 1, height: 7, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.07)',
                              '& .MuiLinearProgress-bar': { bgcolor: d.healthRate > 80 ? '#4ade80' : d.healthRate > 60 ? '#f59e0b' : '#f87171', borderRadius: 3 }
                            }}
                          />
                          <Typography fontSize={11} fontWeight={800} sx={{ minWidth: 32 }}>{d.healthRate}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography fontWeight={600}>{d.totalTickets}</Typography></TableCell>
                      <TableCell>
                        <Chip
                          label={`${d.resolutionRate}%`}
                          size="small"
                          sx={{
                            fontWeight: 700, height: 20, fontSize: 11,
                            bgcolor: d.resolutionRate > 80 ? '#14532d' : d.resolutionRate > 50 ? '#422006' : '#450a0a',
                            color: d.resolutionRate > 80 ? '#4ade80' : d.resolutionRate > 50 ? '#fb923c' : '#f87171',
                          }}
                        />
                      </TableCell>
                      <TableCell><Typography fontSize={13} fontWeight={700} sx={{ color: ACCENT }}>{fmtCurr(d.totalCost)}</Typography></TableCell>
                      <TableCell><Typography fontSize={13} sx={{ color: '#f87171' }}>{fmtCurr(d.totalRepairCost)}</Typography></TableCell>
                    </TableRow>
                  ))}
                  {!deptScorecard?.departments?.length && (
                    <TableRow>
                      <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
                        No department data available yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

