// backend/models/RegistrationOtp.js
const mongoose = require('mongoose');

const registrationOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    default: null,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  }
}, { timestamps: true });

module.exports = mongoose.model('RegistrationOtp', registrationOtpSchema);
