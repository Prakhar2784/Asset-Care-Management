import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, Grid, Paper, Divider, Switch,
  FormControlLabel, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  CheckRounded, CloseRounded, RocketLaunchRounded, StarRounded,
  ShieldRounded, ArrowForwardRounded, FlashOnRounded
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const ACCENT = '#FFFFFF';
const DARK = '#000000';

const plans = [
  {
    id: 'basic',
    name: 'Starter',
    icon: <RocketLaunchRounded sx={{ fontSize: 28 }} />,
    monthlyPrice: 0,
    yearlyPrice: 0,
    color: '#FFFFFF',
    description: 'Perfect for small teams getting started with asset management.',
    badge: null,
    features: [
      { label: 'Up to 50 Assets', included: true },
      { label: 'Up to 10 Users', included: true },
      { label: 'Asset Registry & Tracking', included: true },
      { label: 'Ticket Management', included: true },
      { label: 'Employee Self-Service Portal', included: true },
      { label: 'Email Notifications', included: true },
      { label: 'Basic Reports & PDF Export', included: true },
      { label: 'Procurement Module', included: false },
      { label: 'Vendor Portal', included: false },
      { label: 'Enterprise Hub', included: false },
      { label: 'Custom Branding & SMTP', included: false },
      { label: 'Dedicated Support', included: false },
    ]
  },
  {
    id: 'pro',
    name: 'Professional',
    icon: <StarRounded sx={{ fontSize: 28 }} />,
    monthlyPrice: 2999,
    yearlyPrice: 29990,
    color: ACCENT,
    description: 'For growing businesses that need advanced procurement and workflows.',
    badge: 'Most Popular',
    features: [
      { label: 'Up to 500 Assets', included: true },
      { label: 'Up to 50 Users', included: true },
      { label: 'Asset Registry & Tracking', included: true },
      { label: 'Ticket Management', included: true },
      { label: 'Employee Self-Service Portal', included: true },
      { label: 'Email Notifications', included: true },
      { label: 'Advanced Reports & Excel Export', included: true },
      { label: 'Procurement Module (PR/PO/GRN)', included: true },
      { label: 'Vendor Portal', included: true },
      { label: 'Enterprise Hub', included: true },
      { label: 'Custom Branding & SMTP', included: false },
      { label: 'Priority Email Support', included: true },
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: <ShieldRounded sx={{ fontSize: 28 }} />,
    monthlyPrice: null,
    yearlyPrice: null,
    color: '#FFFFFF',
    description: 'Unlimited scale, full customization, and dedicated enterprise support.',
    badge: null,
    features: [
      { label: 'Unlimited Assets', included: true },
      { label: 'Unlimited Users', included: true },
      { label: 'Asset Registry & Tracking', included: true },
      { label: 'Ticket Management', included: true },
      { label: 'Employee Self-Service Portal', included: true },
      { label: 'Email Notifications', included: true },
      { label: 'Full Analytics Suite & Custom Reports', included: true },
      { label: 'Procurement Module (PR/PO/GRN)', included: true },
      { label: 'Vendor Portal', included: true },
      { label: 'Enterprise Hub (Warehouse, Licenses, AMC)', included: true },
      { label: 'Custom Branding & SMTP', included: true },
      { label: '24/7 Dedicated Support + SLA', included: true },
    ]
  }
];

const faqs = [
  {
    q: 'Can I upgrade my plan later?',
    a: 'Yes, you can upgrade or downgrade your plan at any time from your company settings. Upgrades take effect immediately.'
  },
  {
    q: 'Is my data secure?',
    a: 'Each company gets a fully isolated database (physical multi-tenancy). Your data is never shared with or visible to other companies on the platform.'
  },
  {
    q: 'Can I use my own SMTP for emails?',
    a: 'Yes! Professional and Enterprise plans allow you to configure a custom SMTP gateway so all transactional emails are sent from your own domain.'
  },
  {
    q: 'What counts as an "asset"?',
    a: 'Any piece of equipment, device, or inventory item tracked in the system — laptops, servers, projectors, furniture, vehicles, etc.'
  },
  {
    q: 'Do you offer on-premise deployment?',
    a: 'Yes, Enterprise customers can opt for an on-premise Docker deployment. Contact us to discuss your infrastructure requirements.'
  },
];

function PricingCard({ plan, yearly, highlight }) {
  const navigate = useNavigate();
  const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
  const isEnterprise = plan.monthlyPrice === null;
  const isFree = plan.monthlyPrice === 0;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{ height: '100%' }}
    >
      <Paper
        elevation={highlight ? 12 : 2}
        sx={{
          height: '100%',
          borderRadius: '24px',
          border: `1px solid ${highlight ? plan.color : 'rgba(17,24,39,0.12)'}`,
          bgcolor: highlight ? 'rgba(17,24,39,0.12)' : 'rgba(20,20,20,0.75)',
          backdropFilter: 'blur(20px)',
          boxShadow: highlight ? `0 12px 40px rgba(17,24,39,0.2)` : '0 4px 24px rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          p: 4,
        }}
      >
        {highlight && (
          <Box sx={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: `linear-gradient(90deg, transparent, ${plan.color}, transparent)`,
          }} />
        )}
        {plan.badge && (
          <Chip
            label={plan.badge}
            size="small"
            icon={<FlashOnRounded sx={{ fontSize: 12, color: DARK }} />}
            sx={{
              position: 'absolute', top: 24, right: 24,
              bgcolor: ACCENT, color: DARK, fontWeight: 900, fontSize: 11,
              '& .MuiChip-icon': { color: DARK }
            }}
          />
        )}

        {/* Plan Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3.5 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '14px', flexShrink: 0,
            bgcolor: `${plan.color}15`, color: plan.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {plan.icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={900} fontSize={22} sx={{ letterSpacing: '-0.5px', color: '#FFFFFF' }}>{plan.name}</Typography>
            <Typography sx={{ fontSize: 12.5, color: '#9CA3AF', mt: 0.5, lineHeight: 1.3 }}>{plan.description}</Typography>
          </Box>
        </Box>

        {/* Price */}
        <Box sx={{ mb: 4 }}>
          {isEnterprise ? (
            <Box>
              <Typography variant="h3" fontWeight={900} sx={{ color: plan.color, letterSpacing: '-1.5px' }}>
                Custom
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: '#9CA3AF', mt: 0.5 }}>Talk to us for pricing</Typography>
            </Box>
          ) : isFree ? (
            <Box>
              <Typography variant="h3" fontWeight={900} sx={{ color: '#FFFFFF', letterSpacing: '-2px' }}>Free</Typography>
              <Typography sx={{ fontSize: 13, color: '#9CA3AF', mt: 0.5 }}>1st month free · then <strong style={{ color: '#FFFFFF' }}>₹999/month</strong></Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#9CA3AF', mb: 0.8 }}>₹</Typography>
                <Typography variant="h3" fontWeight={900} sx={{ color: '#FFFFFF', letterSpacing: '-2px' }}>999</Typography>
                <Typography sx={{ fontSize: 13, color: '#9CA3AF', mb: 0.8, ml: 0.3 }}>1st month</Typography>
              </Box>
              <Typography sx={{ fontSize: 13, color: '#9CA3AF', mt: 0.3 }}>
                then <strong style={{ color: '#FFFFFF' }}>₹{price?.toLocaleString('en-IN')}</strong> / {yearly ? 'year' : 'month'}
              </Typography>
            </Box>
          )}
          {!isEnterprise && yearly && (
            <Chip label="2 months FREE" size="small" sx={{ bgcolor: 'rgba(22,163,74,0.15)', color: '#4ade80', fontWeight: 800, fontSize: 10.5, mt: 1, border: '1px solid rgba(22,163,74,0.2)' }} />
          )}
        </Box>

        <Divider sx={{ mb: 3.5, borderColor: 'rgba(17,24,39,0.15)' }} />

        {/* Features */}
        <List disablePadding dense sx={{ flex: 1 }}>
          {plan.features.map((feat, i) => (
            <ListItem key={i} disableGutters sx={{ py: 0.6 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                {feat.included
                  ? <CheckRounded sx={{ fontSize: 18, color: '#4ade80' }} />
                  : <CloseRounded sx={{ fontSize: 18, color: 'rgba(17,24,39,0.3)' }} />
                }
              </ListItemIcon>
              <ListItemText
                primary={feat.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: 13.5,
                      fontWeight: feat.included ? 600 : 400,
                      color: feat.included ? '#E0E0E0' : '#4B5563',
                    }
                  }
                }}
              />
            </ListItem>
          ))}
        </List>

        {/* CTA Button */}
        <Button
          id={`pricing-cta-${plan.id}`}
          variant={highlight ? 'contained' : 'outlined'}
          fullWidth
          endIcon={<ArrowForwardRounded />}
          onClick={() => isEnterprise ? navigate('/contact') : navigate('/register-company')}
          sx={{
            mt: 4, py: 1.6, fontWeight: 900, fontSize: 14,
            borderRadius: '14px',
            bgcolor: highlight ? plan.color : 'transparent',
            color: highlight ? DARK : '#FFFFFF',
            borderColor: plan.color,
            '&:hover': {
              bgcolor: highlight ? '#E5E7EB' : `${plan.color}18`,
              borderColor: plan.color,
            }
          }}
        >
          {isEnterprise ? 'Contact Sales' : 'Get Started Free'}
        </Button>
      </Paper>
    </motion.div>
  );
}

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <Paper
      onClick={() => setOpen(o => !o)}
      sx={{
        p: 3, borderRadius: '16px', border: '1px solid rgba(17,24,39,0.15)',
        bgcolor: 'rgba(20,20,20,0.75)',
        backdropFilter: 'blur(12px)',
        cursor: 'pointer', mb: 2,
        '&:hover': { borderColor: ACCENT, bgcolor: 'rgba(17,24,39,0.1)' },
        transition: 'all 0.2s ease'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={800} fontSize={15.5} sx={{ color: '#FFFFFF' }}>{faq.q}</Typography>
        <Typography fontSize={22} fontWeight={700} sx={{ color: ACCENT, ml: 2, flexShrink: 0 }}>{open ? '−' : '+'}</Typography>
      </Box>
      {open && (
        <Typography sx={{ mt: 2, fontSize: 14, color: '#9CA3AF', lineHeight: 1.7 }}>{faq.a}</Typography>
      )}
    </Paper>
  );
}

