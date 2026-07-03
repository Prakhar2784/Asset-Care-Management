const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, forgotPassword, verifyOtp, resetPassword, verifyResetToken, registerCompany, getTenantBranding, completeOnboarding } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/register-company', registerCompany);
router.post('/login', loginUser);
router.get('/tenant-branding', getTenantBranding);
router.get('/me', protect, getMe);
router.patch('/complete-onboarding', protect, completeOnboarding);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

module.exports = router;