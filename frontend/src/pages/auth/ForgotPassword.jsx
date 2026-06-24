import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, Alert, CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  EmailOutlined, ArrowBackRounded, LockResetRounded,
  ShieldOutlined, CheckCircleOutlined
} from '@mui/icons-material';
import api from '../../api/axios';

const containerSx = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #1E3A8A 0%, #0F766E 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2
};

const gradientBtn = {
  py: 1.4, fontWeight: 700,
  background: 'linear-gradient(135deg, #1E3A8A, #0F766E)',
  '&:hover': { background: 'linear-gradient(135deg, #1a3278, #0d6b64)' }
};

// ─── OTP Box: 6 individual digit inputs ────────────────────────────────────────
function OtpInput({ value, onChange }) {
  const inputs = useRef([]);

  const handleChange = (idx, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = value.split('');
    arr[idx] = char;
    const next = arr.join('');
    onChange(next);
    if (char && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste) {
      onChange(paste.padEnd(6, '').slice(0, 6));
      inputs.current[Math.min(paste.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  return (
    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', my: 3 }}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <Box
          key={idx}
          component="input"
          ref={el => { inputs.current[idx] = el; }}
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ''}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          sx={{
            width: 48, height: 56,
            textAlign: 'center', fontSize: 24, fontWeight: 800,
            fontFamily: 'monospace', letterSpacing: 0,
            border: '2px solid',
            borderColor: value[idx] ? '#1E3A8A' : '#cbd5e1',
            borderRadius: 2, outline: 'none',
            bgcolor: value[idx] ? '#eef2ff' : '#f8fafc',
            color: '#0f172a',
            transition: 'all 0.15s',
            cursor: 'text',
            '&:focus': { borderColor: '#4f46e5', bgcolor: '#eef2ff', boxShadow: '0 0 0 3px rgba(79,70,229,0.15)' }
          }}
        />
      ))}
    </Box>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
      setOtp('');
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (otp.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      navigate(`/reset-password/${data.resetToken}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={containerSx}>
      <Paper elevation={8} sx={{ p: 4, maxWidth: 440, width: '100%', borderRadius: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: 2, mx: 'auto', mb: 2,
            background: 'linear-gradient(135deg, #1E3A8A, #0F766E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {step === 1
              ? <EmailOutlined sx={{ color: 'white', fontSize: 28 }} />
              : <ShieldOutlined sx={{ color: 'white', fontSize: 28 }} />}
          </Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            {step === 1 ? 'Forgot Password' : 'Enter OTP'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {step === 1
              ? 'Enter your registered email to receive an OTP'
              : `We sent a 6-digit code to ${email}`}
          </Typography>
        </Box>

        {/* Step indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
          {[1, 2, 3].map((s) => (
            <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800,
                bgcolor: step > s ? '#16a34a' : step === s ? '#1E3A8A' : '#e2e8f0',
                color: step >= s ? 'white' : '#94a3b8',
                transition: 'all 0.2s'
              }}>
                {step > s ? <CheckCircleOutlined sx={{ fontSize: 16 }} /> : s}
              </Box>
              {s < 3 && <Box sx={{ width: 32, height: 2, bgcolor: step > s ? '#16a34a' : '#e2e8f0', transition: 'all 0.3s' }} />}
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, px: 0.5 }}>
          {['Email', 'OTP', 'Password'].map((label, i) => (
            <Typography key={label} fontSize={11} fontWeight={700}
              color={step === i + 1 ? '#1E3A8A' : step > i + 1 ? '#16a34a' : '#94a3b8'}
              sx={{ width: 60, textAlign: i === 1 ? 'center' : i === 2 ? 'right' : 'left' }}
            >
              {label}
            </Typography>
          ))}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Step 1: Email input */}
        {step === 1 && (
          <Box component="form" onSubmit={handleSendOtp}>
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth required autoFocus
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined sx={{ color: '#94a3b8', fontSize: 20 }} />
                  </InputAdornment>
                )
              }}
            />
            <Button type="submit" variant="contained" fullWidth disabled={loading} sx={gradientBtn}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Send OTP'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link to="/login" style={{ color: '#1E3A8A', textDecoration: 'none', fontSize: 14 }}>
                ← Back to Login
              </Link>
            </Box>
          </Box>
        )}

        {/* Step 2: OTP input */}
        {step === 2 && (
          <Box component="form" onSubmit={handleVerifyOtp}>
            <OtpInput value={otp} onChange={setOtp} />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || otp.length < 6}
              sx={gradientBtn}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Verify OTP'}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Button
                size="small"
                startIcon={<ArrowBackRounded />}
                onClick={() => { setStep(1); setOtp(''); setError(''); }}
                sx={{ color: '#64748b', fontWeight: 600 }}
              >
                Change email
              </Button>
              <Button
                size="small"
                disabled={resendCooldown > 0 || loading}
                onClick={handleSendOtp}
                sx={{ color: '#1E3A8A', fontWeight: 700 }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
