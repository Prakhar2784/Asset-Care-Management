const Tenant = require('../models/Tenant');
const Invoice = require('../models/Invoice');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const Coupon = require('../models/Coupon');
const billingConfig = require('../config/billingConfig');
const crypto = require('crypto');
const { generateLicenseKey } = require('../services/licenseService');
const razorpayService = require('../services/razorpayService');

const PLAN_TIER_RANK = {
  'home user': 1,
  'home_user': 1,
  'home': 1,
  'basic': 1,
  'msme': 2,
  'pro': 2,
  'large scale': 3,
  'large_scale': 3,
  'enterprise': 3,
};

const getPlanRank = (planName) => {
  if (!planName) return 0;
  const clean = planName.toString().trim().toLowerCase();
  return PLAN_TIER_RANK[clean] || 0;
};

const assertNoDowngrade = (tenant, selectedPlanName) => {
  if (!tenant || tenant.subscriptionStatus !== 'Active') return;
  const currentRank = getPlanRank(tenant.plan);
  const targetRank = getPlanRank(selectedPlanName);
  if (currentRank > 0 && targetRank > 0 && targetRank < currentRank) {
    throw new Error('Downgrade is not supported during an active subscription period. Please contact support.');
  }
};

// Utility to calculate billing math using dynamic DB coupons (with config fallback)
const computeBilling = async (planKey, couponCode, customerState) => {
  const cleanKey = (planKey || 'HOME_USER').toString().trim().toUpperCase().replace(/\s+/g, '_');
  const plan = billingConfig.PLANS[cleanKey] || 
               billingConfig.PLANS[planKey] || 
               Object.values(billingConfig.PLANS).find(p => p.name.toLowerCase() === (planKey || '').toString().toLowerCase()) ||
               billingConfig.PLANS.HOME_USER;
  if (!plan) throw new Error('Invalid plan selected');

  const baseAmount = plan.price;
  let discountAmount = 0;
  let appliedCoupon = null;

  if (couponCode && couponCode.trim()) {
    const cleanCode = couponCode.trim().toUpperCase();
    let coupon = await Coupon.findOne({ code: cleanCode }).setOptions({ bypassTenantFilter: true });

    // Fallback to config coupons if not yet saved to DB
    if (!coupon && billingConfig.COUPONS && billingConfig.COUPONS[cleanCode]) {
      const cfg = billingConfig.COUPONS[cleanCode];
      coupon = {
        code: cleanCode,
        discountType: cfg.type,
        discountValue: cfg.value,
        minOrderValue: cfg.minPurchase || 0,
        maxDiscount: null,
        applicablePlans: ['ALL'],
        isActive: cfg.active !== false,
      };
    }

    if (!coupon) {
      throw new Error('Invalid or expired coupon');
    }

    if (!coupon.isActive) {
      throw new Error('Coupon is inactive');
    }

    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      throw new Error('Coupon is not yet active');
    }
    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
      throw new Error('Coupon has expired');
    }

    if (coupon.minOrderValue && baseAmount < coupon.minOrderValue) {
      throw new Error(`Minimum order value of ₹${coupon.minOrderValue} required for this coupon`);
    }

    if (coupon.applicablePlans && coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes('ALL')) {
      if (!coupon.applicablePlans.includes(plan.name)) {
        throw new Error(`Coupon is only valid for: ${coupon.applicablePlans.join(', ')}`);
      }
    }

    if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
      throw new Error('Coupon usage limit has been reached');
    }

    if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    } else if (coupon.discountType === 'percentage') {
      discountAmount = baseAmount * (coupon.discountValue / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    }

    discountAmount = Math.min(baseAmount, Math.max(0, discountAmount));
  appliedCoupon = coupon;
}

// Round monetary values to 2 decimal places to eliminate floating-point artefacts
const r2 = (n) => Math.round(n * 100) / 100;

const taxableAmount = r2(Math.max(0, baseAmount - discountAmount));
discountAmount = r2(discountAmount);

let cgst = 0, sgst = 0, igst = 0;
if (customerState && customerState.toLowerCase() === billingConfig.COMPANY_STATE.toLowerCase()) {
  cgst = r2(taxableAmount * (billingConfig.GST_RATE / 2));
  sgst = r2(taxableAmount * (billingConfig.GST_RATE / 2));
} else {
  igst = r2(taxableAmount * billingConfig.GST_RATE);
}

