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
  CheckRounded, ArrowForwardRounded, AccountTreeRounded, VpnKeyRounded, KeyRounded,
  QrCodeScannerRounded, AssessmentRounded, UploadFileRounded, AccessTimeFilledRounded,
  BrandingWatermarkRounded, FactCheckRounded, SupportAgentRounded, TuneRounded, ControlPointRounded,
  RemoveRounded, SaveRounded, BoltRounded
} from '@mui/icons-material';
import api from '../../api/axios';

const ACCENT = '#7777C7';
const DARK = '#7777C7';
const TEXT_MUTED = '#64748B';

// Authoritative Feature Definitions matching project feature matrix
const FEATURE_DEFINITIONS = [
  { key: 'coreInventory', label: 'Core inventory and QR tagging', desc: 'Asset registry, QR label generator & barcode mobile scan' },
  { key: 'ticketing', label: 'Ticketing (breakdown requests)', desc: 'Maintenance breakdown ticketing (Basic or Full workflows)', isTicketing: true },
  { key: 'standardReports', label: 'Standard reports', desc: 'Asset valuation, depreciation & assignment CSV/PDF reports' },
  { key: 'advancedAnalytics', label: 'Advanced analytics', desc: 'Deep lifecycle analytics, breakdown radar & MTTR charts' },
  { key: 'warrantyTracking', label: 'Warranty tracking', desc: 'Automated expiration alerts, AMC contract radar & claim logs' },
  { key: 'bulkCsvImport', label: 'Bulk CSV import', desc: 'Mass batch asset and user onboarding via CSV spreadsheets' },
  { key: 'slaEscalation', label: 'SLA escalation', desc: 'Automated breach timer escalations & priority alerts' },
  { key: 'customBranding', label: 'Custom branding (company logo)', desc: 'Custom company logo, whitelabel UI and brand identity' },
  { key: 'auditTrail', label: 'Full audit trail', desc: 'Immutable audit logs tracking every event, edit and approval' },
  { key: 'dedicatedSupport', label: 'Dedicated support', desc: '24/7 dedicated support SLA & customer success manager' },
];

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

// Formatter to display only the client's actual message/requirements text
const formatLeadMessage = (msg) => {
  if (!msg) return '—';
  if (msg.includes('Custom Enterprise Plan Request:')) {
    const match = msg.match(/Specific Requirements:\s*([\s\S]*)$/i);
    if (match && match[1] && match[1].trim() && !match[1].trim().toLowerCase().includes('none specified')) {
      return match[1].trim();
    }
    return 'Custom Enterprise Plan Inquiry';
  }
  return msg;
};

