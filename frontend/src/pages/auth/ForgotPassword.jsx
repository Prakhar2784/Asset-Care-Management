import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';

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
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '24px 0' }}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={el => { inputs.current[idx] = el; }}
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ''}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          style={{
            width: '48px',
            height: '56px',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: '800',
            fontFamily: 'monospace',
            border: '1.5px solid #222222',
            borderRadius: '12px',
            outline: 'none',
            background: '#141414',
            color: '#FFFFFF',
            transition: 'all 0.15s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#FFFFFF';
            e.target.style.background = '#181818';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#222222';
            e.target.style.background = '#141414';
          }}
        />
      ))}
    </div>
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
    <div className="auth-wrapper">
      <div className="auth-container">
        <style>{`
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
            width: 100%;
            max-width: 1200px;
            background: rgba(255, 255, 255, 0.70);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(17,24,39,0.18);
            border-radius: 36px;
            box-shadow: 0 30px 70px rgba(0, 0, 0, 0.5);
            display: flex;
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

        .stepper-container {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          margin-bottom: 30px;
        }

        .step-item {
          display: flex;
          align-items: center;
        }

        .step-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 72px;
        }

        .step-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          transition: all 0.2s;
        }

        .step-circle.done {
          background: #16a34a;
          border: 1px solid #16a34a;
          color: #ffffff;
        }

        .step-circle.active {
          background: #111827;
          border: 1px solid #111827;
          color: #ffffff;
          box-shadow: 0 0 0 4px rgba(17,24,39,0.18);
        }

        .step-circle.upcoming {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          color: #9CA3AF;
        }

        .step-label {
          font-size: 11px;
          font-weight: 700;
        }

        .step-label.active { color: #FBBF24; }
        .step-label.done { color: #4ADE80; }
        .step-label.upcoming { color: #5B5B75; }

        .step-line {
          width: 40px;
          height: 2px;
          margin-bottom: 24px;
          transition: all 0.3s;
        }

        .step-line.done { background: #16a34a; }
        .step-line.upcoming { background: rgba(255,255,255,0.12); }

        @media (max-width: 900px) {
          .auth-info {
            display: none;
          }
        }
      `}</style>

      {/* LEFT DESIGN SIDE */}
      <div className="auth-info">
        <div className="brand-header">
          <div className="brand-logo">
            <Inventory2Icon />
          </div>
          <span className="brand-name">AssetCare</span>
        </div>

        <div className="info-content">
          <h1 className="info-title">Recover Your Workspace Access.</h1>
          <p className="info-desc">
            Verify your identity and configure a secure new password to log back into your tenant organization dashboard partition.
          </p>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <ShieldOutlinedIcon fontSize="small" />
            </div>
            <div className="feature-details">
              <h4>Secure OTP Verification</h4>
              <p>We send a one-time verification code to confirm ownership of your registered email address.</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <LockRoundedIcon fontSize="small" />
            </div>
            <div className="feature-details">
              <h4>Password Protection</h4>
              <p>Ensure your credentials meet organization security strength guidelines to keep records safe.</p>
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
          <h2 className="form-title">{step === 1 ? 'Forgot Password' : 'Verify OTP'}</h2>
          <p className="form-sub">
            {step === 1 
              ? 'Enter your registered email to receive an OTP' 
              : `We sent a 6-digit code to ${email}`}
          </p>

          {/* Step indicator */}
          <div className="stepper-container">
            {['Email', 'OTP', 'Password'].map((label, i) => {
              const s = i + 1;
              const isDone = step > s;
              const isActive = step === s;
              return (
                <div key={label} className="step-item">
                  <div className="step-node">
                    <div className={`step-circle ${isDone ? 'done' : isActive ? 'active' : 'upcoming'}`}>
                      {isDone ? <CheckCircleOutlineRoundedIcon sx={{ fontSize: 16 }} /> : s}
                    </div>
                    <span className={`step-label ${isActive ? 'active' : isDone ? 'done' : 'upcoming'}`}>
                      {label}
                    </span>
                  </div>
                  {s < 3 && (
                    <div className={`step-line ${isDone ? 'done' : 'upcoming'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {error && <div className="error-banner">{error}</div>}

          {/* Step 1: Email Input */}
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <div className="input-group">
                <span className="input-icon"><EmailRoundedIcon fontSize="small" /></span>
                <input
                  type="email"
                  placeholder="Email Address"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step 2: OTP Input */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <OtpInput value={otp} onChange={setOtp} />
              <button type="submit" className="submit-btn" disabled={loading || otp.length < 6}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); setError(''); }}
                  style={{
                    background: 'none', border: 'none', color: '#9CA3AF',
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <ArrowBackRoundedIcon sx={{ fontSize: 14 }} /> Change email
                </button>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleSendOtp}
                  style={{
                    background: 'none', border: 'none', color: resendCooldown > 0 ? '#5B5B75' : '#FBBF24',
                    fontWeight: 700, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
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
