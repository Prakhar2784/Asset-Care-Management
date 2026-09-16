import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Tooltip, Alert, Snackbar, CircularProgress,
  Tabs, Tab, Divider, Avatar, Switch, FormControlLabel,
  InputAdornment, Stack, Card, CardContent, TablePagination
} from '@mui/material';
import {
  BusinessRounded, AddRounded, PowerSettingsNewRounded,
  DeleteRounded, PeopleRounded, BarChartRounded,
  CheckCircleRounded, CancelRounded, UpgradeRounded,
  InventoryRounded, ConfirmationNumberRounded, PersonRounded,
  ShieldRounded, RocketLaunchRounded, StarRounded,
  VisibilityRounded, TrendingUpRounded, DnsRounded,
  InboxRounded, EmailRounded, PhoneRounded, BusinessCenterRounded,
  EditNoteRounded, OpenInNewRounded, LocalOfferRounded,
  WarningAmberRounded, ErrorOutlineRounded, ScheduleRounded,
  ReceiptRounded, HistoryRounded, RefreshRounded, EditRounded,
  AccountBalanceWalletRounded, MonetizationOnRounded, CalendarMonthRounded,
  LocationOnRounded, AssignmentRounded, SearchRounded,
  CreditCardRounded, ContentCopyRounded, FilterListRounded,
  CheckRounded, ArrowForwardRounded, AccountTreeRounded
} from '@mui/icons-material';
import api from '../../api/axios';

const ACCENT = '#B4F105';
const DARK = '#051C12';
const TEXT_MUTED = '#64748B';

// Currency formatter for Indian numbering system
const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(val);
};

const PLAN_BADGE_STYLES = {
  'Home User': { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  'MSME': { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  'Large Scale': { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  'None': { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1' }
};

function PlanBadge({ plan }) {
  const style = PLAN_BADGE_STYLES[plan] || PLAN_BADGE_STYLES['None'];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1.25,
        py: 0.35,
        borderRadius: '6px',
        bgcolor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        fontWeight: 700,
        fontSize: '11.5px',
        letterSpacing: '0.2px'
      }}
    >
      {plan || 'None'}
    </Box>
  );
}

function StatusBadge({ status }) {
  let bg = '#F1F5F9';
  let text = '#475569';
  let border = '#CBD5E1';

  if (status === 'Active') {
    bg = '#ECFDF5';
    text = '#059669';
    border = '#A7F3D0';
  } else if (status === 'Pending Checkout' || status === 'Pending') {
    bg = '#FFFBEB';
    text = '#D97706';
    border = '#FDE68A';
  } else if (status === 'Expired') {
    bg = '#FEF2F2';
    text = '#DC2626';
    border = '#FECACA';
  } else if (status === 'Cancelled' || status === 'Failed') {
    bg = '#F8FAFC';
    text = '#64748B';
    border = '#E2E8F0';
  } else if (status === 'Paid') {
    bg = '#F0FDF4';
    text = '#16A34A';
    border = '#BBF7D0';
  }

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.25,
        py: 0.35,
        borderRadius: '6px',
        bgcolor: bg,
        color: text,
        border: `1px solid ${border}`,
        fontWeight: 700,
        fontSize: '11.5px',
        letterSpacing: '0.2px'
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: text }} />
      {status || 'Unknown'}
    </Box>
  );
}

function UrgencyBadge({ urgency, days }) {
  if (urgency === 'EXPIRED') {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.2, py: 0.3, borderRadius: '6px', bgcolor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontWeight: 800, fontSize: '11px' }}>
        <ErrorOutlineRounded sx={{ fontSize: 13 }} /> EXPIRED
      </Box>
    );
  }
  if (urgency === 'URGENT_15') {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.2, py: 0.3, borderRadius: '6px', bgcolor: '#FFF7ED', color: '#EA580C', border: '1px solid #FFEDD5', fontWeight: 800, fontSize: '11px' }}>
        <WarningAmberRounded sx={{ fontSize: 13 }} /> {days}d (URGENT)
      </Box>
    );
  }
  if (urgency === 'WARNING_30') {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.2, py: 0.3, borderRadius: '6px', bgcolor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', fontWeight: 700, fontSize: '11px' }}>
        <ScheduleRounded sx={{ fontSize: 13 }} /> {days}d remaining
      </Box>
    );
  }
  if (urgency === 'PENDING') {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.2, py: 0.3, borderRadius: '6px', bgcolor: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', fontWeight: 700, fontSize: '11px' }}>
        Pending Checkout
      </Box>
    );
  }
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.2, py: 0.3, borderRadius: '6px', bgcolor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', fontWeight: 700, fontSize: '11px' }}>
      <CheckCircleRounded sx={{ fontSize: 13 }} /> {days !== null ? `${days}d remaining` : 'Active'}
    </Box>
  );
}

