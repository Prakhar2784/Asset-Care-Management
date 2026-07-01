import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Tooltip, Alert, Snackbar, CircularProgress,
  Tabs, Tab, Divider, Avatar, Badge
} from '@mui/material';
import {
  BusinessRounded, AddRounded, PowerSettingsNewRounded,
  DeleteRounded, PeopleRounded, BarChartRounded,
  CheckCircleRounded, CancelRounded, UpgradeRounded,
  InventoryRounded, ConfirmationNumberRounded, PersonRounded,
  ShieldRounded, RocketLaunchRounded, StarRounded,
  VisibilityRounded, TrendingUpRounded, DnsRounded
} from '@mui/icons-material';
import api from '../../api/axios';

const ACCENT = '#A855F7';
const DARK = '#1A0B2E';

const PLAN_COLORS = {
  Basic: { bg: '#1e3a5f', text: '#60a5fa', label: 'Basic' },
  Pro: { bg: '#3b1f6e', text: '#a78bfa', label: 'Pro' },
  Enterprise: { bg: '#1a3a2a', text: '#4ade80', label: 'Enterprise' },
};

const PLAN_ICONS = {
  Basic: <RocketLaunchRounded sx={{ fontSize: 14 }} />,
  Pro: <StarRounded sx={{ fontSize: 14 }} />,
  Enterprise: <ShieldRounded sx={{ fontSize: 14 }} />,
};

function PlanBadge({ plan }) {
  const colors = PLAN_COLORS[plan] || PLAN_COLORS['Basic'];
  return (
    <Chip
      icon={PLAN_ICONS[plan]}
      label={plan}
      size="small"
      sx={{
        bgcolor: colors.bg,
        color: colors.text,
        fontWeight: 800,
        fontSize: 11,
        height: 22,
        '& .MuiChip-icon': { color: colors.text, ml: 0.5 }
      }}
    />
  );
}

function UtilBar({ value, color = '#A855F7', label }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" fontWeight={700} color={value > 80 ? '#ef4444' : value > 60 ? '#f59e0b' : color}>
          {value}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 5, borderRadius: 4,
          bgcolor: 'rgba(255,255,255,0.08)',
          '& .MuiLinearProgress-bar': {
            bgcolor: value > 80 ? '#ef4444' : value > 60 ? '#f59e0b' : color,
            borderRadius: 4,
          }
        }}
      />
    </Box>
  );
}

