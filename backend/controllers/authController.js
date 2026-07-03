const crypto = require('crypto');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail, sendOtpEmail, sendPasswordChangedEmail } = require('../services/emailService');

const generateToken = (id, tenantId) => jwt.sign({ id, tenantId }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Registered companies keep their users in per-tenant isolated databases, but
// pre-login requests (login, password reset) carry no tenant context and would
// only ever search the control-plane DB. This helper searches the control-plane
// DB first, then every active tenant's isolated DB, and returns a document
// bound to whichever connection it was found on (so .save()/.constructor
// operations hit the right database).
const findUserAcrossTenants = async (query) => {
  const { getTenantConnection } = require('../config/tenantDb');
  let user = await User.findOne(query).setOptions({ bypassTenantFilter: true });
  if (user) return user;
  const tenants = await Tenant.find({}).select('slug');
  for (const t of tenants) {
    if (!t.slug || t.slug === 'default') continue;
    try {
      const TenantUser = getTenantConnection(t.slug).model('User');
      // bypassTenantFilter: the ambient request context is 'default', which
      // would otherwise inject tenantId='default' into this tenant-DB query
      user = await TenantUser.findOne(query).setOptions({ bypassTenantFilter: true });
      if (user) return user;
    } catch (err) {
      console.error(`[Auth] Cross-tenant user lookup failed for tenant '${t.slug}':`, err.message);
    }
  }
  return null;
};

// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, department, tenantId } = req.body;
    // Check globally to avoid duplicate emails across tenants
    const userExists = await findUserAcrossTenants({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const activeTenantId = tenantId || req.tenantId || 'default';
    const user = await User.create({ name, email, password, role, department, tenantId: activeTenantId });
    if (user) {
      res.status(201).json({
        _id: user._id, name: user.name, email: user.email,
        role: user.role, department: user.department, tenantId: user.tenantId,
        token: generateToken(user._id, user.tenantId)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    // Look up the user globally (control-plane DB + every tenant DB) to
    // identify which tenant they belong to
    const user = await findUserAcrossTenants({ email });
    if (user && (await user.matchPassword(password))) {
      // Deactivated (offboarded / not-yet-activated invite) accounts cannot log in
      if (user.isActive === false) {
        return res.status(403).json({ message: 'This account is deactivated. Contact your administrator, or complete your invite link to activate it.' });
      }
      // Validate role mapping to match selected portal tab
      if (role) {
        const adminRoles = ['admin', 'super_admin', 'hod', 'manager'];
        if (role === 'admin' && !adminRoles.includes(user.role)) {
          return res.status(403).json({ message: 'Access Denied: This portal requires administrator permissions.' });
        }
        if (role === 'employee' && adminRoles.includes(user.role)) {
          return res.status(403).json({ message: 'This account has admin access. Please switch to the Admin Access portal to log in.' });
        }
      }

      // Stamp last login time (fire-and-forget) — via the model the user doc
      // was found on, so it updates the correct tenant database
      user.constructor.findByIdAndUpdate(user._id, { lastLogin: new Date() }).catch(() => {});

      const tenant = await Tenant.findOne({ slug: user.tenantId });

      res.json({
        _id: user._id, name: user.name, email: user.email,
        role: user.role, department: user.department, tenantId: user.tenantId,
        customPermissions: user.customPermissions || [],
        onboardingDone: user.onboardingDone,
        plan: tenant?.plan || 'Basic',
        features: tenant?.features || {},
        token: generateToken(user._id, user.tenantId)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.user.tenantId });
    res.status(200).json({
      ...req.user.toObject(),
      plan: tenant?.plan || 'Basic',
      features: tenant?.features || {},
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/auth/complete-onboarding
const completeOnboarding = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { onboardingDone: true });
    res.status(200).json({ onboardingDone: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/forgot-password  — Step 1: send OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await findUserAcrossTenants({ email });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ message: 'If an account with that email exists, an OTP has been sent.' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    await user.constructor.findByIdAndUpdate(user._id, {
      otpHash,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    await sendOtpEmail(user, otp);

    res.status(200).json({ message: 'OTP sent to your registered email address.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/verify-otp  — Step 2: verify OTP, return a short-lived reset token
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await findUserAcrossTenants({
      email,
      otpHash,
      otpExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please try again.' });
    }

    // OTP is valid — generate a password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await user.constructor.findByIdAndUpdate(user._id, {
      otpHash: null,
      otpExpiry: null,
      passwordResetToken: hashedToken,
      passwordResetExpiry: new Date(Date.now() + 15 * 60 * 1000)
    });

    res.status(200).json({ resetToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await findUserAcrossTenants({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired. Please request a new one.' });
    }

    // Hash password manually (bypassing pre-save hook since we use findByIdAndUpdate)
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    await user.constructor.findByIdAndUpdate(user._id, {
      password: hashed,
      passwordResetToken: null,
      passwordResetExpiry: null,
      // Invited accounts are created deactivated; setting a password activates them
      isActive: true
    });

    sendPasswordChangedEmail(user).catch(err => console.error('[EMAIL] Password changed email failed:', err.message));

    res.status(200).json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/verify-reset-token/:token
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await findUserAcrossTenants({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ valid: false, message: 'Token is invalid or expired' });
    res.status(200).json({ valid: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/register-company
const registerCompany = async (req, res) => {
  try {
    const { companyName, slug, adminName, adminEmail, adminPassword, adminPhone } = req.body;
    
    if (!companyName || !slug || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const Tenant = require('../models/Tenant');
    const Department = require('../models/Department');

    // Check if tenant slug already exists
    const tenantExists = await Tenant.findOne({ slug: slug.toLowerCase() });
    if (tenantExists) {
      return res.status(400).json({ message: 'Company URL / Slug is already in use.' });
    }

    // Check if user already exists globally (emails must be unique across all tenants)
    const userExists = await findUserAcrossTenants({ email: adminEmail });
    if (userExists) {
      return res.status(400).json({ message: 'Admin email already registered.' });
    }

    // Create the Tenant
    const tenant = await Tenant.create({
      name: companyName,
      slug: slug.toLowerCase(),
      plan: 'Basic', // Default to Basic tier
      limits: { maxAssets: 50, maxUsers: 10 }
    });

    // We run User and Department creation in the tenant context so the Mongoose plugin captures it correctly
    const { setTenantId } = require('../middleware/tenantContext');
    
    let adminUser;
    await setTenantId(tenant.slug, async () => {
      // Create default IT department
      const defaultDept = await Department.create({
        name: 'IT',
        code: 'IT',
        hodName: adminName,
        hodEmail: adminEmail,
        hodPhone: adminPhone || '',
        status: 'Active',
        description: 'Information Technology Department',
        tenantId: tenant.slug
      });

      // Create Admin User
      adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        department: defaultDept.name,
        phone: adminPhone || '',
        tenantId: tenant.slug
      });
    });

    res.status(201).json({
      message: 'Company registered successfully!',
      tenant: {
        _id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        limits: tenant.limits
      },
      user: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        department: adminUser.department,
        tenantId: adminUser.tenantId,
        onboardingDone: adminUser.onboardingDone,
        token: generateToken(adminUser._id, tenant.slug)
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/tenant-branding
const getTenantBranding = async (req, res) => {
  try {
    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.findOne({ slug: req.tenantId });
    
    if (!tenant) {
      return res.status(200).json({
        name: 'AssetCare',
        logoUrl: null,
        primaryColor: '#141414',
        secondaryColor: '#CBFA57'
      });
    }

    res.status(200).json({
      name: tenant.name,
      logoUrl: tenant.branding.logoUrl,
      primaryColor: tenant.branding.primaryColor || '#141414',
      secondaryColor: tenant.branding.secondaryColor || '#CBFA57'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  getMe, 
  forgotPassword, 
  verifyOtp, 
  resetPassword, 
  verifyResetToken,
  registerCompany,
  getTenantBranding,
  completeOnboarding
};
