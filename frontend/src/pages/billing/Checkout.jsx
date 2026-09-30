import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Stack,
  Card,
  CardContent,
  Radio,
  Tooltip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  CheckCircleRounded,
  LocalOfferRounded,
  LockRounded,
  ArrowForwardRounded,
  AutorenewRounded,
  StarRounded,
  ShieldRounded,
  VerifiedUserRounded,
  TrendingUpRounded,
  Inventory2Rounded,
  SpeedRounded,
  SupportAgentRounded,
  CodeRounded,
  CloseRounded,
  CheckRounded,
  SendRounded,
  BusinessRounded,
  ContactMailRounded,
  WarningAmberRounded,
  AddRounded,
  RemoveRounded,
  LayersRounded,
} from '@mui/icons-material';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─── STYLING CONSTANTS ────────────────────────────────────────────────────────
const DARK = '#7777C7';
const ACCENT = '#7777C7';
const BORDER_COLOR = '#E2E8F0';
const BG_MUTED = '#F8FAFC';
const TEXT_MUTED = '#64748B';

// ─── AUTHORITATIVE PLAN DEFINITIONS (matches backend billingConfig) ───────────
const PLANS = [
  {
    key: 'HOME_USER',
    name: 'Home User',
    price: 999,
    assets: '20 Assets',
    assetCount: 20,
    tagline: 'Essential asset tracking for small setups & solo operators',
    features: [
      'Up to 20 Asset Registry & QR Tagging',
      'Standard Maintenance Ticket Portal',
      'Authorized Service Centers Locator',
      'Automated Email Status Notifications',
      'Single Admin / Department Management',
    ],
    recommendedFor: 'Solo Operators & Micro Offices',
  },
  {
    key: 'MSME',
    name: 'MSME',
    price: 2999,
    assets: '50 Assets',
    assetCount: 50,
    popular: true,
    tagline: 'Advanced workflows & automated compliance for growing teams',
    features: [
      'Up to 50 Asset Registry & QR Tagging',
      'Multi-Department Approval Workflows',
      'Advanced Warranty Radar & Alerts',
      'Automated SLA Escalation Engine',
      'PDF & Excel Compliance Reports',
      'Technician Service Logs & Audits',
    ],
    recommendedFor: 'Growing Businesses & Mid-Sized Teams',
  },
  {
    key: 'SME',
    name: 'SME',
    price: 8999,
    assets: '200 Assets',
    assetCount: 200,
    tagline: 'Enterprise-grade scale, custom branding & dedicated APIs',
    features: [
      '200 Asset Registry & Tracking',
      '30 Users & Role-Based Access',
      '10 Departments',
      'Custom Branding & White-labeling',
      'Developer REST API & Webhooks',
      'Priority 24/7 SLA Support',
      'Advanced Compliance Reports',
      'Dedicated Account Manager'
    ],
    recommendedFor: 'Enterprises & High-Scale Operations',
  },
  {
    key: 'CUSTOM_ENTERPRISE',
    name: 'Custom Enterprise Plan',
    price: 0,
    isCustom: true,
    assets: 'As per requirement Assets',
    assetCount: 'As per requirement',
    users: 'As per requirement Users',
    departments: 'As per requirement Departments',
    tagline: 'Custom tailored plan configured with bespoke quotas and enabled capabilities',
    features: [
      'As per requirement Users',
      'As per requirement Departments',
      'As per requirement Assets',
      'Core inventory and QR tagging',
      'Custom ticketing & approval workflows',
      'SLA escalation engine',
      'Custom branding & white-labeling',
      'Full audit trail logs',
      'Dedicated priority support & Account Manager'
    ],
    recommendedFor: 'Custom Enterprise Operations',
  }
];

const PLAN_TIER_RANK = {
  HOME_USER: 1,
  MSME: 2,
  SME: 3,
  LARGE_SCALE: 3,
  CUSTOM_ENTERPRISE: 4,
  CUSTOM_PLAN: 4
};

const normalizePlanKey = (planName, availablePlans = []) => {
  if (!planName) return 'HOME_USER';
  const clean = planName.toString().trim();
  const found = availablePlans.find(p => 
    p.key?.toLowerCase() === clean.toLowerCase() || 
    p.name?.toLowerCase() === clean.toLowerCase() || 
    p.planKey?.toLowerCase() === clean.toLowerCase()
  );
  if (found) return found.key || found.planKey;

  const upper = clean.toUpperCase().replace(/\s+/g, '_');
  if (upper.includes('HOME')) return 'HOME_USER';
  if (upper.includes('MSME')) return 'MSME';
  if (upper.includes('CUSTOM')) return 'CUSTOM_ENTERPRISE';
  if (upper.includes('SME') || upper.includes('LARGE') || upper.includes('ENTERPRISE')) return 'SME';
  if (upper.includes('PRO')) return 'MSME';
  if (upper.includes('BASIC')) return 'HOME_USER';
  return upper;
};

