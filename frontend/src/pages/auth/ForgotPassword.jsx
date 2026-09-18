import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';

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
            width: '46px',
            height: '52px',
            textAlign: 'center',
            fontSize: '22px',
            fontWeight: '800',
            fontFamily: 'Poppins, monospace',
            border: '1px solid rgba(119, 119, 199, 0.2)',
            borderRadius: '12px',
            outline: 'none',
            background: '#0B0D17',
            color: '#FFFFFF',
            transition: 'all 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#7777C7';
            e.target.style.boxShadow = '0 0 0 3px rgba(119, 119, 199, 0.15)';
            e.target.style.background = '#0E101D';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(119, 119, 199, 0.2)';
            e.target.style.boxShadow = 'none';
            e.target.style.background = '#0B0D17';
          }}
        />
      ))}
    </div>
  );
}

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
    <>
      <style>{`
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
        }

        .auth-container {
          width: 100%;
          max-width: 1200px;
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.22);
          border-radius: 28px;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7);
          display: flex;
          overflow: hidden;
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
          max-width: 440px;
          z-index: 2;
          margin: 36px 0;
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
          margin: 0;
          font-weight: 400;
        }

        .feature-card {
          margin-top: 36px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.18);
          border-radius: 16px;
          padding: 20px;
          position: relative;
          z-index: 2;
          transition: border-color 0.2s ease;
        }
        .feature-card:hover {
          border-color: rgba(119, 119, 199, 0.35);
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
          padding: 15px 16px 15px 48px;
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

        .stepper-container {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          margin-bottom: 28px;
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
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          transition: all 0.2s;
        }

        .step-circle.done {
          background: #10B981;
          border: 1px solid #10B981;
          color: #ffffff;
        }

        .step-circle.active {
          background: #7777C7;
          border: 1px solid #7777C7;
          color: #0B0C1A;
          box-shadow: 0 0 0 4px rgba(119, 119, 199, 0.2);
        }

        .step-circle.upcoming {
          background: #171B2E;
          border: 1px solid rgba(119, 119, 199, 0.2);
          color: #94A3B8;
        }

        .step-label {
          font-size: 11px;
          font-weight: 700;
        }

        .step-label.active { color: #7777C7; }
        .step-label.done { color: #10B981; }
        .step-label.upcoming { color: #94A3B8; }

        .step-line {
          width: 40px;
          height: 2px;
          margin-bottom: 24px;
          transition: all 0.3s;
        }

        .step-line.done { background: #10B981; }
        .step-line.upcoming { background: rgba(119, 119, 199, 0.2); }

        @media (max-width: 900px) {
          .auth-wrapper { padding: 110px 18px 40px; }
          .auth-container { flex-direction: column; border-radius: 24px; }
          .auth-info { display: none; }
          .auth-form-side { padding: 36px 24px; }
        }
      `}</style>

      <div className="auth-wrapper">
        <div className="auth-container">
          {/* LEFT DESIGN SIDE */}
          <div className="auth-info">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
              <div className="auth-brand-box">
                <img src="/logo_home.png" alt="IAssetCare" style={{ width: 28, height: 28, display: 'block', objectFit: 'contain' }} />
              </div>
              <span style={{ fontFamily: 'Poppins', fontSize: "20px", fontWeight: "900", letterSpacing: "-0.4px", color: "#FFFFFF" }}>IAssetCare</span>
            </div>

            <div className="info-content">
              <h1 className="info-title">Recover Your Workspace Access.</h1>
              <p className="info-desc">
                Verify your identity and configure a secure new password to log back into your organization dashboard partition.
              </p>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <ShieldOutlinedIcon sx={{ fontSize: 20 }} />
                </div>
                <div className="feature-details">
                  <h4>Secure OTP Verification</h4>
                  <p>We send a one-time verification code to confirm ownership of your registered email address.</p>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <LockRoundedIcon sx={{ fontSize: 20 }} />
                </div>
                <div className="feature-details">
                  <h4>Password Protection</h4>
                  <p>Ensure your credentials meet organization security guidelines to keep records safe.</p>
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
                    <span className="input-icon"><EmailRoundedIcon sx={{ fontSize: 20 }} /></span>
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
                        background: 'none', border: 'none', color: '#94A3B8',
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
                        background: 'none', border: 'none', color: resendCooldown > 0 ? '#64748B' : '#7777C7',
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
    </>
  );
}
