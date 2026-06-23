import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, Alert,
  CircularProgress, InputAdornment, IconButton
} from '@mui/material';
import { LockResetRounded, Visibility, VisibilityOff, CheckCircleOutlined, ErrorOutlined } from '@mui/icons-material';
import api from '../../api/axios';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [tokenValid, setTokenValid] = useState(null); // null=checking, true, false
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
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
    background: 'linear-gradient(135deg, #1E3A8A 0%, #0F766E 100%)',
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
            sx={{ background: 'linear-gradient(135deg, #1E3A8A, #0F766E)', fontWeight: 700, py: 1.4 }}>
            Request New Link
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={containerSx}>
      <Paper elevation={8} sx={{ p: 4, maxWidth: 440, width: '100%', borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: 2, mx: 'auto', mb: 2,
            background: 'linear-gradient(135deg, #1E3A8A, #0F766E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <LockResetRounded sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Typography variant="h5" fontWeight={700}>Reset Password</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Choose a new secure password
          </Typography>
        </Box>

        {success ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleOutlined sx={{ fontSize: 56, color: '#0F766E', mb: 2 }} />
            <Typography variant="h6" fontWeight={600} gutterBottom>Password Reset!</Typography>
            <Typography variant="body2" color="text.secondary">
              Your password has been updated. Redirecting to login...
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
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass(!showPass)} edge="end">
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Confirm Password"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              fullWidth required
              sx={{ mb: 3 }}
              error={confirm.length > 0 && password !== confirm}
              helperText={confirm.length > 0 && password !== confirm ? 'Passwords do not match' : ''}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end">
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.4, fontWeight: 700,
                background: 'linear-gradient(135deg, #1E3A8A, #0F766E)',
                '&:hover': { background: 'linear-gradient(135deg, #1a3278, #0d6b64)' }
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