// Professional, standalone metric KPI card with zero text collision
function MetricCard({ title, value, subtext, icon, iconBg = '#EFF6FF', iconColor = '#2563EB', badgeText, badgeColor = '#10B981' }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.75,
        borderRadius: '16px',
        bgcolor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: 140,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: iconBg,
            color: iconColor
          }}
        >
          {icon}
        </Box>
        {badgeText && (
          <Box
            sx={{
              px: 1,
              py: 0.3,
              borderRadius: '9999px',
              bgcolor: badgeColor + '18',
              color: badgeColor,
              fontWeight: 800,
              fontSize: '11px'
            }}
          >
            {badgeText}
          </Box>
        )}
      </Box>

      <Box>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontWeight: 800,
            color: TEXT_MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            fontSize: '11px',
            mb: 0.5
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            color: '#0F172A',
            letterSpacing: '-0.8px',
            lineHeight: 1.1,
            mb: 0.5,
            wordBreak: 'break-word'
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: TEXT_MUTED,
            fontSize: '12px',
            fontWeight: 500
          }}
        >
          {subtext}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function SuperAdminPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);
  const [mainTab, setMainTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [lastSynced, setLastSynced] = useState(new Date());

  // Expiry monitoring
  const [expiryList, setExpiryList] = useState([]);
  const [expiryLoading, setExpiryLoading] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState('ALL');
  const [expirySearch, setExpirySearch] = useState('');

  // Coupons
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponModal, setCouponModal] = useState({ open: false, isEdit: false, data: null });
  const [couponForm, setCouponForm] = useState({
    code: '', description: '', discountType: 'fixed', discountValue: '',
    minOrderValue: 0, maxDiscount: '', applicablePlans: ['ALL'],
    startDate: new Date().toISOString().split('T')[0], expiryDate: '', maxUsage: '', isActive: true
  });

  // Leads tab
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTenantDetails, setSelectedTenantDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState(0);
  const [copiedKey, setCopiedKey] = useState(false);

  // Search & Filter state for Companies Table
  const [companySearch, setCompanySearch] = useState('');
  const [companyPlanFilter, setCompanyPlanFilter] = useState('ALL');
  const [companyStatusFilter, setCompanyStatusFilter] = useState('ALL');
  const [companyPage, setCompanyPage] = useState(0);
  const [companyRowsPerPage, setCompanyRowsPerPage] = useState(10);

  // Transaction Search & Filter state
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [invoicePage, setInvoicePage] = useState(0);
  const [invoiceRowsPerPage, setInvoiceRowsPerPage] = useState(10);

  // Form state
  const [form, setForm] = useState({
    name: '', slug: '', plan: 'MSME',
    adminName: '', adminEmail: '', adminPassword: '',
    maxAssets: '', maxUsers: '', address: '', city: '', state: 'Maharashtra', pinCode: '', gstNumber: ''
  });
  const [planForm, setPlanForm] = useState({
    plan: 'MSME', expiryDate: '', status: 'Active', notes: ''
  });
  const [saving, setSaving] = useState(false);

  const showSnack = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorState(false);
      const { data: res } = await api.get('/super-admin/platform-stats');
      setData(res);
      setLastSynced(new Date());
    } catch {
      setErrorState(true);
      showSnack('Failed to load platform stats from backend.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExpiryMonitoring = useCallback(async () => {
    setExpiryLoading(true);
    try {
      const { data: res } = await api.get('/super-admin/expiry-monitoring');
      setExpiryList(res);
    } catch {
      showSnack('Failed to load expiry monitoring list.', 'error');
    } finally {
      setExpiryLoading(false);
    }
  }, []);

  const fetchCoupons = useCallback(async () => {
    setCouponsLoading(true);
    try {
      const { data: res } = await api.get('/super-admin/coupons');
      setCoupons(res);
    } catch {
      showSnack('Failed to load coupons.', 'error');
    } finally {
      setCouponsLoading(false);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const { data } = await api.get('/super-admin/leads');
      setLeads(data);
    } catch {
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      await api.patch(`/super-admin/leads/${leadId}`, { status: newStatus });
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? { ...l, status: newStatus } : l))
      );
      showSnack('Inquiry status updated successfully.');
    } catch {
      showSnack('Failed to update status.', 'error');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this contact inquiry?')) return;
    try {
      await api.delete(`/super-admin/leads/${leadId}`);
      setLeads((prev) => prev.filter((l) => l._id !== leadId));
      showSnack('Inquiry deleted successfully.');
    } catch {
      showSnack('Failed to delete inquiry.', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (mainTab === 2) fetchExpiryMonitoring();
    if (mainTab === 4) fetchCoupons();
    if (mainTab === 5) fetchLeads();
  }, [mainTab, fetchExpiryMonitoring, fetchCoupons, fetchLeads]);

  const handleOpenDetails = async (tenantId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailTab(0);
    setCopiedKey(false);
    try {
      const { data: res } = await api.get(`/super-admin/tenants/${tenantId}/details`);
      setSelectedTenantDetails(res);
    } catch {
      showSnack('Failed to load company details.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleTenant = async (tenantId) => {
    try {
      const { data: res } = await api.patch(`/super-admin/tenants/${tenantId}/toggle`);
      showSnack(res.message);
      fetchData();
      if (mainTab === 2) fetchExpiryMonitoring();
    } catch (e) {
      showSnack(e.response?.data?.message || 'Action failed', 'error');
    }
  };

  const handleDeleteTenant = async (tenant) => {
    if (!window.confirm(`Are you sure you want to permanently delete company "${tenant.name}"?`)) return;
    try {
      const { data: res } = await api.delete(`/super-admin/tenants/${tenant._id}`);
      showSnack(res.message);
      fetchData();
      if (mainTab === 2) fetchExpiryMonitoring();
    } catch (e) {
      showSnack(e.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/super-admin/tenants', form);
      showSnack('Company created successfully!');
      setCreateOpen(false);
      setForm({
        name: '', slug: '', plan: 'MSME', adminName: '', adminEmail: '',
        adminPassword: '', maxAssets: '', maxUsers: '', address: '', city: '', state: 'Maharashtra', pinCode: '', gstNumber: ''
      });
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Creation failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubscriptionAction = async (e) => {
    e.preventDefault();
    if (!selectedTenantDetails?.tenant?._id) return;
    setSaving(true);
    try {
      await api.post(`/super-admin/tenants/${selectedTenantDetails.tenant._id}/subscription-action`, {
        plan: planForm.plan,
        newExpiryDate: planForm.expiryDate,
        status: planForm.status,
        notes: planForm.notes
      });
      showSnack('Subscription updated successfully!');
      setPlanOpen(false);
      handleOpenDetails(selectedTenantDetails.tenant._id);
      fetchData();
      if (mainTab === 2) fetchExpiryMonitoring();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (couponModal.isEdit && couponModal.data?._id) {
        await api.put(`/super-admin/coupons/${couponModal.data._id}`, couponForm);
        showSnack(`Coupon "${couponForm.code}" updated.`);
      } else {
        await api.post('/super-admin/coupons', couponForm);
        showSnack(`Coupon "${couponForm.code}" created.`);
      }
      setCouponModal({ open: false, isEdit: false, data: null });
      fetchCoupons();
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Coupon save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCoupon = async (couponId) => {
    try {
      const { data: res } = await api.patch(`/super-admin/coupons/${couponId}/toggle`);
      showSnack(res.message);
      fetchCoupons();
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Toggle failed', 'error');
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return;
    try {
      const { data: res } = await api.delete(`/super-admin/coupons/${coupon._id}`);
      showSnack(res.message);
      fetchCoupons();
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const openCreateCoupon = () => {
    setCouponForm({
      code: '', description: '', discountType: 'fixed', discountValue: '',
      minOrderValue: 0, maxDiscount: '', applicablePlans: ['ALL'],
      startDate: new Date().toISOString().split('T')[0], expiryDate: '', maxUsage: '', isActive: true
    });
    setCouponModal({ open: true, isEdit: false, data: null });
  };

  const openEditCoupon = (c) => {
    setCouponForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderValue: c.minOrderValue || 0,
      maxDiscount: c.maxDiscount || '',
      applicablePlans: c.applicablePlans || ['ALL'],
      startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
      expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().split('T')[0] : '',
      maxUsage: c.maxUsage || '',
      isActive: c.isActive !== false
    });
    setCouponModal({ open: true, isEdit: true, data: c });
  };

  const copyLicenseKey = (key) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    showSnack('License key copied to clipboard.');
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const platform = data?.platform || {};
  const tenants = data?.tenants || [];
  const recentInvoices = data?.recentInvoices || [];

  // Filtered Companies
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch = !companySearch ||
        t.name?.toLowerCase().includes(companySearch.toLowerCase()) ||
        t.slug?.toLowerCase().includes(companySearch.toLowerCase()) ||
        t.contactEmail?.toLowerCase().includes(companySearch.toLowerCase());
      const matchesPlan = companyPlanFilter === 'ALL' || t.plan === companyPlanFilter;
      const matchesStatus = companyStatusFilter === 'ALL' || t.subscriptionStatus === companyStatusFilter;
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [tenants, companySearch, companyPlanFilter, companyStatusFilter]);

  // Filtered Expiry List
  const filteredExpiryList = useMemo(() => {
    return expiryList.filter((item) => {
      const matchesSearch = !expirySearch ||
        item.name?.toLowerCase().includes(expirySearch.toLowerCase()) ||
        item.slug?.toLowerCase().includes(expirySearch.toLowerCase()) ||
        item.customerName?.toLowerCase().includes(expirySearch.toLowerCase());
      if (!matchesSearch) return false;
      if (expiryFilter === 'EXPIRED') return item.urgency === 'EXPIRED';
      if (expiryFilter === 'URGENT_15') return item.urgency === 'URGENT_15';
      if (expiryFilter === 'WARNING_30') return item.urgency === 'WARNING_30';
      if (expiryFilter === 'PENDING') return item.urgency === 'PENDING';
      if (expiryFilter === 'ACTIVE') return item.urgency === 'ACTIVE';
      return true;
    });
  }, [expiryList, expirySearch, expiryFilter]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return recentInvoices.filter((inv) => {
      const matchesSearch = !invoiceSearch ||
        inv.invoiceNumber?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.companyName?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.razorpayOrderId?.toLowerCase().includes(invoiceSearch.toLowerCase());
      const matchesStatus = invoiceStatusFilter === 'ALL' || inv.status === invoiceStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [recentInvoices, invoiceSearch, invoiceStatusFilter]);

  // Plan Breakdown percentages
  const planBreakdown = platform.planBreakdown || {};
  const totalTenantsCount = platform.totalTenants || 0;
  const homeCount = planBreakdown['Home User'] || 0;
  const msmeCount = planBreakdown['MSME'] || 0;
  const largeCount = planBreakdown['Large Scale'] || 0;
  const homePct = totalTenantsCount > 0 ? ((homeCount / totalTenantsCount) * 100).toFixed(1) : 0;
  const msmePct = totalTenantsCount > 0 ? ((msmeCount / totalTenantsCount) * 100).toFixed(1) : 0;
  const largePct = totalTenantsCount > 0 ? ((largeCount / totalTenantsCount) * 100).toFixed(1) : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* ─── 1. TOP HEADER ────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          mb: 3.5,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                bgcolor: DARK,
                color: ACCENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(5, 28, 18, 0.2)'
              }}
            >
              <ShieldRounded sx={{ fontSize: 22 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>
              Super Admin Console
            </Typography>
            <Chip
              label="Control Plane"
              size="small"
              sx={{
                bgcolor: '#EFF6FF',
                color: '#2563EB',
                fontWeight: 800,
                fontSize: '11px',
                border: '1px solid #DBEAFE'
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: TEXT_MUTED, fontWeight: 500 }}>
            AssetCare Platform Administration, Tenant Isolation & Commercial Licensing Engine
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
            Last synced: {lastSynced.toLocaleTimeString()}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshRounded sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />}
            onClick={fetchData}
            disabled={loading}
            sx={{
              borderRadius: '10px',
              borderColor: '#E2E8F0',
              color: '#334155',
              bgcolor: '#FFFFFF',
              fontWeight: 700,
              textTransform: 'none',
              px: 2,
              '&:hover': { bgcolor: '#F1F5F9', borderColor: '#CBD5E1' }
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setCreateOpen(true)}
            sx={{
              borderRadius: '10px',
              bgcolor: DARK,
              color: '#FFFFFF',
              fontWeight: 800,
              textTransform: 'none',
              px: 2.5,
              boxShadow: '0 4px 12px rgba(5, 28, 18, 0.15)',
              '&:hover': { bgcolor: '#0B291C' }
            }}
          >
            Provision Company
          </Button>
        </Stack>
      </Box>

      {/* ─── NAVIGATION TABS ────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          mb: 3.5,
          p: 0.5
        }}
      >
        <Tabs
          value={mainTab}
          onChange={(_, v) => setMainTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 48,
            '& .MuiTabs-indicator': {
              bgcolor: DARK,
              height: 3,
              borderRadius: '3px 3px 0 0'
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13.5px',
              color: '#64748B',
              minHeight: 48,
              px: 2.5,
              '&.Mui-selected': {
                color: '#0F172A',
                fontWeight: 900
              }
            }
          }}
        >
          <Tab
            icon={<BarChartRounded sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Overview & Financials"
          />
          <Tab
            icon={<BusinessRounded sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Companies (${totalTenantsCount})`}
          />
          <Tab
            icon={<ScheduleRounded sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Expiry Monitoring (${platform.expiringIn30 || 0})`}
          />
          <Tab
            icon={<ReceiptRounded sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Transactions (${platform.paidInvoicesCount || 0})`}
          />
          <Tab
            icon={<LocalOfferRounded sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Promotions & Coupons (${platform.totalCoupons || 0})`}
          />
          <Tab
            icon={<InboxRounded sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Contact Inquiries (${leads.length})`}
          />
        </Tabs>
      </Paper>

      {/* Error state */}
      {errorState && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchData}>
              Retry
            </Button>
          }
          sx={{ mb: 3, borderRadius: '12px' }}
        >
          Unable to load live platform statistics. Please check database connectivity and retry.
        </Alert>
      )}

      {/* ─── TAB 0: EXECUTIVE OVERVIEW & FINANCIALS ─────────────────────────────────── */}
      {mainTab === 0 && (
        <Box>
          {loading && !data ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <CircularProgress size={40} sx={{ color: DARK, mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Loading live platform telemetry and billing data...
              </Typography>
            </Box>
          ) : (
            <>
              {/* PRIMARY 9 KPI CARDS */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', mb: 2, letterSpacing: '0.3px', textTransform: 'uppercase', fontSize: '12px' }}>
                  Platform Health & Subscriptions
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6} md={4} lg={2.4}>
                    <MetricCard
                      title="Total Companies"
                      value={platform.totalTenants ?? 'N/A'}
                      subtext="All registered tenants"
                      icon={<BusinessRounded sx={{ fontSize: 22 }} />}
                      iconBg="#EFF6FF"
                      iconColor="#2563EB"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={4} lg={2.4}>
                    <MetricCard
                      title="Active Subscriptions"
                      value={platform.activeSubscriptions ?? 'N/A'}
                      subtext={`of ${platform.totalTenants || 0} companies (${totalTenantsCount > 0 ? ((platform.activeSubscriptions / totalTenantsCount) * 100).toFixed(1) : 0}%)`}
                      icon={<CheckCircleRounded sx={{ fontSize: 22 }} />}
                      iconBg="#ECFDF5"
                      iconColor="#059669"
                      badgeText="Active"
                      badgeColor="#059669"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={4} lg={2.4}>
                    <MetricCard
                      title="Pending Checkout"
                      value={platform.pendingCheckout ?? 'N/A'}
                      subtext="Awaiting plan purchase"
                      icon={<ScheduleRounded sx={{ fontSize: 22 }} />}
                      iconBg="#FFFBEB"
                      iconColor="#D97706"
                      badgeText="Pending"
                      badgeColor="#D97706"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={4} lg={2.4}>
                    <MetricCard
                      title="Expiring ≤ 30 Days"
                      value={platform.expiringIn30 ?? 'N/A'}
                      subtext="Renewal window open"
                      icon={<WarningAmberRounded sx={{ fontSize: 22 }} />}
                      iconBg="#FFF7ED"
                      iconColor="#EA580C"
                      badgeText={platform.expiringIn30 > 0 ? 'Warning' : 'Good'}
                      badgeColor={platform.expiringIn30 > 0 ? '#EA580C' : '#10B981'}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={4} lg={2.4}>
                    <MetricCard
                      title="Expiring ≤ 15 Days"
                      value={platform.expiringIn15 ?? 'N/A'}
                      subtext="Urgent action required"
                      icon={<ErrorOutlineRounded sx={{ fontSize: 22 }} />}
                      iconBg="#FEF2F2"
                      iconColor="#DC2626"
                      badgeText={platform.expiringIn15 > 0 ? 'Urgent' : 'Zero'}
                      badgeColor={platform.expiringIn15 > 0 ? '#DC2626' : '#10B981'}
                    />
                  </Grid>

                  {/* Revenue & Tax Row */}
                  <Grid item xs={12} sm={6} md={4} lg={3}>
                    <MetricCard
                      title="Total Platform Revenue"
                      value={formatINR(platform.totalRevenue)}
                      subtext={`From ${platform.paidInvoicesCount || 0} paid transactions`}
                      icon={<MonetizationOnRounded sx={{ fontSize: 22 }} />}
                      iconBg="#F0FDF4"
                      iconColor="#16A34A"
                      badgeText="Gross Paid"
                      badgeColor="#16A34A"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={4} lg={3}>
                    <MetricCard
                      title="Total GST Collected"
                      value={formatINR(platform.totalTax)}
                      subtext={`Taxable base: ${formatINR(platform.totalTaxable)}`}
                      icon={<ReceiptRounded sx={{ fontSize: 22 }} />}
                      iconBg="#F5F3FF"
                      iconColor="#7C3AED"
                      badgeText="18% GST"
                      badgeColor="#7C3AED"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={4} lg={3}>
                    <MetricCard
                      title="Expired Subscriptions"
                      value={platform.expiredSubscriptions ?? 'N/A'}
                      subtext="In grace period or expired"
                      icon={<CancelRounded sx={{ fontSize: 22 }} />}
                      iconBg="#F8FAFC"
                      iconColor="#64748B"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={4} lg={3}>
                    <MetricCard
                      title="Cancelled Subscriptions"
                      value={platform.cancelledSubscriptions ?? 'N/A'}
                      subtext="Deactivated tenant accounts"
                      icon={<PowerSettingsNewRounded sx={{ fontSize: 22 }} />}
                      iconBg="#F8FAFC"
                      iconColor="#64748B"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* ─── PLAN DISTRIBUTION & REVENUE SUMMARY ────────────────────────────── */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Plan Distribution */}
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: '16px',
                      bgcolor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      height: '100%'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '16px' }}>
                          Subscription Plan Breakdown
                        </Typography>
                        <Typography variant="body2" sx={{ color: TEXT_MUTED, fontSize: '12.5px' }}>
                          Distribution across {totalTenantsCount} registered companies
                        </Typography>
                      </Box>
                      <AccountTreeRounded sx={{ color: TEXT_MUTED }} />
                    </Box>

                    <Stack spacing={3}>
                      {/* MSME */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <PlanBadge plan="MSME" />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '13px' }}>
                              ₹2,999 / year
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '13px' }}>
                            {`${msmeCount} companies (${msmePct}%)`}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Number(msmePct)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#F5F3FF',
                            '& .MuiLinearProgress-bar': { bgcolor: '#7C3AED', borderRadius: 4 }
                          }}
                        />
                      </Box>

                      {/* Large Scale */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <PlanBadge plan="Large Scale" />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '13px' }}>
                              ₹8,999 / year
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '13px' }}>
                            {`${largeCount} companies (${largePct}%)`}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Number(largePct)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#ECFDF5',
                            '& .MuiLinearProgress-bar': { bgcolor: '#059669', borderRadius: 4 }
                          }}
                        />
                      </Box>

                      {/* Home User */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <PlanBadge plan="Home User" />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '13px' }}>
                              ₹999 / year
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '13px' }}>
                            {`${homeCount} companies (${homePct}%)`}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Number(homePct)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#EFF6FF',
                            '& .MuiLinearProgress-bar': { bgcolor: '#2563EB', borderRadius: 4 }
                          }}
                        />
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Platform Utilization & Coupons Summary */}
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: '16px',
                      bgcolor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '16px' }}>
                          Financial & Coupon Telemetry
                        </Typography>
                        <Typography variant="body2" sx={{ color: TEXT_MUTED, fontSize: '12.5px' }}>
                          Real-time transaction compliance & promo engine
                        </Typography>
                      </Box>
                      <CreditCardRounded sx={{ color: TEXT_MUTED }} />
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                          <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 700 }}>
                            PAID INVOICES
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#16A34A', mt: 0.5 }}>
                            {platform.paidInvoicesCount ?? 0}
                          </Typography>
                          <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                            Settled via Razorpay
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={6}>
                        <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                          <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 700 }}>
                            PENDING PAYMENTS
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#D97706', mt: 0.5 }}>
                            {platform.pendingInvoicesCount ?? 0}
                          </Typography>
                          <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                            Orders awaiting capture
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={6}>
                        <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                          <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 700 }}>
                            ACTIVE COUPONS
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#7C3AED', mt: 0.5 }}>
                            {platform.activeCoupons ?? 0}
                          </Typography>
                          <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                            of {platform.totalCoupons || 0} configured codes
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={6}>
                        <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                          <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 700 }}>
                            COUPON USAGE
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', mt: 0.5 }}>
                            {platform.totalCouponUsage ?? 0}
                          </Typography>
                          <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                            Total checkout redemptions
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Button
                      variant="outlined"
                      endIcon={<ArrowForwardRounded />}
                      onClick={() => setMainTab(4)}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700,
                        color: DARK,
                        borderColor: '#E2E8F0',
                        '&:hover': { bgcolor: '#F8FAFC', borderColor: DARK }
                      }}
                    >
                      Manage Promotional Coupons
                    </Button>
                  </Paper>
                </Grid>
              </Grid>

              {/* RECENT TRANSACTIONS PREVIEW */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    p: 2.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #E2E8F0'
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '16px' }}>
                      Recent Payments & Invoices
                    </Typography>
                    <Typography variant="body2" sx={{ color: TEXT_MUTED, fontSize: '12.5px' }}>
                      Latest commercial subscription transactions recorded in the platform
                    </Typography>
                  </Box>
                  <Button
                    variant="text"
                    endIcon={<ArrowForwardRounded />}
                    onClick={() => setMainTab(3)}
                    sx={{ textTransform: 'none', fontWeight: 700, color: '#2563EB' }}
                  >
                    View All Transactions
                  </Button>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '12px', py: 1.5 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '12px' }}>Invoice #</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '12px' }}>Company</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '12px' }}>Plan</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '12px' }}>Taxable</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '12px' }}>GST (18%)</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '12px' }}>Total Amount</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '12px' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentInvoices.slice(0, 5).map((inv) => (
                        <TableRow key={inv._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ color: '#334155', fontSize: '12.5px', py: 1.5 }}>
                            {inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : '—'}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A', fontSize: '12px' }}>
                            {inv.invoiceNumber}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0F172A', fontSize: '12.5px' }}>
                            {inv.companyName}
                          </TableCell>
                          <TableCell><PlanBadge plan={inv.planName} /></TableCell>
                          <TableCell sx={{ color: '#475569', fontSize: '12.5px' }}>{formatINR(inv.taxableAmount)}</TableCell>
                          <TableCell sx={{ color: '#475569', fontSize: '12.5px' }}>{formatINR((inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0))}</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#0F172A', fontSize: '13px' }}>{formatINR(inv.totalAmount)}</TableCell>
                          <TableCell><StatusBadge status={inv.status} /></TableCell>
                        </TableRow>
                      ))}
                      {recentInvoices.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4, color: TEXT_MUTED }}>
                            No payment transactions recorded yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}
        </Box>
      )}

      {/* ─── TAB 1: REGISTERED COMPANIES (FULL MANAGEMENT) ────────────────────────── */}
      {mainTab === 1 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }}
        >
          {/* Filter Bar */}
          <Box sx={{ p: 2.5, borderBottom: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', flex: 1, minWidth: 280 }}>
              <TextField
                size="small"
                placeholder="Search by company name, slug, or email..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ fontSize: 20, color: TEXT_MUTED }} />
                    </InputAdornment>
                  )
                }}
                sx={{ minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Plan Filter</InputLabel>
                <Select
                  value={companyPlanFilter}
                  label="Plan Filter"
                  onChange={(e) => setCompanyPlanFilter(e.target.value)}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="ALL">All Plans</MenuItem>
                  <MenuItem value="Home User">Home User</MenuItem>
                  <MenuItem value="MSME">MSME</MenuItem>
                  <MenuItem value="Large Scale">Large Scale</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={companyStatusFilter}
                  label="Status Filter"
                  onChange={(e) => setCompanyStatusFilter(e.target.value)}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Pending Checkout">Pending Checkout</MenuItem>
                  <MenuItem value="Expired">Expired</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Typography variant="body2" sx={{ color: TEXT_MUTED, fontWeight: 600 }}>
              Showing {filteredTenants.length} of {tenants.length} companies
            </Typography>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', py: 1.5 }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Customer Type</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Plan</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Subscription Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Expiry Date</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Days Left</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Limits</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Active</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTenants
                  .slice(companyPage * companyRowsPerPage, companyPage * companyRowsPerPage + companyRowsPerPage)
                  .map((t) => (
                    <TableRow key={t._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {t.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: TEXT_MUTED, fontFamily: 'monospace' }}>
                          /{t.slug} {t.contactEmail ? `• ${t.contactEmail}` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '12.5px' }}>
                        {t.customerType || 'Business'}
                      </TableCell>
                      <TableCell><PlanBadge plan={t.plan} /></TableCell>
                      <TableCell><StatusBadge status={t.subscriptionStatus} /></TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '12.5px' }}>
                        {t.planExpiry ? new Date(t.planExpiry).toLocaleDateString('en-IN') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {t.daysRemaining !== null ? (
                          <Typography variant="body2" sx={{ fontWeight: 700, color: t.daysRemaining <= 15 ? '#DC2626' : '#334155' }}>
                            {t.daysRemaining} days
                          </Typography>
                        ) : '—'}
                      </TableCell>
                      <TableCell sx={{ color: TEXT_MUTED, fontSize: '12px' }}>
                        {`${t.limits?.maxAssets || 0} assets / ${t.limits?.maxUsers || 0} users`}
                      </TableCell>
                      <TableCell>
                        <Switch
                          size="small"
                          checked={t.isActive}
                          onChange={() => handleToggleTenant(t._id)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: DARK },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: DARK }
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenDetails(t._id)}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              borderRadius: '8px',
                              borderColor: '#E2E8F0',
                              color: '#334155',
                              '&:hover': { borderColor: DARK, bgcolor: '#F8FAFC' }
                            }}
                          >
                            Inspect 360°
                          </Button>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteTenant(t)}
                            sx={{ borderRadius: '8px' }}
                          >
                            <DeleteRounded fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                {filteredTenants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: TEXT_MUTED }}>
                      No companies match the specified search or filter criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredTenants.length}
            rowsPerPage={companyRowsPerPage}
            page={companyPage}
            onPageChange={(_, p) => setCompanyPage(p)}
            onRowsPerPageChange={(e) => {
              setCompanyRowsPerPage(parseInt(e.target.value, 10));
              setCompanyPage(0);
            }}
          />
        </Paper>
      )}

      {/* ─── TAB 2: SUBSCRIPTION EXPIRY MONITORING ───────────────────────────────── */}
      {mainTab === 2 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2.5, borderBottom: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '16px' }}>
                Subscription Expiry Radar
              </Typography>
              <Typography variant="body2" sx={{ color: TEXT_MUTED, fontSize: '12.5px' }}>
                Real-time tracking sorted by renewal urgency (expired & approaching deadlines first)
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <TextField
                size="small"
                placeholder="Search company or admin..."
                value={expirySearch}
                onChange={(e) => setExpirySearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ fontSize: 18, color: TEXT_MUTED }} />
                    </InputAdornment>
                  )
                }}
                sx={{ minWidth: 240, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Urgency</InputLabel>
                <Select
                  value={expiryFilter}
                  label="Urgency"
                  onChange={(e) => setExpiryFilter(e.target.value)}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="ALL">All Urgencies</MenuItem>
                  <MenuItem value="EXPIRED">Expired</MenuItem>
                  <MenuItem value="URGENT_15">≤ 15 Days</MenuItem>
                  <MenuItem value="WARNING_30">≤ 30 Days</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          {expiryLoading ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <CircularProgress size={36} sx={{ color: DARK, mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary">
                Analyzing tenant subscription expirations...
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', py: 1.5 }}>Urgency Level</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Company</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Customer Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Plan</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Start Date</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Expiry Date</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Contact Info</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExpiryList.map((row) => (
                    <TableRow key={row._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ py: 1.5 }}>
                        <UrgencyBadge urgency={row.urgency} days={row.daysRemaining} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {row.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                          /{row.slug}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#334155', fontWeight: 600, fontSize: '12.5px' }}>
                        {row.customerName}
                      </TableCell>
                      <TableCell><PlanBadge plan={row.plan} /></TableCell>
                      <TableCell><StatusBadge status={row.subscriptionStatus} /></TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '12.5px' }}>
                        {row.startDate ? new Date(row.startDate).toLocaleDateString('en-IN') : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '12.5px' }}>
                        {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString('en-IN') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#334155', display: 'block', fontWeight: 600 }}>
                          {row.contactEmail || 'No email'}
                        </Typography>
                        {row.contactPhone && (
                          <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                            {row.contactPhone}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenDetails(row._id)}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '8px',
                            borderColor: '#E2E8F0',
                            color: '#334155',
                            '&:hover': { borderColor: DARK, bgcolor: '#F8FAFC' }
                          }}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredExpiryList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                        <CheckCircleRounded sx={{ fontSize: 36, color: '#10B981', mb: 1, display: 'block', mx: 'auto' }} />
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          No companies currently expiring within 30 days
                        </Typography>
                        <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                          All commercial customer subscriptions are active and healthy.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* ─── TAB 3: TRANSACTIONS & REVENUE INVOICES ───────────────────────────────── */}
      {mainTab === 3 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2.5, borderBottom: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '16px' }}>
                Commercial Invoices & Transactions
              </Typography>
              <Typography variant="body2" sx={{ color: TEXT_MUTED, fontSize: '12.5px' }}>
                Complete audit ledger of billing orders, GST compliance, and payment gateway references
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <TextField
                size="small"
                placeholder="Search invoice #, company, order ID..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ fontSize: 18, color: TEXT_MUTED }} />
                    </InputAdornment>
                  )
                }}
                sx={{ minWidth: 260, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={invoiceStatusFilter}
                  label="Payment Status"
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', py: 1.5 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Invoice #</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Plan</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Base Amount</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Discount</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>GST (18%)</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Total Paid</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Gateway Reference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices
                  .slice(invoicePage * invoiceRowsPerPage, invoicePage * invoiceRowsPerPage + invoiceRowsPerPage)
                  .map((inv) => (
                    <TableRow key={inv._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ color: '#334155', fontSize: '12px', py: 1.5 }}>
                        {inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : '—'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', fontSize: '12px' }}>
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0F172A', fontSize: '12.5px' }}>
                        {inv.companyName}
                      </TableCell>
                      <TableCell><PlanBadge plan={inv.planName} /></TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '12px' }}>{formatINR(inv.baseAmount)}</TableCell>
                      <TableCell sx={{ color: inv.discountAmount > 0 ? '#16A34A' : '#64748B', fontSize: '12px', fontWeight: inv.discountAmount > 0 ? 700 : 400 }}>
                        {inv.discountAmount > 0 ? `- ${formatINR(inv.discountAmount)}` : '₹0.00'}
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '12px' }}>
                        {formatINR((inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0))}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 900, color: '#0F172A', fontSize: '13px' }}>
                        {formatINR(inv.totalAmount)}
                      </TableCell>
                      <TableCell><StatusBadge status={inv.status} /></TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: TEXT_MUTED, display: 'block' }}>
                          {inv.razorpayPaymentId !== '—' ? `Pay: ${inv.razorpayPaymentId}` : '—'}
                        </Typography>
                        {inv.razorpayOrderId !== '—' && (
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#94A3B8' }}>
                            Order: {inv.razorpayOrderId}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                {filteredInvoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6, color: TEXT_MUTED }}>
                      No invoices found matching search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredInvoices.length}
            rowsPerPage={invoiceRowsPerPage}
            page={invoicePage}
            onPageChange={(_, p) => setInvoicePage(p)}
            onRowsPerPageChange={(e) => {
              setInvoiceRowsPerPage(parseInt(e.target.value, 10));
              setInvoicePage(0);
            }}
          />
        </Paper>
      )}

      {/* ─── TAB 4: PROMOTIONS & COUPON MANAGEMENT ENGINE ────────────────────────── */}
      {mainTab === 4 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2.5, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '16px' }}>
                Promotional Coupons & Discount Engine
              </Typography>
              <Typography variant="body2" sx={{ color: TEXT_MUTED, fontSize: '12.5px' }}>
                Configure promo codes, percentage / flat discounts, validity dates, minimum order thresholds, and plan limits
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={openCreateCoupon}
              sx={{
                bgcolor: DARK,
                color: '#FFFFFF',
                borderRadius: '10px',
                fontWeight: 800,
                textTransform: 'none',
                px: 2.5,
                '&:hover': { bgcolor: '#0B291C' }
              }}
            >
              Create Coupon
            </Button>
          </Box>

          {couponsLoading ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <CircularProgress size={36} sx={{ color: DARK, mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary">
                Loading promo codes...
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', py: 1.5 }}>Coupon Code</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Discount</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Min Order / Max Cap</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Applicable Plans</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Validity Period</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Usage Count</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Active</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coupons.map((c) => (
                    <TableRow key={c._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            px: 1.25,
                            py: 0.35,
                            borderRadius: '6px',
                            bgcolor: '#F1F5F9',
                            color: '#0F172A',
                            fontFamily: 'monospace',
                            fontWeight: 900,
                            fontSize: '12px',
                            border: '1px solid #CBD5E1'
                          }}
                        >
                          {c.code}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#334155', fontSize: '12.5px', maxWidth: 220 }}>
                        {c.description || '—'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0F172A', fontSize: '13px' }}>
                        {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `${formatINR(c.discountValue)} FLAT`}
                      </TableCell>
                      <TableCell sx={{ color: TEXT_MUTED, fontSize: '12px' }}>
                        {`Min: ${formatINR(c.minOrderValue || 0)}`}
                        {c.maxDiscount ? ` • Cap: ${formatINR(c.maxDiscount)}` : ''}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {c.applicablePlans?.map((p) => (
                            <PlanBadge key={p} plan={p} />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '12px' }}>
                        {c.startDate ? new Date(c.startDate).toLocaleDateString('en-IN') : 'Now'}
                        {' → '}
                        {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN') : 'No Expiry'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0F172A', fontSize: '12.5px' }}>
                        {`${c.usedCount || 0} / ${c.maxUsage || '∞'}`}
                      </TableCell>
                      <TableCell>
                        <Switch
                          size="small"
                          checked={c.isActive}
                          onChange={() => handleToggleCoupon(c._id)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: DARK },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: DARK }
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton size="small" onClick={() => openEditCoupon(c)}>
                            <EditRounded fontSize="small" sx={{ color: '#334155' }} />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteCoupon(c)}>
                            <DeleteRounded fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {coupons.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6, color: TEXT_MUTED }}>
                        No promotional coupons created yet. Click "+ Create Coupon" above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* ─── TAB 5: CONTACT INQUIRIES & DEMO LEADS ─────────────────────────────────── */}
      {mainTab === 5 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2.5, borderBottom: '1px solid #E2E8F0' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '16px' }}>
              Inbound Platform Inquiries & Sales Leads
            </Typography>
            <Typography variant="body2" sx={{ color: TEXT_MUTED, fontSize: '12.5px' }}>
              Messages and demo requests submitted through the public website
            </Typography>
          </Box>

          {leadsLoading ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <CircularProgress size={36} sx={{ color: DARK, mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary">
                Loading inquiries...
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', py: 1.5 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Phone Number</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Company / Type</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', minWidth: 200 }}>Message</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ color: '#475569', fontSize: '12px', py: 1.5, whiteSpace: 'nowrap' }}>
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN') : '—'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0F172A', fontSize: '12.5px' }}>
                        {lead.name}
                      </TableCell>
                      <TableCell sx={{ color: '#2563EB', fontSize: '12.5px' }}>
                        <a href={`mailto:${lead.email}`} style={{ color: '#2563EB', textDecoration: 'none' }}>
                          {lead.email}
                        </a>
                      </TableCell>
                      <TableCell sx={{ fontSize: '12.5px' }}>
                        {lead.phone ? (
                          <Box
                            component="a"
                            href={`tel:${lead.phone}`}
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              color: '#059669',
                              fontWeight: 700,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            <PhoneRounded sx={{ fontSize: '14px' }} />
                            {lead.phone}
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ color: '#334155', fontSize: '12.5px' }}>
                        <Typography sx={{ fontSize: '12.5px', fontWeight: 600 }}>{lead.company || '—'}</Typography>
                        {(lead.inquiryType || lead.type) && (
                          <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                            {lead.inquiryType || lead.type}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '12.5px', maxWidth: 300, wordBreak: 'break-word' }}>
                        {lead.message || '—'}
                      </TableCell>
                      <TableCell sx={{ py: 1 }}>
                        <Select
                          size="small"
                          value={lead.status || 'New'}
                          onChange={(e) => handleUpdateLeadStatus(lead._id, e.target.value)}
                          sx={{
                            fontSize: '12px',
                            fontWeight: 700,
                            height: 30,
                            borderRadius: '8px',
                            bgcolor:
                              lead.status === 'Converted' ? '#ECFDF5' :
                              lead.status === 'Demo Scheduled' ? '#EFF6FF' :
                              lead.status === 'Contacted' ? '#FFFBEB' :
                              lead.status === 'Not Interested' ? '#FEF2F2' : '#F1F5F9',
                            color:
                              lead.status === 'Converted' ? '#059669' :
                              lead.status === 'Demo Scheduled' ? '#2563EB' :
                              lead.status === 'Contacted' ? '#D97706' :
                              lead.status === 'Not Interested' ? '#DC2626' : '#475569',
                            '& .MuiSelect-select': { py: 0.5, px: 1 }
                          }}
                        >
                          <MenuItem value="New">New</MenuItem>
                          <MenuItem value="Contacted">Contacted</MenuItem>
                          <MenuItem value="Demo Scheduled">Demo Scheduled</MenuItem>
                          <MenuItem value="Converted">Converted</MenuItem>
                          <MenuItem value="Not Interested">Not Interested</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1 }}>
                        <Tooltip title="Delete Inquiry">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteLead(lead._id)}
                            sx={{
                              color: '#EF4444',
                              bgcolor: '#FEF2F2',
                              '&:hover': { bgcolor: '#FEE2E2' }
                            }}
                          >
                            <DeleteRounded sx={{ fontSize: '16px' }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {leads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6, color: TEXT_MUTED }}>
                        No inbound leads recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* ─── MODAL: 360° COMPANY INSPECTION & DETAILS ─────────────────────────────── */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A' }}>
              {selectedTenantDetails?.tenant?.name || 'Company Profile'}
            </Typography>
            <Typography variant="caption" sx={{ color: TEXT_MUTED, fontFamily: 'monospace' }}>
              {`Slug: /${selectedTenantDetails?.tenant?.slug || ''} • Tenant ID: ${selectedTenantDetails?.tenant?._id || ''}`}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<UpgradeRounded />}
            onClick={() => {
              const currentExpiry = selectedTenantDetails?.tenant?.planExpiry
                ? new Date(selectedTenantDetails.tenant.planExpiry).toISOString().split('T')[0]
                : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              setPlanForm({
                plan: selectedTenantDetails?.tenant?.plan || 'MSME',
                expiryDate: currentExpiry,
                status: selectedTenantDetails?.tenant?.subscriptionStatus || 'Active',
                notes: ''
              });
              setPlanOpen(true);
            }}
            sx={{
              borderRadius: '10px',
              bgcolor: DARK,
              color: '#FFFFFF',
              fontWeight: 800,
              textTransform: 'none',
              '&:hover': { bgcolor: '#0B291C' }
            }}
          >
            Manage Subscription
          </Button>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {detailLoading ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <CircularProgress size={36} sx={{ color: DARK, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Loading 360° records...</Typography>
            </Box>
          ) : (
            <Box>
              <Tabs
                value={detailTab}
                onChange={(_, v) => setDetailTab(v)}
                sx={{
                  px: 3,
                  borderBottom: '1px solid #E2E8F0',
                  '& .MuiTabs-indicator': { bgcolor: DARK }
                }}
              >
                <Tab label="Profile & License" sx={{ textTransform: 'none', fontWeight: 700 }} />
                <Tab label={`Invoices (${selectedTenantDetails?.invoices?.length || 0})`} sx={{ textTransform: 'none', fontWeight: 700 }} />
                <Tab label={`History Log (${selectedTenantDetails?.history?.length || 0})`} sx={{ textTransform: 'none', fontWeight: 700 }} />
                <Tab label={`Users (${selectedTenantDetails?.users?.length || 0})`} sx={{ textTransform: 'none', fontWeight: 700 }} />
              </Tabs>

              {/* Subtab 0: Profile */}
              {detailTab === 0 && (
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: TEXT_MUTED, textTransform: 'uppercase' }}>
                        COMPANY IDENTITY
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                        {selectedTenantDetails?.tenant?.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
                        Customer Type: <strong>{selectedTenantDetails?.tenant?.customerType || 'Business'}</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
                        Address: {selectedTenantDetails?.tenant?.address?.line || 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569' }}>
                        {`${selectedTenantDetails?.tenant?.address?.city || ''}, ${selectedTenantDetails?.tenant?.address?.state || ''} ${selectedTenantDetails?.tenant?.address?.pin || ''}`}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>
                        GSTIN: <strong>{selectedTenantDetails?.tenant?.gstNumber || 'None'}</strong>
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: TEXT_MUTED, textTransform: 'uppercase' }}>
                        SUBSCRIPTION & COMMERCIAL LICENSE
                      </Typography>
                      <Box sx={{ mt: 0.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                        <PlanBadge plan={selectedTenantDetails?.tenant?.plan} />
                        <StatusBadge status={selectedTenantDetails?.tenant?.subscriptionStatus} />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#475569', mt: 1.5 }}>
                        <strong>Plan Expiry:</strong>{' '}
                        {selectedTenantDetails?.tenant?.planExpiry
                          ? new Date(selectedTenantDetails.tenant.planExpiry).toLocaleDateString('en-IN')
                          : 'N/A'}
                        {selectedTenantDetails?.tenant?.daysRemaining !== null && selectedTenantDetails?.tenant?.daysRemaining !== undefined
                          ? ` (${selectedTenantDetails.tenant.daysRemaining} days left)`
                          : ''}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>
                        <strong>Commercial License Key:</strong>
                      </Typography>
                      <Box
                        sx={{
                          p: 1,
                          mt: 0.5,
                          borderRadius: '8px',
                          bgcolor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A', wordBreak: 'break-all' }}>
                          {selectedTenantDetails?.tenant?.licenseKey || 'None'}
                        </Typography>
                        {selectedTenantDetails?.tenant?.licenseKey && (
                          <IconButton size="small" onClick={() => copyLicenseKey(selectedTenantDetails.tenant.licenseKey)}>
                            {copiedKey ? <CheckRounded fontSize="small" color="success" /> : <ContentCopyRounded fontSize="small" />}
                          </IconButton>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Subtab 1: Invoices */}
              {detailTab === 1 && (
                <TableContainer sx={{ maxHeight: 320 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Invoice #</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Plan</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Taxable</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>GST</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selectedTenantDetails?.invoices || []).map((inv) => (
                        <TableRow key={inv._id} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{inv.invoiceNumber}</TableCell>
                          <TableCell>{inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : '—'}</TableCell>
                          <TableCell><PlanBadge plan={inv.planName} /></TableCell>
                          <TableCell>{formatINR(inv.taxableAmount)}</TableCell>
                          <TableCell>{formatINR((inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0))}</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>{formatINR(inv.totalAmount)}</TableCell>
                          <TableCell><StatusBadge status={inv.status} /></TableCell>
                        </TableRow>
                      ))}
                      {(!selectedTenantDetails?.invoices || selectedTenantDetails.invoices.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4, color: TEXT_MUTED }}>
                            No invoice records for this company.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Subtab 2: History */}
              {detailTab === 2 && (
                <TableContainer sx={{ maxHeight: 320 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Action</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Previous Plan</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>New Plan</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selectedTenantDetails?.history || []).map((h) => (
                        <TableRow key={h._id} hover>
                          <TableCell>{h.createdAt ? new Date(h.createdAt).toLocaleDateString('en-IN') : '—'}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{h.action}</TableCell>
                          <TableCell><PlanBadge plan={h.previousPlan} /></TableCell>
                          <TableCell><PlanBadge plan={h.newPlan} /></TableCell>
                          <TableCell sx={{ color: TEXT_MUTED, fontSize: '12px' }}>{h.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                      {(!selectedTenantDetails?.history || selectedTenantDetails.history.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: TEXT_MUTED }}>
                            No subscription history logs recorded.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Subtab 3: Users */}
              {detailTab === 3 && (
                <TableContainer sx={{ maxHeight: 320 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>User Name</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Email Address</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Department</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selectedTenantDetails?.users || []).map((u) => (
                        <TableRow key={u._id} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Chip label={u.role} size="small" sx={{ fontWeight: 700, fontSize: '11px' }} />
                          </TableCell>
                          <TableCell>{u.department || 'General'}</TableCell>
                          <TableCell>
                            <Chip
                              label={u.isActive !== false ? 'Active' : 'Inactive'}
                              size="small"
                              sx={{
                                bgcolor: u.isActive !== false ? '#ECFDF5' : '#FEF2F2',
                                color: u.isActive !== false ? '#059669' : '#DC2626',
                                fontWeight: 700,
                                fontSize: '11px'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!selectedTenantDetails?.users || selectedTenantDetails.users.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: TEXT_MUTED }}>
                            No user accounts found in this company workspace.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDetailOpen(false)}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, color: '#334155' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── MODAL: MANAGE / OVERRIDE SUBSCRIPTION ───────────────────────────────── */}
      <Dialog
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <form onSubmit={handleSubscriptionAction}>
          <DialogTitle sx={{ fontWeight: 900, color: '#0F172A' }}>
            Override Company Subscription
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Subscription Plan</InputLabel>
                <Select
                  value={planForm.plan}
                  label="Subscription Plan"
                  onChange={(e) => setPlanForm({ ...planForm, plan: e.target.value })}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="Home User">Home User (₹999 / 20 Assets)</MenuItem>
                  <MenuItem value="MSME">MSME (₹2,999 / 50 Assets)</MenuItem>
                  <MenuItem value="Large Scale">Large Scale (₹8,999 / Unlimited)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                type="date"
                label="Subscription Expiry Date"
                InputLabelProps={{ shrink: true }}
                value={planForm.expiryDate || ''}
                onChange={(e) => setPlanForm({ ...planForm, expiryDate: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />

              <FormControl fullWidth size="small">
                <InputLabel>Subscription Status</InputLabel>
                <Select
                  value={planForm.status}
                  label="Subscription Status"
                  onChange={(e) => setPlanForm({ ...planForm, status: e.target.value })}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Pending Checkout">Pending Checkout</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                  <MenuItem value="Expired">Expired</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                label="Audit Notes"
                multiline
                rows={2}
                value={planForm.notes}
                onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
                placeholder="Reason for override..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPlanOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, color: '#334155' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{
                borderRadius: '10px',
                bgcolor: DARK,
                color: '#FFFFFF',
                fontWeight: 800,
                textTransform: 'none',
                '&:hover': { bgcolor: '#0B291C' }
              }}
            >
              {saving ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL: PROVISION NEW COMPANY ────────────────────────────────────────── */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <form onSubmit={handleCreateTenant}>
          <DialogTitle sx={{ fontWeight: 900, color: '#0F172A' }}>
            Provision New Company Workspace
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                size="small"
                required
                label="Company Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />

              <TextField
                fullWidth
                size="small"
                required
                label="URL Workspace Slug (e.g. acme)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />

              <FormControl fullWidth size="small">
                <InputLabel>Commercial Plan</InputLabel>
                <Select
                  value={form.plan}
                  label="Commercial Plan"
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="Home User">Home User (₹999 / 20 Assets)</MenuItem>
                  <MenuItem value="MSME">MSME (₹2,999 / 50 Assets)</MenuItem>
                  <MenuItem value="Large Scale">Large Scale (₹8,999 / Unlimited)</MenuItem>
                </Select>
              </FormControl>

              <Divider sx={{ my: 0.5 }}>Administrator Credentials</Divider>

              <TextField
                fullWidth
                size="small"
                required
                label="Primary Admin Name"
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />

              <TextField
                fullWidth
                size="small"
                required
                type="email"
                label="Admin Email"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />

              <TextField
                fullWidth
                size="small"
                required
                type="password"
                label="Admin Password"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, color: '#334155' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{
                borderRadius: '10px',
                bgcolor: DARK,
                color: '#FFFFFF',
                fontWeight: 800,
                textTransform: 'none',
                '&:hover': { bgcolor: '#0B291C' }
              }}
            >
              {saving ? 'Provisioning...' : 'Provision Company'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL: CREATE / EDIT COUPON ────────────────────────────────────────── */}
      <Dialog
        open={couponModal.open}
        onClose={() => setCouponModal({ open: false, isEdit: false, data: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <form onSubmit={handleSaveCoupon}>
          <DialogTitle sx={{ fontWeight: 900, color: '#0F172A' }}>
            {couponModal.isEdit ? `Edit Coupon: ${couponForm.code}` : 'Create Promotional Coupon'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                size="small"
                required
                label="Coupon Code (e.g. WELCOME50)"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />

              <TextField
                fullWidth
                size="small"
                label="Description"
                value={couponForm.description}
                onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Discount Type</InputLabel>
                    <Select
                      value={couponForm.discountType}
                      label="Discount Type"
                      onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                      sx={{ borderRadius: '10px' }}
                    >
                      <MenuItem value="fixed">Fixed Amount (₹ Flat)</MenuItem>
                      <MenuItem value="percentage">Percentage (% Off)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    type="number"
                    label={couponForm.discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Value (₹)'}
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Minimum Order Value (₹)"
                    value={couponForm.minOrderValue}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Max Discount Cap (₹)"
                    value={couponForm.maxDiscount}
                    onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
                    helperText="Optional cap for % discounts"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                </Grid>
              </Grid>

              {/* Applicable Plans */}
              <FormControl fullWidth size="small">
                <InputLabel>Applicable Plans</InputLabel>
                <Select
                  multiple
                  value={couponForm.applicablePlans || ['ALL']}
                  label="Applicable Plans"
                  onChange={(e) => {
                    const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                    setCouponForm({ ...couponForm, applicablePlans: val.length === 0 ? ['ALL'] : val });
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" sx={{ fontWeight: 700 }} />
                      ))}
                    </Box>
                  )}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="ALL">ALL (All Plans)</MenuItem>
                  <MenuItem value="Home User">Home User</MenuItem>
                  <MenuItem value="MSME">MSME</MenuItem>
                  <MenuItem value="Large Scale">Large Scale</MenuItem>
                </Select>
              </FormControl>

              {/* Date Inputs with Explicit Labels Above to Prevent Overlap */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.5, display: 'block' }}>
                      Start Date
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={couponForm.startDate}
                      onChange={(e) => setCouponForm({ ...couponForm, startDate: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.5, display: 'block' }}>
                      Expiry Date
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={couponForm.expiryDate}
                      onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                      helperText="Leave blank for lifetime validity"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                size="small"
                type="number"
                label="Maximum Total Redemptions"
                value={couponForm.maxUsage}
                onChange={(e) => setCouponForm({ ...couponForm, maxUsage: e.target.value })}
                helperText="Leave empty for unlimited redemptions"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCouponModal({ open: false, isEdit: false, data: null })} sx={{ textTransform: 'none', fontWeight: 700, color: '#334155' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{
                borderRadius: '10px',
                bgcolor: DARK,
                color: '#FFFFFF',
                fontWeight: 800,
                textTransform: 'none',
                '&:hover': { bgcolor: '#0B291C' }
              }}
            >
              {saving ? 'Saving...' : couponModal.isEdit ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Global Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: '10px', fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