const totalAmount = r2(taxableAmount + cgst + sgst + igst);

return { plan, baseAmount, discountAmount, taxableAmount, cgst, sgst, igst, totalAmount, appliedCoupon };
};

/**
 * Idempotent subscription activation helper after verified payment
 */
const activateVerifiedPayment = async ({ invoice, paymentId, signature, gateway = 'Razorpay' }) => {
  // Idempotency check: if invoice is already Paid, return immediately without duplicate processing
  if (invoice.status === 'Paid') {
    return { alreadyPaid: true, invoice };
  }

  const tenant = await Tenant.findById(invoice.tenantId).setOptions({ bypassTenantFilter: true });
  if (!tenant) throw new Error('Tenant record not found for invoice');

  // Mark invoice as Paid
  invoice.status = 'Paid';
  invoice.paymentReference = paymentId;
  invoice.razorpayPaymentId = paymentId;
  if (signature) invoice.razorpaySignature = signature;
  await invoice.save();

  // Track coupon usage
  if (invoice.couponCode) {
    await Coupon.findOneAndUpdate(
      { code: invoice.couponCode },
      { $inc: { usageCount: 1 } },
      { bypassTenantFilter: true }
    ).catch(() => {});
  }

  // Determine action (Subscribed, Upgraded, Renewed)
  let action = 'Subscribed';
  const planConfig = Object.values(billingConfig.PLANS).find(p => p.name.toLowerCase() === invoice.planName.toLowerCase()) || billingConfig.PLANS.home;

  if (tenant.subscriptionStatus === 'Active') {
    const currentRank = getPlanRank(tenant.plan);
    const targetRank = getPlanRank(invoice.planName);
    if (currentRank > 0 && targetRank > 0 && targetRank < currentRank) {
      throw new Error('Downgrade is not permitted on an active subscription.');
    }
    if (targetRank > currentRank) {
      action = 'Upgraded';
    } else {
      action = 'Renewed';
    }
  } else if (tenant.subscriptionStatus === 'Expired' || tenant.subscriptionStatus === 'Cancelled') {
    action = 'Renewed';
  }

  // Record Subscription History
  await SubscriptionHistory.create({
    tenantId: tenant._id,
    action,
    previousPlan: tenant.plan || 'None',
    newPlan: invoice.planName,
    amountPaid: invoice.totalAmount,
    paymentReference: paymentId,
    notes: `${gateway} ${paymentId} for Invoice ${invoice.invoiceNumber}`
  });

  // Activate Tenant
  tenant.subscriptionStatus = 'Active';
  tenant.plan = invoice.planName;
  const { getPlanDefaults } = require('../config/planDefaults');
  const planDefaults = getPlanDefaults(invoice.planName);
  tenant.limits = tenant.limits || {};
  tenant.limits.maxAssets = planDefaults.maxAssets;
  tenant.limits.maxUsers = planDefaults.maxUsers;
  tenant.features = planDefaults.features;
  tenant.planExpiry = invoice.periodEnd;
  if (!tenant.licenseKey) {
    tenant.licenseKey = generateLicenseKey(tenant.slug);
  }
  await tenant.save();

  return { alreadyPaid: false, invoice, tenant };
};

