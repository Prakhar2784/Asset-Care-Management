import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  EmailOutlined, ArrowBackRounded,
  ShieldOutlined, CheckCircleOutlined, Inventory2Rounded
} from '@mui/icons-material';
import api from '../../api/axios';

const wrapperSx = {
  minHeight: '100vh',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  p: 3,
  background:
    'radial-gradient(ellipse at 15% 0%, rgba(124,58,237,0.22) 0%, transparent 55%),' +
    'radial-gradient(ellipse at 85% 100%, rgba(168,85,247,0.16) 0%, transparent 55%),' +
    '#080812',
  backgroundAttachment: 'fixed',
};

const cardSx = {
  width: '100%', maxWidth: 460,
  bgcolor: 'rgba(15,10,40,0.70)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(168,85,247,0.18)',
  borderRadius: '32px',
  boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
  p: { xs: 3.5, sm: 5 },
};

const darkInputSx = {
  mb: 3,
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    bgcolor: 'rgba(15,10,40,0.6)',
    color: '#FFFFFF',
    fontWeight: 600,
    '& fieldset': { borderColor: 'rgba(168,85,247,0.25)', borderWidth: '1.5px' },
    '&:hover fieldset': { borderColor: 'rgba(168,85,247,0.4)' },
    '&.Mui-focused fieldset': { borderColor: '#A855F7', boxShadow: '0 0 0 3px rgba(168,85,247,0.15)' },
  },
  '& .MuiInputLabel-root': { color: '#8B8BAA', fontWeight: 600 },
  '& .MuiInputLabel-root.Mui-focused': { color: '#A855F7' },
};

const gradientBtn = {
  py: 1.6, fontWeight: 900, borderRadius: '16px', textTransform: 'none', fontSize: 16,
  background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#FFFFFF',
  boxShadow: '0 14px 28px rgba(0,0,0,0.28)',
  '&:hover': { background: 'linear-gradient(135deg,#6D28D9,#9333EA)', transform: 'translateY(-2px)', boxShadow: '0 20px 36px rgba(0,0,0,0.35)' },
  '&.Mui-disabled': { background: 'rgba(168,85,247,0.25)', color: 'rgba(255,255,255,0.5)' },
  transition: 'all 0.25s ease',
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
            border: '1.5px solid',
            borderColor: value[idx] ? '#A855F7' : 'rgba(168,85,247,0.25)',
            borderRadius: '16px', outline: 'none',
            bgcolor: 'rgba(15,10,40,0.6)',
            color: '#FFFFFF',
            transition: 'all 0.15s',
            cursor: 'text',
            '&:focus': { borderColor: '#A855F7', boxShadow: '0 0 0 3px rgba(168,85,247,0.15)', bgcolor: 'rgba(20,12,50,0.8)' }
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
    <Box sx={wrapperSx}>
      <Box sx={cardSx}>
        {/* Brand mark */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, mb: 4 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '14px', display: 'grid', placeItems: 'center', bgcolor: '#A855F7', boxShadow: '0 14px 28px rgba(168,85,247,0.28)' }}>
            <Inventory2Rounded sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Typography sx={{ color: '#FFFFFF', fontWeight: 900, fontSize: 18, letterSpacing: '-0.4px' }}>AssetCare Pro</Typography>
        </Box>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
          <Box sx={{
            width: 60, height: 60, borderRadius: '18px', mx: 'auto', mb: 2.2,
            background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {step === 1
              ? <EmailOutlined sx={{ color: '#C084FC', fontSize: 28 }} />
              : <ShieldOutlined sx={{ color: '#C084FC', fontSize: 28 }} />}
          </Box>
          <Typography sx={{ fontSize: 26, fontWeight: 950, color: '#FFFFFF', letterSpacing: '-0.6px' }}>
            {step === 1 ? 'Forgot Password' : 'Enter OTP'}
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#8B8BAA', fontWeight: 600, mt: 0.8, lineHeight: 1.5 }}>
            {step === 1
              ? 'Enter your registered email to receive an OTP'
              : `We sent a 6-digit code to ${email}`}
          </Typography>
        </Box>

        {/* Step indicator */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', mb: 4 }}>
          {['Email', 'OTP', 'Password'].map((label, i) => {
            const s = i + 1;
            const isDone = step > s;
            const isActive = step === s;
            return (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', flex: s < 3 ? '0 1 auto' : '0 0 auto' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8, width: 72 }}>
                  <Box sx={{
                    width: 30, height: 30, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800,
                    bgcolor: isDone ? '#16a34a' : isActive ? '#A855F7' : 'rgba(255,255,255,0.06)',
                    border: '1px solid', borderColor: isDone ? '#16a34a' : isActive ? '#A855F7' : 'rgba(255,255,255,0.14)',
                    color: isDone || isActive ? '#fff' : '#8B8BAA',
                    boxShadow: isActive ? '0 0 0 4px rgba(168,85,247,0.18)' : 'none',
                    transition: 'all 0.2s'
                  }}>
                    {isDone ? <CheckCircleOutlined sx={{ fontSize: 16 }} /> : s}
                  </Box>
                  <Typography fontSize={11} fontWeight={700}
                    color={isActive ? '#C084FC' : isDone ? '#4ADE80' : '#5B5B75'}>
                    {label}
                  </Typography>
                </Box>
                {s < 3 && <Box sx={{ width: 40, height: 2, mb: 2.4, bgcolor: isDone ? '#16a34a' : 'rgba(255,255,255,0.12)', transition: 'all 0.3s' }} />}
              </Box>
            );
          })}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

        {/* Step 1: Email input */}
        {step === 1 && (
          <Box component="form" onSubmit={handleSendOtp}>
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth required autoFocus
              sx={darkInputSx}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: '#8B8BAA', fontSize: 20 }} /></InputAdornment> } }}
            />
            <Button type="submit" variant="contained" fullWidth disabled={loading} sx={gradientBtn}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Send OTP'}
            </Button>
            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', mt: 3, pt: 2.5, textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#C084FC', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2.5 }}>
              <Button
                size="small"
                startIcon={<ArrowBackRounded />}
                onClick={() => { setStep(1); setOtp(''); setError(''); }}
                sx={{ color: '#8B8BAA', fontWeight: 700, textTransform: 'none' }}
              >
                Change email
              </Button>
              <Button
                size="small"
                disabled={resendCooldown > 0 || loading}
                onClick={handleSendOtp}
                sx={{ color: '#C084FC', fontWeight: 700, textTransform: 'none', '&.Mui-disabled': { color: '#5B5B75' } }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
