const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Invoice = require('../models/Invoice');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const Coupon = require('../models/Coupon');
const billingConfig = require('../config/billingConfig');
const planService = require('../services/planService');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
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
  const stripped = planName.toString().replace(/\s*\(\+?\d+.*?\)\s*/g, '').trim().toLowerCase();
  if (PLAN_TIER_RANK[stripped]) return PLAN_TIER_RANK[stripped];
  if (stripped.includes('large') || stripped.includes('enterprise')) return 3;
  if (stripped.includes('msme') || stripped.includes('pro')) return 2;
  if (stripped.includes('home') || stripped.includes('basic')) return 1;
  return 0;
};

const assertNoDowngrade = (tenant, selectedPlanName) => {
  if (!tenant || tenant.subscriptionStatus !== 'Active') return;
  const currentRank = getPlanRank(tenant.plan);
  const targetRank = getPlanRank(selectedPlanName);
  if (currentRank > 0 && targetRank > 0 && targetRank < currentRank) {
    throw new Error('Downgrade is not supported during an active subscription period. Please contact support.');
  }
};

// Utility to calculate billing math using dynamic DB plans, DB coupons (with config fallback) and prorated upgrade adjustments
const computeBilling = async (planKey, couponCode, customerState, tenant = null, addonAssets = 0) => {
  const plan = await planService.getPlanByKey(planKey);
  if (!plan) throw new Error('Invalid plan selected');

  const r2 = (n) => Math.round(n * 100) / 100;
  let baseAmount = plan.price;

  // Add-On Assets calculation if specified
  const numAddons = Math.max(0, Number(addonAssets || 0));
  let addonCost = 0;
  let unitPrice = 49;
  if (numAddons > 0) {
    const GlobalSetting = require('../models/GlobalSetting');
    const globalSetting = await GlobalSetting.findOne({ key: 'platform_settings' }).catch(() => null);
    unitPrice = Number(globalSetting?.addonAssetPrice || tenant?.addonAssetPrice || 49);
    addonCost = r2(numAddons * unitPrice);
    baseAmount = r2(baseAmount + addonCost);
  }

  // Check if custom quote is active and within 7-day validity window
  const isQuoteActive = Boolean(
    tenant &&
    tenant.customPrice &&
    tenant.customPrice > 0 &&
    (!tenant.customQuoteExpiry || new Date(tenant.customQuoteExpiry) > new Date())
  );

  if (isQuoteActive && (plan.isCustom || plan.planKey === 'CUSTOM_PLAN' || planKey === 'CUSTOM_PLAN' || planKey === 'CUSTOM_ENTERPRISE' || plan.name?.toLowerCase().includes('custom'))) {
    baseAmount = Number(tenant.customPrice) + addonCost;
  }
  let prorationCredit = 0;
  let isUpgrade = false;
  let daysRemaining = 0;
  let currentPlanName = tenant?.plan || null;

  // Proration calculation: When tenant is Active and upgrading to a higher tier plan
  if (tenant && tenant.subscriptionStatus === 'Active' && tenant.plan && tenant.planExpiry) {
    const currentRank = getPlanRank(tenant.plan);
    const targetRank = getPlanRank(plan.name);

    if (currentRank > 0 && targetRank > currentRank) {
      isUpgrade = true;
      const now = new Date();
      const expiry = new Date(tenant.planExpiry);
      const msRemaining = expiry.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

      if (daysRemaining > 0) {
        // Find current plan price dynamically
        const currentPlanConfig = await planService.getPlanByKey(tenant.plan);
        const currentPrice = currentPlanConfig ? currentPlanConfig.price : 0;

        if (currentPrice > 0) {
          const dailyRate = currentPrice / 365;
          prorationCredit = r2(dailyRate * daysRemaining);
          // Credit cannot exceed target plan base price
          prorationCredit = Math.min(prorationCredit, baseAmount);
        }
      }
    }
  }

  const adjustedBase = Math.max(0, r2(baseAmount - prorationCredit));
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
    if (coupon.expiryDate) {
      const exp = new Date(coupon.expiryDate);
      if (exp.getHours() === 0 && exp.getMinutes() === 0 && exp.getSeconds() === 0) {
        exp.setHours(23, 59, 59, 999);
      }
      if (exp < now) {
        throw new Error('Coupon has expired');
      }
    }

    if (coupon.minOrderValue && Number(coupon.minOrderValue) > 0 && adjustedBase < Number(coupon.minOrderValue)) {
      throw new Error(`Minimum order value of ₹${Number(coupon.minOrderValue).toLocaleString('en-IN')} required for this coupon`);
    }

    if (coupon.applicablePlans && coupon.applicablePlans.length > 0) {
      const cleanPlans = coupon.applicablePlans.map(p => p.toString().trim().toLowerCase());
      if (!cleanPlans.includes('all')) {
        const planNameClean = (plan.name || '').toString().trim().toLowerCase();
        const planKeyClean = (plan.planKey || '').toString().trim().toLowerCase();
        const matches = cleanPlans.some(p => p === planNameClean || p === planKeyClean || planNameClean.includes(p) || p.includes(planNameClean));
        if (!matches) {
          throw new Error(`Coupon is only valid for: ${coupon.applicablePlans.join(', ')}`);
        }
      }
    }

    if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
      throw new Error('Coupon usage limit has been reached');
    }

    if (coupon.discountType === 'fixed') {
      discountAmount = Number(coupon.discountValue || 0);
    } else if (coupon.discountType === 'percentage') {
      discountAmount = adjustedBase * (Number(coupon.discountValue || 0) / 100);
    }

    // Apply Max Discount Cap universally (for both Fixed and Percentage discounts)
    if (coupon.maxDiscount && Number(coupon.maxDiscount) > 0 && discountAmount > Number(coupon.maxDiscount)) {
      discountAmount = Number(coupon.maxDiscount);
    }

    discountAmount = Math.min(adjustedBase, Math.max(0, discountAmount));
    appliedCoupon = coupon;
  }

  const taxableAmount = r2(Math.max(0, adjustedBase - discountAmount));
  discountAmount = r2(discountAmount);

  let cgst = 0, sgst = 0, igst = 0;
  if (customerState && customerState.toLowerCase() === billingConfig.COMPANY_STATE.toLowerCase()) {
    cgst = r2(taxableAmount * (billingConfig.GST_RATE / 2));
    sgst = r2(taxableAmount * (billingConfig.GST_RATE / 2));
  } else {
    igst = r2(taxableAmount * billingConfig.GST_RATE);
  }

  const totalAmount = r2(taxableAmount + cgst + sgst + igst);

  return {
    plan,
    baseAmount,
    isUpgrade,
    currentPlanName,
    daysRemaining,
    prorationCredit,
    adjustedBase,
    discountAmount,
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalAmount,
    appliedCoupon,
    addonAssets: numAddons,
    addonCost,
    unitPrice
  };
};

