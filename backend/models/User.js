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
    enum: ['admin', 'employee', 'hod', 'vendor', 'it_support', 'super_admin'],
    default: 'employee'
  },
  department: {
    type: String,
    required: true
  },
  phone: { type: String },
  isActive: { type: Boolean, default: true },

  // Password reset (token-based, used after OTP verification)
  passwordResetToken: { type: String, default: null },
  passwordResetExpiry: { type: Date, default: null },

  // OTP-based reset (step 1)
  otpHash: { type: String, default: null },
  otpExpiry: { type: Date, default: null }
}, {
  timestamps: true
});

// Pre-save middleware to hash the password before saving to the DB
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with the hashed password in the DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);