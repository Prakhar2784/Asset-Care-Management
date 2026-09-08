const { z } = require('zod');

// Reuse existing helpers
const email = z.string().trim().email('Invalid email address.');
const phone = z.string().trim().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits.');
const newPassword = z.string().min(8, 'Password must be at least 8 characters long.').regex(/[a-zA-Z]/, 'Must contain letters.').regex(/[0-9]/, 'Must contain numbers.');
const slug = z.string().trim().regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens.').min(2, 'Slug must be at least 2 characters.');
const freeText = (fieldName, min = 2, max = 255) => z.string().trim().min(min, fieldName + ' must be at least ' + min + ' characters.').max(max, fieldName + ' cannot exceed ' + max + ' characters.');

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required.')
});

const registerCompanySchema = z.object({
  companyName: freeText('Company name', 2, 80),
  slug,
  adminName: freeText('Admin name', 2, 80),
  adminEmail: email,
  adminPassword: newPassword,
  adminPhone: z.string().trim().regex(/^\d{10}$/, 'Phone number must be 10 digits.').optional().nullable().or(z.literal('')),
  customerType: z.enum(['Individual', 'Business']).optional().default('Business'),
  address: z.string().trim().min(2, 'Address is required.').optional().nullable().or(z.literal('')),
  state: z.string().trim().min(2, 'State is required.').optional().nullable().or(z.literal('')),
  city: z.string().trim().min(2, 'City is required.').optional().nullable().or(z.literal('')),
  pinCode: z.string().trim().min(4, 'PIN Code is required.').optional().nullable().or(z.literal('')),
  gstNumber: z.string().trim().optional().nullable().or(z.literal('')),
  licenseKey: z.string().trim().optional().nullable().or(z.literal('')),
  plan: z.string().trim().optional().nullable().or(z.literal('')),
  acceptedTerms: z.boolean().refine(val => val === true, 'You must accept the terms.')
});

const forgotPasswordSchema = z.object({ email });

const verifyOtpSchema = z.object({
  email,
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be a 6-digit code.'),
});

const resetPasswordSchema = z.object({ password: newPassword });

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    const errorList = err.errors || err.issues || [];
    const firstError = errorList[0];
    const message = firstError ? `${firstError.message}` : (err.message || 'Validation failed');
    res.status(400).json({ message, errors: errorList });
  }
};

module.exports = {
  validate,
  loginSchema,
  registerCompanySchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
};