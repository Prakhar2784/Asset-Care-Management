import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CircularProgress from '@mui/material/CircularProgress';

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

  const cssStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');

    .auth-wrapper {
      min-height: 100vh;
      padding: 130px 24px 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #0B0D17;
      font-family: 'Poppins', 'Inter', -apple-system, sans-serif;
      color: #FFFFFF;
      width: 100%;
    }

    .auth-container {
      display: flex;
      width: 100%;
      max-width: 1200px;
      background-color: #1E233D;
      border: 1px solid rgba(119, 119, 199, 0.22);
      border-radius: 28px;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7);
      overflow: hidden;
      color: #FFFFFF;
    }

    .auth-info {
      flex: 1;
      background-color: #161B2E;
      border-right: 1px solid rgba(119, 119, 199, 0.18);
      padding: 60px 48px;
      color: #FFFFFF;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }

    .auth-info::before {
      content: '';
      position: absolute;
      top: -80px;
      right: -80px;
      width: 260px;
      height: 260px;
      background: radial-gradient(circle, rgba(119, 119, 199, 0.14), transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    .brand-header {
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 2;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-name {
      font-family: 'Poppins', sans-serif;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.4px;
      color: #FFFFFF;
    }

    .info-content {
      max-width: 500px;
      z-index: 2;
      margin: 40px 0;
    }

    .info-title {
      font-family: 'Poppins', sans-serif;
      font-size: clamp(28px, 3vw, 38px);
      font-weight: 900;
      line-height: 1.2;
      margin-bottom: 16px;
      letter-spacing: -1px;
      color: #FFFFFF;
    }

    .info-desc {
      color: #94A3B8;
      font-size: 15.5px;
      line-height: 1.7;
      margin-bottom: 32px;
      font-weight: 400;
    }

    .feature-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px 20px;
      background-color: #1E233D;
      border: 1px solid rgba(119, 119, 199, 0.18);
      border-radius: 16px;
      margin-bottom: 16px;
    }

    .feature-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background-color: #161B2E;
      color: #7777C7;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .feature-details h4 {
      font-family: 'Poppins', sans-serif;
      font-size: 15px;
      font-weight: 800;
      margin: 0 0 3px 0;
      color: #FFFFFF;
    }

    .feature-details p {
      font-size: 13.5px;
      color: #94A3B8;
      margin: 0;
      line-height: 1.55;
    }

    .auth-form-side {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 48px;
      background-color: #1E233D;
      z-index: 2;
    }

    .form-card {
      width: 100%;
      max-width: 440px;
    }

    .form-title {
      font-family: 'Poppins', sans-serif;
      font-size: 28px;
      font-weight: 900;
      color: #FFFFFF;
      margin-bottom: 8px;
      letter-spacing: -0.8px;
    }

    .form-sub {
      color: #94A3B8;
      font-size: 14.5px;
      margin-bottom: 24px;
      font-weight: 400;
      line-height: 1.6;
    }

    .input-group {
      position: relative;
      margin-bottom: 18px;
    }

    .input-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #7777C7;
      display: flex;
      align-items: center;
    }

    .auth-input {
      width: 100%;
      background-color: #161B2E;
      border: 1px solid rgba(119, 119, 199, 0.22);
      padding: 15px 48px;
      border-radius: 12px;
      color: #FFFFFF;
      font-size: 14.5px;
      font-weight: 500;
      transition: all 0.22s ease;
      outline: none;
      box-sizing: border-box;
      font-family: 'Poppins', 'Inter', sans-serif;
    }

    .auth-input:focus {
      border-color: #7777C7;
      background-color: #1E233D;
      box-shadow: 0 0 0 3px rgba(119, 119, 199, 0.15);
    }

    .input-suffix {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #94A3B8;
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    .input-suffix:hover {
      color: #FFFFFF;
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #F87171;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13.5px;
      margin-bottom: 20px;
      text-align: center;
      font-weight: 600;
    }

    .success-banner {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10B981;
      padding: 16px;
      border-radius: 14px;
      font-size: 14px;
      margin-bottom: 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .submit-btn {
      width: 100%;
      background-color: #7777C7;
      color: #0B0C1A;
      font-family: 'Poppins', sans-serif;
      font-weight: 800;
      border: 1px solid #7777C7;
      padding: 16px;
      border-radius: 9999px;
      cursor: pointer;
      font-size: 15px;
      transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      margin-top: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 6px 20px rgba(119, 119, 199, 0.35);
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(119, 119, 199, 0.5);
      background-color: #6464B8;
      border-color: #6464B8;
      color: #FFFFFF;
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .auth-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 13.5px;
      color: #94A3B8;
    }

    .auth-link {
      color: #7777C7;
      text-decoration: none;
      font-weight: 700;
    }

    .auth-link:hover {
      color: #8C8CE0;
      text-decoration: underline;
    }

    .pw-rules {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 14px;
      background-color: #0B0D17;
      border: 1px solid rgba(119, 119, 199, 0.2);
      border-radius: 12px;
      padding: 12px 16px;
      margin-top: 5px;
      margin-bottom: 20px;
    }

    .pw-rule {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 700;
    }

    .pw-rule.pass { color: #10B981; }
    .pw-rule.fail { color: #F87171; }

    .pw-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }

    .pw-rule.pass .pw-dot { background: #10B981; }
    .pw-rule.fail .pw-dot { background: #F87171; }

    .loading-center {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #0B0D17;
      color: #FFFFFF;
      font-family: 'Poppins', 'Inter', sans-serif;
      flex-direction: column;
      gap: 16px;
    }

    @media (max-width: 900px) {
      .auth-wrapper { padding: 110px 18px 40px; }
      .auth-container { flex-direction: column; border-radius: 24px; }
      .auth-info { display: none; }
      .auth-form-side { padding: 36px 24px; }
    }
  `;

  if (tokenValid === null) {
    return (
      <div className="loading-center">
        <style>{cssStyles}</style>
        <CircularProgress sx={{ color: '#7777C7' }} />
        <span style={{ fontWeight: 700, fontSize: '14px', color: '#94A3B8' }}>Verifying security token...</span>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          <style>{cssStyles}</style>
          {/* LEFT DESIGN SIDE */}
          <div className="auth-info">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
              <div className="auth-brand-box">
                <img src="/logo_home.png" alt="IAssetCare" style={{ width: 28, height: 28, display: 'block', objectFit: 'contain' }} />
              </div>
              <span style={{ fontFamily: 'Poppins', fontSize: "20px", fontWeight: "900", letterSpacing: "-0.4px", color: "#FFFFFF" }}>IAssetCare</span>
            </div>
            <div className="info-content">
              <h1 className="info-title">Security Link Expired.</h1>
              <p className="info-desc">
                For security reasons, verification tokens expire quickly. Please request a new recovery link.
              </p>
            </div>
            <div style={{ color: '#64748B', fontSize: '12px', zIndex: 2 }}>
              &copy; 2026 IAssetCare. All rights reserved.
            </div>
          </div>

          {/* RIGHT FORM SIDE */}
          <div className="auth-form-side">
            <div className="form-card" style={{ textAlign: 'center' }}>
              <ErrorOutlineRoundedIcon sx={{ fontSize: 56, color: '#F87171', mb: 2 }} />
              <h2 className="form-title" style={{ fontSize: '24px' }}>Link Expired or Invalid</h2>
              <p className="form-sub" style={{ marginBottom: '24px' }}>
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link to="/forgot-password" className="submit-btn" style={{ textDecoration: 'none' }}>
                Request New Link
              </Link>
              <div className="auth-footer">
                Back to{' '}
                <Link to="/login" className="auth-link">
                  Log In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <style>{cssStyles}</style>

          {/* LEFT DESIGN SIDE */}
          <div className="auth-info">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
              <div className="auth-brand-box">
                <img src="/logo_home.png" alt="IAssetCare" style={{ width: 28, height: 28, display: 'block', objectFit: 'contain' }} />
              </div>
              <span style={{ fontFamily: 'Poppins', fontSize: "20px", fontWeight: "900", letterSpacing: "-0.4px", color: "#FFFFFF" }}>IAssetCare</span>
            </div>

          <div className="info-content">
            <h1 className="info-title">{isInvite ? 'Configure Your Workspace.' : 'Choose A Strong Password.'}</h1>
            <p className="info-desc">
              {isInvite 
                ? 'Complete your account activation and configure your private login password details.' 
                : 'Setup your new password to restore access to your company assets partition.'}
            </p>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <ShieldOutlinedIcon sx={{ fontSize: 20 }} />
              </div>
              <div className="feature-details">
                <h4>Password Complexity Rules</h4>
                <p>Corporate guidelines require passwords to have upper, lower, numbers, and symbol characters.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <LockRoundedIcon sx={{ fontSize: 20 }} />
              </div>
              <div className="feature-details">
                <h4>Asset Security Shield</h4>
                <p>Strong passwords protect ticket databases, hardware serial records, and HOD workflows.</p>
              </div>
            </div>
          </div>

          <div style={{ color: '#64748B', fontSize: '12px', zIndex: 2 }}>
            &copy; 2026 IAssetCare. All rights reserved.
          </div>
        </div>

        {/* RIGHT FORM SIDE */}
        <div className="auth-form-side">
          <div className="form-card">
            <h2 className="form-title">{isInvite ? 'Activate Account' : 'Reset Password'}</h2>
            <p className="form-sub">
              {isInvite ? 'Set your password to activate your workspace profile' : 'Enter your new secure account password'}
            </p>

            {error && <div className="error-banner">{error}</div>}

            {success ? (
              <div className="success-banner">
                <CheckCircleOutlineRoundedIcon sx={{ fontSize: 40, color: '#10B981' }} />
                <div>
                  <strong style={{ color: '#FFFFFF', fontSize: '16px' }}>{isInvite ? 'Account Activated!' : 'Password Updated!'}</strong>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94A3B8" }}>
                    Redirecting to login portal shortly...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <span className="input-icon"><LockRoundedIcon sx={{ fontSize: 20 }} /></span>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="New Password"
                    className="auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <span 
                    className="input-suffix"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                  </span>
                </div>

                {/* Password rules */}
                {password.length > 0 && (
                  <div className="pw-rules">
                    {ruleResults.map(r => (
                      <div key={r.key} className={`pw-rule ${r.passed ? 'pass' : 'fail'}`}>
                        <span className="pw-dot" />
                        {r.label}
                      </div>
                    ))}
                  </div>
                )}

                <div className="input-group">
                  <span className="input-icon"><LockRoundedIcon sx={{ fontSize: 20 }} /></span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm Password"
                    className="auth-input"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                  <span 
                    className="input-suffix"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                  </span>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Processing...' : isInvite ? 'Set Password & Activate' : 'Set New Password'}
                </button>
              </form>
            )}

            <div className="auth-footer">
              Back to{' '}
              <Link to="/login" className="auth-link">
                Log In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