function PlatformStatCard({ icon, label, value, color, sub }) {
  return (
    <Paper sx={{
      p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)',
      backdropFilter: 'blur(10px)',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: 2, flexShrink: 0,
          bgcolor: `${color}20`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={900} color="text.primary" letterSpacing="-1px">
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing="0.5px">
            {label}
          </Typography>
          {sub && <Typography variant="caption" color="text.disabled" display="block">{sub}</Typography>}
        </Box>
      </Box>
    </Paper>
  );
}

export default function SuperAdminPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '', slug: '', plan: 'Basic',
    adminName: '', adminEmail: '', adminPassword: '',
    maxAssets: '', maxUsers: ''
  });
  const [planForm, setPlanForm] = useState({ plan: 'Basic', maxAssets: '', maxUsers: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/super-admin/platform-stats');
      setData(res);
    } catch (e) {
      showSnack('Failed to load platform stats.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showSnack = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const handleCreateCompany = async () => {
    try {
      setSaving(true);
      await api.post('/super-admin/tenants', {
        name: form.name,
        slug: form.slug,
        plan: form.plan,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
        maxAssets: form.maxAssets ? Number(form.maxAssets) : undefined,
        maxUsers: form.maxUsers ? Number(form.maxUsers) : undefined,
      });
      showSnack(`Company "${form.name}" provisioned successfully!`);
      setCreateOpen(false);
      setForm({ name: '', slug: '', plan: 'Basic', adminName: '', adminEmail: '', adminPassword: '', maxAssets: '', maxUsers: '' });
      fetchData();
    } catch (e) {
      showSnack(e?.response?.data?.message || 'Failed to create company.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (tenant) => {
    try {
      const { data: res } = await api.patch(`/super-admin/tenants/${tenant._id}/toggle`);
      showSnack(res.message);
      fetchData();
    } catch {
      showSnack('Failed to update status.', 'error');
    }
  };

  const handleDelete = async (tenant) => {
    if (!window.confirm(`Permanently delete "${tenant.name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/super-admin/tenants/${tenant._id}`);
      showSnack(`"${tenant.name}" deleted.`, 'info');
      fetchData();
    } catch (e) {
      showSnack(e?.response?.data?.message || 'Delete failed.', 'error');
    }
  };

  const handlePlanSave = async () => {
    try {
      setSaving(true);
      await api.patch(`/super-admin/tenants/${selectedTenant._id}/plan`, {
        plan: planForm.plan,
        maxAssets: planForm.maxAssets ? Number(planForm.maxAssets) : undefined,
        maxUsers: planForm.maxUsers ? Number(planForm.maxUsers) : undefined,
      });
      showSnack('Plan updated successfully!');
      setPlanOpen(false);
      fetchData();
    } catch {
      showSnack('Failed to update plan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleViewUsers = async (tenant) => {
    setSelectedTenant(tenant);
    setUsersOpen(true);
    setUsersLoading(true);
    try {
      const { data: users } = await api.get(`/super-admin/tenants/${tenant._id}/users`);
      setTenantUsers(users);
    } catch {
      setTenantUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress sx={{ color: ACCENT }} />
      <Typography color="text.secondary" fontWeight={600}>Loading Platform Console...</Typography>
    </Box>
  );

  const { platform, tenants } = data || {};
  const activeTenants = tenants?.filter(t => t.isActive) || [];
  const suspendedTenants = tenants?.filter(t => !t.isActive) || [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: 2.5,
            bgcolor: DARK, display: 'grid', placeItems: 'center',
            boxShadow: `0 0 0 3px ${ACCENT}40`
          }}>
            <DnsRounded sx={{ color: ACCENT, fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={900} letterSpacing="-1px" color="text.primary">
              Platform Console
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Super Admin · God Mode · All Tenant Operations
            </Typography>
          </Box>
        </Box>
        <Button
          id="provision-company-btn"
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => setCreateOpen(true)}
          sx={{
            bgcolor: ACCENT, color: DARK, fontWeight: 900,
            borderRadius: '10px', px: 3, py: 1.2, fontSize: 14,
            '&:hover': { bgcolor: '#b8e84e' }
          }}
        >
          Provision New Company
        </Button>
      </Box>

      {/* Platform KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {[
          { icon: <BusinessRounded />, label: 'Total Companies', value: platform?.totalTenants || 0, color: ACCENT },
          { icon: <CheckCircleRounded />, label: 'Active Tenants', value: platform?.activeTenants || 0, color: '#4ade80' },
          { icon: <PeopleRounded />, label: 'Total Users', value: platform?.totalUsers || 0, color: '#60a5fa' },
          { icon: <InventoryRounded />, label: 'Total Assets', value: platform?.totalAssets || 0, color: '#f59e0b' },
          { icon: <ConfirmationNumberRounded />, label: 'Total Tickets', value: platform?.totalTickets || 0, color: '#a78bfa' },
          { icon: <CancelRounded />, label: 'Suspended', value: platform?.suspendedTenants || 0, color: '#ef4444' },
        ].map(card => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <PlatformStatCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Plan Breakdown */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {['Basic', 'Pro', 'Enterprise'].map(plan => {
          const count = platform?.planBreakdown?.[plan] || 0;
          const pct = platform?.totalTenants > 0 ? ((count / platform.totalTenants) * 100).toFixed(1) : 0;
          const colors = PLAN_COLORS[plan];
          return (
            <Grid key={plan} size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Box sx={{ mb: 1.5 }}>{PLAN_ICONS[plan]}</Box>
                <Typography variant="h3" fontWeight={900} color={colors.text}>{count}</Typography>
                <Typography fontWeight={700} color="text.secondary">{plan} Plan</Typography>
                <LinearProgress
                  variant="determinate"
                  value={Number(pct)}
                  sx={{
                    mt: 1.5, height: 6, borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.06)',
                    '& .MuiLinearProgress-bar': { bgcolor: colors.text, borderRadius: 4 }
                  }}
                />
                <Typography variant="caption" color="text.disabled">{pct}% of tenants</Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 700, fontSize: 13, textTransform: 'none' }, '& .MuiTabs-indicator': { bgcolor: ACCENT } }}
      >
        <Tab id="tab-all" label={`All Companies (${tenants?.length || 0})`} />
        <Tab id="tab-active" label={`Active (${activeTenants.length})`} />
        <Tab id="tab-suspended" label={`Suspended (${suspendedTenants.length})`} />
      </Tabs>

      {/* Company Table */}
      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['Company', 'Plan', 'Status', 'Assets', 'Users', 'Tickets', 'Asset Utilization', 'User Utilization', 'Joined', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.7px', py: 1.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(tab === 0 ? tenants : tab === 1 ? activeTenants : suspendedTenants)?.map(t => (
                <TableRow key={t._id} hover sx={{ opacity: t.isActive ? 1 : 0.55 }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: t.branding?.primaryColor || '#1976d2', fontSize: 13, fontWeight: 900 }}>
                        {t.name.substring(0, 1)}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={700} fontSize={14} color="text.primary">{t.name}</Typography>
                        <Typography fontSize={11} color="text.disabled">slug: {t.slug}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><PlanBadge plan={t.plan} /></TableCell>
                  <TableCell>
                    <Chip
                      label={t.isActive ? 'Active' : 'Suspended'}
                      size="small"
                      sx={{
                        bgcolor: t.isActive ? '#14532d' : '#450a0a',
                        color: t.isActive ? '#4ade80' : '#f87171',
                        fontWeight: 700, fontSize: 11, height: 22
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700}>{t.usage.assets}</Typography>
                    <Typography fontSize={11} color="text.disabled">/ {t.limits.maxAssets}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700}>{t.usage.users}</Typography>
                    <Typography fontSize={11} color="text.disabled">/ {t.limits.maxUsers}</Typography>
                  </TableCell>
                  <TableCell><Typography fontWeight={600}>{t.usage.tickets}</Typography></TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <UtilBar value={t.usage.assetUtilization} label="" />
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <UtilBar value={t.usage.userUtilization} color="#60a5fa" label="" />
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={12} color="text.secondary" whiteSpace="nowrap">
                      {new Date(t.createdAt).toLocaleDateString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Users">
                        <IconButton size="small" onClick={() => handleViewUsers(t)} sx={{ color: '#60a5fa' }}>
                          <PeopleRounded sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Change Plan">
                        <IconButton size="small" onClick={() => {
                          setSelectedTenant(t);
                          setPlanForm({ plan: t.plan, maxAssets: t.limits.maxAssets, maxUsers: t.limits.maxUsers });
                          setPlanOpen(true);
                        }} sx={{ color: '#a78bfa' }}>
                          <UpgradeRounded sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t.isActive ? 'Suspend' : 'Activate'}>
                        <IconButton size="small" onClick={() => handleToggle(t)} sx={{ color: t.isActive ? '#f59e0b' : '#4ade80' }}>
                          <PowerSettingsNewRounded sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Company">
                        <IconButton size="small" onClick={() => handleDelete(t)} sx={{ color: '#ef4444' }}>
                          <DeleteRounded sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {(tab === 0 ? tenants : tab === 1 ? activeTenants : suspendedTenants)?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
                    No companies found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ─── Create Company Dialog ─── */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '16px', bgcolor: 'background.paper' } }}>
        <DialogTitle sx={{ fontWeight: 900, fontSize: 20 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: ACCENT, display: 'grid', placeItems: 'center' }}>
              <BusinessRounded sx={{ fontSize: 18, color: DARK }} />
            </Box>
            Provision New Company
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.secondary" mb={1.5} textTransform="uppercase" letterSpacing="0.7px">
            Company Details
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField id="company-name" fullWidth label="Company Name" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField id="company-slug" fullWidth label="Slug (unique ID)" value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                size="small" helperText="e.g. acme-corp (no spaces)" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Plan</InputLabel>
                <Select id="company-plan" value={form.plan} label="Plan" onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                  <MenuItem value="Basic">Basic</MenuItem>
                  <MenuItem value="Pro">Pro</MenuItem>
                  <MenuItem value="Enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField id="max-assets" fullWidth label="Max Assets" type="number" value={form.maxAssets}
                onChange={e => setForm(f => ({ ...f, maxAssets: e.target.value }))} size="small" helperText="Leave blank for plan default" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField id="max-users" fullWidth label="Max Users" type="number" value={form.maxUsers}
                onChange={e => setForm(f => ({ ...f, maxUsers: e.target.value }))} size="small" helperText="Leave blank for plan default" />
            </Grid>
          </Grid>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" fontWeight={800} color="text.secondary" mb={1.5} textTransform="uppercase" letterSpacing="0.7px">
            Admin Account
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField id="admin-name" fullWidth label="Admin Full Name" value={form.adminName}
                onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))} size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField id="admin-email" fullWidth label="Admin Email" type="email" value={form.adminEmail}
                onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} size="small" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField id="admin-password" fullWidth label="Temporary Password" type="password" value={form.adminPassword}
                onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))} size="small" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button
            id="confirm-provision-btn"
            variant="contained"
            onClick={handleCreateCompany}
            disabled={saving || !form.name || !form.slug || !form.adminEmail || !form.adminName || !form.adminPassword}
            sx={{ bgcolor: ACCENT, color: DARK, fontWeight: 900, borderRadius: '8px', px: 3 }}
          >
            {saving ? 'Provisioning...' : 'Provision Company'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Plan Update Dialog ─── */}
      <Dialog open={planOpen} onClose={() => setPlanOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle fontWeight={900}>
          Update Plan — {selectedTenant?.name}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mt: 1, mb: 2 }}>
            <InputLabel>Plan</InputLabel>
            <Select value={planForm.plan} label="Plan" onChange={e => setPlanForm(f => ({ ...f, plan: e.target.value }))}>
              <MenuItem value="Basic">Basic</MenuItem>
              <MenuItem value="Pro">Pro</MenuItem>
              <MenuItem value="Enterprise">Enterprise</MenuItem>
            </Select>
          </FormControl>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Max Assets" type="number" size="small"
                value={planForm.maxAssets} onChange={e => setPlanForm(f => ({ ...f, maxAssets: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Max Users" type="number" size="small"
                value={planForm.maxUsers} onChange={e => setPlanForm(f => ({ ...f, maxUsers: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPlanOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" onClick={handlePlanSave} disabled={saving}
            sx={{ bgcolor: ACCENT, color: DARK, fontWeight: 900, borderRadius: '8px' }}>
            {saving ? 'Saving...' : 'Save Plan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Tenant Users Dialog ─── */}
      <Dialog open={usersOpen} onClose={() => setUsersOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle fontWeight={900}>
          Users — {selectedTenant?.name}
        </DialogTitle>
        <DialogContent>
          {usersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    {['Name', 'Email', 'Role', 'Department', 'Status'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tenantUsers.map(u => (
                    <TableRow key={u._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 26, height: 26, fontSize: 11, fontWeight: 700, bgcolor: "rgba(124,58,237,0.12)", color: ACCENT }}>
                            {u.name?.substring(0, 1)}
                          </Avatar>
                          <Typography fontSize={13} fontWeight={600}>{u.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography fontSize={12} color="text.secondary">{u.email}</Typography></TableCell>
                      <TableCell>
                        <Chip label={u.role} size="small"
                          sx={{ fontWeight: 700, fontSize: 11, height: 20, textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell><Typography fontSize={12}>{u.department}</Typography></TableCell>
                      <TableCell>
                        <Chip
                          label={u.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            bgcolor: u.isActive ? '#14532d' : '#450a0a',
                            color: u.isActive ? '#4ade80' : '#f87171',
                            fontWeight: 700, fontSize: 11, height: 20
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {tenantUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                        No users found in this tenant.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUsersOpen(false)} sx={{ fontWeight: 700 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

