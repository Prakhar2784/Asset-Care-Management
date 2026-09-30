import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  CircularProgress, Alert, IconButton, Tooltip, TextField, InputAdornment, ButtonGroup, Stack
} from '@mui/material';
import {
  ReceiptRounded, CheckCircleRounded, AutorenewRounded, CancelRounded,
  ContentCopyRounded, ArrowForwardRounded, CloudDownloadRounded,
  SecurityRounded, ScheduleRounded, DiamondRounded, AddCircleOutlineRounded,
  BoltRounded, AddRounded, RemoveRounded, CheckRounded, LocalOfferRounded,
  HelpOutlineRounded, InfoOutlined, VerifiedUserRounded
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

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

const PLAN_PRICES = {
  'Home User': '₹999 / yr',
  'MSME': '₹2,999 / yr',
  'Large Scale': '₹8,999 / yr',
};

const PLAN_LIMITS = {
  'Home User': '20 Assets',
  'MSME': '50 Assets',
  'Large Scale': 'Unlimited Assets',
};

export default function SubscriptionBilling() {
  const [tenant, setTenant] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [livePlans, setLivePlans] = useState([]);
  
  // Addon Purchase State
  const [addonQuantity, setAddonQuantity] = useState(10);
  const [addonLoading, setAddonLoading] = useState(false);
  const [addonSuccess, setAddonSuccess] = useState('');
  const [addonError, setAddonError] = useState('');
  const [policyOpen, setPolicyOpen] = useState(false);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tenantRes, invRes, plansRes] = await Promise.all([
        api.get('/settings/tenant'),
        api.get('/billing/invoices'),
        api.get('/billing/plans').catch(() => ({ data: [] }))
      ]);
      setTenant(tenantRes.data);
      setInvoices(invRes.data || []);
      setLivePlans(plansRes.data || []);
    } catch (err) {
      console.error('Failed to fetch subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyLicense = () => {
    if (tenant?.licenseKey) {
      navigator.clipboard.writeText(tenant.licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePurchaseAddon = async () => {
    const qty = parseInt(addonQuantity, 10);
    if (!qty || qty < 1) {
      setAddonError('Please select a valid quantity of assets to purchase.');
      return;
    }
    try {
      setAddonLoading(true);
      setAddonError('');
      setAddonSuccess('');

      const { data } = await api.post('/billing/addon/create-order', {
        quantity: qty
      });

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Razorpay gateway failed to load. Please check your connection or disable ad-blockers.');
      }

      const numAssets = data.addonAssets || data.additionalAssets || qty;

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'IAssetCare Platform',
        description: `Add-on: +${numAssets} Assets Quota Expansion`,
        order_id: data.orderId,
        prefill: {
          name: data.customerDetails?.name || data.customer?.name || currentUser?.name || '',
          email: data.customerDetails?.email || data.customer?.email || currentUser?.email || '',
          contact: data.customerDetails?.phone || data.customer?.phone || currentUser?.phone || '',
        },
        theme: {
          color: '#7777C7',
        },
        handler: async function (response) {
          try {
            setAddonLoading(true);
            await api.post('/billing/checkout/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setAddonSuccess(`Payment verified! Successfully added +${numAssets} assets. Your quota is now expanded!`);
            await fetchData();
            try {
              const { data: me } = await api.get('/auth/me');
              if (me) {
                localStorage.setItem('assetcare_user', JSON.stringify(me));
              }
            } catch (e) {}
          } catch (verifyErr) {
            console.error('Add-on verification error:', verifyErr);
            setAddonError(verifyErr.response?.data?.message || 'Payment signature verification failed.');
          } finally {
            setAddonLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setAddonLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        console.error('Addon payment failed:', resp);
        setAddonError(resp.error?.description || 'Payment failed. Please try again.');
        setAddonLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Purchase add-on error:', err);
      setAddonError(err.response?.data?.message || err.message || 'Failed to initiate add-on purchase.');
      setAddonLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelLoading(true);
      await api.post('/billing/cancel');
      setMessage('Subscription cancelled successfully. You can continue using your plan until it expires.');
      setCancelOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Failed to cancel subscription.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress sx={{ color: '#7777C7' }} />
      </Box>
    );
  }

  const currentPlan = tenant?.plan || 'Home User';
  const matchedLivePlan = livePlans.find(p => p.name?.toLowerCase() === currentPlan.toLowerCase() || p.planKey?.toLowerCase() === currentPlan.toLowerCase().replace(/\s+/g, '_'));
  const planPrice = matchedLivePlan ? `₹${matchedLivePlan.price.toLocaleString('en-IN')} / yr` : (PLAN_PRICES[currentPlan] || '₹999 / yr');
  const assetLimit = matchedLivePlan?.maxAssets !== undefined ? (matchedLivePlan.maxAssets === -1 || matchedLivePlan.maxAssets === 999999999 ? 'Unlimited Assets' : `${matchedLivePlan.maxAssets} Assets`) : (PLAN_LIMITS[currentPlan] || `${tenant?.limits?.maxAssets || 20} Assets`);
  const subStatus = tenant?.subscriptionStatus || 'Active';

  // Calculate remaining days
  const now = new Date();
  let remainingDays = 0;
  let expiryDateFormatted = 'N/A';
  let startDateFormatted = 'N/A';

  if (tenant?.planExpiry) {
    const expiryDate = new Date(tenant.planExpiry);
    expiryDateFormatted = expiryDate.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    const diffTime = expiryDate - now;
    remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Approximate start date (1 year before expiry)
    const startDate = new Date(expiryDate);
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDateFormatted = startDate.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Box sx={{
          width: 52, height: 52, borderRadius: 2.5,
          display: 'grid', placeItems: 'center',
          bgcolor: 'rgba(119, 119, 199, 0.18)', color: '#7777C7', flexShrink: 0
        }}>
          <ReceiptRounded sx={{ fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={900} letterSpacing="-0.5px" sx={{ color: 'text.primary', lineHeight: 1.2 }}>
            Subscription & Billing
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage your organization's license, plan tier, validity period, and tax invoices
          </Typography>
        </Box>
      </Box>

      {message && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {tenant?.customPrice && Number(tenant.customPrice) > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: '14px',
            bgcolor: '#ECFDF5',
            border: '1.5px solid #10B981',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                bgcolor: '#059669',
                color: '#FFFFFF',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0
              }}
            >
              <DiamondRounded sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" fontWeight={900} sx={{ color: '#065F46' }}>
                  Custom Enterprise Quote Ready: ₹{Number(tenant.customPrice).toLocaleString('en-IN')}/year
                </Typography>
                <Chip
                  label={tenant.customQuoteDaysRemaining ? `QUOTED RATE • ${tenant.customQuoteDaysRemaining}D LEFT` : 'QUOTED RATE • 7D LEFT'}
                  size="small"
                  sx={{
                    fontWeight: 900,
                    fontSize: '10px',
                    height: 22,
                    bgcolor: '#059669',
                    color: '#FFFFFF',
                    letterSpacing: '0.4px'
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#047857', mt: 0.3 }}>
                Super Admin has configured a tailored enterprise package for your organization. This quote is valid for{' '}
                <strong>{tenant.customQuoteDaysRemaining ?? 7} more days</strong> before auto-expiring.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate('/admin/checkout')}
            endIcon={<ArrowForwardRounded />}
            sx={{
              bgcolor: '#059669',
              color: '#FFFFFF',
              fontWeight: 800,
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: '8px',
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#047857' }
            }}
          >
            Review & Activate
          </Button>
        </Paper>
      )}

      {/* Main Grid: Plan Details, Optional Add-on Assets, & Subscription Actions */}
      <Grid container spacing={2.5} mb={4} alignItems="stretch">
        {/* Current Plan Card */}
        <Grid item xs={12} md={tenant?.allowAddonAssets ? 4 : 7}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.75, borderRadius: '16px', height: '100%',
              bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
              position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}
          >
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                <Box>
                  <Typography variant="overline" color="text.secondary" fontWeight={800} letterSpacing={1.1} fontSize="10.5px">
                    CURRENT SUBSCRIPTION PLAN
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={0.3}>
                    <Typography variant="h5" fontWeight={900} color="#7777C7">
                      {currentPlan}
                    </Typography>
                    <Chip
                      label={subStatus}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: '11px',
                        height: 22,
                        bgcolor: subStatus === 'Active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: subStatus === 'Active' ? '#166534' : '#991B1B'
                      }}
                    />
                  </Box>
                </Box>
                <Typography variant="h6" fontWeight={900} color="#7777C7">
                  {planPrice}
                </Typography>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} fontSize="10.5px" display="block">
                    ASSET LIMIT
                  </Typography>
                  <Typography variant="body2" fontWeight={800} mt={0.2}>
                    {assetLimit}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} fontSize="10.5px" display="block">
                    REMAINING DAYS
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color="primary.main" mt={0.2}>
                    {remainingDays} Days
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} fontSize="10.5px" display="block">
                    START DATE
                  </Typography>
                  <Typography variant="body2" fontWeight={800} mt={0.2}>
                    {startDateFormatted}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} fontSize="10.5px" display="block">
                    EXPIRY DATE
                  </Typography>
                  <Typography variant="body2" fontWeight={800} mt={0.2}>
                    {expiryDateFormatted}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* License Key Section */}
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(119, 119, 199, 0.03)', borderRadius: '10px', border: '1px dashed rgba(119, 119, 199, 0.2)' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={800} fontSize="10px" display="block" mb={0.3}>
                COMMERCIAL LICENSE KEY
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#7777C7', fontSize: '11px', letterSpacing: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tenant?.licenseKey || 'PENDING-ACTIVATION'}
                </Typography>
                <Tooltip title={copied ? 'Copied!' : 'Copy Key'}>
                  <IconButton size="small" onClick={handleCopyLicense} sx={{ p: 0.3 }}>
                    <ContentCopyRounded sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Purchase More Assets Card (Visible only if Superadmin enables it for this company) */}
        {/* Purchase More Assets Card (Visible only if Superadmin enables it globally) */}
        {tenant?.allowAddonAssets && (
          <Grid item xs={12} md={4}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.75, borderRadius: '16px', height: '100%',
                bgcolor: 'background.paper',
                border: '1.5px solid #7777C7',
                position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(119, 119, 199, 0.08)'
              }}
            >
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.8}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={0.8}>
                      <Typography variant="overline" color="#7777C7" fontWeight={800} letterSpacing={1.1} fontSize="10.5px" display="block">
                        ADD-ON ASSET CAPACITY
                      </Typography>
                      <Tooltip title="Click to view Pro-Rata & Co-Terminus Billing Policy" arrow>
                        <IconButton
                          size="small"
                          onClick={() => setPolicyOpen(true)}
                          sx={{ p: 0.2, color: '#7777C7', '&:hover': { bgcolor: 'rgba(119,119,199,0.1)' } }}
                        >
                          <HelpOutlineRounded sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="h6" fontWeight={900} color="text.primary" fontSize="17px">
                      Purchase More Assets
                    </Typography>
                  </Box>
                  <Chip
                    icon={<BoltRounded style={{ color: '#7777C7', fontSize: 13 }} />}
                    label={`₹${tenant?.addonAssetPrice || 49}/asset/yr`}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: '11px',
                      height: 22,
                      bgcolor: 'rgba(119, 119, 199, 0.12)',
                      color: '#7777C7',
                      border: '1px solid rgba(119, 119, 199, 0.25)'
                    }}
                  />
                </Box>

                <Box display="flex" alignItems="center" gap={0.6} mb={1.2}>
                  <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.3}>
                    Billed <strong>pro-rata</strong> for your remaining <strong>{remainingDays} days</strong>.
                  </Typography>
                  <Tooltip title="Add-on assets co-terminate with your active subscription cycle. Click to read full policy." arrow>
                    <Chip
                      label="Pro-Rata Policy"
                      size="small"
                      onClick={() => setPolicyOpen(true)}
                      clickable
                      sx={{
                        fontSize: '9.5px',
                        height: 18,
                        fontWeight: 800,
                        bgcolor: '#EEF2FF',
                        color: '#4F46E5',
                        border: '1px solid #C7D2FE'
                      }}
                    />
                  </Tooltip>
                </Box>

                {/* Multiples of 5 Stepper Controller */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.2,
                    bgcolor: 'rgba(119, 119, 199, 0.05)',
                    borderRadius: '10px',
                    border: '1px solid rgba(119, 119, 199, 0.2)',
                    mb: 1.5
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => setAddonQuantity(prev => Math.max(5, prev - 5))}
                    disabled={addonQuantity <= 5 || addonLoading}
                    sx={{
                      bgcolor: '#FFFFFF',
                      width: 32,
                      height: 32,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      border: '1px solid #E2E8F0',
                      color: '#7777C7',
                      '&:hover': { bgcolor: '#F1F5F9' },
                      '&.Mui-disabled': { opacity: 0.35 }
                    }}
                  >
                    <RemoveRounded fontSize="small" />
                  </IconButton>

                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight={900} color="#7777C7" lineHeight={1}>
                      +{addonQuantity}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={800} fontSize="10px" letterSpacing={0.4}>
                      ASSETS (MULTIPLE OF 5)
                    </Typography>
                  </Box>

                  <IconButton
                    size="small"
                    onClick={() => setAddonQuantity(prev => prev + 5)}
                    disabled={addonLoading}
                    sx={{
                      bgcolor: '#FFFFFF',
                      width: 32,
                      height: 32,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      border: '1px solid #E2E8F0',
                      color: '#7777C7',
                      '&:hover': { bgcolor: '#F1F5F9' }
                    }}
                  >
                    <AddRounded fontSize="small" />
                  </IconButton>
                </Box>

                {/* Dynamic Pro-Rata Price Breakdown Box */}
                {(() => {
                  const unitPrice = tenant?.addonAssetPrice || 49;
                  const qty = Number(addonQuantity) || 5;
                  const annualSubtotal = qty * unitPrice;
                  const proratedFraction = remainingDays > 0 ? Math.min(1, Math.max(0.01, remainingDays / 365)) : 1;
                  const proratedBase = Math.round(annualSubtotal * proratedFraction * 100) / 100;
                  const gst = Math.round(proratedBase * 0.18 * 100) / 100;
                  const total = proratedBase + gst;
                  const currentMax = tenant?.limits?.maxAssets ?? 20;
                  const isCurrentUnlimited = currentMax === -1 || currentMax >= 999999999;
                  const projectedMax = isCurrentUnlimited ? 'Unlimited' : (currentMax + qty);

                  return (
                    <Box sx={{ p: 1.2, bgcolor: 'rgba(119, 119, 199, 0.04)', borderRadius: '10px', border: '1px dashed rgba(119, 119, 199, 0.25)', mb: 1.5 }}>
                      <Box display="flex" justifyContent="space-between" mb={0.3}>
                        <Typography variant="caption" color="text.secondary" fontSize="11px">Annual Rate ({qty} × ₹{unitPrice}):</Typography>
                        <Typography variant="caption" sx={{ textDecoration: remainingDays < 365 ? 'line-through' : 'none', color: remainingDays < 365 ? 'text.secondary' : 'inherit' }} fontSize="11px">₹{annualSubtotal.toLocaleString('en-IN')}</Typography>
                      </Box>
                      {remainingDays < 365 && (
                        <Box display="flex" justifyContent="space-between" mb={0.3}>
                          <Typography variant="caption" color="#4F46E5" fontWeight={700} fontSize="11px">
                            Pro-Rata ({remainingDays}d / 365d):
                          </Typography>
                          <Typography variant="caption" fontWeight={800} color="#4F46E5" fontSize="11px">
                            ₹{proratedBase.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      )}
                      <Box display="flex" justifyContent="space-between" mb={0.3}>
                        <Typography variant="caption" color="text.secondary" fontSize="11px">GST (18%):</Typography>
                        <Typography variant="caption" fontWeight={700} fontSize="11px">₹{gst.toFixed(2)}</Typography>
                      </Box>
                      <Divider sx={{ my: 0.6 }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="caption" fontWeight={800} fontSize="11.5px" display="block">Total Payable:</Typography>
                          <Typography variant="caption" color="#7777C7" fontWeight={700} fontSize="10px">
                            New Limit: <strong>{projectedMax} Assets</strong> (Till {expiryDateFormatted})
                          </Typography>
                        </Box>
                        <Typography variant="subtitle1" fontWeight={900} color="#7777C7">
                          ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()}
              </Box>

              {addonError && (
                <Alert severity="error" sx={{ mb: 1.5, borderRadius: '8px', fontSize: '12px' }} onClose={() => setAddonError('')}>
                  {addonError}
                </Alert>
              )}

              {addonSuccess && (
                <Alert severity="success" sx={{ mb: 1.5, borderRadius: '8px', fontSize: '12px' }} onClose={() => setAddonSuccess('')}>
                  {addonSuccess}
                </Alert>
              )}

              {(() => {
                const unitPrice = tenant?.addonAssetPrice || 49;
                const qty = Number(addonQuantity) || 5;
                const annualSubtotal = qty * unitPrice;
                const proratedFraction = remainingDays > 0 ? Math.min(1, Math.max(0.01, remainingDays / 365)) : 1;
                const proratedBase = Math.round(annualSubtotal * proratedFraction * 100) / 100;
                const gst = Math.round(proratedBase * 0.18 * 100) / 100;
                const total = proratedBase + gst;

                return (
                  <Button
                    variant="contained"
                    fullWidth
                    size="medium"
                    disabled={addonLoading || !addonQuantity || Number(addonQuantity) < 1}
                    onClick={handlePurchaseAddon}
                    startIcon={addonLoading ? <CircularProgress size={16} color="inherit" /> : <BoltRounded sx={{ fontSize: 18 }} />}
                    sx={{
                      py: 1.1,
                      fontWeight: 900,
                      bgcolor: '#7777C7',
                      color: '#FFFFFF',
                      borderRadius: '10px',
                      boxShadow: '0 4px 14px rgba(119, 119, 199, 0.35)',
                      textTransform: 'none',
                      fontSize: '13px',
                      '&:hover': { bgcolor: '#6464B8' }
                    }}
                  >
                    {addonLoading ? 'Processing...' : `Buy +${addonQuantity} Assets (₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                  </Button>
                );
              })()}
            </Paper>
          </Grid>
        )}

        {/* Subscription Actions */}
        <Grid item xs={12} md={tenant?.allowAddonAssets ? 4 : 5}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.75, borderRadius: '16px', height: '100%',
              display: 'flex', flexDirection: 'column', gap: 1.5, justifyContent: 'center',
              border: '1px solid', borderColor: 'divider', bgcolor: 'background.default'
            }}
          >
            <Typography variant="subtitle2" fontWeight={800} mb={0.2}>
              Subscription Actions
            </Typography>

            <Button
              variant="contained"
              fullWidth
              size="medium"
              endIcon={<ArrowForwardRounded sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/admin/checkout')}
              sx={{
                py: 1.1, fontWeight: 800, fontSize: '13px',
                bgcolor: '#7777C7', color: '#FFFFFF', '&:hover': { bgcolor: '#6464B8' },
                borderRadius: '10px', textTransform: 'none'
              }}
            >
              Change / Upgrade Plan
            </Button>

            <Button
              variant="outlined"
              fullWidth
              size="medium"
              startIcon={<AutorenewRounded sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/admin/checkout')}
              sx={{
                py: 1.1, fontWeight: 800, fontSize: '13px',
                borderColor: '#7777C7', color: '#7777C7', '&:hover': { borderColor: '#7777C7', bgcolor: 'rgba(119, 119, 199, 0.10)' },
                borderRadius: '10px', textTransform: 'none'
              }}
            >
              Renew Subscription
            </Button>

            {subStatus === 'Active' && (
              <Button
                variant="text"
                color="error"
                fullWidth
                size="small"
                startIcon={<CancelRounded sx={{ fontSize: 16 }} />}
                onClick={() => setCancelOpen(true)}
                sx={{ py: 0.6, fontWeight: 700, borderRadius: '10px', fontSize: '12px', textTransform: 'none' }}
              >
                Cancel Subscription
              </Button>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Tax Invoices & Payment History */}
      <Typography variant="h6" fontWeight={800} mb={2}>
        Tax Invoices & Payment History
      </Typography>
      <Paper variant="outlined" sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
              <th style={{ padding: '14px 18px', fontWeight: 800 }}>Date</th>
              <th style={{ padding: '14px 18px', fontWeight: 800 }}>Invoice #</th>
              <th style={{ padding: '14px 18px', fontWeight: 800 }}>Plan</th>
              <th style={{ padding: '14px 18px', fontWeight: 800 }}>Amount</th>
              <th style={{ padding: '14px 18px', fontWeight: 800 }}>Status</th>
              <th style={{ padding: '14px 18px', fontWeight: 800 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
                  No tax invoices recorded yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv._id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    {new Date(inv.date || inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                    {inv.invoiceNumber}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {inv.planName}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                    ₹{(inv.totalAmount || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <Chip
                      size="small"
                      label={inv.status}
                      sx={{
                        fontWeight: 700,
                        bgcolor: inv.status === 'Paid' ? 'rgba(34,197,94,0.12)' : 'rgba(0,0,0,0.06)',
                        color: inv.status === 'Paid' ? '#166534' : 'inherit'
                      }}
                    />
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CloudDownloadRounded />}
                      onClick={() => window.open(`/admin/billing/invoice/${inv._id}`, '_blank')}
                      sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
                    >
                      View Tax Invoice
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Paper>

      {/* Co-Terminus & Pro-Rata Policy Explanation Modal */}
      <Dialog
        open={policyOpen}
        onClose={() => setPolicyOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: 'rgba(119, 119, 199, 0.15)', color: '#7777C7', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <VerifiedUserRounded sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={900} color="#0F172A" lineHeight={1.2}>
              Add-On Asset Capacity Policy
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Co-Terminus & Pro-Rata Fair Billing Rules
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2.5 }}>
          {/* Rule 1: Pro-Rata */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <Box display="flex" alignItems="flex-start" gap={1.5}>
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#EEF2FF', color: '#4F46E5', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: '13px', flexShrink: 0 }}>
                1
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                  Fair Pro-Rata Mid-Cycle Pricing
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5} fontSize="13px" lineHeight={1.5}>
                  When you purchase additional assets mid-cycle, you are <strong>only charged for the remaining {remainingDays} days</strong> of your current annual subscription period rather than paying for a full 365-day block upfront.
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Rule 2: Co-Terminus Expiry */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <Box display="flex" alignItems="flex-start" gap={1.5}>
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#ECFDF5', color: '#059669', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: '13px', flexShrink: 0 }}>
                2
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                  Co-Terminus Expiry Alignment
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5} fontSize="13px" lineHeight={1.5}>
                  All purchased add-on assets stay active and valid until your primary subscription plan expiration date (<strong>{expiryDateFormatted}</strong>). This ensures your entire organization operates on a single unified renewal calendar without fragmented micro-expirations.
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Rule 3: Single Consolidated Annual Renewal */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <Box display="flex" alignItems="flex-start" gap={1.5}>
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#FFFBEB', color: '#D97706', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: '13px', flexShrink: 0 }}>
                3
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                  Single Consolidated Renewal Invoice
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5} fontSize="13px" lineHeight={1.5}>
                  At your annual subscription renewal date, your base plan fee and your active add-on asset quota will be combined into <strong>one single official GST tax invoice</strong>, keeping corporate accounting clean and simple.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC' }}>
          <Button
            variant="contained"
            onClick={() => setPolicyOpen(false)}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 800,
              bgcolor: '#7777C7',
              color: '#FFFFFF',
              px: 3,
              '&:hover': { bgcolor: '#6464B8' }
            }}
          >
            I Understand
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
