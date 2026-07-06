import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';

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
    .auth-wrapper {
      min-height: 100vh;
      padding: 120px 24px 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0B0D12;
      background-attachment: fixed;
      font-family: 'Inter', sans-serif;
      width: 100%;
    }

    .auth-container {
      display: flex;
      width: 100%;
      max-width: 1200px;
      background: rgba(255, 255, 255, 0.70);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(17,24,39,0.18);
      border-radius: 36px;
      box-shadow: 0 30px 70px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      border: 1px solid rgba(17,24,39,0.15);
      color: #ffffff;
    }

    .auth-info {
      flex: 1.2;
      background: linear-gradient(135deg, #111111 0%, #050505 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px;
      position: relative;
    }

    .auth-info::before {
      content: '';
      position: absolute;
      top: -10%;
      left: -10%;
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, rgba(17,24,39,0.12) 0%, rgba(0,0,0,0) 70%);
      border: 1px dashed rgba(17,24,39,0.15);
      border-radius: 50%;
    }

    .brand-header {
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 2;
    }

    .brand-logo {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #111827;
      display: grid;
      place-items: center;
      color: #FFFFFF;
    }

    .brand-name {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .info-content {
      max-width: 500px;
      z-index: 2;
      margin: auto 0;
    }

    .info-title {
      font-size: 40px;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 20px;
      background: linear-gradient(90deg, #FFFFFF 0%, #888888 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .info-desc {
      color: #909090;
      line-height: 1.6;
      margin-bottom: 40px;
    }

    .feature-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      backdrop-filter: blur(10px);
      margin-bottom: 16px;
    }

    .feature-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(17,24,39,0.1);
      color: #FFFFFF;
      display: grid;
      place-items: center;
    }

    .feature-details h4 {
      font-size: 16px;
      font-weight: 700;
      margin: 0 0 4px 0;
    }

    .feature-details p {
      font-size: 13px;
      color: #808080;
      margin: 0;
    }

    .auth-form-side {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      background: #090909;
      z-index: 2;
    }

    .form-card {
      width: 100%;
      max-width: 440px;
    }

    .form-title {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
    }

    .form-sub {
      color: #888888;
      font-size: 14px;
      margin-bottom: 30px;
    }

    .input-group {
      position: relative;
      margin-bottom: 20px;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #555555;
      display: flex;
      align-items: center;
    }

    .auth-input {
      width: 100%;
      background: #141414;
      border: 1px solid #222222;
      padding: 14px 14px 14px 44px;
      border-radius: 12px;
      color: #ffffff;
      font-size: 14px;
      transition: all 0.3s;
      outline: none;
    }

    .auth-input:focus {
      border-color: #FFFFFF;
      background: #181818;
      box-shadow: 0 0 0 4px rgba(17,24,39,0.1);
    }

    .input-suffix {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #555555;
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    .input-suffix:hover {
      color: #ffffff;
    }

    .error-banner {
      background: rgba(244,67,54,0.1);
      border: 1px solid rgba(244,67,54,0.2);
      color: #f44336;
      padding: 12px;
      border-radius: 10px;
      font-size: 13px;
      margin-bottom: 20px;
      text-align: center;
    }

    .success-banner {
      background: rgba(76,175,80,0.1);
      border: 1px solid rgba(76,175,80,0.2);
      color: #4caf50;
      padding: 16px;
      border-radius: 12px;
      font-size: 14px;
      margin-bottom: 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .submit-btn {
      width: 100%;
      background: #FBBF24;
      color: #111827;
      font-weight: 700;
      border: none;
      padding: 14px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 15px;
      transition: all 0.3s;
      margin-top: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(17,24,39,0.3);
    }

    .submit-btn:disabled {
      background: #444444;
      color: #888888;
      cursor: not-allowed;
    }

    .auth-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 13px;
      color: #666666;
    }

    .auth-link {
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 600;
    }

    .auth-link:hover {
      text-decoration: underline;
    }

    .pw-rules {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 14px;
      background: rgba(20,20,20,0.65);
      border: 1.5px solid rgba(17,24,39,0.2);
      border-radius: 14px;
      padding: 12px 16px;
      margin-top: 5px;
      margin-bottom: 20px;
    }

    .pw-rule {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
    }

    .pw-rule.pass { color: #16A34A; }
    .pw-rule.fail { color: #DC2626; }

    .pw-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }

    .pw-rule.pass .pw-dot { background: #16A34A; }
    .pw-rule.fail .pw-dot { background: #DC2626; }

    .loading-center {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #090909;
      color: #ffffff;
      font-family: 'Inter', sans-serif;
      flex-direction: column;
      gap: 16px;
    }

    @media (max-width: 900px) {
      .auth-info {
        display: none;
      }
    }
  `;

  if (tokenValid === null) {
    return (
      <div className="loading-center">
        <style>{cssStyles}</style>
        <CircularProgress sx={{ color: '#FBBF24' }} />
        <span style={{ fontWeight: 700, fontSize: '14px', color: '#888888' }}>Verifying security token...</span>
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
            <div className="brand-header">
              <div className="brand-logo">
                <Inventory2Icon />
              </div>
              <span className="brand-name">AssetCare</span>
            </div>
            <div className="info-content">
              <h1 className="info-title">Security Link Expired.</h1>
              <p className="info-desc">
                For security reasons, verification tokens expire quickly. Please request a new recovery link.
              </p>
            </div>
            <div style={{ color: '#444444', fontSize: '12px', zIndex: 2 }}>
              &copy; 2026 AssetCare PaaS. All rights reserved.
            </div>
          </div>

          {/* RIGHT FORM SIDE */}
          <div className="auth-form-side">
            <div className="form-card" style={{ textAlign: 'center' }}>
              <ErrorOutlineRoundedIcon sx={{ fontSize: 56, color: '#dc2626', mb: 2 }} />
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
        <div className="brand-header">
          <div className="brand-logo">
            <Inventory2Icon />
          </div>
          <span className="brand-name">AssetCare</span>
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
              <ShieldOutlinedIcon fontSize="small" />
            </div>
            <div className="feature-details">
              <h4>Password Complexity Rules</h4>
              <p>Corporate guidelines require passwords to have upper, lower, numbers, and symbol characters.</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <LockRoundedIcon fontSize="small" />
            </div>
            <div className="feature-details">
              <h4>Asset Security Shield</h4>
              <p>Strong passwords protect ticket databases, hardware serial records, and HOD workflows.</p>
            </div>
          </div>
        </div>

        <div style={{ color: '#444444', fontSize: '12px', zIndex: 2 }}>
          &copy; 2026 AssetCare PaaS. All rights reserved.
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
              <CheckCircleOutlineRoundedIcon sx={{ fontSize: 40, color: '#4caf50' }} />
              <div>
                <strong>{isInvite ? 'Account Activated!' : 'Password Updated!'}</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#888888" }}>
                  Redirecting to login portal shortly...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <span className="input-icon"><LockRoundedIcon fontSize="small" /></span>
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
                  {showPass ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
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
                <span className="input-icon"><LockRoundedIcon fontSize="small" /></span>
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
                  {showConfirm ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
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
