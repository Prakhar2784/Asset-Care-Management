const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: {
    type: String,
    enum: ['admin', 'employee', 'hod', 'super_admin', 'technician'],
    default: 'employee'
  },
  department: {
    type: String,
    required: true
  },
  tenantId: {
    type: String,
    required: true,
    default: 'default'
  },
  phone:        { type: String },
  employeeId:   { type: String, default: null },
  avatar:       { type: String, default: null },
  onboardingDone: { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  
  // Password reset (token-based, used after OTP verification)
  passwordResetToken: { type: String, default: null },
  passwordResetExpiry: { type: Date, default: null },

  // OTP-based reset (step 1)
  otpHash: { type: String, default: null },
  otpExpiry: { type: Date, default: null },

  lastLogin: { type: Date, default: null },

  // Brute-force protection: consecutive failed logins + lockout window
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },

  // Per-user custom permissions (overrides role defaults when set)
  customPermissions: [{
    feature: { type: String },
    allowed: { type: Boolean }
  }]
}, {
  timestamps: true
});

// Pre-save middleware to hash the password before saving to the DB.
// bcrypt embeds a per-hash random salt; work factor 12 per current OWASP
// guidance. Never MD5/SHA-1. The plaintext is never logged.
const BCRYPT_WORK_FACTOR = 12;
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(BCRYPT_WORK_FACTOR);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with the stored hash. bcrypt.compare is
// constant-time, so it does not leak how much of the hash matched.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Indexes for performance
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ tenantId: 1 });

const User = mongoose.model('User', userSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('User', User);