const PLAN_BADGE_STYLES = {
  'Home User': { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  'MSME': { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  'SME': { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  'Large Scale': { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  'Custom Enterprise Plan': { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8' },
  'Custom Plan': { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8' },
  'None': { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1' }
};

function PlanBadge({ plan }) {
  let style = PLAN_BADGE_STYLES[plan];
  if (!style && plan?.toLowerCase().includes('custom')) {
    style = { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8' };
  }
  if (!style && (plan?.toLowerCase().includes('sme') || plan?.toLowerCase().includes('pro'))) {
    style = { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' };
  }
  style = style || PLAN_BADGE_STYLES['None'];
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

  // Plans & Pricing tab
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planEditModal, setPlanEditModal] = useState({ open: false, isCreate: false, isCustom: false, data: null });
  const [planEditForm, setPlanEditForm] = useState({
    planKey: '',
    name: '',
    price: '',
    maxAssets: '',
    maxUsers: '',
    maxDepartments: '',
    description: '',
    badge: '',
    featuresText: '',
    featureFlags: {
      coreInventory: true,
      ticketing: 'basic',
      standardReports: true,
      advancedAnalytics: false,
      warrantyTracking: false,
      bulkCsvImport: false,
      slaEscalation: false,
      customBranding: false,
      auditTrail: false,
      dedicatedSupport: false,
    },
    isActive: true,
    isCustom: false
  });

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
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
    plan: 'MSME', expiryDate: '', status: 'Active', notes: '',
    maxAssets: '', maxUsers: '', maxDepartments: '',
    allowAddonAssets: false,
    addonAssetPrice: 49,
    features: {}
  });
  const [saving, setSaving] = useState(false);

  // Key Generator Modal State
  const [keyGenOpen, setKeyGenOpen] = useState(false);
  const [keyGenSlug, setKeyGenSlug] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [keyGenLoading, setKeyGenLoading] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [instructionsCopied, setInstructionsCopied] = useState(false);

  const showSnack = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  // Universal Platform Settings (Global Add-on Controls)
  const [globalSettings, setGlobalSettings] = useState({
    allowAddonAssets: true,
    addonAssetPrice: 49
  });
  const [globalSettingsLoading, setGlobalSettingsLoading] = useState(false);
  const [globalSettingsSaving, setGlobalSettingsSaving] = useState(false);

  const fetchGlobalSettings = useCallback(async () => {
    setGlobalSettingsLoading(true);
    try {
      const { data: res } = await api.get('/super-admin/global-settings');
      if (res) {
        setGlobalSettings({
          allowAddonAssets: res.allowAddonAssets !== false,
          addonAssetPrice: res.addonAssetPrice || 49
        });
      }
    } catch {
      // ignore
    } finally {
      setGlobalSettingsLoading(false);
    }
  }, []);

  const handleToggleGlobalAddon = async (newVal) => {
    setGlobalSettings(prev => ({ ...prev, allowAddonAssets: newVal }));
    setGlobalSettingsSaving(true);
    try {
      const { data: res } = await api.put('/super-admin/global-settings', {
        allowAddonAssets: newVal,
        addonAssetPrice: Number(globalSettings.addonAssetPrice || 49),
        applyToAllCompanies: true
      });
      showSnack(`"Purchase More Assets" tab is now ${newVal ? 'ENABLED' : 'DISABLED'} globally for all companies!`);
      fetchGlobalSettings();
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Failed to update universal setting.', 'error');
    } finally {
      setGlobalSettingsSaving(false);
    }
  };

  const handleSaveGlobalSettings = async (overridePrice) => {
    setGlobalSettingsSaving(true);
    try {
      const priceToSave = overridePrice !== undefined ? overridePrice : globalSettings.addonAssetPrice;
      const { data: res } = await api.put('/super-admin/global-settings', {
        allowAddonAssets: globalSettings.allowAddonAssets,
        addonAssetPrice: Number(priceToSave || 49),
        applyToAllCompanies: true
      });
      showSnack(res.message || 'Universal settings saved and applied to all companies!');
      fetchGlobalSettings();
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Failed to save universal platform settings.', 'error');
    } finally {
      setGlobalSettingsSaving(false);
    }
  };

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const { data: res } = await api.get('/super-admin/plans');
      setPlans(res || []);
    } catch {
      showSnack('Failed to load subscription plans.', 'error');
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const openCreatePlanModal = (isCustom = false) => {
    const timestamp = Date.now().toString().slice(-4);
    setPlanEditForm({
      planKey: isCustom ? `CUSTOM_PLAN_${timestamp}` : `PLAN_${timestamp}`,
      name: isCustom ? 'Custom Enterprise Plan' : 'New Plan Tier',
      price: isCustom ? 4999 : 1999,
      maxAssets: isCustom ? 'unlimited' : 35,
      maxUsers: isCustom ? 'unlimited' : 8,
      maxDepartments: isCustom ? 'unlimited' : 3,
      description: isCustom ? 'Custom tailored plan configured with bespoke quotas and enabled capabilities' : 'Standard tier subscription',
      badge: isCustom ? 'Custom Tailored' : 'New Tier',
      featuresText: isCustom
        ? 'As per requirement Users\nAs per requirement Departments\nAs per requirement Assets\nCore inventory and QR tagging\nCustom ticketing & approval workflows\nSLA escalation engine\nCustom branding & white-labeling\nFull audit trail logs\nDedicated priority support & Account Manager'
        : 'Core inventory and QR tagging\nTicketing workflows\nStandard reports',
      featureFlags: {
        coreInventory: true,
        ticketing: isCustom ? 'full' : 'basic',
        standardReports: true,
        advancedAnalytics: Boolean(isCustom),
        warrantyTracking: Boolean(isCustom),
        bulkCsvImport: Boolean(isCustom),
        slaEscalation: Boolean(isCustom),
        customBranding: Boolean(isCustom),
        auditTrail: Boolean(isCustom),
        dedicatedSupport: Boolean(isCustom),
      },
      isActive: true,
      isCustom: Boolean(isCustom)
    });
    setPlanEditModal({ open: true, isCreate: true, isCustom, data: null });
  };

  const openEditPlanModal = (p) => {
    setPlanEditForm({
      planKey: p.planKey,
      name: p.name,
      price: p.price,
      maxAssets: p.maxAssets === -1 || p.maxAssets === 999999999 ? 'unlimited' : p.maxAssets,
      maxUsers: p.maxUsers === -1 || p.maxUsers === 999999999 ? 'unlimited' : p.maxUsers,
      maxDepartments: p.maxDepartments === -1 || p.maxDepartments === 999999999 ? 'unlimited' : (p.maxDepartments ?? 2),
      description: p.description || '',
      badge: p.badge || '',
      featuresText: (p.features || []).join('\n'),
      featureFlags: {
        coreInventory: p.featureFlags?.coreInventory !== false,
        ticketing: p.featureFlags?.ticketing || 'basic',
        standardReports: p.featureFlags?.standardReports !== false,
        advancedAnalytics: Boolean(p.featureFlags?.advancedAnalytics),
        warrantyTracking: Boolean(p.featureFlags?.warrantyTracking),
        bulkCsvImport: Boolean(p.featureFlags?.bulkCsvImport),
        slaEscalation: Boolean(p.featureFlags?.slaEscalation),
        customBranding: Boolean(p.featureFlags?.customBranding),
        auditTrail: Boolean(p.featureFlags?.auditTrail),
        dedicatedSupport: Boolean(p.featureFlags?.dedicatedSupport),
      },
      isActive: p.isActive !== false,
      isCustom: Boolean(p.isCustom)
    });
    setPlanEditModal({ open: true, isCreate: false, isCustom: Boolean(p.isCustom), data: p });
  };

  const handleSavePlan = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const features = planEditForm.featuresText
        ? planEditForm.featuresText.split('\n').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        planKey: planEditForm.planKey,
        price: Number(planEditForm.price),
        name: planEditForm.name,
        description: planEditForm.description,
        badge: planEditForm.badge,
        maxAssets: planEditForm.maxAssets === 'unlimited' || planEditForm.maxAssets === -1 || planEditForm.maxAssets === '-1' ? -1 : Number(planEditForm.maxAssets),
        maxUsers: planEditForm.maxUsers === 'unlimited' || planEditForm.maxUsers === -1 || planEditForm.maxUsers === '-1' ? -1 : Number(planEditForm.maxUsers),
        maxDepartments: planEditForm.maxDepartments === 'unlimited' || planEditForm.maxDepartments === -1 || planEditForm.maxDepartments === '-1' ? -1 : Number(planEditForm.maxDepartments),
        features,
        featureFlags: planEditForm.featureFlags,
        isActive: planEditForm.isActive,
        isCustom: planEditForm.isCustom
      };

      if (planEditModal.isCreate) {
        const { data: res } = await api.post('/super-admin/plans', payload);
        showSnack(res.message || 'Plan created successfully!');
      } else {
        const originalKey = planEditModal.data?.planKey || planEditForm.planKey;
        const { data: res } = await api.put(`/super-admin/plans/${originalKey}`, payload);
        showSnack(res.message || 'Plan updated successfully!');
      }

      setPlanEditModal({ open: false, isCreate: false, isCustom: false, data: null });
      fetchPlans();
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Failed to save plan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePlan = async (p) => {
    try {
      const { data: res } = await api.patch(`/super-admin/plans/${p.planKey}/toggle`);
      showSnack(res.message || `Plan "${p.name}" updated.`);
      fetchPlans();
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Failed to toggle plan.', 'error');
    }
  };

  const handleDeletePlan = async (p) => {
    if (!window.confirm(`Are you sure you want to permanently delete plan "${p.name}"?`)) return;
    try {
      const { data: res } = await api.delete(`/super-admin/plans/${p.planKey}`);
      showSnack(res.message || `Plan "${p.name}" deleted.`);
      fetchPlans();
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Failed to delete plan.', 'error');
    }
  };

  const handleResetPlans = async () => {
    if (!window.confirm('Reset all plans to standard default factory pricing and limits?')) return;
    setSaving(true);
    try {
      const { data: res } = await api.post('/super-admin/plans/reset');
      showSnack(res.message || 'Plans reset to defaults.');
      fetchPlans();
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Reset failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

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
    fetchPlans();
    fetchGlobalSettings();
  }, [fetchData, fetchPlans, fetchGlobalSettings]);

  useEffect(() => {
    if (mainTab === 0) { fetchPlans(); fetchGlobalSettings(); }
    if (mainTab === 2) fetchExpiryMonitoring();
    if (mainTab === 4) fetchCoupons();
    if (mainTab === 5) fetchLeads();
    if (mainTab === 6) { fetchPlans(); fetchGlobalSettings(); }
  }, [mainTab, fetchExpiryMonitoring, fetchCoupons, fetchLeads, fetchPlans, fetchGlobalSettings]);

  const handleOpenDetails = async (tenantId) => {
    setSelectedTenantId(tenantId);
    const existing = (data?.tenants || []).find(t => t._id === tenantId) || (expiryList || []).find(t => t._id === tenantId);
    if (existing) {
      setSelectedTenant(existing);
      setSelectedTenantDetails({
        tenant: existing,
        stats: { totalPaid: 0, totalInvoices: 0, userCount: 0 },
        users: [],
        invoices: [],
        history: []
      });
    }
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailTab(0);
    setCopiedKey(false);
    try {
      const { data: res } = await api.get(`/super-admin/tenants/${tenantId}/details`);
      setSelectedTenantDetails(res);
      if (res?.tenant) {
        setSelectedTenant(res.tenant);
      }
    } catch {
      showSnack('Failed to load company details.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenPlanModal = (tenant) => {
    const t = tenant || selectedTenantDetails?.tenant || selectedTenant;
    if (!t) return;
    setSelectedTenant(t);
    setSelectedTenantId(t._id);

    const foundMatch = plans.find(p => p.name?.toLowerCase() === t.plan?.toLowerCase() || p.planKey?.toLowerCase() === t.plan?.toLowerCase());
    const planName = foundMatch ? foundMatch.name : (t.plan || 'MSME');
    const isCustomPlan = Boolean(foundMatch?.isCustom || foundMatch?.planKey?.includes('CUSTOM') || planName.toLowerCase().includes('custom'));
    const activeLimits = t.limits || {};
    const activeFeatures = t.features || {};

    setPlanForm({
      plan: planName,
      customPrice: isCustomPlan && t.customPrice !== undefined && t.customPrice !== null ? t.customPrice : '',
      expiryDate: t.planExpiry ? new Date(t.planExpiry).toISOString().split('T')[0] : '',
      status: t.subscriptionStatus || 'Active',
      notes: '',
      maxAssets: activeLimits.maxAssets === -1 || activeLimits.maxAssets === 999999999 ? 'unlimited' : (activeLimits.maxAssets ?? ''),
      maxUsers: activeLimits.maxUsers === -1 || activeLimits.maxUsers === 999999999 ? 'unlimited' : (activeLimits.maxUsers ?? ''),
      maxDepartments: activeLimits.maxDepartments === -1 || activeLimits.maxDepartments === 999999999 ? 'unlimited' : (activeLimits.maxDepartments ?? ''),
      allowAddonAssets: Boolean(t.allowAddonAssets),
      addonAssetPrice: t.addonAssetPrice || 49,
      features: {
        coreInventory: activeFeatures.coreInventory !== false,
        ticketing: activeFeatures.ticketing || 'basic',
        standardReports: activeFeatures.standardReports !== false,
        advancedAnalytics: Boolean(activeFeatures.advancedAnalytics),
        warrantyTracking: Boolean(activeFeatures.warrantyTracking),
        bulkCsvImport: Boolean(activeFeatures.bulkCsvImport),
        slaEscalation: Boolean(activeFeatures.slaEscalation),
        customBranding: Boolean(activeFeatures.customBranding),
        auditTrail: Boolean(activeFeatures.auditTrail),
        dedicatedSupport: Boolean(activeFeatures.dedicatedSupport)
      }
    });
    setDetailOpen(false);
    setPlanOpen(true);
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
    if (e && e.preventDefault) e.preventDefault();
    const targetTenantId = selectedTenantDetails?.tenant?._id || selectedTenantId || selectedTenant?._id;
    if (!targetTenantId) {
      showSnack('Unable to identify selected company. Please try re-opening Company Profile.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/super-admin/tenants/${targetTenantId}/subscription-action`, {
        plan: planForm.plan,
        newExpiryDate: planForm.expiryDate,
        status: planForm.status,
        notes: planForm.notes,
        maxAssets: planForm.maxAssets === '' ? undefined : (planForm.maxAssets === 'unlimited' || planForm.maxAssets === -1 || planForm.maxAssets === '-1' ? -1 : Number(planForm.maxAssets)),
        maxUsers: planForm.maxUsers === '' ? undefined : (planForm.maxUsers === 'unlimited' || planForm.maxUsers === -1 || planForm.maxUsers === '-1' ? -1 : Number(planForm.maxUsers)),
        maxDepartments: planForm.maxDepartments === '' ? undefined : (planForm.maxDepartments === 'unlimited' || planForm.maxDepartments === -1 || planForm.maxDepartments === '-1' ? -1 : Number(planForm.maxDepartments)),
        features: planForm.features,
        customPrice: planForm.customPrice === '' || planForm.customPrice === null ? null : Number(planForm.customPrice),
        allowAddonAssets: Boolean(planForm.allowAddonAssets),
        addonAssetPrice: planForm.addonAssetPrice !== '' && planForm.addonAssetPrice !== undefined ? Number(planForm.addonAssetPrice) : 49
      });
      showSnack('Subscription and capacity allocations updated successfully!');
      setPlanOpen(false);
      handleOpenDetails(targetTenantId);
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

  const computeLicenseKeyClient = async (slug) => {
    const clean = (slug || '').toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (!clean) return '';
    try {
      const secret = "assetcare_commercial_license_secret_key_2026";
      const enc = new TextEncoder();
      const key = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["sign"]
      );
      const sig = await window.crypto.subtle.sign("HMAC", key, enc.encode(clean));
      const hex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 16)
        .toUpperCase();
      return `AC-${clean.toUpperCase()}-${hex}`;
    } catch (e) {
      return '';
    }
  };

  const handleGenerateKey = async (slugVal) => {
    const rawSlug = slugVal !== undefined ? slugVal : keyGenSlug;
    const clean = (rawSlug || '').toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (!clean) {
      showSnack('Please enter a valid company workspace slug.', 'warning');
      return;
    }
    setKeyGenLoading(true);
    try {
      try {
        const { data: res } = await api.get(`/super-admin/generate-key/${clean}`);
        setGeneratedKey(res.licenseKey);
        setKeyGenSlug(res.slug);
      } catch (err) {
        // Fallback to client-side cryptographic generation if backend server was not restarted yet
        const clientKey = await computeLicenseKeyClient(clean);
        if (clientKey) {
          setGeneratedKey(clientKey);
          setKeyGenSlug(clean);
        } else {
          throw err;
        }
      }
      showSnack('Commercial License Key generated successfully!');
    } catch (err) {
      showSnack(err.response?.data?.message || 'Failed to generate license key.', 'error');
    } finally {
      setKeyGenLoading(false);
    }
  };

  const copyKeyText = (k) => {
    if (!k) return;
    navigator.clipboard.writeText(k);
    setKeyCopied(true);
    showSnack('License Key copied to clipboard!');
    setTimeout(() => setKeyCopied(false), 3000);
  };

  const copyClientInstructions = () => {
    if (!generatedKey || !keyGenSlug) return;
    const regUrl = `${window.location.origin}/register-company`;
    const text = `Hello,\n\nHere are your registration details for AssetCare:\n\n• Registration URL: ${regUrl}\n• Workspace URL (Slug): ${keyGenSlug}\n• Commercial License Key: ${generatedKey}\n\nSteps:\n1. Open ${regUrl}\n2. Enter your Company Name and Workspace Slug: "${keyGenSlug}"\n3. Enter the License Key: "${generatedKey}"\n4. Complete your admin profile and submit.\n\nYour workspace will be immediately pre-activated (no checkout required).\n\nAssetCare Platform Team`;
    navigator.clipboard.writeText(text);
    setInstructionsCopied(true);
    showSnack('Client registration instructions copied to clipboard!');
    setTimeout(() => setInstructionsCopied(false), 3000);
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
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(17,24,39,0.12)', flexShrink: 0 }}>
              <DnsRounded sx={{ color: 'text.primary' }} />
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
            variant="outlined"
            startIcon={<VpnKeyRounded />}
            onClick={() => {
              setKeyGenOpen(true);
              setGeneratedKey('');
              setKeyGenSlug('');
            }}
            sx={{
              borderRadius: '10px',
              borderColor: '#0F172A',
              color: '#0F172A',
              bgcolor: '#FFFFFF',
              fontWeight: 800,
              textTransform: 'none',
              px: 2,
              '&:hover': { bgcolor: '#F1F5F9', borderColor: '#000000' }
            }}
          >
            Key Generator
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
              boxShadow: '0 4px 12px rgba(119, 119, 199, 0.15)',
              '&:hover': { bgcolor: '#6464B8' }
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
          <Tab
            icon={<MonetizationOnRounded sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Plan Pricing & Limits"
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
                      title="Purchased Add-On Assets"
                      value={`+${platform.totalAddonAssets || 0}`}
                      subtext="Extra capacity active across all tenants"
                      icon={<BoltRounded sx={{ fontSize: 22 }} />}
                      iconBg="rgba(119, 119, 199, 0.12)"
                      iconColor="#7777C7"
                      badgeText="Pro-Rata Addons"
                      badgeColor="#7777C7"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={4} lg={3}>
                    <MetricCard
                      title="Expired Subscriptions"
                      value={platform.expiredSubscriptions ?? 'N/A'}
                      subtext="In grace period or expired"
                      icon={<CancelRounded sx={{ fontSize: 22 }} />}
                      iconBg="#FEF2F2"
                      iconColor="#DC2626"
                      badgeText={platform.expiredSubscriptions > 0 ? 'Action Req.' : 'Clean'}
                      badgeColor={platform.expiredSubscriptions > 0 ? '#DC2626' : '#10B981'}
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
                placeholder="Search company name, slug, or email..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ fontSize: 20, color: TEXT_MUTED }} />
                    </InputAdornment>
                  )
                }}
                sx={{ minWidth: { xs: 240, sm: 320, md: 380 }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
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
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                            {t.limits?.maxAssets === -1 || t.limits?.maxAssets === 999999999 ? 'Unlimited Assets' : `${t.limits?.maxAssets ?? '—'} Assets`}
                          </Typography>
                          {t.addonAssets > 0 ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                              <Chip
                                label={`+${t.addonAssets} Add-on`}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '9.5px',
                                  fontWeight: 800,
                                  bgcolor: 'rgba(119, 119, 199, 0.12)',
                                  color: '#7777C7',
                                  border: '1px solid rgba(119, 119, 199, 0.3)'
                                }}
                              />
                              <Typography variant="caption" sx={{ fontSize: '10px', color: '#64748B' }}>
                                (Base: {Math.max(0, (t.limits?.maxAssets || 0) - t.addonAssets)})
                              </Typography>
                            </Box>
                          ) : null}
                          <Typography variant="caption" sx={{ color: TEXT_MUTED, display: 'block', mt: 0.2 }}>
                            {t.limits?.maxUsers === -1 || t.limits?.maxUsers === 999999999 ? 'Unlimited' : (t.limits?.maxUsers ?? '—')} Users • {t.limits?.maxDepartments === -1 || t.limits?.maxDepartments === 999999999 ? 'Unlimited' : (t.limits?.maxDepartments ?? '—')} Depts
                          </Typography>
                          {t.customPrice ? (
                            <Box sx={{ mt: 0.3 }}>
                              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800, fontSize: '11px', display: 'block' }}>
                                Quote: ₹{Number(t.customPrice).toLocaleString('en-IN')}/yr
                              </Typography>
                              {t.customQuoteDaysRemaining !== null && t.customQuoteDaysRemaining !== undefined ? (
                                <Typography variant="caption" sx={{ color: t.customQuoteDaysRemaining <= 2 ? '#DC2626' : '#D97706', fontWeight: 700, fontSize: '10.5px', display: 'block' }}>
                                  ({t.customQuoteDaysRemaining} days validity left)
                                </Typography>
                              ) : null}
                            </Box>
                          ) : null}
                        </Box>
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
                '&:hover': { bgcolor: '#6464B8' }
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
                      <TableCell sx={{ color: '#334155', fontSize: '12.5px', maxWidth: 320, wordBreak: 'break-word', fontWeight: 500 }}>
                        {formatLeadMessage(lead.message)}
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

      {/* ─── TAB 6: SUBSCRIPTION PLANS & PRICING CONTROL ───────────────────────────── */}
      {mainTab === 6 && (
        <Box>
          {/* Header Banner */}
          {/* Header Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              mb: 3.5,
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', lg: 'center' },
              gap: 2.5
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A' }}>
                  Subscription Plans, Dynamic Quotas & Feature Toggles
                </Typography>
                <Chip
                  label="Authoritative Real-Time Engine"
                  size="small"
                  sx={{
                    bgcolor: '#ECFDF5',
                    color: '#059669',
                    fontWeight: 800,
                    fontSize: '11px',
                    border: '1px solid #A7F3D0'
                  }}
                />
                <Chip
                  label="Dynamic Feature Toggles"
                  size="small"
                  sx={{
                    bgcolor: '#F5F3FF',
                    color: '#7C3AED',
                    fontWeight: 800,
                    fontSize: '11px',
                    border: '1px solid #DDD6FE'
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: TEXT_MUTED, maxWidth: 850 }}>
                Configure live subscription rates, asset/user/department capacity limits, and turn on/off any of the 10 core features per plan. Changes reflect instantly across public registration, dynamic checkouts, and customer access control.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<ControlPointRounded />}
                onClick={() => openCreatePlanModal(true)}
                sx={{
                  borderRadius: '10px',
                  borderColor: '#7C3AED',
                  color: '#7C3AED',
                  bgcolor: '#F5F3FF',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#EDE9FE', borderColor: '#6D28D9' }
                }}
              >
                + Create Custom Plan
              </Button>

              <Button
                variant="contained"
                startIcon={<AddRounded />}
                onClick={() => openCreatePlanModal(false)}
                sx={{
                  borderRadius: '10px',
                  bgcolor: DARK,
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#6464B8' }
                }}
              >
                + Create New Plan
              </Button>

              <Button
                variant="outlined"
                color="error"
                onClick={handleResetPlans}
                disabled={saving || plansLoading}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  whiteSpace: 'nowrap'
                }}
              >
                Reset to Defaults
              </Button>
            </Stack>
          </Paper>

          {/* Universal Add-on Asset Control Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 2.75,
              borderRadius: '16px',
              border: '1.5px solid #7777C7',
              bgcolor: '#F8FAFC',
              mb: 3.5,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 2.5,
              boxShadow: '0 4px 15px rgba(119, 119, 199, 0.08)'
            }}
          >
            <Box sx={{ maxWidth: 700 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A' }}>
                  Universal "Purchase More Assets" Controls (All Companies)
                </Typography>
                <Chip
                  label={globalSettings.allowAddonAssets ? 'ENABLED GLOBALLY' : 'DISABLED GLOBALLY'}
                  size="small"
                  sx={{
                    fontWeight: 900,
                    fontSize: '11px',
                    bgcolor: globalSettings.allowAddonAssets ? '#ECFDF5' : '#FEF2F2',
                    color: globalSettings.allowAddonAssets ? '#059669' : '#DC2626',
                    border: `1px solid ${globalSettings.allowAddonAssets ? '#A7F3D0' : '#FECACA'}`
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                Turn ON or OFF the middle "Purchase More Assets" tab across <strong>all companies universally</strong> and configure the platform-wide unit price. When saved, all client company portals update immediately.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#FFFFFF', px: 1.5, py: 0.6, borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155' }}>
                  Global Tab:
                </Typography>
                <Switch
                  size="small"
                  checked={Boolean(globalSettings.allowAddonAssets)}
                  onChange={(e) => handleToggleGlobalAddon(e.target.checked)}
                  color="primary"
                />
              </Box>

              <TextField
                size="small"
                type="number"
                label="Price (₹/asset)"
                value={globalSettings.addonAssetPrice ?? 49}
                onChange={(e) => setGlobalSettings({ ...globalSettings, addonAssetPrice: e.target.value })}
                sx={{
                  width: 140,
                  bgcolor: '#FFFFFF',
                  '& .MuiOutlinedInput-root': { borderRadius: '10px' }
                }}
              />

              <Button
                variant="contained"
                disabled={globalSettingsSaving || globalSettingsLoading}
                onClick={() => handleSaveGlobalSettings()}
                startIcon={globalSettingsSaving ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
                sx={{
                  bgcolor: '#7777C7',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  borderRadius: '10px',
                  py: 0.9,
                  px: 2,
                  whiteSpace: 'nowrap',
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#6464B8' }
                }}
              >
                {globalSettingsSaving ? 'Applying...' : 'Save & Apply Universally'}
              </Button>
            </Box>
          </Paper>

          {plansLoading && plans.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <CircularProgress size={36} sx={{ color: DARK, mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary">
                Loading live subscription tiers & pricing configurations...
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {(plans.length > 0 ? plans : [
                { planKey: 'HOME_USER', name: 'Home User', price: 999, maxAssets: 20, maxUsers: 3, maxDepartments: 2, badge: 'Popular for Personal', description: 'Up to 20 assets for personal or small office equipment tracking' },
                { planKey: 'MSME', name: 'MSME', price: 2999, maxAssets: 50, maxUsers: 15, maxDepartments: 5, badge: 'Most Popular', description: 'Up to 50 assets with multi-department support and warranty radar' },
                { planKey: 'LARGE_SCALE', name: 'Large Scale', price: 8999, maxAssets: -1, maxUsers: -1, maxDepartments: -1, badge: 'Enterprise', description: 'Unlimited assets with developer REST API and priority 24/7 SLA support' }
              ]).map((p) => {
                const isMsme = p.planKey === 'MSME' || p.name === 'MSME';
                const isLarge = p.planKey === 'LARGE_SCALE' || p.name === 'Large Scale';
                const isCustom = Boolean(p.isCustom);

                const themeColor = isCustom ? '#D97706' : isMsme ? '#7C3AED' : isLarge ? '#059669' : '#2563EB';
                const themeBg = isCustom ? '#FFFBEB' : isMsme ? '#F5F3FF' : isLarge ? '#ECFDF5' : '#EFF6FF';
                const themeBorder = isCustom ? '#FDE68A' : isMsme ? '#DDD6FE' : isLarge ? '#A7F3D0' : '#BFDBFE';

                const flags = p.featureFlags || {};
                const isSystemPlan = p.planKey === 'HOME_USER';

                return (
                  <Grid item xs={12} md={6} lg={4} key={p.planKey || p.name}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: '20px',
                        bgcolor: '#FFFFFF',
                        border: `1.5px solid ${themeBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                        position: 'relative',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.08)'
                        }
                      }}
                    >
                      {/* Top Plan Tag */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <PlanBadge plan={p.name} />
                          {isCustom && (
                            <Chip
                              label="Custom Plan"
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '10.5px',
                                fontWeight: 800,
                                bgcolor: '#FEF3C7',
                                color: '#D97706',
                                border: '1px solid #FDE68A'
                              }}
                            />
                          )}
                          {p.badge && (
                            <Chip
                              label={p.badge}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '10.5px',
                                fontWeight: 800,
                                bgcolor: themeBg,
                                color: themeColor,
                                border: `1px solid ${themeBorder}`
                              }}
                            />
                          )}
                        </Box>

                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Chip
                            label={p.isActive !== false ? 'Active' : 'Disabled'}
                            size="small"
                            onClick={() => handleTogglePlan(p)}
                            sx={{
                              height: 22,
                              fontSize: '10.5px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              bgcolor: p.isActive !== false ? '#ECFDF5' : '#FEF2F2',
                              color: p.isActive !== false ? '#059669' : '#DC2626',
                              '&:hover': { opacity: 0.8 }
                            }}
                          />
                          {!isSystemPlan && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeletePlan(p)}
                              title="Delete Plan"
                              sx={{ p: 0.5 }}
                            >
                              <DeleteRounded sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                        </Stack>
                      </Box>

                      {/* Plan Heading */}
                      <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', mb: 0.5 }}>
                        {p.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: TEXT_MUTED, fontSize: '13px', minHeight: 38, mb: 2 }}>
                        {p.description || 'Configured subscription plan'}
                      </Typography>

                      {/* Current Authoritative Price */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: '14px',
                          bgcolor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          mb: 2.5,
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Annual Base Price
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 0.2 }}>
                            {isCustom ? (
                              <Typography variant="h5" sx={{ fontWeight: 950, color: '#0F172A', letterSpacing: '-0.3px' }}>
                                Contact Sales
                              </Typography>
                            ) : (
                              <>
                                <Typography variant="h4" sx={{ fontWeight: 950, color: '#0F172A', letterSpacing: '-0.5px' }}>
                                  {formatINR(p.price)}
                                </Typography>
                                <Typography variant="body2" sx={{ color: TEXT_MUTED, fontWeight: 700 }}>
                                  / year
                                </Typography>
                              </>
                            )}
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => openEditPlanModal(p)}
                          sx={{
                            bgcolor: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            color: '#0F172A',
                            '&:hover': { bgcolor: themeBg, color: themeColor }
                          }}
                          title="Edit Price, Limits & Feature Switches"
                        >
                          <EditRounded sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Paper>

                      {/* Quotas & Specs */}
                      <Box sx={{ mb: 2.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1 }}>
                          Capacity Quotas
                        </Typography>
                        <Stack spacing={0.75}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.4, borderBottom: '1px solid #F1F5F9' }}>
                            <Typography variant="body2" sx={{ color: TEXT_MUTED, fontSize: '12.5px' }}>Asset Limit</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                              {isCustom ? 'As per requirement Assets' : (p.maxAssets === -1 || p.maxAssets === 999999999 ? 'Unlimited Assets' : `${p.maxAssets} Assets`)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.4, borderBottom: '1px solid #F1F5F9' }}>
                            <Typography variant="body2" sx={{ color: TEXT_MUTED, fontSize: '12.5px' }}>User Accounts</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                              {isCustom ? 'As per requirement Users' : (p.maxUsers === -1 || p.maxUsers === 999999999 ? 'Unlimited Users' : `${p.maxUsers} Users`)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.4, borderBottom: '1px solid #F1F5F9' }}>
                            <Typography variant="body2" sx={{ color: TEXT_MUTED, fontSize: '12.5px' }}>Departments</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                              {isCustom ? 'As per requirement Departments' : (p.maxDepartments === -1 || p.maxDepartments === 999999999 ? 'Unlimited Depts' : `${p.maxDepartments ?? 2} Departments`)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      {/* Dynamic 10-Feature Matrix Checklist */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1 }}>
                          Feature Matrix & Capabilities (10 Points)
                        </Typography>
                        <Stack spacing={0.65}>
                          {FEATURE_DEFINITIONS.map((feat) => {
                            const val = flags[feat.key];
                            const isEnabled = feat.key === 'ticketing' ? val && val !== 'none' && val !== false : Boolean(val);
                            const ticketingLabel = val === 'full' ? 'Full Workflows' : val === 'basic' ? 'Basic' : 'Disabled';

                            return (
                              <Box key={feat.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.25 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {isEnabled ? (
                                    <CheckRounded sx={{ fontSize: 16, color: '#16A34A' }} />
                                  ) : (
                                    <RemoveRounded sx={{ fontSize: 16, color: '#CBD5E1' }} />
                                  )}
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontSize: '12.5px',
                                      color: isEnabled ? '#1E293B' : '#94A3B8',
                                      fontWeight: isEnabled ? 600 : 400
                                    }}
                                  >
                                    {feat.label}
                                  </Typography>
                                </Box>

                                {feat.key === 'ticketing' && (
                                  <Chip
                                    size="small"
                                    label={ticketingLabel}
                                    sx={{
                                      height: 20,
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      bgcolor: val === 'full' ? '#ECFDF5' : val === 'basic' ? '#EFF6FF' : '#F1F5F9',
                                      color: val === 'full' ? '#059669' : val === 'basic' ? '#2563EB' : '#94A3B8'
                                    }}
                                  />
                                )}
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>

                      {/* Action Button */}
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<EditRounded />}
                        onClick={() => openEditPlanModal(p)}
                        sx={{
                          mt: 'auto',
                          borderRadius: '12px',
                          bgcolor: DARK,
                          color: '#FFFFFF',
                          fontWeight: 800,
                          textTransform: 'none',
                          py: 1.2,
                          '&:hover': { bgcolor: '#6464B8' }
                        }}
                      >
                        Edit Plan, Quotas & Features
                      </Button>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
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
              const currentTenant = selectedTenantDetails?.tenant || selectedTenant;
              handleOpenPlanModal(currentTenant);
            }}
            sx={{
              borderRadius: '10px',
              bgcolor: DARK,
              color: '#FFFFFF',
              fontWeight: 800,
              textTransform: 'none',
              '&:hover': { bgcolor: '#6464B8' }
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
                      {selectedTenantDetails?.tenant?.customPrice ? (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ color: '#059669', fontWeight: 800 }}>
                            Custom Quoted Rate: ₹{Number(selectedTenantDetails.tenant.customPrice).toLocaleString('en-IN')}/year
                          </Typography>
                          {selectedTenantDetails?.tenant?.customQuoteDaysRemaining !== undefined && selectedTenantDetails?.tenant?.customQuoteDaysRemaining !== null ? (
                            <Typography variant="caption" sx={{ color: selectedTenantDetails.tenant.customQuoteDaysRemaining <= 2 ? '#DC2626' : '#D97706', fontWeight: 700, display: 'block' }}>
                              ⏳ Quote Validity: {selectedTenantDetails.tenant.customQuoteDaysRemaining} day{selectedTenantDetails.tenant.customQuoteDaysRemaining === 1 ? '' : 's'} remaining (Auto-expires if unpaid)
                            </Typography>
                          ) : null}
                        </Box>
                      ) : null}
                      <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>
                        <strong>Allocated Limits:</strong>{' '}
                        {selectedTenantDetails?.tenant?.limits?.maxAssets === -1 || selectedTenantDetails?.tenant?.limits?.maxAssets === 999999999 ? 'Unlimited' : (selectedTenantDetails?.tenant?.limits?.maxAssets ?? '—')} Assets •{' '}
                        {selectedTenantDetails?.tenant?.limits?.maxUsers === -1 || selectedTenantDetails?.tenant?.limits?.maxUsers === 999999999 ? 'Unlimited' : (selectedTenantDetails?.tenant?.limits?.maxUsers ?? '—')} Users •{' '}
                        {selectedTenantDetails?.tenant?.limits?.maxDepartments === -1 || selectedTenantDetails?.tenant?.limits?.maxDepartments === 999999999 ? 'Unlimited' : (selectedTenantDetails?.tenant?.limits?.maxDepartments ?? '—')} Depts
                      </Typography>

                      {/* Add-on Capacity Breakdown Box */}
                      {selectedTenantDetails?.tenant?.addonAssets > 0 ? (
                        <Box sx={{ mt: 1, p: 1.2, bgcolor: 'rgba(119, 119, 199, 0.06)', borderRadius: '8px', border: '1px solid rgba(119, 119, 199, 0.25)' }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#7777C7' }}>
                              ADD-ON CAPACITY BREAKDOWN
                            </Typography>
                            <Chip
                              label={`+${selectedTenantDetails.tenant.addonAssets} Add-on Assets`}
                              size="small"
                              sx={{ height: 18, fontSize: '9.5px', fontWeight: 800, bgcolor: '#7777C7', color: '#FFFFFF' }}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ color: '#334155', display: 'block', mt: 0.5 }}>
                            • Base Plan Allocation: <strong>{Math.max(0, (selectedTenantDetails.tenant.limits?.maxAssets || 0) - selectedTenantDetails.tenant.addonAssets)} Assets</strong><br />
                            • Active Add-On Capacity: <strong>+{selectedTenantDetails.tenant.addonAssets} Assets</strong> (Co-Terminus Pro-Rata)<br />
                            • Total Active Limit: <strong>{selectedTenantDetails.tenant.limits?.maxAssets} Assets</strong>
                          </Typography>
                        </Box>
                      ) : null}

                      <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>
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

      {/* ─── MODAL: MANAGE / OVERRIDE SUBSCRIPTION & QUOTAS ──────────────────────── */}
      <Dialog
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          component: 'form',
          onSubmit: handleSubscriptionAction,
          sx: { borderRadius: '20px', p: 1 }
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A' }}>
              Override Company Subscription & Quotas
            </Typography>
            {(selectedTenantDetails?.tenant?.name || selectedTenant?.name) && (
              <Typography variant="body2" sx={{ color: TEXT_MUTED, fontWeight: 600, mt: 0.3 }}>
                Target: {selectedTenantDetails?.tenant?.name || selectedTenant?.name} (/{selectedTenantDetails?.tenant?.slug || selectedTenant?.slug || ''})
              </Typography>
            )}
          </Box>
          <PlanBadge plan={planForm.plan} />
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          <Stack spacing={3}>
            {/* Top Row: Plan, Expiry & Status */}
            {(() => {
              const isSelectedCustom = Boolean(
                planForm.plan?.toLowerCase().includes('custom') ||
                plans.find(p => p.name === planForm.plan || p.planKey === planForm.plan)?.isCustom
              );

              return (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={isSelectedCustom ? 6 : 4} md={isSelectedCustom ? 3 : 4}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.6, display: 'block', fontSize: '11.5px' }}>
                      Subscription Tier
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={planForm.plan}
                        onChange={(e) => {
                          const selectedPlanKeyOrName = e.target.value;
                          const foundPlan = plans.find(p => p.name === selectedPlanKeyOrName || p.planKey === selectedPlanKeyOrName);
                          if (foundPlan) {
                            const isCustom = Boolean(foundPlan.isCustom || foundPlan.planKey?.includes('CUSTOM') || foundPlan.name?.toLowerCase().includes('custom'));
                            setPlanForm({
                              ...planForm,
                              plan: foundPlan.name,
                              customPrice: isCustom ? (planForm.customPrice || '') : '',
                              maxAssets: isCustom ? 'unlimited' : (foundPlan.maxAssets === -1 || foundPlan.maxAssets === 999999999 ? 'unlimited' : foundPlan.maxAssets),
                              maxUsers: isCustom ? 'unlimited' : (foundPlan.maxUsers === -1 || foundPlan.maxUsers === 999999999 ? 'unlimited' : foundPlan.maxUsers),
                              maxDepartments: isCustom ? 'unlimited' : (foundPlan.maxDepartments === -1 || foundPlan.maxDepartments === 999999999 ? 'unlimited' : (foundPlan.maxDepartments ?? 2)),
                              features: {
                                ...(foundPlan.featureFlags || {})
                              }
                            });
                          } else {
                            const isCustom = Boolean(selectedPlanKeyOrName.toLowerCase().includes('custom'));
                            setPlanForm({
                              ...planForm,
                              plan: selectedPlanKeyOrName,
                              customPrice: isCustom ? planForm.customPrice : ''
                            });
                          }
                        }}
                        sx={{ borderRadius: '10px', bgcolor: '#FFFFFF' }}
                      >
                        {plans.map((p) => {
                          const isCustom = Boolean(p.isCustom || p.planKey?.includes('CUSTOM') || p.name?.toLowerCase().includes('custom'));
                          return (
                            <MenuItem key={p.planKey || p.name} value={p.name}>
                              {isCustom ? p.name : `${p.name} (${formatINR(p.price)}/yr)`}
                            </MenuItem>
                          );
                        })}
                        {planForm.plan && !plans.some(p => p.name === planForm.plan) && (
                          <MenuItem value={planForm.plan}>
                            {planForm.plan}
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>

                  {isSelectedCustom && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.6, display: 'block', fontSize: '11.5px' }}>
                        Custom Quoted Price (₹/yr)
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        placeholder="e.g. 50000"
                        value={planForm.customPrice ?? ''}
                        onChange={(e) => setPlanForm({ ...planForm, customPrice: e.target.value })}
                        helperText="Bespoke yearly quote for this company"
                        sx={{ bgcolor: '#FFFFFF', '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} sm={isSelectedCustom ? 6 : 4} md={isSelectedCustom ? 3 : 4}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.6, display: 'block', fontSize: '11.5px' }}>
                      Subscription Expiry Date
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={planForm.expiryDate || ''}
                      onChange={(e) => setPlanForm({ ...planForm, expiryDate: e.target.value })}
                      sx={{
                        bgcolor: '#FFFFFF',
                        '& .MuiOutlinedInput-root': { borderRadius: '10px' },
                        '& input': { py: '8.5px' }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={isSelectedCustom ? 6 : 4} md={isSelectedCustom ? 3 : 4}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.6, display: 'block', fontSize: '11.5px' }}>
                      Subscription Status
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={planForm.status}
                        onChange={(e) => setPlanForm({ ...planForm, status: e.target.value })}
                        sx={{ borderRadius: '10px', bgcolor: '#FFFFFF' }}
                      >
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Pending Checkout">Pending Checkout</MenuItem>
                        <MenuItem value="Suspended">Suspended</MenuItem>
                        <MenuItem value="Expired">Expired</MenuItem>
                        <MenuItem value="Cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              );
            })()}

            {/* Quota Override Section */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  Company Capacity Quota Overrides (Add Extra Capacity)
                </Typography>
                <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                  Override default plan quotas for this specific tenant (e.g., allow 35 assets or 5 users on Home User plan). Enter a specific number or 'unlimited' (-1).
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Asset Limit (Max Assets)"
                    value={planForm.maxAssets}
                    onChange={(e) => setPlanForm({ ...planForm, maxAssets: e.target.value })}
                    placeholder="e.g. 35 or unlimited"
                    sx={{ bgcolor: '#FFFFFF', '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="User Limit (Max Users)"
                    value={planForm.maxUsers}
                    onChange={(e) => setPlanForm({ ...planForm, maxUsers: e.target.value })}
                    placeholder="e.g. 5 or unlimited"
                    sx={{ bgcolor: '#FFFFFF', '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Department Limit (Max Depts)"
                    value={planForm.maxDepartments}
                    onChange={(e) => setPlanForm({ ...planForm, maxDepartments: e.target.value })}
                    placeholder="e.g. 3 or unlimited"
                    sx={{ bgcolor: '#FFFFFF', '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Feature Flags Section */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  Company Feature Access Switches (10 Points)
                </Typography>
                <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                  Grant or revoke individual feature permissions for this specific enterprise account.
                </Typography>
              </Box>

              <Grid container spacing={1.5}>
                {FEATURE_DEFINITIONS.map((feat) => {
                  if (feat.key === 'ticketing') {
                    const currentTicketing = planForm.features?.ticketing || 'basic';
                    return (
                      <Grid item xs={12} sm={6} key={feat.key}>
                        <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', height: '100%' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                            {feat.label}
                          </Typography>
                          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                            <Select
                              value={currentTicketing}
                              onChange={(e) => setPlanForm({
                                ...planForm,
                                features: { ...planForm.features, ticketing: e.target.value }
                              })}
                              sx={{ borderRadius: '8px' }}
                            >
                              <MenuItem value="full">Full Ticketing Workflows</MenuItem>
                              <MenuItem value="basic">Basic Breakdown Requests</MenuItem>
                              <MenuItem value="none">Disabled</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      </Grid>
                    );
                  }

                  const isChecked = Boolean(planForm.features?.[feat.key]);
                  return (
                    <Grid item xs={12} sm={6} key={feat.key}>
                      <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                        <Box sx={{ pr: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            {feat.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: TEXT_MUTED, display: 'block', fontSize: '11px' }}>
                            {feat.desc}
                          </Typography>
                        </Box>
                        <Switch
                          size="small"
                          checked={isChecked}
                          onChange={(e) => setPlanForm({
                            ...planForm,
                            features: { ...planForm.features, [feat.key]: e.target.checked }
                          })}
                          color="primary"
                        />
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>

            {/* Audit Notes */}
            <TextField
              fullWidth
              size="small"
              label="Audit Log & Override Reason"
              multiline
              rows={2}
              value={planForm.notes}
              onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
              placeholder="e.g., Client purchased 15 additional assets and Warranty Radar add-on..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setPlanOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, color: '#334155' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubscriptionAction}
            variant="contained"
            disabled={saving}
            sx={{
              borderRadius: '10px',
              bgcolor: DARK,
              color: '#FFFFFF',
              fontWeight: 800,
              textTransform: 'none',
              px: 3,
              '&:hover': { bgcolor: '#6464B8' }
            }}
          >
            {saving ? 'Updating...' : 'Apply Subscription Overrides'}
          </Button>
        </DialogActions>
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
                '&:hover': { bgcolor: '#6464B8' }
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
                    inputProps={couponForm.discountType === 'percentage' ? { min: 1, max: 100 } : { min: 0 }}
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
                    helperText="Max discount limit in ₹ (for both % and flat)"
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
                    const rawVal = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                    let val = rawVal;
                    if (rawVal.includes('ALL') && rawVal.length > 1) {
                      // If user had ALL and selected a specific plan, keep only specific plans
                      if (couponForm.applicablePlans?.includes('ALL')) {
                        val = rawVal.filter(v => v !== 'ALL');
                      } else {
                        // User explicitly clicked ALL
                        val = ['ALL'];
                      }
                    }
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
                  <MenuItem value="SME">SME</MenuItem>
                  <MenuItem value="Custom Enterprise Plan">Custom Enterprise Plan</MenuItem>
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
                '&:hover': { bgcolor: '#6464B8' }
              }}
            >
              {saving ? 'Saving...' : couponModal.isEdit ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── LICENSE KEY GENERATOR DIALOG ────────────────────────────────────── */}
      <Dialog
        open={keyGenOpen}
        onClose={() => setKeyGenOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '18px',
            boxShadow: '0 25px 60px rgba(119, 119, 199, 0.25)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: DARK,
            color: '#FFFFFF',
            py: 2.5,
            px: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: 'rgba(119, 119, 199, 0.15)',
              color: ACCENT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <VpnKeyRounded sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '18px', lineHeight: 1.2 }}>
              Commercial License Key Generator
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
              Generate an upfront activation key for self-registering clients
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3.5, bgcolor: '#FFFFFF' }}>
          <Stack spacing={2.5}>
            <Alert severity="info" sx={{ borderRadius: '12px', fontSize: '12.5px', '& .MuiAlert-icon': { fontSize: 20 } }}>
              Provide the client with their agreed <strong>Workspace Slug</strong> and <strong>License Key</strong>. When they register at <code>/register-company</code> using this key, their account activates instantly (1-Year validity, bypasses checkout).
            </Alert>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Client Workspace Slug (URL)
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. tatamotors, acme-corp"
                  value={keyGenSlug}
                  onChange={(e) => {
                    const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    setKeyGenSlug(clean);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGenerateKey();
                    }
                  }}
                  helperText={keyGenSlug ? `Workspace URL: assetcare.app/${keyGenSlug}` : 'Enter the agreed company slug'}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
                <Button
                  variant="contained"
                  disabled={!keyGenSlug || keyGenLoading}
                  onClick={() => handleGenerateKey()}
                  sx={{
                    borderRadius: '10px',
                    bgcolor: DARK,
                    color: '#FFFFFF',
                    fontWeight: 800,
                    textTransform: 'none',
                    px: 3,
                    height: 40,
                    whiteSpace: 'nowrap',
                    '&:hover': { bgcolor: '#6464B8' }
                  }}
                >
                  {keyGenLoading ? <CircularProgress size={18} sx={{ color: '#FFFFFF' }} /> : 'Generate'}
                </Button>
              </Stack>
            </Box>

            {generatedKey && (
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '14px',
                  bgcolor: '#F8FAFC',
                  border: '1.5px solid #E2E8F0'
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Generated Commercial License Key
                </Typography>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: '#0F172A',
                    color: ACCENT,
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: '15px',
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    wordBreak: 'break-all'
                  }}
                >
                  <span>{generatedKey}</span>
                  <Tooltip title={keyCopied ? "Copied!" : "Copy Key"}>
                    <IconButton
                      size="small"
                      onClick={() => copyKeyText(generatedKey)}
                      sx={{ color: keyCopied ? ACCENT : '#FFFFFF', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                    >
                      {keyCopied ? <CheckRounded fontSize="small" /> : <ContentCopyRounded fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Ready-to-Send Client Registration Details
                </Typography>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    color: '#334155',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6
                  }}
                >
{`Registration URL: ${window.location.origin}/register-company
Workspace Slug  : ${keyGenSlug}
License Key     : ${generatedKey}`}
                </Box>

                <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={keyCopied ? <CheckRounded /> : <ContentCopyRounded />}
                    onClick={() => copyKeyText(generatedKey)}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 700,
                      borderColor: '#CBD5E1',
                      color: '#0F172A'
                    }}
                  >
                    {keyCopied ? "Key Copied" : "Copy License Key"}
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={instructionsCopied ? <CheckRounded /> : <ContentCopyRounded />}
                    onClick={copyClientInstructions}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 800,
                      bgcolor: DARK,
                      color: '#FFFFFF',
                      '&:hover': { bgcolor: '#6464B8' }
                    }}
                  >
                    {instructionsCopied ? "Instructions Copied" : "Copy Client Instructions"}
                  </Button>
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
          <Button
            onClick={() => setKeyGenOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 700, color: '#64748B' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── MODAL: EDIT / CREATE PLAN PRICING & SPECIFICATIONS ─────────────── */}
      <Dialog
        open={planEditModal.open}
        onClose={() => setPlanEditModal({ open: false, isCreate: false, isCustom: false, data: null })}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <form onSubmit={handleSavePlan}>
          <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A' }}>
                {planEditModal.isCreate
                  ? (planEditModal.isCustom ? 'Create Custom Bespoke Plan' : 'Create New Subscription Plan')
                  : `Edit Plan: ${planEditForm.name || planEditForm.planKey}`}
              </Typography>
              <Typography variant="caption" sx={{ color: TEXT_MUTED, fontFamily: 'monospace' }}>
                Key: {planEditForm.planKey || 'AUTO_GENERATED'} {planEditForm.isCustom ? '• Custom Enterprise' : ''}
              </Typography>
            </Box>
            <PlanBadge plan={planEditForm.name || (planEditModal.isCustom ? 'Custom Plan' : 'New Tier')} />
          </DialogTitle>

          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 3 }}>
            <Alert severity="info" sx={{ borderRadius: '12px', fontSize: '12.5px' }}>
              All configuration changes immediately propagate to checkout, dynamic public registration, contract renewals, and feature gatekeeper middleware.
            </Alert>

            {/* Basic Info */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="Plan Identifier (Unique Key)"
                  value={planEditForm.planKey}
                  onChange={(e) => setPlanEditForm({
                    ...planEditForm,
                    planKey: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
                  })}
                  helperText="e.g. HOME_USER, MSME, ENTERPRISE_PRO, CUSTOM_PLAN"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="Display Plan Name"
                  value={planEditForm.name}
                  onChange={(e) => setPlanEditForm({ ...planEditForm, name: e.target.value })}
                  placeholder="e.g. Home User, Custom Enterprise"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="Annual Price (₹)"
                  type="number"
                  value={planEditForm.price}
                  onChange={(e) => setPlanEditForm({ ...planEditForm, price: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                  helperText="Authoritative yearly price before GST"
                />
              </Grid>

              {/* Quotas */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Max Assets Limit"
                  value={planEditForm.maxAssets}
                  onChange={(e) => setPlanEditForm({ ...planEditForm, maxAssets: e.target.value })}
                  placeholder="e.g. 20, 50, or unlimited"
                  helperText="Enter a number or 'unlimited' (-1)"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Max Users Limit"
                  value={planEditForm.maxUsers}
                  onChange={(e) => setPlanEditForm({ ...planEditForm, maxUsers: e.target.value })}
                  placeholder="e.g. 3, 15, or unlimited"
                  helperText="Enter a number or 'unlimited' (-1)"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Max Departments Limit"
                  value={planEditForm.maxDepartments}
                  onChange={(e) => setPlanEditForm({ ...planEditForm, maxDepartments: e.target.value })}
                  placeholder="e.g. 2, 5, or unlimited"
                  helperText="Enter a number or 'unlimited' (-1)"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Badge / Tag (Optional)"
                  value={planEditForm.badge}
                  onChange={(e) => setPlanEditForm({ ...planEditForm, badge: e.target.value })}
                  placeholder="e.g. Most Popular, Custom Tailored, Enterprise"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Plan Subtitle / Description"
                  value={planEditForm.description}
                  onChange={(e) => setPlanEditForm({ ...planEditForm, description: e.target.value })}
                  placeholder="Short summary of this subscription tier"
                />
              </Grid>
            </Grid>

            {/* 10-Feature Matrix Switches */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', bgcolor: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    Feature Capabilities Matrix (10 Core Features)
                  </Typography>
                  <Chip label="Turn ON / OFF" size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 800, fontSize: '10.5px' }} />
                </Box>
                <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                  Toggle each feature on or off. Access control middleware will restrict or allow features in real time based on these switches.
                </Typography>
              </Box>

              <Grid container spacing={1.5}>
                {FEATURE_DEFINITIONS.map((feat) => {
                  if (feat.key === 'ticketing') {
                    const currentTicketing = planEditForm.featureFlags?.ticketing || 'basic';
                    return (
                      <Grid item xs={12} sm={6} key={feat.key}>
                        <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', height: '100%' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            {feat.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: TEXT_MUTED, display: 'block', fontSize: '11px', mb: 1 }}>
                            {feat.desc}
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={currentTicketing}
                              onChange={(e) => setPlanEditForm({
                                ...planEditForm,
                                featureFlags: { ...planEditForm.featureFlags, ticketing: e.target.value }
                              })}
                              sx={{ borderRadius: '8px' }}
                            >
                              <MenuItem value="full">Full Ticketing Workflows</MenuItem>
                              <MenuItem value="basic">Basic Breakdown Requests</MenuItem>
                              <MenuItem value="none">Disabled</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      </Grid>
                    );
                  }

                  const isChecked = Boolean(planEditForm.featureFlags?.[feat.key]);
                  return (
                    <Grid item xs={12} sm={6} key={feat.key}>
                      <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                        <Box sx={{ pr: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            {feat.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: TEXT_MUTED, display: 'block', fontSize: '11px' }}>
                            {feat.desc}
                          </Typography>
                        </Box>
                        <Switch
                          size="small"
                          checked={isChecked}
                          onChange={(e) => setPlanEditForm({
                            ...planEditForm,
                            featureFlags: { ...planEditForm.featureFlags, [feat.key]: e.target.checked }
                          })}
                          color="primary"
                        />
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>

            {/* Features Marketing Bullets */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Plan Marketing Bullets (One feature per line)"
              value={planEditForm.featuresText}
              onChange={(e) => setPlanEditForm({ ...planEditForm, featuresText: e.target.value })}
              helperText="Additional bullet points displayed on pricing cards"
            />

            {/* Plan Flags */}
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <FormControlLabel
                control={
                  <Switch
                    checked={planEditForm.isActive}
                    onChange={(e) => setPlanEditForm({ ...planEditForm, isActive: e.target.checked })}
                    color="primary"
                  />
                }
                label="Plan Active & Selectable in Checkout"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={planEditForm.isCustom}
                    onChange={(e) => setPlanEditForm({ ...planEditForm, isCustom: e.target.checked })}
                    color="secondary"
                  />
                }
                label="Mark as Bespoke Custom Enterprise Plan"
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button
              onClick={() => setPlanEditModal({ open: false, isCreate: false, isCustom: false, data: null })}
              disabled={saving}
              sx={{ textTransform: 'none', fontWeight: 700, color: TEXT_MUTED }}
            >
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
                px: 3,
                '&:hover': { bgcolor: '#6464B8' }
              }}
            >
              {saving ? 'Saving...' : (planEditModal.isCreate ? 'Create Plan' : 'Save Plan Changes')}
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
