import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, Alert,
  CircularProgress, InputAdornment, IconButton, Grid
} from '@mui/material';
import {
  LockResetRounded, Visibility, VisibilityOff,
  CheckCircleOutlined, ErrorOutlined, CheckCircleRounded, CancelRounded
} from '@mui/icons-material';
import api from '../../api/axios';

const rules = [
  { key: 'length',    label: '8+ chars',   test: (p) => p.length >= 8 },
  { key: 'upper',     label: 'Uppercase',  test: (p) => /[A-Z]/.test(p) },
  { key: 'lower',     label: 'Lowercase',  test: (p) => /[a-z]/.test(p) },
  { key: 'number',    label: 'Number',     test: (p) => /[0-9]/.test(p) },
  { key: 'symbol',    label: 'Symbol',     test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function ResetPassword() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const isInvite = searchParams.get('invite') === 'true';
  const navigate = useNavigate();

  const [tokenValid, setTokenValid] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const ruleResults = rules.map(r => ({ ...r, passed: r.test(password) }));
  const allRulesPassed = ruleResults.every(r => r.passed);

  useEffect(() => {
    const verify = async () => {
      try {
        await api.get(`/auth/verify-reset-token/${token}`);
        setTokenValid(true);
      } catch {
        setTokenValid(false);
      }
    };
    verify();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allRulesPassed) {
      setError('Please meet all password requirements.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const containerSx = {
    minHeight: '100vh',
    background: "rgba(124,58,237,0.12)",
    display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2
  };

  if (tokenValid === null) {
    return (
      <Box sx={containerSx}>
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (tokenValid === false) {
    return (
      <Box sx={containerSx}>
        <Paper elevation={8} sx={{ p: 4, maxWidth: 440, width: '100%', borderRadius: 3, textAlign: 'center' }}>
          <ErrorOutlined sx={{ fontSize: 56, color: '#dc2626', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Link Expired or Invalid
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This password reset link is invalid or has expired. Please request a new one.
          </Typography>
          <Button component={Link} to="/forgot-password" variant="contained" fullWidth
            sx={{ background: "rgba(124,58,237,0.12)", color: '#A855F7', fontWeight: 700, py: 1.4, '&:hover': { background: '#222222' } }}>
            Request New Link
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={containerSx}>
      <Paper elevation={8} sx={{ p: 4, maxWidth: 460, width: '100%', borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: 2, mx: 'auto', mb: 2,
            background: "rgba(124,58,237,0.12)",
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <LockResetRounded sx={{ color: '#A855F7', fontSize: 28 }} />
          </Box>
          <Typography variant="h5" fontWeight={700}>{isInvite ? 'Activate Your Account' : 'Reset Password'}</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {isInvite ? 'Set a password to activate your AssetCare Pro account' : 'Choose a new secure password'}
          </Typography>
        </Box>

        {success ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleOutlined sx={{ fontSize: 56, color: '#16a34a', mb: 2 }} />
            <Typography variant="h6" fontWeight={600} gutterBottom>{isInvite ? 'Account Activated!' : 'Password Reset!'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {isInvite ? 'Your account is ready. Redirecting to login...' : 'Your password has been updated. A confirmation email has been sent. Redirecting to login...'}
            </Typography>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TextField
              label="New Password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth required autoFocus
              sx={{ mb: 1.5 }}
              slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPass(!showPass)} edge="end">{showPass ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }}
            />

            {/* Password rules */}
            {password.length > 0 && (
              <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={0.5}>
                  {ruleResults.map(r => (
                    <Grid size={{ xs: 6 }} key={r.key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        {r.passed
                          ? <CheckCircleRounded sx={{ fontSize: 14, color: '#16a34a' }} />
                          : <CancelRounded sx={{ fontSize: 14, color: '#dc2626' }} />
                        }
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: r.passed ? '#16a34a' : '#dc2626' }}>
                          {r.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <TextField
              label="Confirm Password"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              fullWidth required
              sx={{ mb: 3 }}
              error={confirm.length > 0 && password !== confirm}
              helperText={confirm.length > 0 && password !== confirm ? 'Passwords do not match' : ''}
              slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end">{showConfirm ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.4, fontWeight: 700,
                background: "rgba(124,58,237,0.12)", color: '#A855F7',
                '&:hover': { background: '#222222' }
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Set New Password'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
