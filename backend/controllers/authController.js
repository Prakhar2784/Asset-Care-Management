const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail, sendOtpEmail } = require('../services/emailService');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, role, department });
    if (user) {
      res.status(201).json({
        _id: user._id, name: user.name, email: user.email,
        role: user.role, department: user.department,
        token: generateToken(user._id)
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
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id, name: user.name, email: user.email,
        role: user.role, department: user.department,
        token: generateToken(user._id)
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
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/forgot-password  — Step 1: send OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ message: 'If an account with that email exists, an OTP has been sent.' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    await User.findByIdAndUpdate(user._id, {
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

    const user = await User.findOne({
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

    await User.findByIdAndUpdate(user._id, {
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

    const user = await User.findOne({
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

    await User.findByIdAndUpdate(user._id, {
      password: hashed,
      passwordResetToken: null,
      passwordResetExpiry: null
    });

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
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ valid: false, message: 'Token is invalid or expired' });
    res.status(200).json({ valid: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getMe, forgotPassword, verifyOtp, resetPassword, verifyResetToken };