exports.calculateCheckout = async (req, res) => {
  try {
    console.log('[CALCULATE CHECKOUT REQ]', { body: req.body, tenantId: req.tenantId });
    const { planKey, couponCode } = req.body;
    const tenant = await Tenant.findOne({ slug: req.tenantId }).setOptions({ bypassTenantFilter: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    const breakdown = await computeBilling(planKey, couponCode, tenant.address?.state);
    assertNoDowngrade(tenant, breakdown.plan.name);

    res.json({
      plan: breakdown.plan,
      baseAmount: breakdown.baseAmount,
      discountAmount: breakdown.discountAmount,
      taxableAmount: breakdown.taxableAmount,
      cgst: breakdown.cgst,
      sgst: breakdown.sgst,
      igst: breakdown.igst,
      totalAmount: breakdown.totalAmount
    });
  } catch (error) {
    console.error('[CALCULATE CHECKOUT ERROR]', error.message);
    res.status(400).json({ message: error.message });
  }
};

/**
 * Creates an authoritative Razorpay order and a pending invoice
 * POST /api/billing/checkout/create-order
 */
exports.createRazorpayOrder = async (req, res) => {
  try {
    console.log('[CREATE RAZORPAY ORDER REQ]', { body: req.body, tenantId: req.tenantId });
    const { planKey, planName, plan, couponCode } = req.body;
    const selectedPlan = planKey || planName || plan;
    const tenant = await Tenant.findOne({ slug: req.tenantId }).setOptions({ bypassTenantFilter: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    const breakdown = await computeBilling(selectedPlan, couponCode, tenant.address?.state);
    assertNoDowngrade(tenant, breakdown.plan.name);
    const amountInPaise = Math.round(breakdown.totalAmount * 100);
    const invoiceNumber = 'INV-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();

    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    // Create Razorpay Order with authoritative server amount
    const rzpOrder = await razorpayService.createRazorpayOrder({
      amountInPaise,
      currency: 'INR',
      receipt: invoiceNumber,
      notes: {
        tenantId: tenant._id.toString(),
        tenantSlug: tenant.slug,
        planName: breakdown.plan.name,
        couponCode: couponCode || ''
      }
    });

    // Create Pending Invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      tenantId: tenant._id,
      planName: breakdown.plan.name,
      baseAmount: breakdown.baseAmount,
      discountAmount: breakdown.discountAmount,
      couponCode: couponCode || null,
      taxableAmount: breakdown.taxableAmount,
      cgst: breakdown.cgst,
      sgst: breakdown.sgst,
      igst: breakdown.igst,
      totalAmount: breakdown.totalAmount,
      status: 'Pending',
      razorpayOrderId: rzpOrder.id,
      currency: rzpOrder.currency || 'INR',
      customerName: tenant.name,
      companyName: tenant.name,
      address: tenant.address?.line,
      state: tenant.address?.state,
      city: tenant.address?.city,
      pin: tenant.address?.pin,
      gstin: tenant.gstNumber,
      periodStart,
      periodEnd
    });

    res.json({
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency || 'INR',
      keyId: razorpayService.getKeyId(),
      invoiceId: invoice._id,
      breakdown: {
        plan: breakdown.plan,
        baseAmount: breakdown.baseAmount,
        discountAmount: breakdown.discountAmount,
        taxableAmount: breakdown.taxableAmount,
        cgst: breakdown.cgst,
        sgst: breakdown.sgst,
        igst: breakdown.igst,
        totalAmount: breakdown.totalAmount
      },
      customer: {
        name: tenant.name,
        email: req.user?.email || '',
        phone: req.user?.phone || tenant.phone || ''
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Verifies Razorpay payment signature and activates subscription
 * POST /api/billing/checkout/verify
 */
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing Razorpay payment parameters.' });
    }

    // Server-side cryptographic signature verification
    const isValid = razorpayService.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValid) {
      await Invoice.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id, status: 'Pending' },
        { status: 'Failed' },
        { bypassTenantFilter: true }
      ).catch(() => {});
      return res.status(400).json({ message: 'Invalid payment signature. Payment verification failed.' });
    }

    // Locate pending invoice for this order
    const invoice = await Invoice.findOne({ razorpayOrderId: razorpay_order_id }).setOptions({ bypassTenantFilter: true });
    if (!invoice) {
      return res.status(404).json({ message: 'Order or invoice record not found.' });
    }

    // Multi-tenant isolation verification
    if (req.tenantId) {
      const tenant = await Tenant.findOne({ slug: req.tenantId }).setOptions({ bypassTenantFilter: true });
      if (!tenant || tenant._id.toString() !== invoice.tenantId.toString()) {
        return res.status(403).json({ message: 'Unauthorized access to order invoice.' });
      }
    }

    const { alreadyPaid, invoice: updatedInvoice } = await activateVerifiedPayment({
      invoice,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      gateway: 'Razorpay'
    });

    res.json({
      success: true,
      message: alreadyPaid ? 'Payment was already verified.' : 'Payment verified and subscription activated successfully!',
      invoiceId: updatedInvoice._id,
      tenantStatus: 'Active'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Webhook handler for Razorpay asynchronous events
 * POST /api/billing/webhook
 */
exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ message: 'Missing x-razorpay-signature header' });
    }

    const isValid = razorpayService.verifyWebhookSignature({
      rawBody: req.rawBody || JSON.stringify(req.body),
      signature
    });

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid webhook signature.' });
    }

    const event = req.body;
    if (event && (event.event === 'payment.captured' || event.event === 'order.paid')) {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (orderId && paymentId) {
        const invoice = await Invoice.findOne({ razorpayOrderId: orderId }).setOptions({ bypassTenantFilter: true });
        if (invoice && invoice.status !== 'Paid') {
          await activateVerifiedPayment({
            invoice,
            paymentId,
            signature: paymentEntity?.signature || null,
            gateway: 'Razorpay Webhook'
          });
        }
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Backward compatibility process checkout
 */
exports.processCheckout = async (req, res) => {
  try {
    const { planKey, couponCode } = req.body;
    const tenant = await Tenant.findOne({ slug: req.tenantId }).setOptions({ bypassTenantFilter: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    const breakdown = await computeBilling(planKey, couponCode, tenant.address?.state);
    assertNoDowngrade(tenant, breakdown.plan.name);

    if (breakdown.appliedCoupon && breakdown.appliedCoupon._id) {
      await Coupon.findByIdAndUpdate(
        breakdown.appliedCoupon._id,
        { $inc: { usageCount: 1 } },
        { bypassTenantFilter: true }
      ).catch(() => {});
    }

    const invoiceNumber = 'INV-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    const invoice = await Invoice.create({
      invoiceNumber,
      tenantId: tenant._id,
      planName: breakdown.plan.name,
      baseAmount: breakdown.baseAmount,
      discountAmount: breakdown.discountAmount,
      couponCode: couponCode || null,
      taxableAmount: breakdown.taxableAmount,
      cgst: breakdown.cgst,
      sgst: breakdown.sgst,
      igst: breakdown.igst,
      totalAmount: breakdown.totalAmount,
      status: 'Paid',
      paymentReference: 'SIMULATED-' + Date.now(),
      customerName: tenant.name,
      companyName: tenant.name,
      address: tenant.address?.line,
      state: tenant.address?.state,
      city: tenant.address?.city,
      pin: tenant.address?.pin,
      gstin: tenant.gstNumber,
      periodStart,
      periodEnd
    });

    let action = 'Subscribed';
    if (tenant.subscriptionStatus === 'Active') {
      if (breakdown.plan.price > billingConfig.PLANS[Object.keys(billingConfig.PLANS).find(k => billingConfig.PLANS[k].name === tenant.plan)]?.price) {
        action = 'Upgraded';
      } else {
        action = 'Renewed';
      }
    } else if (tenant.subscriptionStatus === 'Expired' || tenant.subscriptionStatus === 'Cancelled') {
      action = 'Renewed';
    }

    await SubscriptionHistory.create({
      tenantId: tenant._id,
      action,
      previousPlan: tenant.plan,
      newPlan: breakdown.plan.name,
      amountPaid: breakdown.totalAmount,
      paymentReference: invoice.paymentReference,
      notes: 'Invoice ' + invoiceNumber
    });

    tenant.subscriptionStatus = 'Active';
    tenant.plan = breakdown.plan.name;
    tenant.limits = tenant.limits || {};
    tenant.limits.maxAssets = breakdown.plan.maxAssets;
    tenant.limits.maxUsers = 10;
    tenant.planExpiry = periodEnd;
    if (!tenant.licenseKey) {
      tenant.licenseKey = generateLicenseKey(tenant.slug);
    }
    await tenant.save();

    res.json({ message: 'Subscription successful', invoiceId: invoice._id, tenantStatus: tenant.subscriptionStatus });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.tenantId }).setOptions({ bypassTenantFilter: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    const invoices = await Invoice.find({ tenantId: tenant._id }).setOptions({ bypassTenantFilter: true }).sort({ date: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.tenantId }).setOptions({ bypassTenantFilter: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    tenant.subscriptionStatus = 'Cancelled';
    await tenant.save();

    await SubscriptionHistory.create({
      tenantId: tenant._id,
      action: 'Cancelled',
      previousPlan: tenant.plan,
      newPlan: 'None',
      amountPaid: 0,
      notes: 'User requested cancellation'
    });

    res.json({ message: 'Subscription cancelled successfully. You can use it until it expires.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSubscriptionHistory = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.tenantId }).setOptions({ bypassTenantFilter: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    const history = await SubscriptionHistory.find({ tenantId: tenant._id }).setOptions({ bypassTenantFilter: true }).sort({ date: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.tenantId }).setOptions({ bypassTenantFilter: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: tenant._id }).setOptions({ bypassTenantFilter: true });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

