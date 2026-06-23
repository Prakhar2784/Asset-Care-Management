import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { EmailOutlined, ArrowBackRounded, CheckCircleOutlined } from '@mui/icons-material';
import api from '../../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1E3A8A 0%, #0F766E 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2
    }}>
      <Paper elevation={8} sx={{ p: 4, maxWidth: 440, width: '100%', borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: 2, mx: 'auto', mb: 2,
            background: 'linear-gradient(135deg, #1E3A8A, #0F766E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <EmailOutlined sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Forgot Password
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Enter your email and we'll send you a reset link
          </Typography>
        </Box>

        {sent ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleOutlined sx={{ fontSize: 56, color: '#0F766E', mb: 2 }} />
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Check your inbox
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              If <strong>{email}</strong> is registered, you'll receive a password reset link within a few minutes. The link expires in 15 minutes.
            </Typography>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              startIcon={<ArrowBackRounded />}
              fullWidth
            >
              Back to Login
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              autoFocus
              sx={{ mb: 3 }}
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
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Send Reset Link'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link to="/login" style={{ color: '#1E3A8A', textDecoration: 'none', fontSize: 14 }}>
                ← Back to Login
              </Link>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
