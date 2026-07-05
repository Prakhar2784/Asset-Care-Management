const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, forgotPassword, verifyOtp, resetPassword, verifyResetToken, registerCompany, getTenantBranding, completeOnboarding } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate, loginSchema, registerSchema, registerCompanySchema, forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema } = require('../validation/authSchemas');
const { loginLimiter, forgotLimiter, registerLimiter } = require('../middleware/authRateLimiters');

router.post('/register', registerLimiter, validate(registerSchema), registerUser);
router.post('/register-company', registerLimiter, validate(registerCompanySchema), registerCompany);
router.post('/login', loginLimiter, validate(loginSchema), loginUser);
router.get('/tenant-branding', getTenantBranding);
router.get('/me', protect, getMe);
router.patch('/complete-onboarding', protect, completeOnboarding);
router.post('/forgot-password', forgotLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/verify-otp', forgotLimiter, validate(verifyOtpSchema), verifyOtp);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

module.exports = router;