export default function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <Box sx={{ bgcolor: '#0B0D12', minHeight: '100vh', backgroundImage: 'radial-gradient(ellipse at 15% 0%, rgba(17,24,39,0.18) 0%, transparent 50%), radial-gradient(ellipse at 85% 100%, rgba(17,24,39,0.12) 0%, transparent 50%)' }}>
      {/* Hero */}
      <Box sx={{ pt: { xs: 10, md: 14 }, pb: 8, textAlign: 'center', px: 2 }}>
        <Chip
          label="Simple, Transparent Pricing"
          icon={<FlashOnRounded sx={{ fontSize: 14, color: ACCENT }} />}
          sx={{ bgcolor: `${ACCENT}15`, color: ACCENT, fontWeight: 700, mb: 3, px: 1 }}
        />
        <Typography
          variant="h2"
          fontWeight={900}
          letterSpacing="-2px"
          sx={{ mb: 2, fontSize: { xs: 36, md: 56 }, color: '#FFFFFF' }}
        >
          The right plan for<br />
          <Box component="span" sx={{ color: ACCENT }}>your business</Box>
        </Typography>
        <Typography
          sx={{ color: '#9CA3AF', fontSize: 18, maxWidth: 540, mx: 'auto', lineHeight: 1.7, mb: 4 }}
        >
          Start free, scale as you grow. No hidden fees. Cancel anytime.
          Every plan includes physical database isolation for your company's data.
        </Typography>

        {/* Billing Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Typography fontWeight={700} sx={{ color: !yearly ? '#FFFFFF' : '#9CA3AF' }}>Monthly</Typography>
          <Switch
            id="billing-toggle"
            checked={yearly}
            onChange={e => setYearly(e.target.checked)}
            sx={{
              '& .MuiSwitch-thumb': { bgcolor: yearly ? ACCENT : '#9CA3AF' },
              '& .MuiSwitch-track': { bgcolor: yearly ? `${ACCENT}60` : 'rgba(17,24,39,0.25) !important' }
            }}
          />
          <Typography fontWeight={700} sx={{ color: yearly ? '#FFFFFF' : '#9CA3AF', display: 'flex', alignItems: 'center', gap: 1 }}>
            Annual
            <Chip label="Save 17%" size="small" sx={{ bgcolor: 'rgba(74,222,128,0.12)', color: '#4ade80', fontWeight: 700, fontSize: 10, border: '1px solid rgba(74,222,128,0.25)' }} />
          </Typography>
        </Box>
      </Box>

      {/* Pricing Cards */}
      <Box sx={{ px: { xs: 2, md: 6, lg: 10 }, pb: 10 }}>
        <Grid container spacing={3} alignItems="stretch">
          {plans.map(plan => (
            <Grid key={plan.id} size={{ xs: 12, md: 4 }}>
              <PricingCard plan={plan} yearly={yearly} highlight={plan.id === 'pro'} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Feature comparison note */}
      <Box sx={{ textAlign: 'center', pb: 6, px: 2 }}>
        <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>
          All plans include multi-tenancy isolation, SSL security, and automatic daily backups.
        </Typography>
      </Box>

      {/* Trust Bar */}
      <Box sx={{ borderTop: '1px solid rgba(17,24,39,0.2)', borderBottom: '1px solid rgba(17,24,39,0.2)', py: 7, px: { xs: 2, md: 8 }, background: 'rgba(17,24,39,0.08)' }}>
        <Grid container spacing={4} justifyContent="center" textAlign="center">
          {[
            { stat: '99.9%', label: 'Uptime SLA' },
            { stat: '< 2s', label: 'Page Load Time' },
            { stat: 'ISO 27001', label: 'Security Standard' },
            { stat: '24/7', label: 'Enterprise Support' },
          ].map(({ stat, label }) => (
            <Grid key={label} size={{ xs: 6, md: 3 }}>
              <Typography variant="h4" fontWeight={900} sx={{ color: ACCENT, letterSpacing: '-1px' }}>{stat}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, mt: 0.5 }}>{label}</Typography>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* FAQ */}
      <Box sx={{ px: { xs: 2, md: 8, lg: 16 }, pt: 10, pb: 12 }}>
        <Typography variant="h4" fontWeight={900} sx={{ color: '#FFFFFF', letterSpacing: '-1px', textAlign: 'center', mb: 1 }}>
          Frequently Asked Questions
        </Typography>
        <Typography sx={{ color: '#9CA3AF', textAlign: 'center', mb: 5, fontSize: 15 }}>
          Can't find what you're looking for? <Box component="span" sx={{ color: ACCENT, fontWeight: 700, cursor: 'pointer' }}>Contact us</Box>
        </Typography>
        {faqs.map((faq, i) => <FAQItem key={i} faq={faq} />)}
      </Box>

      {/* CTA Banner */}
      <Box sx={{
        mx: { xs: 2, md: 8, lg: 12 }, mb: 10,
        p: { xs: 4, md: 6 }, borderRadius: 4,
        background: `linear-gradient(135deg, ${ACCENT}18 0%, ${ACCENT}06 100%)`,
        border: `1px solid ${ACCENT}30`,
        textAlign: 'center'
      }}>
        <Typography variant="h4" fontWeight={900} letterSpacing="-1px" sx={{ mb: 1, color: '#FFFFFF' }}>
          Ready to take control of your assets?
        </Typography>
        <Typography sx={{ color: '#9CA3AF', fontSize: 15, mb: 4 }}>
          Set up your company in under 2 minutes. No credit card required.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            id="pricing-register-btn"
            variant="contained"
            size="large"
            endIcon={<ArrowForwardRounded />}
            href="/register-company"
            sx={{
              background: '#111827', color: '#FFFFFF', fontWeight: 900,
              px: 4, py: 1.5, borderRadius: '12px', fontSize: 15,
              boxShadow: '0 4px 16px rgba(17,24,39,0.4)',
              '&:hover': { background: '#1F2937', boxShadow: '0 6px 24px rgba(17,24,39,0.55)' }
            }}
          >
            Start Free Trial
          </Button>
          <Button
            id="pricing-contact-btn"
            variant="outlined"
            size="large"
            href="/contact"
            sx={{
              borderColor: `${ACCENT}50`, color: ACCENT, fontWeight: 700,
              px: 4, py: 1.5, borderRadius: '12px', fontSize: 15,
              '&:hover': { borderColor: ACCENT, bgcolor: `${ACCENT}10` }
            }}
          >
            Talk to Sales
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
