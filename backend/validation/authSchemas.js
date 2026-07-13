/**
 * backend/validation/authSchemas.js
 *
 * Server-side validation & sanitization for every authentication input.
 * Client-side validation is treated purely as UX — nothing here trusts it.
 */
const { z } = require('zod');

// ─── Sanitizers ────────────────────────────────────────────────────────────────
// Strip HTML tags, angle brackets and control characters from free text.
const stripHtml = (s) =>
  String(s)
    .replace(/<[^>]*>/g, '')          // remove complete tags
    .replace(/[<>]/g, '')             // remove stray angle brackets
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, ' ') // control chars → space
    .replace(/\s+/g, ' ')
    .trim();

// Whitelist for human names / company names: letters (any script), digits,
// spaces and common punctuation. Everything else is rejected, not stripped,
// so the caller knows their input was not silently altered.
const NAME_RE = /^[\p{L}\p{N} .,'&()\-\/]+$/u;

const freeText = (label, min, max) =>
  z.string()
    .transform(stripHtml)
    .pipe(
      z.string()
        .min(min, `${label} must be at least ${min} characters.`)
        .max(max, `${label} must be at most ${max} characters.`)
        .regex(NAME_RE, `${label} contains invalid characters.`)
    );

const email = z.string()
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long.')
  .pipe(z.email('Please enter a valid email address.'));

// Login password: only bound the size — never restrict the charset of an
// existing secret. New-password rules live in newPassword below.
const loginPassword = z.string().min(1, 'Password is required.').max(128, 'Password is too long.');

// New passwords: length-bounded + basic strength (server-enforced, matching
// the strongest client-side rule set so the client can never under-enforce).
const newPassword = z.string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password is too long.')
  .regex(/[a-z]/, 'Password must contain a lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/\d/, 'Password must contain a number.');

const phone = z.string().trim().max(20, 'Phone number is too long.')
  .regex(/^[\d+\-() ]*$/, 'Phone number contains invalid characters.')
  .optional().or(z.literal(''));

// No dots: the slug becomes part of the per-tenant Mongo database name
// (assetcare_<slug>), and Mongo database names cannot contain '.'.
const slug = z.string().trim().toLowerCase()
  .regex(/^[a-z0-9][a-z0-9-]{1,39}$/, 'Slug must be 2–40 chars: lowercase letters, digits, or hyphens.');

// ─── Schemas per endpoint ──────────────────────────────────────────────────────
const loginSchema = z.object({
  email,
  password: loginPassword,
  role: z.enum(['admin', 'employee', 'hod', 'manager', 'technician', 'super_admin']).optional(),
  captchaToken: z.string().max(2048).optional(),
});

const registerCompanySchema = z.object({
  companyName: freeText('Company name', 2, 80),
  slug,
  adminName: freeText('Admin name', 2, 80),
  adminEmail: email,
  adminPassword: newPassword,
  adminPhone: phone,
});

const forgotPasswordSchema = z.object({ email });

const verifyOtpSchema = z.object({
  email,
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be a 6-digit code.'),
});

const resetPasswordSchema = z.object({ password: newPassword });

// ─── Middleware factory ────────────────────────────────────────────────────────
// Replaces req.body with the parsed (sanitized, whitelisted) data on success;
// returns 400 with the first human-readable issue on failure.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body || {});
  if (!result.success) {
    const first = result.error.issues[0];
    return res.status(400).json({ message: first?.message || 'Invalid input.' });
  }
  req.body = result.data;
  next();
};

module.exports = {
  validate,
  loginSchema,
  registerCompanySchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
};
