import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import LocationCityRoundedIcon from "@mui/icons-material/LocationCityRounded";
import PinDropRoundedIcon from "@mui/icons-material/PinDropRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

const RegisterCompany = () => {
  const navigate = useNavigate();
  
  // Form State
  const [formData, setFormData] = useState({
    companyName: "",
    slug: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    adminPhone: "",
    customerType: "Business",
    address: "",
    state: "",
    city: "",
    pinCode: "",
    gstNumber: "",
    licenseKey: "",
    plan: "Home User",
    acceptedTerms: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Check if first-run setup is required
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const { data } = await api.get("/auth/setup-status");
        if (data.needsSetup) {
          setIsFirstTime(true);
        }
      } catch (err) {
        console.error("Failed to check setup status:", err);
      }
    };
    checkSetupStatus();
  }, []);

  const pwRules = [
    { label: '8+ chars',  pass: formData.adminPassword.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(formData.adminPassword) },
    { label: 'Lowercase', pass: /[a-z]/.test(formData.adminPassword) },
    { label: 'Number',    pass: /[0-9]/.test(formData.adminPassword) },
    { label: 'Symbol',    pass: /[^A-Za-z0-9]/.test(formData.adminPassword) },
  ];

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === "slug") {
      value = value.toLowerCase().replace(/[^a-z0-9.-]/g, "");
    }
    if (name === "adminPhone") {
      value = value.replace(/[^0-9]/g, '').slice(0, 10);
    }
    if (name === "pinCode") {
      value = value.replace(/[^0-9]/g, '').slice(0, 6);
    }
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.acceptedTerms) {
      setError("Please accept the Terms and Conditions to proceed.");
      return;
    }

    if (!pwRules.every(r => r.pass)) {
      setError("Password must be 8+ chars with uppercase, lowercase, number, and symbol.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register-company", formData);
      setSuccess(true);
      setLoading(false);
      
      const { user } = response.data;
      localStorage.setItem("assetcare_user", JSON.stringify(user));

      setTimeout(() => {
        navigate(`/onboarding`);
        window.location.reload();
      }, 1800);
      
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Registration failed. Please check your inputs.");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <style>{`
          .auth-wrapper {
            min-height: 100vh;
            padding: 100px 20px 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0B0D12;
            background-attachment: fixed;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            width: 100%;
          }

          .auth-container {
            width: 100%;
            max-width: 1240px;
            background: rgba(18, 20, 29, 0.85);
            backdrop-filter: blur(28px);
            -webkit-backdrop-filter: blur(28px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 32px;
            box-shadow: 0 35px 80px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(255, 255, 255, 0.05);
            display: flex;
            overflow: hidden;
            color: #ffffff;
          }

          .auth-info {
            flex: 1;
            background: linear-gradient(160deg, #131722 0%, #090B10 100%);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 56px 48px;
            position: relative;
            border-right: 1px solid rgba(255, 255, 255, 0.06);
          }

          .auth-info::before {
            content: '';
            position: absolute;
            top: -15%;
            left: -15%;
            width: 450px;
            height: 450px;
            background: radial-gradient(circle, rgba(251, 191, 36, 0.08) 0%, rgba(0,0,0,0) 70%);
            border-radius: 50%;
            pointer-events: none;
          }

          .brand-header {
            display: flex;
            align-items: center;
            gap: 14px;
            z-index: 2;
          }

          .brand-logo {
            width: 46px;
            height: 46px;
            border-radius: 14px;
            background: linear-gradient(135deg, #1E2433 0%, #111520 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: grid;
            place-items: center;
            color: #FBBF24;
            box-shadow: 0 8px 20px rgba(0,0,0,0.3);
          }

          .brand-name {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #FFFFFF;
          }

          .info-content {
            max-width: 480px;
            z-index: 2;
            margin: 40px 0;
            position: sticky;
            top: 130px;
          }

          .badge-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(251, 191, 36, 0.12);
            border: 1px solid rgba(251, 191, 36, 0.25);
            color: #FBBF24;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 20px;
            letter-spacing: 0.3px;
          }

          .info-title {
            font-size: 36px;
            font-weight: 800;
            line-height: 1.25;
            margin-bottom: 16px;
            background: linear-gradient(135deg, #FFFFFF 30%, #A1A1AA 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.8px;
          }

          .info-desc {
            color: #9CA3AF;
            line-height: 1.65;
            font-size: 14.5px;
            margin-bottom: 32px;
          }

          .feature-card {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            padding: 18px 20px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 18px;
            backdrop-filter: blur(12px);
            margin-bottom: 14px;
            transition: all 0.25s ease;
          }

          .feature-card:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(251, 191, 36, 0.25);
            transform: translateY(-2px);
          }

          .feature-icon-wrapper {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            background: rgba(251, 191, 36, 0.1);
            color: #FBBF24;
            display: grid;
            place-items: center;
            flex-shrink: 0;
          }

          .feature-details h4 {
            font-size: 15px;
            font-weight: 700;
            color: #FFFFFF;
            margin: 0 0 4px 0;
          }

          .feature-details p {
            font-size: 13px;
            color: #88909E;
            margin: 0;
            line-height: 1.45;
          }

          .auth-form-side {
            flex: 1.25;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 48px 40px;
            background: #0D1017;
            z-index: 2;
          }

          .form-card {
            width: 100%;
            max-width: 520px;
          }

          .form-header-area {
            margin-bottom: 28px;
          }

          .form-title {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 6px;
            letter-spacing: -0.5px;
            color: #FFFFFF;
          }

          .form-sub {
            color: #88909E;
            font-size: 14px;
            margin: 0;
          }

          .form-section-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 20px;
            padding: 22px 20px 14px;
            margin-bottom: 20px;
          }

          .section-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;
          }

          .section-num {
            width: 30px;
            height: 30px;
            border-radius: 9px;
            background: #FBBF24;
            color: #111827;
            display: grid;
            place-items: center;
            font-weight: 900;
            font-size: 13px;
            flex-shrink: 0;
          }

          .section-title {
            font-size: 15px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.2px;
          }

          .section-sub {
            font-size: 12px;
            font-weight: 500;
            color: #717684;
            margin-top: 1px;
          }

          .input-group {
            position: relative;
            margin-bottom: 14px;
          }

          .input-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: #6B7280;
            display: flex;
            align-items: center;
            pointer-events: none;
          }

          .auth-input {
            width: 100%;
            background: #141721;
            border: 1px solid #232734;
            padding: 13px 14px 13px 44px;
            border-radius: 12px;
            color: #ffffff;
            font-size: 13.5px;
            transition: all 0.2s ease;
            outline: none;
            box-sizing: border-box;
          }

          .auth-input:focus {
            border-color: #FBBF24;
            background: #171B27;
            box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.15);
          }

          .auth-input::placeholder {
            color: #525866;
          }

          .input-grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .input-suffix {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: #6B7280;
            cursor: pointer;
            display: flex;
            align-items: center;
          }

          .input-suffix:hover {
            color: #FBBF24;
          }

          .slug-hint {
            font-size: 11.5px;
            color: #717684;
            margin-top: -8px;
            margin-bottom: 12px;
            padding-left: 4px;
          }

          .slug-highlight {
            color: #FBBF24;
            font-weight: 600;
          }

          .error-banner {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.25);
            color: #F87171;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 13px;
            margin-bottom: 20px;
            font-weight: 600;
          }

          .success-banner {
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.25);
            color: #4ADE80;
            padding: 20px;
            border-radius: 16px;
            font-size: 14px;
            margin-bottom: 20px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }

          .terms-wrapper {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .terms-label {
            font-size: 12.5px;
            color: #9CA3AF;
            cursor: pointer;
            user-select: none;
          }

          .terms-link {
            color: #FBBF24;
            text-decoration: none;
            font-weight: 600;
          }

          .terms-link:hover {
            text-decoration: underline;
          }

          .submit-btn {
            width: 100%;
            background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
            color: #0F172A;
            font-weight: 800;
            border: none;
            padding: 15px;
            border-radius: 14px;
            cursor: pointer;
            font-size: 15px;
            transition: all 0.25s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 10px 25px rgba(245, 158, 11, 0.25);
          }

          .submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 14px 30px rgba(245, 158, 11, 0.35);
          }

          .submit-btn:disabled {
            background: #27272a;
            color: #71717a;
            box-shadow: none;
            cursor: not-allowed;
          }

          .auth-footer {
            margin-top: 24px;
            text-align: center;
            font-size: 13.5px;
            color: #88909E;
          }

          .auth-link {
            color: #FBBF24;
            text-decoration: none;
            font-weight: 700;
            margin-left: 4px;
          }

          .auth-link:hover {
            text-decoration: underline;
          }

          .pw-rules {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 12px;
            background: #10131B;
            border: 1px solid #232734;
            border-radius: 12px;
            padding: 10px 14px;
            margin-top: -4px;
            margin-bottom: 14px;
          }

          .pw-rule {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 600;
          }

          .pw-rule.pass { color: #22C55E; }
          .pw-rule.fail { color: #EF4444; }

          .pw-dot {
            width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
          }

          .pw-rule.pass .pw-dot { background: #22C55E; }
          .pw-rule.fail .pw-dot { background: #EF4444; }

          @media (max-width: 1024px) {
            .auth-container {
              flex-direction: column;
              border-radius: 24px;
            }
            .auth-info {
              padding: 40px 30px;
              border-right: none;
              border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            }
            .auth-form-side {
              padding: 40px 24px;
              max-height: none;
            }
          }
        `}</style>

        {/* LEFT DESIGN SIDE */}
        <div className="auth-info">
          <div>
            <div className="brand-header">
              <div className="brand-logo" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
                <img src="/logo.png" alt="IAssetCare" style={{ width: 44, height: 44, objectFit: "contain", display: "block" }} />
              </div>
              <span className="brand-name">IAssetCare</span>
            </div>

            <div className="info-content">
              <div className="badge-tag">
                <AutoAwesomeRoundedIcon style={{ fontSize: 14 }} /> Enterprise Multi-Tenant PaaS
              </div>
              <h1 className="info-title">Launch Your Own Asset Workspace.</h1>
              <p className="info-desc">
                Equip your entire organization with isolated ticket management, dynamic hardware inventories, 
                and complete asset lifecycle tracking under your corporate identity.
              </p>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <ApartmentRoundedIcon fontSize="small" />
                </div>
                <div className="feature-details">
                  <h4>Isolated Database Partition</h4>
                  <p>Your team members register and operate in a dedicated, isolated tenant partition.</p>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <LanguageRoundedIcon fontSize="small" />
                </div>
                <div className="feature-details">
                  <h4>Corporate Identity & Slug</h4>
                  <p>Provision dedicated URL workspaces and personalize your dashboard branding context.</p>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <ReceiptLongRoundedIcon fontSize="small" />
                </div>
                <div className="feature-details">
                  <h4>Automated Compliance & GST</h4>
                  <p>Integrated tax invoicing, commercial licensing, and transparent subscription management.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ color: "#64748B", fontSize: "12.5px", zIndex: 2 }}>
            &copy; 2026 AssetCare PaaS. All rights reserved.
          </div>
        </div>

        {/* RIGHT FORM SIDE */}
        <div className="auth-form-side">
          <div className="form-card">
            <div className="form-header-area">
              <h2 className="form-title">Register Company</h2>
              <p className="form-sub">Create your dedicated tenant workspace and primary administrator profile.</p>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {isFirstTime && (
              <div style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                color: '#FBBF24',
                padding: '14px 16px',
                borderRadius: '14px',
                fontSize: '13px',
                marginBottom: '20px',
                lineHeight: '1.5'
              }}>
                <strong>✨ First-Time Setup Detected</strong>
                <div style={{ marginTop: '2px', opacity: 0.85 }}>
                  Register your master organization to initialize the AssetCare workspace.
                </div>
              </div>
            )}
            
            {success && (
              <div className="success-banner">
                <CheckCircleOutlineRoundedIcon sx={{ fontSize: 44 }} />
                <div>
                  <strong style={{ fontSize: '16px' }}>Workspace Initialized!</strong>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#88909E" }}>
                    Provisioning your dashboard partition... Redirecting to onboarding.
                  </p>
                </div>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit}>
                
                {/* SECTION 1: Company Information */}
                <div className="form-section-card">
                  <div className="section-header">
                    <div className="section-num">1</div>
                    <div>
                      <div className="section-title">Company Information</div>
                      <div className="section-sub">Workspace identity, URL slug, and tier plan.</div>
                    </div>
                  </div>

                  <div className="input-group">
                    <span className="input-icon"><ApartmentRoundedIcon fontSize="small" /></span>
                    <input
                      type="text"
                      name="companyName"
                      placeholder="Company Name (e.g., Acme Innovations)"
                      className="auth-input"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <span className="input-icon"><LanguageRoundedIcon fontSize="small" /></span>
                    <input
                      type="text"
                      name="slug"
                      placeholder="Workspace URL Slug (e.g., acme)"
                      className="auth-input"
                      value={formData.slug}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  {formData.slug && (
                    <div className="slug-hint">
                      Workspace URL: <span className="slug-highlight">assetcare.app/{formData.slug}</span>
                    </div>
                  )}

                  <div className="input-group">
                    <span className="input-icon"><KeyRoundedIcon fontSize="small" /></span>
                    <input
                      type="text"
                      name="licenseKey"
                      placeholder="Commercial License Key (Optional / Auto-generated)"
                      className="auth-input"
                      value={formData.licenseKey}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="input-group">
                    <select
                      name="plan"
                      className="auth-input"
                      style={{ paddingLeft: '16px', appearance: 'none', cursor: 'pointer' }}
                      value={formData.plan}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Home User">Home User Plan (₹999/yr — Up to 20 assets)</option>
                      <option value="MSME">MSME Plan (₹2,999/yr — Up to 50 assets)</option>
                      <option value="Large Scale">Large Scale Plan (₹8,999/yr — Unlimited assets)</option>
                    </select>
                  </div>

                  {(formData.plan === "MSME" || formData.plan === "Large Scale") && (
                    <div className="input-group">
                      <span className="input-icon"><ReceiptLongRoundedIcon fontSize="small" /></span>
                      <input
                        type="text"
                        name="gstNumber"
                        placeholder="GSTIN Number (e.g., 29AAAAA0000A1Z5)"
                        className="auth-input"
                        value={formData.gstNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  )}
                </div>

                {/* SECTION 2: Location & Billing Address */}
                <div className="form-section-card">
                  <div className="section-header">
                    <div className="section-num">2</div>
                    <div>
                      <div className="section-title">Billing & Company Address</div>
                      <div className="section-sub">Tax invoice address and registered location.</div>
                    </div>
                  </div>

                  <div className="input-group">
                    <span className="input-icon"><LocationOnRoundedIcon fontSize="small" /></span>
                    <input
                      type="text"
                      name="address"
                      placeholder="Street / Office Address"
                      className="auth-input"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="input-grid-2">
                    <div className="input-group">
                      <span className="input-icon"><LocationCityRoundedIcon fontSize="small" /></span>
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        className="auth-input"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <span className="input-icon"><PinDropRoundedIcon fontSize="small" /></span>
                      <input
                        type="text"
                        name="state"
                        placeholder="State (e.g., Maharashtra)"
                        className="auth-input"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <span className="input-icon"><PinDropRoundedIcon fontSize="small" /></span>
                    <input
                      type="text"
                      name="pinCode"
                      placeholder="6-digit PIN Code"
                      className="auth-input"
                      value={formData.pinCode}
                      onChange={handleInputChange}
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                {/* SECTION 3: Admin Account */}
                <div className="form-section-card">
                  <div className="section-header">
                    <div className="section-num">3</div>
                    <div>
                      <div className="section-title">Primary Administrator</div>
                      <div className="section-sub">Master credentials to manage this workspace.</div>
                    </div>
                  </div>

                  <div className="input-group">
                    <span className="input-icon"><PersonRoundedIcon fontSize="small" /></span>
                    <input
                      type="text"
                      name="adminName"
                      placeholder="Admin Full Name"
                      className="auth-input"
                      value={formData.adminName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <span className="input-icon"><EmailRoundedIcon fontSize="small" /></span>
                    <input
                      type="email"
                      name="adminEmail"
                      placeholder="Admin Email Address"
                      className="auth-input"
                      value={formData.adminEmail}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <span className="input-icon"><PhoneRoundedIcon fontSize="small" /></span>
                    <input
                      type="tel"
                      name="adminPhone"
                      placeholder="10-digit Mobile Number"
                      className="auth-input"
                      value={formData.adminPhone}
                      onChange={handleInputChange}
                      inputMode="numeric"
                      maxLength={10}
                      required
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: formData.adminPassword.length > 0 ? "10px" : "14px" }}>
                    <span className="input-icon"><LockRoundedIcon fontSize="small" /></span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="adminPassword"
                      placeholder="Create Master Password"
                      className="auth-input"
                      value={formData.adminPassword}
                      onChange={handleInputChange}
                      required
                    />
                    <span 
                      className="input-suffix"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                    </span>
                  </div>

                  {formData.adminPassword.length > 0 && (
                    <div className="pw-rules">
                      {pwRules.map(r => (
                        <div key={r.label} className={`pw-rule ${r.pass ? 'pass' : 'fail'}`}>
                          <span className="pw-dot" />
                          {r.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* TERMS & CONDITIONS CHECKBOX */}
                <div className="terms-wrapper">
                  <input
                    type="checkbox"
                    id="acceptedTerms"
                    name="acceptedTerms"
                    checked={formData.acceptedTerms}
                    onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                    style={{ accentColor: '#FBBF24', width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="acceptedTerms" className="terms-label">
                    I agree to the <Link to="/terms" className="terms-link" target="_blank">Terms of Service</Link> and <Link to="/privacy-policy" className="terms-link" target="_blank">Privacy Policy</Link>
                  </label>
                </div>

                {/* SUBMIT BUTTON */}
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? "Provisioning Workspace..." : "Launch Workspace"}
                  {!loading && <ArrowForwardRoundedIcon fontSize="small" />}
                </button>

              </form>
            )}

            <div className="auth-footer">
              Already have an active company workspace?
              <Link to="/login" className="auth-link">
                Log In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCompany;
