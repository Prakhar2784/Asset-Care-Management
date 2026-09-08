import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  CircularProgress, Alert, IconButton, Tooltip
} from '@mui/material';
import {
  ReceiptRounded, CheckCircleRounded, AutorenewRounded, CancelRounded,
  ContentCopyRounded, ArrowForwardRounded, CloudDownloadRounded,
  SecurityRounded, ScheduleRounded, DiamondRounded
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

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
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tenantRes, invRes] = await Promise.all([
        api.get('/settings/tenant'),
        api.get('/billing/invoices'),
      ]);
      setTenant(tenantRes.data);
      setInvoices(invRes.data || []);
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
        <CircularProgress sx={{ color: '#051C12' }} />
      </Box>
    );
  }

  const currentPlan = tenant?.plan || 'Home User';
  const planPrice = PLAN_PRICES[currentPlan] || '₹999 / yr';
  const assetLimit = PLAN_LIMITS[currentPlan] || `${tenant?.limits?.maxAssets || 20} Assets`;
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
          bgcolor: '#051C12', color: '#B4F105', flexShrink: 0
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

      {/* Main Grid: Plan Details & Subscription Actions */}
      <Grid container spacing={3} mb={4}>
        {/* Current Plan Card */}
        <Grid item xs={12} md={7}>
          <Paper
            variant="outlined"
            sx={{
              p: 3.5, borderRadius: '16px', height: '100%',
              bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
              position: 'relative', overflow: 'hidden'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={800} letterSpacing={1.2}>
                  CURRENT SUBSCRIPTION PLAN
                </Typography>
                <Box display="flex" alignItems="center" gap={1.5} mt={0.5}>
                  <Typography variant="h4" fontWeight={900} color="#051C12">
                    {currentPlan}
                  </Typography>
                  <Chip
                    label={subStatus}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      bgcolor: subStatus === 'Active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      color: subStatus === 'Active' ? '#166534' : '#991B1B'
                    }}
                  />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight={900} color="#051C12">
                {planPrice}
              </Typography>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                  ASSET LIMIT
                </Typography>
                <Typography variant="body2" fontWeight={800} mt={0.5}>
                  {assetLimit}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                  REMAINING DAYS
                </Typography>
                <Typography variant="body2" fontWeight={800} color="primary.main" mt={0.5}>
                  {remainingDays} Days
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                  START DATE
                </Typography>
                <Typography variant="body2" fontWeight={800} mt={0.5}>
                  {startDateFormatted}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                  EXPIRY DATE
                </Typography>
                <Typography variant="body2" fontWeight={800} mt={0.5}>
                  {expiryDateFormatted}
                </Typography>
              </Grid>
            </Grid>

            {/* License Key Section */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(5,28,18,0.03)', borderRadius: '12px', border: '1px dashed rgba(5,28,18,0.15)' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" mb={0.5}>
                COMMERCIAL LICENSE KEY
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#051C12', letterSpacing: 0.5 }}>
                  {tenant?.licenseKey || 'PENDING-ACTIVATION'}
                </Typography>
                <Tooltip title={copied ? 'Copied!' : 'Copy License Key'}>
                  <IconButton size="small" onClick={handleCopyLicense}>
                    <ContentCopyRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Subscription Actions */}
        <Grid item xs={12} md={5}>
          <Paper
            variant="outlined"
            sx={{
              p: 3.5, borderRadius: '16px', height: '100%',
              display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center',
              border: '1px solid', borderColor: 'divider', bgcolor: 'background.default'
            }}
          >
            <Typography variant="subtitle1" fontWeight={800} mb={0.5}>
              Subscription Actions
            </Typography>

            <Button
              variant="contained"
              fullWidth
              size="large"
              endIcon={<ArrowForwardRounded />}
              onClick={() => navigate('/admin/checkout')}
              sx={{
                py: 1.4, fontWeight: 800,
                bgcolor: '#051C12', color: '#B4F105',
                '&:hover': { bgcolor: '#0B3B24' },
                borderRadius: '10px'
              }}
            >
              Change / Upgrade Plan
            </Button>

            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<AutorenewRounded />}
              onClick={() => navigate('/admin/checkout')}
              sx={{
                py: 1.4, fontWeight: 800,
                borderColor: '#051C12', color: '#051C12',
                '&:hover': { borderColor: '#0B3B24', bgcolor: 'rgba(5,28,18,0.04)' },
                borderRadius: '10px'
              }}
            >
              Renew Subscription
            </Button>

            {subStatus === 'Active' && (
              <Button
                variant="text"
                color="error"
                fullWidth
                startIcon={<CancelRounded />}
                onClick={() => setCancelOpen(true)}
                sx={{ py: 1, fontWeight: 700, borderRadius: '10px' }}
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
                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#6C7E75' }}>
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

      {/* Cancellation Confirmation Dialog */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)}>
        <DialogTitle fontWeight={800}>Cancel Subscription?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your active subscription? You will still retain access to your plan and all assets until <strong>{expiryDateFormatted}</strong>, after which your plan will not automatically renew.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCancelOpen(false)} disabled={cancelLoading} sx={{ fontWeight: 700 }}>
            Keep Subscription
          </Button>
          <Button onClick={handleCancelSubscription} color="error" variant="contained" disabled={cancelLoading} sx={{ fontWeight: 700 }}>
            {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
