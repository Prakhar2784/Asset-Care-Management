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
} from '@mui/icons-material';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─── STYLING CONSTANTS ────────────────────────────────────────────────────────
const DARK = '#051C12';
const ACCENT = '#B4F105';
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
    key: 'LARGE_SCALE',
    name: 'Large Scale',
    price: 8999,
    assets: 'Unlimited Assets',
    assetCount: 'Unlimited',
    tagline: 'Enterprise-grade scale, custom branding & dedicated APIs',
    features: [
      'Unlimited Asset Registry & Tracking',
      'Unlimited Users & Role-Based Access',
      'REST API Access & Webhook Integrations',
      'Tenant Database Isolation & Custom Brand',
      'Full Audit Trail & Regulatory Compliance',
      'Priority 24/7 SLA Technical Support',
    ],
    recommendedFor: 'Enterprises & High-Scale Operations',
  },
];

const PLAN_TIER_RANK = {
  HOME_USER: 1,
  MSME: 2,
  LARGE_SCALE: 3,
};

const normalizePlanKey = (planName) => {
  if (!planName) return 'HOME_USER';
  const clean = planName.toString().trim().toUpperCase().replace(/\s+/g, '_');
  if (clean.includes('HOME')) return 'HOME_USER';
  if (clean.includes('MSME')) return 'MSME';
  if (clean.includes('LARGE') || clean.includes('ENTERPRISE')) return 'LARGE_SCALE';
  if (clean.includes('PRO')) return 'MSME';
  if (clean.includes('BASIC')) return 'HOME_USER';
  return 'HOME_USER';
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

  // Authoritative Calculation from backend
  const fetchBreakdown = useCallback(async (planKey, coupon) => {
    try {
      setLoadingBreakdown(true);
      setError('');
      const { data } = await api.post('/billing/checkout/calculate', {
        planKey: planKey,
        couponCode: coupon || '',
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
        // Recalculate without coupon
        try {
          const { data: cleanData } = await api.post('/billing/checkout/calculate', {
            planKey: planKey,
            couponCode: '',
          });
          setBreakdown(cleanData);
        } catch {}
      }
    } finally {
      setLoadingBreakdown(false);
      setCalculatingCoupon(false);
    }
  }, []);

  // 1. AUTO-DETECT CURRENT PLAN ON MOUNT
  useEffect(() => {
    const detectCurrentPlan = async () => {
      try {
        const { data } = await api.get('/auth/me');
        const rawPlan = data.plan || currentUser?.plan || 'Home User';
        const detectedKey = normalizePlanKey(rawPlan);
        const matchedPlanObj = PLANS.find((p) => p.key === detectedKey) || PLANS[0];

        setCurrentPlanKey(detectedKey);
        setCurrentPlanName(matchedPlanObj.name);
        setSubscriptionStatus(data.subscriptionStatus || currentUser?.subscriptionStatus || 'Pending Checkout');
        setPlanExpiryDate(data.planExpiry || currentUser?.planExpiry || null);
        setDaysRemaining(data.daysRemaining !== undefined ? data.daysRemaining : currentUser?.daysRemaining);

        // Auto-select detected current plan
        setSelectedPlan(detectedKey);
        await fetchBreakdown(detectedKey, '');
      } catch (err) {
        // Fallback to currentUser from AuthContext or default
        const rawPlan = currentUser?.plan || 'Home User';
        const detectedKey = normalizePlanKey(rawPlan);
        const matchedPlanObj = PLANS.find((p) => p.key === detectedKey) || PLANS[0];

        setCurrentPlanKey(detectedKey);
        setCurrentPlanName(matchedPlanObj.name);
        setSelectedPlan(detectedKey);
        await fetchBreakdown(detectedKey, '');
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
    fetchBreakdown(planKey, appliedCoupon || couponCode);
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
    await fetchBreakdown(selectedPlan, couponCode.trim().toUpperCase());
  };

  const handleRemoveCoupon = async () => {
    setCouponCode('');
    setAppliedCoupon('');
    setCouponSuccess('');
    setError('');
    await fetchBreakdown(selectedPlan, '');
  };

  // 4. RAZORPAY PAYMENT FLOW (Unchanged backend contract)
  const handleSubscribe = async () => {
    if (!breakdown) return;
    try {
      setPaying(true);
      setError('');

      // Step 1: Create authoritative Razorpay order on server
      const { data } = await api.post('/billing/checkout/create-order', {
        planKey: selectedPlan,
        couponCode: appliedCoupon || couponCode || '',
      });

      // Ensure Razorpay SDK is ready
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Razorpay payment gateway failed to load. Please verify your internet connection.');
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
            setError(verifyErr.response?.data?.message || 'Payment signature verification failed on backend.');
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
            setError('Payment checkout cancelled. Your subscription remains unchanged.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setError(resp.error?.description || 'Payment transaction failed. Please retry.');
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment initialization failed');
      setPaying(false);
    }
  };

  // Determine transition type: Upgrade vs Renewal
  const currentRank = PLAN_TIER_RANK[currentPlanKey] || 1;
  const selectedRank = PLAN_TIER_RANK[selectedPlan] || 1;
  const isSamePlan = selectedPlan === currentPlanKey;
  const isUpgrade = selectedRank > currentRank;
  const selectedPlanObj = PLANS.find((p) => p.key === selectedPlan) || PLANS[0];

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
              1. Select Subscription Tier
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.key;
                const isCurrent = currentPlanKey === plan.key;
                const isDisabled = isPlanDisabled(plan.key);

                return (
                  <Card
                    key={plan.key}
                    elevation={0}
                    onClick={() => {
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
                        : '1px solid #E2E8F0',
                      bgcolor: isSelected ? '#FBFDFB' : isDisabled ? '#F8FAFC' : '#FFFFFF',
                      boxShadow: isSelected
                        ? '0 12px 28px -6px rgba(5, 28, 18, 0.15)'
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
                          {plan.popular && !isCurrent && !isDisabled && (
                            <Chip
                              icon={<StarRounded sx={{ fontSize: '13px !important', color: '#0F172A !important' }} />}
                              label="POPULAR"
                              size="small"
                              sx={{
                                fontWeight: 900,
                                fontSize: '9.5px',
                                height: 20,
                                bgcolor: ACCENT,
                                color: DARK,
                                letterSpacing: '0.3px',
                              }}
                            />
                          )}
                        </Box>

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
                        <Typography variant="h5" sx={{ fontWeight: 900, color: isDisabled ? '#64748B' : '#0F172A', fontSize: '24px' }}>
                          ₹{plan.price.toLocaleString('en-IN')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 700, fontSize: '12px' }}>
                          / year
                        </Typography>
                      </Box>

                      {/* Asset Capacity Badge */}
                      <Box
                        sx={{
                          py: 0.5,
                          px: 1,
                          borderRadius: '6px',
                          bgcolor: isSelected ? 'rgba(5, 28, 18, 0.05)' : '#F8FAFC',
                          border: '1px solid',
                          borderColor: isSelected ? 'rgba(5, 28, 18, 0.12)' : '#E2E8F0',
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
                              bgcolor: isSelected ? '#0B291C' : '#F1F5F9',
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

          {/* ─── SELECTED PLAN KEY DETAILS BREAKDOWN CARD ─────────────────────── */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '15.5px' }}>
                  Package Highlights: {selectedPlanObj.name}
                </Typography>
                <Typography variant="body2" sx={{ color: TEXT_MUTED, fontSize: '12px' }}>
                  {selectedPlanObj.recommendedFor} • Annual Commercial License
                </Typography>
              </Box>
              <Chip
                label={`Capacity: ${selectedPlanObj.assets}`}
                size="small"
                sx={{ fontWeight: 800, fontSize: '11.5px', bgcolor: '#F1F5F9', color: '#0F172A' }}
              />
            </Box>

            <Grid container spacing={1.5}>
              {selectedPlanObj.features.map((feat, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: '8px',
                      bgcolor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.25,
                    }}
                  >
                    <CheckRounded sx={{ fontSize: 16, color: '#059669', bgcolor: '#D1FAE5', borderRadius: '50%', p: 0.2 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '12px' }}>
                      {feat}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* ─── PROMOTIONAL COUPON SECTION ───────────────────────────────────── */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '15.5px', mb: 0.5 }}>
              2. Promotional Code & Discounts
            </Typography>
            <Typography variant="body2" sx={{ color: TEXT_MUTED, fontSize: '12px', mb: 2 }}>
              Have a platform coupon provided by Super Admin? Apply it below to calculate your instant discount.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Enter Coupon Code (e.g. SAVE50)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={calculatingCoupon || paying}
                InputProps={{
                  startAdornment: <LocalOfferRounded sx={{ color: '#94A3B8', mr: 1, fontSize: 18 }} />,
                }}
                sx={{
                  flexGrow: 1,
                  minWidth: 220,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    bgcolor: '#FFFFFF',
                  },
                }}
              />

              {appliedCoupon ? (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRemoveCoupon}
                  disabled={calculatingCoupon || paying}
                  startIcon={<CloseRounded />}
                  sx={{
                    borderRadius: '10px',
                    px: 2,
                    py: 1,
                    fontWeight: 800,
                    textTransform: 'none',
                    fontSize: '12.5px',
                  }}
                >
                  Remove Coupon
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleApplyCoupon}
                  disabled={calculatingCoupon || !couponCode.trim() || paying}
                  startIcon={calculatingCoupon ? <CircularProgress size={16} color="inherit" /> : <CheckRounded />}
                  sx={{
                    borderRadius: '10px',
                    px: 2.5,
                    py: 1,
                    fontWeight: 800,
                    fontSize: '12.5px',
                    textTransform: 'none',
                    bgcolor: DARK,
                    color: '#FFFFFF',
                    '&:hover': { bgcolor: '#0B291C' },
                  }}
                >
                  {calculatingCoupon ? 'Applying...' : 'Apply Coupon'}
                </Button>
              )}
            </Box>

            {/* Alerts */}
            {couponSuccess && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: '10px', fontWeight: 700, fontSize: '12.5px' }}>
                {couponSuccess}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: '10px', fontWeight: 700, fontSize: '12.5px' }}>
                {error}
              </Alert>
            )}
          </Paper>
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
              boxShadow: '0 12px 32px -8px rgba(5, 28, 18, 0.1)',
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
                    {breakdown.plan?.name || selectedPlanObj.name} (1 Year)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {formatINR(breakdown.baseAmount)}
                  </Typography>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'baseline' }}>
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

                {/* Primary Action Button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSubscribe}
                  disabled={paying || loadingBreakdown}
                  startIcon={paying ? <CircularProgress size={20} color="inherit" /> : <LockRounded />}
                  sx={{
                    borderRadius: '12px',
                    py: 1.6,
                    fontWeight: 900,
                    fontSize: '15px',
                    textTransform: 'none',
                    bgcolor: DARK,
                    color: '#FFFFFF',
                    boxShadow: '0 8px 20px -4px rgba(5, 28, 18, 0.35)',
                    '&:hover': {
                      bgcolor: '#0B291C',
                    },
                  }}
                >
                  {paying
                    ? 'Processing Payment...'
                    : isSamePlan
                    ? `Renew & Extend (${formatINR(breakdown.totalAmount)})`
                    : isUpgrade
                    ? `Upgrade to ${selectedPlanObj.name} (${formatINR(breakdown.totalAmount)})`
                    : `Pay & Activate (${formatINR(breakdown.totalAmount)})`}
                </Button>

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
    </Container>
  );
}