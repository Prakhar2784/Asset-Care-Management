const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail, sendOtpEmail, sendPasswordChangedEmail } = require('../services/emailService');

// ─── Brute-force / timing constants ───────────────────────────────────────────
const GENERIC_LOGIN_ERROR = 'Incorrect email or password.';
const MAX_FAILED_ATTEMPTS = 5;          // lock the account after this many
const LOCK_MINUTES = 15;
const CAPTCHA_AFTER_ATTEMPTS = 3;       // require CAPTCHA from this failure count
// Compared against when the email is unknown, so both branches cost one bcrypt
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer-dummy-password', 12);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Update a user document found via findUserAcrossTenants. Must bypass the
// tenant filter: pre-login requests run in the 'default' context, which would
// otherwise inject tenantId='default' into the query and silently no-op
// against a tenant database.
const updateUserById = (user, updates) =>
  user.constructor.findByIdAndUpdate(user._id, updates, { bypassTenantFilter: true });

// Google reCAPTCHA verification — active only when a secret key is configured.
// Without RECAPTCHA_SECRET_KEY the check is skipped (flag still returned so the
// frontend can show a CAPTCHA once keys are provisioned).
const verifyCaptcha = async (token, ip) => {
  if (!process.env.RECAPTCHA_SECRET_KEY) return true;
  if (!token) return false;
  try {
    const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET_KEY, response: token, remoteip: ip || '' }),
    });
    const data = await resp.json();
    return data.success === true;
  } catch {
    return false;
  }
};

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

// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password, role, captchaToken } = req.body;
    // Look up the user globally (control-plane DB + every tenant DB) to
    // identify which tenant they belong to
    const user = await findUserAcrossTenants({ email });

    // Unknown email: burn one bcrypt comparison anyway so the response time
    // does not distinguish "no such account" from "wrong password"
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ message: GENERIC_LOGIN_ERROR });
    }

    const UserModel = user.constructor; // bound to the user's own tenant DB

    // Account lockout window
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.max(1, Math.ceil((user.lockUntil - Date.now()) / 60000));
      return res.status(429).json({
        message: `Too many failed attempts. Account is locked — try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
        lockedUntil: user.lockUntil,
      });
    }
    // Expired lock: start a fresh window
    if (user.lockUntil) {
      await updateUserById(user, { failedLoginAttempts: 0, lockUntil: null });
      user.failedLoginAttempts = 0;
    }

    // CAPTCHA gate after repeated failures (enforced when keys are configured)
    const captchaRequired = user.failedLoginAttempts >= CAPTCHA_AFTER_ATTEMPTS;
    if (captchaRequired && !(await verifyCaptcha(captchaToken, req.ip))) {
      return res.status(400).json({ message: 'CAPTCHA verification required.', captchaRequired: true });
    }

    if (!(await user.matchPassword(password))) {
      const attempts = user.failedLoginAttempts + 1;
      const updates = { failedLoginAttempts: attempts };
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        updates.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      }
      await updateUserById(user, updates);

      // Progressive delay: each consecutive failure responds a little slower
      await sleep(Math.min(attempts * 400, 3000));

      if (updates.lockUntil) {
        return res.status(429).json({
          message: `Too many failed attempts. Account is locked — try again in ${LOCK_MINUTES} minutes.`,
          lockedUntil: updates.lockUntil,
        });
      }
      return res.status(401).json({
        message: GENERIC_LOGIN_ERROR,
        ...(attempts >= CAPTCHA_AFTER_ATTEMPTS ? { captchaRequired: true } : {}),
      });
    }

    // ── Authenticated beyond this point ──────────────────────────────────────
    // Deactivated (offboarded / not-yet-activated invite) accounts cannot log in
    if (user.isActive === false) {
      return res.status(403).json({ message: 'This account is deactivated. Contact your administrator, or complete your invite link to activate it.' });
    }
    // Validate role mapping to match selected portal tab
    if (role) {
      const allAdminRoles = ['admin', 'super_admin', 'hod', 'manager'];
      if (role === 'hod' && user.role !== 'hod') {
        return res.status(403).json({ message: 'Access Denied: Department Access is for Head of Department accounts only.' });
      }
      if (role === 'admin' && !['admin', 'super_admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: user.role === 'hod' ? 'Please use Department Access to sign in.' : 'Access Denied: This portal requires system administrator permissions.' });
      }
      if (role === 'employee' && allAdminRoles.includes(user.role)) {
        return res.status(403).json({ message: 'This account has elevated access. Please use Department Access or Admin sign-in.' });
      }
    }

    // Stamp last login + clear brute-force counters (fire-and-forget)
    updateUserById(user, { lastLogin: new Date(), failedLoginAttempts: 0, lockUntil: null }).catch(() => {});

    const tenant = await Tenant.findOne({ slug: user.tenantId });

    res.json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, department: user.department, tenantId: user.tenantId,
      customPermissions: user.customPermissions || [],
      onboardingDone: user.onboardingDone,
      avatar: user.avatar || null,
      phone: user.phone || null,
      isActive: user.isActive,
      plan: tenant?.plan || 'Basic',
      features: tenant?.features || {},
      token: generateToken(user._id, user.tenantId)
    });
  } catch (error) {
    console.error('[Auth] Login error:', error.message); // never log credentials
    res.status(500).json({ message: 'Login failed. Please try again.' });
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

    // ANTI-ENUMERATION: respond immediately with one identical message whether
    // or not the account exists. The lookup + OTP + email all happen after the
    // response, so neither the message nor the response time reveals anything.
    res.status(200).json({ message: "If that email is registered, you'll receive a one-time code to reset your password." });

    setImmediate(async () => {
      try {
        const user = await findUserAcrossTenants({ email });
        if (!user) return;

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        await updateUserById(user, {
          otpHash,
          otpExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });

        await sendOtpEmail(user, otp);
      } catch (err) {
        console.error('[Auth] Forgot-password background task failed:', err.message);
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Request failed. Please try again.' });
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

    await updateUserById(user, {
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

    // Defense-in-depth: the Zod schema enforces the full policy before this runs
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
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
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);

    await updateUserById(user, {
      password: hashed,
      passwordResetToken: null,
      passwordResetExpiry: null,
      // Invited accounts are created deactivated; setting a password activates them
      isActive: true,
      // A successful reset also clears any brute-force lockout
      failedLoginAttempts: 0,
      lockUntil: null
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
        avatar: null,
        phone: adminUser.phone || null,
        isActive: true,
        customPermissions: [],
        plan: tenant.plan || 'Basic',
        features: tenant.features || {},
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