const formatINR = (val) => {
  const num = Number(val);
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Checkout() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // State management
  const [currentPlanKey, setCurrentPlanKey] = useState('HOME_USER');
  const [currentPlanName, setCurrentPlanName] = useState('Home User');
  const [subscriptionStatus, setSubscriptionStatus] = useState('Pending Checkout');
  const [planExpiryDate, setPlanExpiryDate] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(null);

  const [selectedPlan, setSelectedPlan] = useState('HOME_USER');
  const [addonAssets, setAddonAssets] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [breakdown, setBreakdown] = useState(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [calculatingCoupon, setCalculatingCoupon] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [plansList, setPlansList] = useState(PLANS);

  // Custom Quote Dialog State
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState('');
  const [quoteForm, setQuoteForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    expectedAssets: '',
    expectedUsers: '',
    expectedDepartments: '',
    requirements: '',
  });

  const handleOpenQuoteModal = (plan) => {
    const rawPhone = (currentUser?.phone || '').replace(/\D/g, '').slice(0, 10);
    setQuoteForm({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: rawPhone,
      company: currentUser?.companyName || currentUser?.tenantId || '',
      expectedAssets: '',
      expectedUsers: '',
      expectedDepartments: '',
      requirements: '',
    });
    setQuoteSuccessMsg('');
    setQuoteOpen(true);
  };

  const handleSubmitCustomQuote = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!quoteForm.name || !quoteForm.email || !quoteForm.company) {
      setError('Please provide your name, company name, and email address.');
      return;
    }
    if (quoteForm.phone && quoteForm.phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setQuoteSending(true);
    setError('');
    try {
      await api.post('/contact', {
        company: quoteForm.company,
        name: quoteForm.name,
        email: quoteForm.email,
        phone: quoteForm.phone || '',
        orgSize: `${quoteForm.expectedUsers || 'Custom'} Users / ${quoteForm.expectedAssets || 'Custom'} Assets / ${quoteForm.expectedDepartments || 'Custom'} Depts`,
        inquiryType: 'Custom Enterprise Plan Quote Request',
        message: quoteForm.requirements && quoteForm.requirements.trim() ? quoteForm.requirements.trim() : 'Custom Enterprise Plan Inquiry',
      });
      setQuoteSuccessMsg('Your custom enterprise requirements have been submitted! Our Super Admin team will review and assign your custom pricing quote shortly. Once quoted, your price will automatically appear on this page.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quote inquiry. Please try again.');
    } finally {
      setQuoteSending(false);
    }
  };

  // Authoritative Calculation from backend
  const fetchBreakdown = useCallback(async (planKey, coupon, customAddon) => {
    try {
      setLoadingBreakdown(true);
      setError('');
      const effectiveAddon = customAddon !== undefined ? Number(customAddon) : Number(addonAssets || 0);
      const { data } = await api.post('/billing/checkout/calculate', {
        planKey: planKey,
        couponCode: coupon || '',
        addonAssets: effectiveAddon,
      });
      setBreakdown(data);
      if (coupon && data.discountAmount > 0) {
        setAppliedCoupon(coupon);
        setCouponSuccess(`Coupon "${coupon}" applied successfully! You saved ${formatINR(data.discountAmount)}.`);
      } else if (coupon && data.discountAmount === 0) {
        setAppliedCoupon('');
        setCouponSuccess('');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' && err.response?.data.length < 100 ? err.response?.data : null) || 'Failed to calculate subscription pricing. Please try selecting the plan again.';
      setError(msg);
      // Keep previous breakdown if coupon failed, or recalculate without coupon
      if (coupon) {
        setAppliedCoupon('');
        setCouponSuccess('');
        try {
          const { data: cleanData } = await api.post('/billing/checkout/calculate', {
            planKey: planKey,
            couponCode: '',
            addonAssets: customAddon !== undefined ? Number(customAddon) : Number(addonAssets || 0),
          });
          setBreakdown(cleanData);
        } catch {}
      }
    } finally {
      setLoadingBreakdown(false);
      setCalculatingCoupon(false);
    }
  }, [addonAssets]);

  // Stepper handlers for Add-on capacity adjustment
  const handleAddonChange = (delta) => {
    const newQty = Math.max(0, (Number(addonAssets) || 0) + delta);
    setAddonAssets(newQty);
    fetchBreakdown(selectedPlan, appliedCoupon || couponCode, newQty);
  };

  const handleSetAddon = (qty) => {
    const newQty = Math.max(0, Number(qty) || 0);
    setAddonAssets(newQty);
    fetchBreakdown(selectedPlan, appliedCoupon || couponCode, newQty);
  };

  // 1. AUTO-DETECT CURRENT PLAN & LOAD LIVE DYNAMIC PLAN PRICES
  useEffect(() => {
    const detectCurrentPlan = async () => {
      let activePlans = PLANS;
      try {
        const { data: livePlans } = await api.get('/billing/plans');
        if (livePlans && livePlans.length > 0) {
          activePlans = livePlans.filter(p => p.isActive !== false).map(lp => {
            const isCustomPlan = Boolean(lp.isCustom || lp.planKey === 'CUSTOM_PLAN' || lp.planKey === 'CUSTOM_ENTERPRISE' || lp.name?.toLowerCase().includes('custom'));
            
            const customFeatures = [
              'As per requirement Users',
              'As per requirement Departments',
              'As per requirement Assets',
              'Core inventory and QR tagging',
              'Custom ticketing & approval workflows',
              'SLA escalation engine',
              'Custom branding & white-labeling',
              'Full audit trail logs',
              'Dedicated priority support & Account Manager'
            ];

            return {
              key: lp.planKey,
              planKey: lp.planKey,
              name: lp.name,
              price: lp.price,
              customQuotedPrice: lp.customQuotedPrice,
              isCustomQuoted: Boolean(lp.isCustomQuoted),
              quoteDaysRemaining: lp.quoteDaysRemaining,
              quoteExpiry: lp.quoteExpiry,
              isCustom: isCustomPlan,
              assets: isCustomPlan ? 'As per requirement Assets' : (lp.maxAssets === -1 || lp.maxAssets === 999999999 ? 'Unlimited Assets' : `${lp.maxAssets} Assets`),
              assetCount: isCustomPlan ? 'As per requirement' : (lp.maxAssets === -1 || lp.maxAssets === 999999999 ? 'Unlimited' : lp.maxAssets),
              users: isCustomPlan ? 'As per requirement Users' : (lp.maxUsers === -1 || lp.maxUsers === 999999999 ? 'Unlimited Users' : `${lp.maxUsers} Users`),
              departments: isCustomPlan ? 'As per requirement Departments' : (lp.maxDepartments === -1 || lp.maxDepartments === 999999999 ? 'Unlimited Depts' : `${lp.maxDepartments} Depts`),
              tagline: lp.description || (isCustomPlan ? 'Custom tailored plan configured with bespoke quotas and enabled capabilities' : 'Essential asset operations'),
              badge: lp.badge || (isCustomPlan ? 'Custom Tailored' : ''),
              popular: Boolean(lp.badge?.toLowerCase().includes('popular') || lp.badge?.toLowerCase().includes('recommended')),
              features: isCustomPlan
                ? (lp.features && lp.features.some(f => f.toLowerCase().includes('as per requirement')) ? lp.features : customFeatures)
                : (lp.features && lp.features.length > 0 ? lp.features : [
                    `${lp.maxAssets === -1 ? 'Unlimited' : lp.maxAssets} Assets`,
                    `${lp.maxUsers === -1 ? 'Unlimited' : lp.maxUsers} Users`,
                    `${lp.maxDepartments === -1 ? 'Unlimited' : lp.maxDepartments} Departments`,
                    'Core Asset Registry & QR Tagging',
                    'Maintenance Requests'
                  ]),
              recommendedFor: lp.badge || (isCustomPlan ? 'Custom Enterprise Operations' : 'Modern Organizations')
            };
          });

          if (!activePlans.some(p => p.isCustom)) {
            const customDefault = PLANS.find(p => p.isCustom);
            if (customDefault) activePlans.push(customDefault);
          }
          setPlansList(activePlans);
        }
      } catch {}

      try {
        const { data } = await api.get('/auth/me');
        const rawPlan = data.plan || currentUser?.plan || 'Home User';
        const detectedKey = normalizePlanKey(rawPlan, activePlans);
        const matchedPlanObj = activePlans.find((p) => p.key === detectedKey) || activePlans[0];
        const existingAddon = Number(data.addonAssets !== undefined ? data.addonAssets : (currentUser?.addonAssets || 0));

        setAddonAssets(existingAddon);
        setCurrentPlanKey(detectedKey);
        setCurrentPlanName(matchedPlanObj.name);
        setSubscriptionStatus(data.subscriptionStatus || currentUser?.subscriptionStatus || 'Pending Checkout');
        setPlanExpiryDate(data.planExpiry || currentUser?.planExpiry || null);
        setDaysRemaining(data.daysRemaining !== undefined ? data.daysRemaining : currentUser?.daysRemaining);

        // Auto-select detected current plan
        setSelectedPlan(detectedKey);
        await fetchBreakdown(detectedKey, '', existingAddon);
      } catch (err) {
        // Fallback to currentUser from AuthContext or default
        const rawPlan = currentUser?.plan || 'Home User';
        const detectedKey = normalizePlanKey(rawPlan, activePlans);
        const matchedPlanObj = activePlans.find((p) => p.key === detectedKey) || activePlans[0];
        const existingAddon = Number(currentUser?.addonAssets || 0);

        setAddonAssets(existingAddon);
        setCurrentPlanKey(detectedKey);
        setCurrentPlanName(matchedPlanObj.name);
        setSelectedPlan(detectedKey);
        await fetchBreakdown(detectedKey, '', existingAddon);
      } finally {
        setInitialLoaded(true);
      }
    };

    detectCurrentPlan();
  }, [currentUser, fetchBreakdown]);

  const isPlanDisabled = (planKey) => {
    if (subscriptionStatus !== 'Active') return false;
    const currentRank = PLAN_TIER_RANK[currentPlanKey] || 1;
    const targetRank = PLAN_TIER_RANK[planKey] || 1;
    return targetRank < currentRank;
  };

  // 2. WHEN CUSTOMER CLICKS ANOTHER PLAN
  const handleSelectPlan = (planKey) => {
    if (planKey === selectedPlan) return;
    if (isPlanDisabled(planKey)) {
      setError('Downgrade is not available during an active subscription period. Please contact support.');
      return;
    }
    setSelectedPlan(planKey);
    setError('');
    fetchBreakdown(planKey, appliedCoupon || couponCode, addonAssets);
  };

  // 3. APPLY / REMOVE COUPON
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code to apply.');
      return;
    }
    setCalculatingCoupon(true);
    setError('');
    setCouponSuccess('');
    await fetchBreakdown(selectedPlan, couponCode.trim().toUpperCase(), addonAssets);
  };

  const handleRemoveCoupon = async () => {
    setCouponCode('');
    setAppliedCoupon('');
    setCouponSuccess('');
    setError('');
    await fetchBreakdown(selectedPlan, '', addonAssets);
  };

  // 4. RAZORPAY PAYMENT FLOW (Unchanged backend contract)
  const handleSubscribe = async () => {
    if (!breakdown) return;
    if (breakdown.exceedsActiveAssets) {
      setError(`Cannot proceed: you currently have ${breakdown.activeAssetCount} active assets, which exceeds your chosen capacity of ${breakdown.totalCapacity}. Please clean up unused assets in the Asset Registry or increase add-on capacity.`);
      return;
    }
    try {
      setPaying(true);
      setError('');

      // Step 1: Create authoritative Razorpay order on server
      const { data } = await api.post('/billing/checkout/create-order', {
        planKey: selectedPlan,
        couponCode: appliedCoupon || couponCode || '',
        addonAssets: Number(addonAssets || 0),
      });

      console.log('[CHECKOUT] Order created successfully:', data);

      // Ensure Razorpay SDK is ready
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Razorpay payment gateway failed to load. Please disable ad-blockers or check internet connection.');
      }

      // Step 2: Initialize Razorpay Checkout Modal
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'IAssetCare Platform',
        description: `${data.breakdown?.plan?.name || selectedPlan} Annual Commercial Subscription`,
        order_id: data.orderId,
        prefill: {
          name: data.customer?.name || currentUser?.name || '',
          email: data.customer?.email || currentUser?.email || '',
          contact: data.customer?.phone || '',
        },
        theme: {
          color: DARK,
        },
        handler: async function (response) {
          try {
            setPaying(true);
            console.log('[CHECKOUT] Payment success response:', response);
            // Step 3: Server-side cryptographic signature verification
            await api.post('/billing/checkout/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Update user cache in localStorage
            try {
              const user = JSON.parse(localStorage.getItem('assetcare_user') || '{}');
              user.subscriptionStatus = 'Active';
              user.plan = data.breakdown?.plan?.name || selectedPlan;
              localStorage.setItem('assetcare_user', JSON.stringify(user));
            } catch (e) {}

            setPaymentSuccess(true);
            setTimeout(() => {
              window.location.href = '/settings?tab=billing';
            }, 1500);
          } catch (verifyErr) {
            console.error('[CHECKOUT] Verification error:', verifyErr);
            setError(verifyErr.response?.data?.message || 'Payment signature verification failed on backend.');
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            console.log('[CHECKOUT] Modal dismissed');
            setPaying(false);
          },
        },
      };

      console.log('[CHECKOUT] Opening Razorpay modal with options:', { ...options, handler: 'function' });
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        console.error('[CHECKOUT] Payment failed:', resp);
        setError(resp.error?.description || 'Payment transaction failed. Please retry.');
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      console.error('[CHECKOUT] Error in handleSubscribe:', err);
      setError(err.response?.data?.message || err.message || 'Payment initialization failed');
      setPaying(false);
    }
  };

  // Determine transition type: Upgrade vs Renewal
  const currentRank = PLAN_TIER_RANK[currentPlanKey] || 1;
  const selectedRank = PLAN_TIER_RANK[selectedPlan] || 1;
  const isSamePlan = selectedPlan === currentPlanKey;
  const isUpgrade = selectedRank > currentRank;
  const selectedPlanObj = plansList.find((p) => p.key === selectedPlan) || plansList[0];

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* ─── PAGE TITLE & CONTEXT BANNER ────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>
          Subscription & Licensing Checkout
        </Typography>
        <Typography variant="body1" sx={{ color: TEXT_MUTED, mt: 0.5 }}>
          Select or upgrade your commercial plan. All subscriptions include annual maintenance, compliance reports & multi-tenant isolation.
        </Typography>
      </Box>

      {/* ─── SUCCESS NOTIFICATION ──────────────────────────────────────────────── */}
      {paymentSuccess && (
        <Alert
          severity="success"
          icon={<VerifiedUserRounded sx={{ fontSize: 28 }} />}
          sx={{
            mb: 3,
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '15px',
            bgcolor: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #A7F3D0',
          }}
        >
          Payment verified successfully! Activating your commercial subscription and redirecting to your billing dashboard...
        </Alert>
      )}

      {/* ─── PRORATED UPGRADE BENEFIT BANNER ──────────────────────────────────── */}
      {breakdown?.prorationCredit > 0 && (
        <Alert
          severity="info"
          icon={<TrendingUpRounded sx={{ fontSize: 24, color: '#059669' }} />}
          sx={{
            mb: 3,
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '13.5px',
            bgcolor: '#ECFDF5',
            color: '#065F46',
            border: '1.5px solid #A7F3D0',
          }}
        >
          <strong>Prorated Upgrade Benefit:</strong> You have <strong>{breakdown.daysRemaining} days</strong> remaining on your active <strong>{breakdown.currentPlanName || currentPlanName}</strong> plan. We have automatically adjusted and deducted <strong>{formatINR(breakdown.prorationCredit)}</strong> from your upgrade price!
        </Alert>
      )}

      {/* ─── PLAN TRANSITION CONTEXT BAR ───────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3.5,
          borderRadius: '14px',
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* Current Plan Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Current Plan:
            </Typography>
            <Chip
              label={currentPlanName}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: '12px',
                bgcolor: '#F1F5F9',
                color: '#334155',
                border: '1px solid #CBD5E1',
              }}
            />
          </Box>

          <ArrowForwardRounded sx={{ color: '#94A3B8', fontSize: 18, display: { xs: 'none', sm: 'block' } }} />

          {/* Selected Plan State */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Selected Plan:
            </Typography>
            <Chip
              label={selectedPlanObj.name}
              size="small"
              sx={{
                fontWeight: 900,
                fontSize: '12px',
                bgcolor: DARK,
                color: '#FFFFFF',
              }}
            />
          </Box>

          {/* Action Badge */}
          {isSamePlan ? (
            <Chip
              icon={<AutorenewRounded sx={{ fontSize: '15px !important', color: '#0369A1 !important' }} />}
              label="Renewal / Extend Validity"
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: '11.5px',
                bgcolor: '#E0F2FE',
                color: '#0369A1',
                border: '1px solid #BAE6FD',
              }}
            />
          ) : isUpgrade ? (
            <Chip
              icon={<TrendingUpRounded sx={{ fontSize: '15px !important', color: '#15803D !important' }} />}
              label="Plan Upgrade"
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: '11.5px',
                bgcolor: '#DCFCE7',
                color: '#15803D',
                border: '1px solid #86EFAC',
              }}
            />
          ) : (
            <Chip
              label="Switch Plan"
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: '11.5px',
                bgcolor: '#FEF3C7',
                color: '#B45309',
                border: '1px solid #FDE68A',
              }}
            />
          )}
        </Box>

        {/* Expiry Details if available */}
        {planExpiryDate && (
          <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 600 }}>
            Current License Expires:{' '}
            <strong>{new Date(planExpiryDate).toLocaleDateString('en-IN')}</strong>
            {daysRemaining !== null && daysRemaining !== undefined ? ` (${daysRemaining} days left)` : ''}
          </Typography>
        )}
      </Paper>

      {/* ─── MAIN TWO-COLUMN LAYOUT ────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 380px' },
          gap: 3.5,
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: PLAN SELECTION & DETAILS */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* THREE PLAN CARDS */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 2, fontSize: '17px' }}>
              Select Subscription Tier
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: plansList.length > 3 ? 'repeat(auto-fit, minmax(220px, 1fr))' : `repeat(${Math.max(1, plansList.length)}, 1fr)` },
                gap: 2,
              }}
            >
              {plansList.map((plan) => {
                const isSelected = selectedPlan === plan.key;
                const isCurrent = currentPlanKey === plan.key;
                const isDisabled = isPlanDisabled(plan.key);
                const isUnquotedCustom = plan.isCustom && !plan.isCustomQuoted;

                return (
                  <Card
                    key={plan.key}
                    elevation={0}
                    onClick={() => {
                      if (isUnquotedCustom) {
                        handleOpenQuoteModal(plan);
                        return;
                      }
                      if (!isDisabled) handleSelectPlan(plan.key);
                    }}
                    sx={{
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      opacity: isDisabled ? 0.62 : 1,
                      transition: 'all 0.22s ease-in-out',
                      border: isSelected
                        ? `2.5px solid ${DARK}`
                        : isDisabled
                        ? '1px dashed #CBD5E1'
                        : isUnquotedCustom
                        ? '1.5px solid #CBD5E1'
                        : '1px solid #E2E8F0',
                      bgcolor: isSelected ? '#FBFDFB' : isDisabled ? '#F8FAFC' : '#FFFFFF',
                      boxShadow: isSelected
                        ? '0 12px 28px -6px rgba(119, 119, 199, 0.15)'
                        : '0 2px 6px rgba(0, 0, 0, 0.02)',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                      '&:hover': {
                        borderColor: isSelected ? DARK : isDisabled ? '#CBD5E1' : '#94A3B8',
                        boxShadow: isDisabled ? 'none' : '0 8px 24px -4px rgba(0, 0, 0, 0.08)',
                      },
                    }}
                  >
                    {/* Header Badges */}
                    <Box sx={{ p: 2, pb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', minHeight: 24, mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
                          {isCurrent && (
                            <Chip
                              label="CURRENT PLAN"
                              size="small"
                              sx={{
                                fontWeight: 900,
                                fontSize: '9.5px',
                                height: 20,
                                bgcolor: '#059669',
                                color: '#FFFFFF',
                                letterSpacing: '0.3px',
                              }}
                            />
                          )}
                          {plan.isCustomQuoted && (
                            <Chip
                              label={plan.quoteDaysRemaining ? `QUOTED RATE • ${plan.quoteDaysRemaining}D LEFT` : 'QUOTED RATE'}
                              size="small"
                              sx={{
                                fontWeight: 900,
                                fontSize: '9px',
                                height: 20,
                                bgcolor: '#059669',
                                color: '#FFFFFF',
                                letterSpacing: '0.3px',
                              }}
                            />
                          )}
                          {isUnquotedCustom && (
                            <Chip
                              label="BESPOKE QUOTE"
                              size="small"
                              sx={{
                                fontWeight: 900,
                                fontSize: '9px',
                                height: 20,
                                bgcolor: '#0F172A',
                                color: '#FFFFFF',
                                letterSpacing: '0.3px',
                              }}
                            />
                          )}
                          {isDisabled && (
                            <Chip
                              label="LOWER TIER"
                              size="small"
                              sx={{
                                fontWeight: 900,
                                fontSize: '9px',
                                height: 20,
                                bgcolor: '#FEE2E2',
                                color: '#991B1B',
                                letterSpacing: '0.3px',
                              }}
                            />
                          )}

                        </Box>

                        {!isUnquotedCustom && (
                          <Radio
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => {
                              if (!isDisabled) handleSelectPlan(plan.key);
                            }}
                            value={plan.key}
                            name="plan-selector"
                            size="small"
                            sx={{
                              p: 0,
                              color: '#CBD5E1',
                              '&.Mui-checked': { color: DARK },
                            }}
                          />
                        )}
                      </Box>

                      {/* Plan Name */}
                      <Typography variant="h6" sx={{ fontWeight: 900, color: isDisabled ? '#64748B' : '#0F172A', fontSize: '17px' }}>
                        {plan.name}
                      </Typography>

                      <Typography variant="body2" sx={{ color: TEXT_MUTED, fontSize: '11.5px', minHeight: 34, mt: 0.5, lineHeight: 1.35 }}>
                        {plan.tagline}
                      </Typography>

                      {/* Pricing */}
                      <Box sx={{ my: 1.2, display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        {isUnquotedCustom ? (
                          <Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '20px' }}>
                              Contact Sales
                            </Typography>
                            <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 700, fontSize: '11px', display: 'block' }}>
                              Custom requirements pricing
                            </Typography>
                          </Box>
                        ) : (
                          <>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: isDisabled ? '#64748B' : '#0F172A', fontSize: '24px' }}>
                              ₹{(plan.customQuotedPrice || plan.price).toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 700, fontSize: '12px' }}>
                              / year
                            </Typography>
                          </>
                        )}
                      </Box>

                      {/* Asset Capacity Badge */}
                      <Box
                        sx={{
                          py: 0.5,
                          px: 1,
                          borderRadius: '6px',
                          bgcolor: isSelected ? 'rgba(119, 119, 199, 0.05)' : '#F8FAFC',
                          border: '1px solid',
                          borderColor: isSelected ? 'rgba(119, 119, 199, 0.12)' : '#E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                        }}
                      >
                        <Inventory2Rounded sx={{ fontSize: 15, color: isSelected ? DARK : '#64748B' }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: isSelected ? DARK : '#334155', fontSize: '11.5px' }}>
                          {plan.assets}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 0.5, borderColor: '#F1F5F9' }} />

                    {/* Features List */}
                    <Box sx={{ p: 2, pt: 1, flexGrow: 1 }}>
                      <Stack spacing={0.85}>
                        {plan.features.map((feat, idx) => (
                          <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                            <CheckCircleRounded
                              sx={{
                                fontSize: 14,
                                mt: 0.2,
                                color: isSelected ? '#059669' : isDisabled ? '#94A3B8' : '#10B981',
                                flexShrink: 0,
                              }}
                            />
                            <Typography variant="caption" sx={{ color: isDisabled ? '#64748B' : '#334155', fontSize: '11px', lineHeight: 1.35, fontWeight: 600 }}>
                              {feat}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>

                    {/* Card Footer Selection CTA */}
                    <Box sx={{ p: 1.5, pt: 0 }}>
                      {isDisabled ? (
                        <Tooltip title="Downgrade is not supported during an active subscription period. Please contact support.">
                          <Box
                            sx={{
                              p: 0.9,
                              borderRadius: '8px',
                              bgcolor: '#FEF2F2',
                              border: '1px solid #FECACA',
                              textAlign: 'center',
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#991B1B',
                                fontWeight: 800,
                                fontSize: '10.5px',
                                display: 'block',
                                lineHeight: 1.3,
                              }}
                            >
                              Downgrade not available during the active billing period. Please contact support.
                            </Typography>
                          </Box>
                        </Tooltip>
                      ) : isUnquotedCustom ? (
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenQuoteModal(plan);
                          }}
                          startIcon={<SendRounded sx={{ fontSize: '14px !important' }} />}
                          sx={{
                            borderRadius: '8px',
                            py: 0.75,
                            fontWeight: 800,
                            fontSize: '12px',
                            textTransform: 'none',
                            bgcolor: '#0F172A',
                            color: '#FFFFFF',
                            '&:hover': {
                              bgcolor: '#1E293B',
                            },
                          }}
                        >
                          Request Custom Quote
                        </Button>
                      ) : (
                        <Button
                          fullWidth
                          variant={isSelected ? 'contained' : 'outlined'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPlan(plan.key);
                          }}
                          sx={{
                            borderRadius: '8px',
                            py: 0.75,
                            fontWeight: 800,
                            fontSize: '12px',
                            textTransform: 'none',
                            bgcolor: isSelected ? DARK : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : '#334155',
                            borderColor: isSelected ? DARK : '#CBD5E1',
                            '&:hover': {
                              bgcolor: isSelected ? '#6464B8' : '#F1F5F9',
                              borderColor: DARK,
                            },
                          }}
                        >
                          {isSelected ? 'Selected' : 'Select Plan'}
                        </Button>
                      )}
                    </Box>
                  </Card>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* RIGHT COLUMN: AUTHORITATIVE ORDER SUMMARY & CHECKOUT */}
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '18px',
              bgcolor: '#FFFFFF',
              border: `1.5px solid ${DARK}`,
              position: 'sticky',
              top: 24,
              boxShadow: '0 12px 32px -8px rgba(119, 119, 199, 0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '18px' }}>
                Order Summary
              </Typography>
              <Chip
                label="Authoritative"
                size="small"
                sx={{ fontWeight: 800, fontSize: '10px', bgcolor: '#F1F5F9', color: '#475569' }}
              />
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {loadingBreakdown && !breakdown ? (
              <Stack spacing={2} sx={{ py: 3 }}>
                <Skeleton variant="text" height={24} />
                <Skeleton variant="text" height={24} />
                <Skeleton variant="text" height={24} />
                <Skeleton variant="rectangular" height={50} sx={{ borderRadius: '10px' }} />
              </Stack>
            ) : breakdown ? (
              <Box>
                {/* Plan Base Price */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: TEXT_MUTED, fontWeight: 600 }}>
                    {breakdown.plan?.name || selectedPlanObj.name} (Base Tier)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {formatINR(breakdown.plan?.price || selectedPlanObj.price)}
                  </Typography>
                </Box>

                {/* Add-on Asset Capacity Selector & Stepper */}
                {!selectedPlanObj.isCustom && (
                  <Box sx={{ my: 2, p: 2, bgcolor: '#F8FAFC', borderRadius: '14px', border: '1.5px solid #E2E8F0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <LayersRounded sx={{ color: DARK, fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                          Add-On Asset Capacity
                        </Typography>
                      </Box>
                      <Chip
                        label={`₹${breakdown.unitPrice || 49}/asset/yr`}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '10.5px', bgcolor: '#EEF2FF', color: DARK }}
                      />
                    </Box>

                    <Typography variant="caption" sx={{ color: TEXT_MUTED, display: 'block', mb: 1.5, fontSize: '11.5px' }}>
                      Adjust your extra asset quota in increments of 5. Set to 0 to renew base quota only.
                    </Typography>

                    {/* Stepper Controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#FFFFFF', p: 1, borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleAddonChange(-5)}
                          disabled={addonAssets <= 0 || paying || loadingBreakdown}
                          sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' }, borderRadius: '6px' }}
                        >
                          <RemoveRounded sx={{ fontSize: 16 }} />
                        </IconButton>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: '#0F172A', minWidth: '70px', textAlign: 'center' }}>
                          +{addonAssets} Assets
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleAddonChange(5)}
                          disabled={paying || loadingBreakdown}
                          sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' }, borderRadius: '6px' }}
                        >
                          <AddRounded sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>

                      <Typography variant="body2" sx={{ fontWeight: 900, color: DARK }}>
                        {formatINR(breakdown.addonCost || 0)}
                      </Typography>
                    </Box>

                    {/* Preset Quick Chips */}
                    <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5, flexWrap: 'wrap' }}>
                      {[0, 5, 10, 20, 50].map((preset) => (
                        <Chip
                          key={preset}
                          label={preset === 0 ? '0 (Base Only)' : `+${preset}`}
                          size="small"
                          onClick={() => handleSetAddon(preset)}
                          variant={addonAssets === preset ? 'filled' : 'outlined'}
                          sx={{
                            fontWeight: 800,
                            fontSize: '11px',
                            cursor: 'pointer',
                            bgcolor: addonAssets === preset ? DARK : '#FFFFFF',
                            color: addonAssets === preset ? '#FFFFFF' : '#475569',
                            borderColor: addonAssets === preset ? DARK : '#CBD5E1',
                            '&:hover': { bgcolor: addonAssets === preset ? '#6464B8' : '#F1F5F9' },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Add-on Asset Breakdown Line */}
                {breakdown.addonAssets > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 700 }}>
                        Add-On Capacity (+{breakdown.addonAssets} Assets)
                      </Typography>
                      <Typography variant="caption" sx={{ color: TEXT_MUTED, fontSize: '11px' }}>
                        ₹{breakdown.unitPrice || 49}/asset/yr
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                      + {formatINR(breakdown.addonCost)}
                    </Typography>
                  </Box>
                )}

                {/* Proration Credit Line */}
                {breakdown.prorationCredit > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1.5,
                      alignItems: 'center',
                      p: 1.25,
                      borderRadius: '8px',
                      bgcolor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ color: '#059669', fontWeight: 800, fontSize: '12px' }}>
                        Unused Plan Credit
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600, fontSize: '11px', display: 'block' }}>
                        {breakdown.currentPlanName || currentPlanName} ({breakdown.daysRemaining} days unused)
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#059669', fontWeight: 900, fontSize: '13px' }}>
                      - {formatINR(breakdown.prorationCredit)}
                    </Typography>
                  </Box>
                )}

                {/* Promotional Coupon Box inside Order Summary */}
                <Box sx={{ my: 2, p: 1.5, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', display: 'block', mb: 1, letterSpacing: '0.3px' }}>
                    HAVE A COUPON CODE?
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Coupon Code (e.g. SAVE50)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={calculatingCoupon || paying || Boolean(appliedCoupon)}
                      InputProps={{
                        startAdornment: <LocalOfferRounded sx={{ color: '#94A3B8', mr: 0.75, fontSize: 16 }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          bgcolor: '#FFFFFF',
                        },
                      }}
                    />
                    {appliedCoupon ? (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={handleRemoveCoupon}
                        disabled={calculatingCoupon || paying}
                        sx={{ borderRadius: '8px', height: 40, px: 1.5, textTransform: 'none', fontWeight: 800, fontSize: '11.5px', whiteSpace: 'nowrap' }}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleApplyCoupon}
                        disabled={calculatingCoupon || !couponCode.trim() || paying}
                        sx={{
                          borderRadius: '8px',
                          height: 40,
                          px: 2,
                          textTransform: 'none',
                          fontWeight: 800,
                          fontSize: '12px',
                          bgcolor: DARK,
                          color: '#FFFFFF',
                          whiteSpace: 'nowrap',
                          '&:hover': { bgcolor: '#6464B8' },
                        }}
                      >
                        {calculatingCoupon ? <CircularProgress size={14} color="inherit" /> : 'Apply'}
                      </Button>
                    )}
                  </Box>
                  {couponSuccess && (
                    <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, mt: 0.75, display: 'block' }}>
                      ✓ {couponSuccess}
                    </Typography>
                  )}
                  {error && (
                    <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 700, mt: 0.75, display: 'block' }}>
                      {error}
                    </Typography>
                  )}
                </Box>

                {/* Discount Line */}
                {breakdown.discountAmount > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1.5,
                      alignItems: 'center',
                      p: 1,
                      borderRadius: '8px',
                      bgcolor: '#ECFDF5',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#059669', fontWeight: 700 }}>
                      Coupon Discount {appliedCoupon ? `(${appliedCoupon})` : ''}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#059669', fontWeight: 800 }}>
                      - {formatINR(breakdown.discountAmount)}
                    </Typography>
                  </Box>
                )}

                {/* Taxable Subtotal */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: TEXT_MUTED, fontWeight: 600 }}>
                    Taxable Subtotal
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {formatINR(breakdown.taxableAmount)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5, borderColor: '#F1F5F9' }} />

                {/* GST Line Items */}
                {breakdown.cgst > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 600 }}>
                      CGST (9%)
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                      {formatINR(breakdown.cgst)}
                    </Typography>
                  </Box>
                )}

                {breakdown.sgst > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 600 }}>
                      SGST (9%)
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                      {formatINR(breakdown.sgst)}
                    </Typography>
                  </Box>
                )}

                {breakdown.igst > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 600 }}>
                      Integrated GST (18%)
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                      {formatINR(breakdown.igst)}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2, borderColor: '#E2E8F0' }} />

                {/* Total Amount */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5, alignItems: 'baseline' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '18px' }}>
                      Total Payable
                    </Typography>
                    <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 600 }}>
                      {breakdown.cgst > 0
                        ? 'Includes CGST (9%) + SGST (9%) — Tax Invoice provided'
                        : breakdown.igst > 0
                        ? 'Includes IGST (18%) — Tax Invoice provided'
                        : 'Tax Invoice provided'}
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: DARK, fontSize: '24px' }}>
                    {formatINR(breakdown.totalAmount)}
                  </Typography>
                </Box>

                {/* ─── ACTIVE ASSETS CAPACITY SAFETY GUARD (TWO-PATH WORKFLOW) ─── */}
                {breakdown.exceedsActiveAssets ? (
                  <Box
                    sx={{
                      mb: 2.5,
                      p: 2.25,
                      borderRadius: '14px',
                      bgcolor: '#FFFBEB',
                      border: '1.5px solid #FCD34D',
                      boxShadow: '0 6px 16px rgba(217, 119, 6, 0.08)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <WarningAmberRounded sx={{ color: '#D97706', fontSize: 24 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#92400E', fontSize: '14px' }}>
                        Active Assets Exceed Selected Capacity
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#78350F', fontSize: '12.5px', lineHeight: 1.5, mb: 2 }}>
                      You currently have <strong>{breakdown.activeAssetCount} active assets</strong> in your database, but your selected capacity is <strong>{breakdown.totalCapacity} assets</strong>.
                    </Typography>

                    {/* TWO-PATH CHOICE BOX */}
                    <Stack spacing={1.5}>
                      {/* Path 1: Instant Full Renewal */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: '10px',
                          bgcolor: '#FFFFFF',
                          border: '1.5px solid #86EFAC',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                            Option 1: Instant Full Renewal (No Deletion Needed)
                          </Typography>
                          <Chip
                            label={`+${Math.ceil(breakdown.minRequiredAddons / 5) * 5} Add-ons`}
                            size="small"
                            sx={{ fontWeight: 800, fontSize: '10px', bgcolor: '#DCFCE7', color: '#15803D' }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#334155', fontSize: '11.5px' }}>
                          Keep all {breakdown.activeAssetCount} active equipment and renew immediately by adding required capacity.
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleSetAddon(Math.ceil(breakdown.minRequiredAddons / 5) * 5)}
                          sx={{
                            borderRadius: '8px',
                            bgcolor: '#16A34A',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '11.5px',
                            py: 0.75,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#15803D' },
                          }}
                        >
                          Select +{Math.ceil(breakdown.minRequiredAddons / 5) * 5} Add-ons & Enable Payment
                        </Button>
                      </Paper>

                      {/* Path 2: Clean Up for Reduced Price */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: '10px',
                          bgcolor: '#FFFFFF',
                          border: '1.5px solid #CBD5E1',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          Option 2: Pay Reduced Price (Clean Up First)
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '11.5px' }}>
                          To pay the lower rate of {formatINR(breakdown.totalAmount)}, please archive or delete <strong>{breakdown.excessAssets} unused asset{breakdown.excessAssets === 1 ? '' : 's'}</strong> in your Asset Registry. Once deleted, this lower price unlocks automatically.
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate('/admin/assets')}
                          sx={{
                            borderRadius: '8px',
                            borderColor: '#94A3B8',
                            color: '#334155',
                            fontWeight: 800,
                            fontSize: '11.5px',
                            py: 0.75,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#F8FAFC', borderColor: '#475569' },
                          }}
                        >
                          Open Asset Registry to Clean Up ({breakdown.excessAssets} to remove)
                        </Button>
                      </Paper>
                    </Stack>
                  </Box>
                ) : breakdown.activeAssetCount !== undefined && (
                  <Box
                    sx={{
                      mb: 2.5,
                      p: 1.25,
                      bgcolor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleRounded sx={{ color: '#059669', fontSize: 18 }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#065F46', fontSize: '11.5px' }}>
                        Capacity Guard: {breakdown.activeAssetCount} active assets (Capacity: {breakdown.totalCapacity === -1 ? 'Unlimited' : `${breakdown.totalCapacity} total`})
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Primary Action Button */}
                {selectedPlanObj.isCustom && !selectedPlanObj.isCustomQuoted ? (
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => handleOpenQuoteModal(selectedPlanObj)}
                    startIcon={<SendRounded />}
                    sx={{
                      borderRadius: '12px',
                      py: 1.6,
                      fontWeight: 900,
                      fontSize: '15px',
                      textTransform: 'none',
                      bgcolor: '#0F172A',
                      color: '#FFFFFF',
                      boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.35)',
                      '&:hover': {
                        bgcolor: '#1E293B',
                      },
                    }}
                  >
                    Request Custom Quote / Contact Sales
                  </Button>
                ) : (
                  <Tooltip
                    title={
                      breakdown.exceedsActiveAssets
                        ? `You have ${breakdown.activeAssetCount} active assets. Clean up ${breakdown.excessAssets} assets in your registry or add extra capacity to enable payment.`
                        : ''
                    }
                    arrow
                  >
                    <span>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={handleSubscribe}
                        disabled={paying || loadingBreakdown || Boolean(breakdown.exceedsActiveAssets)}
                        startIcon={paying ? <CircularProgress size={20} color="inherit" /> : <LockRounded />}
                        sx={{
                          borderRadius: '12px',
                          py: 1.6,
                          fontWeight: 900,
                          fontSize: '15px',
                          textTransform: 'none',
                          bgcolor: breakdown.exceedsActiveAssets ? '#94A3B8' : DARK,
                          color: '#FFFFFF',
                          boxShadow: breakdown.exceedsActiveAssets ? 'none' : '0 8px 20px -4px rgba(119, 119, 199, 0.35)',
                          '&:hover': {
                            bgcolor: breakdown.exceedsActiveAssets ? '#94A3B8' : '#6464B8',
                          },
                        }}
                      >
                        {paying
                          ? 'Processing Payment...'
                          : breakdown.exceedsActiveAssets
                          ? `Clean Up ${breakdown.excessAssets} Assets to Pay`
                          : isSamePlan
                          ? `Renew & Extend (${formatINR(breakdown.totalAmount)})`
                          : isUpgrade
                          ? `Upgrade to ${selectedPlanObj.name} (${formatINR(breakdown.totalAmount)})`
                          : `Pay & Activate (${formatINR(breakdown.totalAmount)})`}
                      </Button>
                    </span>
                  </Tooltip>
                )}

                {/* Trust & Security Badges */}
                <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: '#059669', mb: 0.5 }}>
                    <ShieldRounded sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '11px' }}>
                      256-Bit SSL Encrypted Checkout via Razorpay
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: TEXT_MUTED, fontSize: '11px', display: 'block' }}>
                    Instant license activation upon payment confirmation.
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: 2 }}>
                  Select a plan to calculate your breakdown.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => fetchBreakdown(selectedPlan, couponCode)}
                  sx={{ borderRadius: '10px', bgcolor: DARK, fontWeight: 800 }}
                >
                  Calculate Pricing
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* ─── CUSTOM ENTERPRISE QUOTE REQUEST MODAL ─── */}
      <Dialog
        open={quoteOpen}
        onClose={() => !quoteSending && setQuoteOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '18px', p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '18px' }}>
              Request Custom Enterprise Quote
            </Typography>
            <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
              Specify your expected scale. Super Admin will quote and configure your custom rate.
            </Typography>
          </Box>
          <IconButton onClick={() => setQuoteOpen(false)} size="small" disabled={quoteSending}>
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          {quoteSuccessMsg ? (
            <Alert severity="success" sx={{ borderRadius: '12px', fontWeight: 600 }}>
              {quoteSuccessMsg}
            </Alert>
          ) : (
            <form id="custom-quote-form" onSubmit={handleSubmitCustomQuote}>
              <Stack spacing={2}>
                {error && (
                  <Alert severity="error" sx={{ borderRadius: '10px' }}>
                    {error}
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Company Name"
                      required
                      value={quoteForm.company}
                      onChange={(e) => setQuoteForm({ ...quoteForm, company: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Contact Person Name"
                      required
                      value={quoteForm.name}
                      onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="email"
                      label="Work Email Address"
                      required
                      value={quoteForm.email}
                      onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Phone Number"
                      placeholder="10-digit mobile number"
                      value={quoteForm.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setQuoteForm({ ...quoteForm, phone: val });
                      }}
                      inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }}
                      helperText={quoteForm.phone && quoteForm.phone.length !== 10 ? 'Must be exactly 10 digits' : ''}
                      error={Boolean(quoteForm.phone && quoteForm.phone.length > 0 && quoteForm.phone.length !== 10)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Expected Assets"
                      placeholder="e.g. 500"
                      value={quoteForm.expectedAssets}
                      onChange={(e) => setQuoteForm({ ...quoteForm, expectedAssets: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Expected Users"
                      placeholder="e.g. 50"
                      value={quoteForm.expectedUsers}
                      onChange={(e) => setQuoteForm({ ...quoteForm, expectedUsers: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Departments"
                      placeholder="e.g. 10"
                      value={quoteForm.expectedDepartments}
                      onChange={(e) => setQuoteForm({ ...quoteForm, expectedDepartments: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      label="Specific Requirements / Custom Needs"
                      placeholder="Mention any custom SLAs, API integrations, dedicated support, or custom hardware needs..."
                      value={quoteForm.requirements}
                      onChange={(e) => setQuoteForm({ ...quoteForm, requirements: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </form>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 2 }}>
          <Button
            onClick={() => setQuoteOpen(false)}
            variant="outlined"
            disabled={quoteSending}
            sx={{ borderRadius: '10px', textTransform: 'none', color: '#64748B', borderColor: '#CBD5E1' }}
          >
            {quoteSuccessMsg ? 'Close' : 'Cancel'}
          </Button>
          {!quoteSuccessMsg && (
            <Button
              type="submit"
              form="custom-quote-form"
              variant="contained"
              disabled={quoteSending}
              startIcon={quoteSending ? <CircularProgress size={16} color="inherit" /> : <SendRounded />}
              sx={{
                borderRadius: '10px',
                bgcolor: '#0F172A',
                color: '#FFFFFF',
                fontWeight: 800,
                textTransform: 'none',
                px: 3,
                '&:hover': { bgcolor: '#1E293B' }
              }}
            >
              {quoteSending ? 'Submitting Inquiry...' : 'Submit Request'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}