/**
 * Idempotent subscription activation helper after verified payment
 */
const activateVerifiedPayment = async ({ invoice, paymentId, signature, gateway = 'Razorpay' }) => {
  // Idempotency check: if invoice is already Paid, return immediately without duplicate processing
  if (invoice.status === 'Paid') {
    return { alreadyPaid: true, invoice };
  }

  let tenant = null;
  try {
    if (mongoose.Types.ObjectId.isValid(invoice.tenantId)) {
      tenant = await Tenant.findById(invoice.tenantId).setOptions({ bypassTenantFilter: true });
    }
  } catch {}
  if (!tenant) {
    tenant = await Tenant.findOne({ slug: invoice.tenantId }).setOptions({ bypassTenantFilter: true });
  }
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

  // If this invoice is for Add-on Assets
  if (invoice.isAddon && invoice.addonAssets > 0) {
    tenant.limits = tenant.limits || {};
    tenant.addonAssets = (Number(tenant.addonAssets) || 0) + Number(invoice.addonAssets);
    if (tenant.limits.maxAssets !== -1 && tenant.limits.maxAssets !== 999999999) {
      tenant.limits.maxAssets = (Number(tenant.limits.maxAssets) || 0) + Number(invoice.addonAssets);
    }
    tenant.markModified('limits');
    await tenant.save();

    await SubscriptionHistory.create({
      tenantId: tenant._id,
      action: 'Addon Assets Purchased',
      previousPlan: tenant.plan || 'None',
      newPlan: tenant.plan || 'None',
      amountPaid: invoice.totalAmount,
      paymentReference: paymentId,
      notes: `${gateway} ${paymentId}: Added +${invoice.addonAssets} Assets (Total Addon: ${tenant.addonAssets}) for Invoice ${invoice.invoiceNumber}`
    });

    return { alreadyPaid: false, invoice, tenant, isAddon: true, addedAssets: invoice.addonAssets };
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

  // Activate Tenant upon successful verified payment
  tenant.subscriptionStatus = 'Active';
  const cleanPlanName = (invoice.planName || 'Home User').replace(/\s*\(\+?\d+.*?\)\s*/g, '').trim();
  tenant.plan = cleanPlanName;
  const { getPlanDefaults } = require('../config/planDefaults');
  const planDefaults = getPlanDefaults(cleanPlanName);
  const dbPlan = await planService.getPlanByKey(cleanPlanName);
  const isCustomPlan = Boolean(dbPlan?.isCustom || cleanPlanName.toLowerCase().includes('custom'));

  tenant.limits = tenant.limits || {};
  const selectedAddons = Number(invoice.addonAssets || 0);
  tenant.addonAssets = selectedAddons;

  if (isCustomPlan && tenant.customQuoteQuotas) {
    tenant.limits.maxAssets = tenant.customQuoteQuotas.maxAssets !== null ? tenant.customQuoteQuotas.maxAssets : -1;
    tenant.limits.maxUsers = tenant.customQuoteQuotas.maxUsers !== null ? tenant.customQuoteQuotas.maxUsers : -1;
    tenant.limits.maxDepartments = tenant.customQuoteQuotas.maxDepartments !== null ? tenant.customQuoteQuotas.maxDepartments : -1;
  } else {
    const baseAssets = dbPlan?.maxAssets !== undefined ? dbPlan.maxAssets : planDefaults.maxAssets;
    tenant.limits.maxAssets = baseAssets === -1 || baseAssets === 999999999 ? -1 : (baseAssets + selectedAddons);
    tenant.limits.maxUsers = dbPlan?.maxUsers !== undefined ? dbPlan.maxUsers : (isCustomPlan ? -1 : planDefaults.maxUsers);
    tenant.limits.maxDepartments = dbPlan?.maxDepartments !== undefined ? dbPlan.maxDepartments : (isCustomPlan ? -1 : (planDefaults.maxDepartments || 2));
  }

  tenant.features = {
    ...(tenant.features || {}),
    ...(isCustomPlan && tenant.customQuoteFeatures ? tenant.customQuoteFeatures : (dbPlan?.featureFlags || planDefaults.features || {}))
  };

  // Payment succeeded: clear quote expiry
  tenant.customQuoteExpiry = null;
  tenant.customQuoteCreatedAt = null;

  // Extend validity: if renewal on active subscription, extend from current planExpiry
  if (action === 'Renewed' && tenant.planExpiry && new Date(tenant.planExpiry) > new Date()) {
    const currentExp = new Date(tenant.planExpiry);
    currentExp.setFullYear(currentExp.getFullYear() + 1);
    tenant.planExpiry = invoice.periodEnd || currentExp;
  } else {
    tenant.planExpiry = invoice.periodEnd || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }

  if (!tenant.licenseKey) {
    tenant.licenseKey = generateLicenseKey(tenant.slug);
  }
  tenant.markModified('limits');
  tenant.markModified('features');
  await tenant.save();

  return { alreadyPaid: false, invoice, tenant };
};

const resolveCheckoutTenant = async (req) => {
  let tokenTenantId = null;
  if (req.headers?.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.decode(token);
      if (decoded && decoded.tenantId && decoded.tenantId !== 'default') {
        tokenTenantId = decoded.tenantId;
      }
    } catch (e) {}
  }

  const possibleSlugs = [
    req.tenantId,
    req.user?.tenantId,
    tokenTenantId,
    req.headers?.['x-tenant-id'],
    req.headers?.['X-Tenant-Id']
  ].filter(s => s && s !== 'default');

  for (const slug of possibleSlugs) {
    try {
      const tenant = await Tenant.findOne({ slug: slug.toString().toLowerCase() }).setOptions({ bypassTenantFilter: true });
      if (tenant) return tenant;
    } catch (e) {}
  }

  // If superadmin, fall back to first active tenant or a virtual tenant for calculations
  if (req.user?.role === 'super_admin') {
    try {
      const firstTenant = await Tenant.findOne({ isActive: true }).setOptions({ bypassTenantFilter: true });
      if (firstTenant) return firstTenant;
    } catch (e) {}
  }

  return null;
};

exports.calculateCheckout = async (req, res) => {
  try {
    console.log('[CALCULATE CHECKOUT REQ]', { body: req.body, tenantId: req.tenantId, userTenant: req.user?.tenantId });
    const { planKey, plan, couponCode, addonAssets } = req.body;
    const selectedPlan = planKey || plan;
    let tenant = await resolveCheckoutTenant(req);
    
    // If still no tenant found, use default virtual tenant context for rate preview
    if (!tenant) {
      tenant = {
        name: 'Platform Organization',
        slug: 'default',
        plan: 'Home User',
        subscriptionStatus: 'Pending Checkout',
        address: { state: 'Maharashtra' },
        addonAssets: 0
      };
    }

    const selectedAddons = addonAssets !== undefined ? Number(addonAssets) : Number(tenant.addonAssets || 0);
    const breakdown = await computeBilling(selectedPlan, couponCode, tenant.address?.state, tenant, selectedAddons);
    assertNoDowngrade(tenant, breakdown.plan.name);

    const Asset = require('../models/Asset');
    let activeAssetCount = 0;
    if (tenant && tenant.slug && tenant.slug !== 'default') {
      activeAssetCount = await Asset.countDocuments({
        tenantId: tenant.slug,
        isDeleted: { $ne: true }
      }).setOptions({ bypassTenantFilter: true });
    }

    const totalCapacity = breakdown.plan.maxAssets === -1 || breakdown.plan.maxAssets >= 999999
      ? -1
      : (breakdown.plan.maxAssets + (breakdown.addonAssets || 0));

    const exceedsActiveAssets = totalCapacity !== -1 && activeAssetCount > totalCapacity;
    const excessAssets = exceedsActiveAssets ? (activeAssetCount - totalCapacity) : 0;
    const minRequiredAddons = breakdown.plan.maxAssets === -1 ? 0 : Math.max(0, activeAssetCount - breakdown.plan.maxAssets);

    res.json({
      plan: breakdown.plan,
      baseAmount: breakdown.baseAmount,
      isUpgrade: breakdown.isUpgrade,
      currentPlanName: breakdown.currentPlanName,
      daysRemaining: breakdown.daysRemaining,
      prorationCredit: breakdown.prorationCredit,
      adjustedBase: breakdown.adjustedBase,
      discountAmount: breakdown.discountAmount,
      taxableAmount: breakdown.taxableAmount,
      cgst: breakdown.cgst,
      sgst: breakdown.sgst,
      igst: breakdown.igst,
      totalAmount: breakdown.totalAmount,
      addonAssets: breakdown.addonAssets,
      addonCost: breakdown.addonCost,
      unitPrice: breakdown.unitPrice,
      activeAssetCount,
      totalCapacity,
      exceedsActiveAssets,
      excessAssets,
      minRequiredAddons
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
    console.log('[CREATE RAZORPAY ORDER REQ]', { body: req.body, tenantId: req.tenantId, userTenant: req.user?.tenantId });
    const { planKey, planName, plan, couponCode, addonAssets } = req.body;
    const selectedPlan = planKey || planName || plan;
    const tenant = await resolveCheckoutTenant(req);
    if (!tenant) return res.status(404).json({ message: 'Tenant organization record not found.' });

    const selectedAddons = addonAssets !== undefined ? Number(addonAssets) : Number(tenant.addonAssets || 0);
    const breakdown = await computeBilling(selectedPlan, couponCode, tenant.address?.state, tenant, selectedAddons);
    assertNoDowngrade(tenant, breakdown.plan.name);

    // Active Asset Safety Check (True-Down Validation)
    const Asset = require('../models/Asset');
    let activeAssetCount = 0;
    if (tenant && tenant.slug && tenant.slug !== 'default') {
      activeAssetCount = await Asset.countDocuments({
        tenantId: tenant.slug,
        isDeleted: { $ne: true }
      }).setOptions({ bypassTenantFilter: true });
    }

    const totalCapacity = breakdown.plan.maxAssets === -1 || breakdown.plan.maxAssets >= 999999
      ? -1
      : (breakdown.plan.maxAssets + (breakdown.addonAssets || 0));

    if (totalCapacity !== -1 && activeAssetCount > totalCapacity) {
      const excess = activeAssetCount - totalCapacity;
      const minAddons = Math.max(0, activeAssetCount - breakdown.plan.maxAssets);
      return res.status(400).json({
        message: `You currently have ${activeAssetCount} active assets. To reduce capacity to ${totalCapacity}, please archive or delete ${excess} unused asset${excess === 1 ? '' : 's'} first, or keep at least +${minAddons} add-ons.`,
        code: 'ACTIVE_ASSETS_EXCEED_CAPACITY',
        activeAssetCount,
        totalCapacity,
        excessAssets: excess,
        minRequiredAddons: minAddons
      });
    }

    const amountInPaise = Math.round(breakdown.totalAmount * 100);
    const invoiceNumber = 'INV-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();

    let periodStart = new Date();
    let periodEnd = new Date();

    // If active and renewing same plan, add 1 full year (365 days) on top of current planExpiry
    if (tenant.subscriptionStatus === 'Active' && tenant.planExpiry && new Date(tenant.planExpiry) > new Date() && !breakdown.isUpgrade) {
      periodStart = new Date(tenant.planExpiry);
      periodEnd = new Date(tenant.planExpiry);
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodStart = new Date();
      periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Create Razorpay Order with authoritative server amount
    const rzpOrder = await razorpayService.createRazorpayOrder({
      amountInPaise,
      currency: 'INR',
      receipt: invoiceNumber,
      notes: {
        tenantId: tenant._id.toString(),
        tenantSlug: tenant.slug,
        planName: breakdown.plan.name,
        couponCode: couponCode || '',
        addonAssets: (breakdown.addonAssets || 0).toString(),
        prorationCredit: breakdown.prorationCredit ? breakdown.prorationCredit.toString() : '0'
      }
    });

    // Create Pending Invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      tenantId: tenant._id,
      planName: breakdown.addonAssets > 0 
        ? `${breakdown.plan.name} (+${breakdown.addonAssets} Add-on Assets)`
        : breakdown.plan.name,
      baseAmount: breakdown.baseAmount,
      prorationCredit: breakdown.prorationCredit || 0,
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
      periodEnd,
      addonAssets: breakdown.addonAssets || 0
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
        isUpgrade: breakdown.isUpgrade,
        currentPlanName: breakdown.currentPlanName,
        daysRemaining: breakdown.daysRemaining,
        prorationCredit: breakdown.prorationCredit,
        adjustedBase: breakdown.adjustedBase,
        discountAmount: breakdown.discountAmount,
        taxableAmount: breakdown.taxableAmount,
        cgst: breakdown.cgst,
        sgst: breakdown.sgst,
        igst: breakdown.igst,
        totalAmount: breakdown.totalAmount,
        addonAssets: breakdown.addonAssets,
        addonCost: breakdown.addonCost,
        unitPrice: breakdown.unitPrice,
        activeAssetCount,
        totalCapacity
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

    const breakdown = await computeBilling(planKey, couponCode, tenant.address?.state, tenant);
    assertNoDowngrade(tenant, breakdown.plan.name);

    if (breakdown.appliedCoupon && breakdown.appliedCoupon._id) {
      await Coupon.findByIdAndUpdate(
        breakdown.appliedCoupon._id,
        { $inc: { usageCount: 1 } },
        { bypassTenantFilter: true }
      ).catch(() => {});
    }

    const invoiceNumber = 'INV-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
    let periodStart = new Date();
    let periodEnd = new Date();

    if (tenant.subscriptionStatus === 'Active' && tenant.planExpiry && new Date(tenant.planExpiry) > new Date() && !breakdown.isUpgrade) {
      periodStart = new Date(tenant.planExpiry);
      periodEnd = new Date(tenant.planExpiry);
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodStart = new Date();
      periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      tenantId: tenant._id,
      planName: breakdown.plan.name,
      baseAmount: breakdown.baseAmount,
      prorationCredit: breakdown.prorationCredit || 0,
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

exports.getPublicPlans = async (req, res) => {
  try {
    const plans = await planService.getAllPlans();
    let tenant = await resolveCheckoutTenant(req);
    let result = plans.map(p => {
      const pObj = typeof p.toObject === 'function' ? p.toObject() : { ...p };
      const isCustom = Boolean(pObj.isCustom || pObj.planKey === 'CUSTOM_PLAN' || pObj.planKey === 'CUSTOM_ENTERPRISE' || pObj.name?.toLowerCase().includes('custom'));
      
      if (isCustom) {
        pObj.isCustom = true;
        pObj.features = [
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
      }

      // Check if custom quote is active and within 7-day validity window
      let isQuoteActive = false;
      let quoteDaysRemaining = null;

      if (tenant && tenant.customPrice && tenant.customPrice > 0) {
        if (!tenant.customQuoteExpiry || new Date(tenant.customQuoteExpiry) > new Date()) {
          isQuoteActive = true;
          if (tenant.customQuoteExpiry) {
            quoteDaysRemaining = Math.max(1, Math.ceil((new Date(tenant.customQuoteExpiry) - new Date()) / (1000 * 60 * 60 * 24)));
          } else {
            // Assign 7-day validity if not already stamped
            tenant.customQuoteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            tenant.save().catch(() => {});
            quoteDaysRemaining = 7;
          }
        } else {
          // Quote expired after 7 days without payment: purge quote
          tenant.customPrice = null;
          tenant.customQuoteExpiry = null;
          tenant.customQuotePlan = null;
          tenant.customQuoteQuotas = null;
          tenant.customQuoteFeatures = null;
          tenant.save().catch(() => {});
        }
      }

      if (isCustom && isQuoteActive) {
        pObj.customQuotedPrice = Number(tenant.customPrice);
        pObj.price = Number(tenant.customPrice);
        pObj.isCustomQuoted = true;
        pObj.quoteDaysRemaining = quoteDaysRemaining;
        pObj.quoteExpiry = tenant.customQuoteExpiry;
      }
      return pObj;
    });

    const hasCustom = result.some(p => p.isCustom || p.planKey === 'CUSTOM_ENTERPRISE' || p.planKey === 'CUSTOM_PLAN' || p.name?.toLowerCase().includes('custom'));
    if (!hasCustom) {
      let isQuoteActive = false;
      let quoteDaysRemaining = null;
      if (tenant && tenant.customPrice && tenant.customPrice > 0 && (!tenant.customQuoteExpiry || new Date(tenant.customQuoteExpiry) > new Date())) {
        isQuoteActive = true;
        quoteDaysRemaining = tenant.customQuoteExpiry
          ? Math.max(1, Math.ceil((new Date(tenant.customQuoteExpiry) - new Date()) / (1000 * 60 * 60 * 24)))
          : 7;
      }
      result.push({
        planKey: 'CUSTOM_ENTERPRISE',
        name: 'Custom Enterprise Plan',
        price: isQuoteActive ? Number(tenant.customPrice) : 0,
        customQuotedPrice: isQuoteActive ? Number(tenant.customPrice) : null,
        isCustomQuoted: isQuoteActive,
        quoteDaysRemaining: isQuoteActive ? quoteDaysRemaining : null,
        quoteExpiry: isQuoteActive ? tenant.customQuoteExpiry : null,
        billingCycle: 'yearly',
        maxAssets: -1,
        maxUsers: -1,
        maxDepartments: -1,
        description: 'Custom tailored plan configured with bespoke quotas and enabled capabilities as per requirement',
        badge: 'Custom Tailored',
        isCustom: true,
        isActive: true,
        order: 4,
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
        ]
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/billing/addon/create-order
exports.createAddonOrder = async (req, res) => {
  try {
    const { additionalAssets, quantity, customerDetails } = req.body;
    const numAssets = Number(quantity || additionalAssets || req.body.numAssets || req.body.addonAssets);
    if (isNaN(numAssets) || numAssets < 1) {
      return res.status(400).json({ message: 'Please specify a valid quantity of additional assets (minimum 1).' });
    }

    const tenant = await Tenant.findOne({ slug: req.tenantId }).setOptions({ bypassTenantFilter: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });

    const GlobalSetting = require('../models/GlobalSetting');
    let globalSetting = await GlobalSetting.findOne({ key: 'platform_settings' });
    if (!globalSetting) {
      globalSetting = { allowAddonAssets: true, addonAssetPrice: 49 };
    }

    if (globalSetting.allowAddonAssets === false) {
      return res.status(403).json({ message: 'Add-on asset purchase is currently disabled by administrator.' });
    }

    if (tenant.allowAddonAssets === false) {
      return res.status(403).json({ message: 'Add-on asset purchase is currently disabled for this organization.' });
    }

    const unitPrice = Number(globalSetting.addonAssetPrice) || Number(tenant.addonAssetPrice) || 49;
    const r2 = (n) => Math.round(n * 100) / 100;

    // Co-Terminus & Pro-Rata Calculation based on remaining days of active subscription
    const now = new Date();
    let daysRemaining = 365;
    let periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    if (tenant.planExpiry && new Date(tenant.planExpiry) > now) {
      periodEnd = new Date(tenant.planExpiry);
      daysRemaining = Math.max(1, Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)));
    }

    // Pro-rata multiplier (capped between ~1 day minimum and 1.0 full year)
    const proratedFraction = Math.min(1, Math.max(0.01, daysRemaining / 365));
    const annualBase = numAssets * unitPrice;
    const baseAmount = r2(annualBase * proratedFraction);

    const customerState = (customerDetails?.state || tenant.address?.state || '').trim();
    const isRajasthan = customerState.toLowerCase() === 'rajasthan' || customerState.toLowerCase().includes('raj');
    
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isRajasthan) {
      cgst = r2(baseAmount * 0.09);
      sgst = r2(baseAmount * 0.09);
    } else {
      igst = r2(baseAmount * 0.18);
    }

    const totalAmount = r2(baseAmount + cgst + sgst + igst);
    const invoiceNumber = 'INV-ADDON-' + Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 900 + 100);

    const invoice = await Invoice.create({
      invoiceNumber,
      tenantId: tenant._id,
      planName: `Add-on: +${numAssets} Assets (Pro-Rata ${daysRemaining} Days)`,
      baseAmount,
      discountAmount: 0,
      taxableAmount: baseAmount,
      cgst,
      sgst,
      igst,
      totalAmount,
      status: 'Pending',
      isAddon: true,
      addonAssets: numAssets,
      customerName: customerDetails?.name || tenant.name,
      companyName: customerDetails?.company || tenant.name,
      address: customerDetails?.address || tenant.address?.line || '',
      state: customerState,
      city: customerDetails?.city || tenant.address?.city || '',
      pin: customerDetails?.pin || tenant.address?.pin || '',
      gstin: customerDetails?.gstin || tenant.gstNumber || '',
      periodStart: now,
      periodEnd
    });

    const amountInPaise = Math.round(totalAmount * 100);

    const razorpayOrder = await razorpayService.createRazorpayOrder({
      amountInPaise,
      currency: 'INR',
      receipt: invoiceNumber,
      notes: {
        type: 'addon_assets',
        additionalAssets: numAssets.toString(),
        tenantId: tenant._id.toString(),
        invoiceNumber
      }
    });

    invoice.razorpayOrderId = razorpayOrder.id;
    await invoice.save();

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || 'INR',
      keyId: razorpayService.getKeyId(),
      invoiceNumber,
      addonAssets: numAssets,
      additionalAssets: numAssets,
      unitPrice,
      baseAmount,
      cgst,
      sgst,
      igst,
      totalAmount,
      customerDetails: {
        name: invoice.customerName,
        company: invoice.companyName,
        email: tenant.contactEmail || req.user?.email || '',
        phone: tenant.phone || req.user?.phone || ''
      }
    });
  } catch (error) {
    console.error('createAddonOrder error:', error);
    res.status(500).json({ message: error.message || 'Failed to create add-on purchase order.' });
  }
};


