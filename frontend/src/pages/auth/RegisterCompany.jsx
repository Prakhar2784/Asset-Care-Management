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
  const [plans, setPlans] = useState([
    { name: 'Home User', price: 999, maxAssets: 20 },
    { name: 'MSME', price: 2999, maxAssets: 50 },
    { name: 'Large Scale', price: 8999, maxAssets: -1 }
  ]);

  // Check if first-run setup is required & load live plans
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
    const fetchPlans = async () => {
      try {
        const { data } = await api.get("/billing/plans");
        if (data && data.length > 0) {
          setPlans(data);
        }
      } catch {}
    };
    checkSetupStatus();
    fetchPlans();
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
    if (name === "gstNumber") {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
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
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');

          .auth-wrapper {
            min-height: 100vh;
            padding: 130px 24px 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #0B0D17;
            font-family: 'Poppins', 'Inter', -apple-system, sans-serif;
            width: 100%;
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
            color: #ffffff;
          }

          .auth-info {
            flex: 1;
            background-color: #161B2E;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 60px 48px;
            position: relative;
            border-right: 1px solid rgba(119, 119, 199, 0.18);
            overflow: hidden;
          }

          .auth-info::before {
            content: '';
            position: absolute;
            top: -80px;
            right: -80px;
            width: 260px;
            height: 260px;
            background: radial-gradient(circle, rgba(119, 119, 199, 0.14) 0%, rgba(0,0,0,0) 70%);
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
            max-width: 480px;
            z-index: 2;
            margin: 36px 0;
          }

          .badge-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background-color: #171B2E;
            border: 1px solid rgba(119, 119, 199, 0.35);
            color: #7777C7;
            padding: 6px 14px;
            border-radius: 9999px;
            font-family: 'Poppins', sans-serif;
            font-size: 11.5px;
            font-weight: 800;
            margin-bottom: 20px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
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
            line-height: 1.65;
            font-size: 15px;
            margin-bottom: 32px;
            font-weight: 400;
          }

          .feature-card {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            padding: 18px 20px;
            background-color: #171B2E;
            border: 1px solid rgba(119, 119, 199, 0.15);
            border-radius: 16px;
            margin-bottom: 14px;
            transition: all 0.2s ease;
          }

          .feature-card:hover {
            border-color: rgba(119, 119, 199, 0.35);
            transform: translateY(-2px);
          }

          .feature-icon-wrapper {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background-color: #1E233D;
            color: #7777C7;
            display: grid;
            place-items: center;
            flex-shrink: 0;
          }

          .feature-details h4 {
            font-family: 'Poppins', sans-serif;
            font-size: 14.5px;
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 3px 0;
          }

          .feature-details p {
            font-size: 13px;
            color: #94A3B8;
            margin: 0;
            line-height: 1.5;
            font-weight: 400;
          }

          .auth-form-side {
            flex: 1.25;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 60px 48px;
            background-color: #1E233D;
            z-index: 2;
          }

          .form-card {
            width: 100%;
            max-width: 520px;
          }

          .form-header-area {
            margin-bottom: 24px;
          }

          .form-title {
            font-family: 'Poppins', sans-serif;
            font-size: 28px;
            font-weight: 900;
            margin-bottom: 6px;
            letter-spacing: -0.8px;
            color: #FFFFFF;
          }

          .form-sub {
            color: #94A3B8;
            font-size: 14.5px;
            margin-bottom: 0;
            line-height: 1.6;
            font-weight: 400;
          }

          .form-fields {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .field-label {
            display: block;
            margin-bottom: 6px;
            font-size: 13px;
            font-weight: 700;
            color: #ffffff;
            font-family: 'Poppins', sans-serif;
          }

          .field-label .required {
            color: #F87171;
            margin-left: 2px;
          }

          .form-section-card {
            background-color: #0B0D17;
            border: 1px solid rgba(119, 119, 199, 0.16);
            border-radius: 18px;
            padding: 22px 20px 14px;
            margin-bottom: 18px;
          }

          .section-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;
          }

          .section-num {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            background-color: #1E233D;
            color: #7777C7;
            border: 1px solid rgba(119, 119, 199, 0.3);
            display: grid;
            place-items: center;
            font-family: 'Poppins', sans-serif;
            font-weight: 900;
            font-size: 12px;
            flex-shrink: 0;
          }

          .section-title {
            font-family: 'Poppins', sans-serif;
            font-size: 14.5px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.2px;
          }

          .section-sub {
            font-size: 12px;
            font-weight: 400;
            color: #94A3B8;
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
            color: #7777C7;
            display: flex;
            align-items: center;
            pointer-events: none;
          }

          .auth-input {
            width: 100%;
            background-color: #161B2E;
            border: 1px solid rgba(119, 119, 199, 0.22);
            padding: 13px 14px 13px 44px;
            border-radius: 12px;
            color: #ffffff;
            font-size: 14px;
            transition: all 0.2s ease;
            outline: none;
            box-sizing: border-box;
            font-family: 'Poppins', 'Inter', sans-serif;
          }

          .auth-input:focus {
            border-color: #7777C7;
            background-color: #1E233D;
            box-shadow: 0 0 0 3px rgba(119, 119, 199, 0.15);
          }

          .auth-input::placeholder {
            color: #64748B;
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
            color: #94A3B8;
            cursor: pointer;
            display: flex;
            align-items: center;
          }

          .input-suffix:hover {
            color: #FFFFFF;
          }

          .slug-hint {
            font-size: 12px;
            color: #94A3B8;
            margin-top: -6px;
            margin-bottom: 12px;
            padding-left: 4px;
          }

          .slug-highlight {
            color: #7777C7;
            font-weight: 700;
          }

          .error-banner {
            background: rgba(239, 68, 68, 0.12);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #F87171;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 13.5px;
            margin-bottom: 20px;
            font-weight: 600;
          }

          .success-banner {
            background: rgba(16, 185, 129, 0.12);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #10B981;
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
            background-color: #0B0D17;
            border: 1px solid rgba(119, 119, 199, 0.15);
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .terms-label {
            font-size: 12.5px;
            color: #94A3B8;
            cursor: pointer;
            user-select: none;
          }

          .terms-link {
            color: #7777C7;
            text-decoration: none;
            font-weight: 600;
          }

          .terms-link:hover {
            color: #8C8CE0;
            text-decoration: underline;
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
            margin-left: 4px;
          }

          .auth-link:hover {
            color: #8C8CE0;
            text-decoration: underline;
          }

          .pw-rules {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 12px;
            background-color: #161B2E;
            border: 1px solid rgba(119, 119, 199, 0.2);
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

          .pw-rule.pass { color: #10B981; }
          .pw-rule.fail { color: #F87171; }

          .pw-dot {
            width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
          }

          .pw-rule.pass .pw-dot { background: #10B981; }
          .pw-rule.fail .pw-dot { background: #F87171; }

          @media (max-width: 1024px) {
            .auth-container {
              flex-direction: column;
              border-radius: 24px;
            }
            .auth-info {
              padding: 40px 30px;
              border-right: none;
              border-bottom: 1px solid rgba(119, 119, 199, 0.12);
            }
            .auth-form-side {
              padding: 40px 24px;
            }
          }
        `}</style>

        {/* LEFT DESIGN SIDE */}
        <div className="auth-info">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
              <div className="auth-brand-box">
                <img src="/logo_home.png" alt="IAssetCare" style={{ width: 28, height: 28, display: 'block', objectFit: 'contain' }} />
              </div>
              <span style={{ fontFamily: 'Poppins', fontSize: "20px", fontWeight: "900", letterSpacing: "-0.4px", color: "#FFFFFF" }}>IAssetCare</span>
            </div>

            <div className="info-content">
              <div className="badge-tag">
                <AutoAwesomeRoundedIcon sx={{ fontSize: 13 }} /> Enterprise Multi-Tenant PaaS
              </div>
              <h1 className="info-title">Launch Your Own Asset Workspace.</h1>
              <p className="info-desc">
                Equip your entire organization with isolated ticket management, dynamic hardware inventories, 
                and complete asset lifecycle tracking under your corporate identity.
              </p>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <ApartmentRoundedIcon sx={{ fontSize: 20 }} />
                </div>
                <div className="feature-details">
                  <h4>Isolated Database Partition</h4>
                  <p>Your team members register and operate in a dedicated, isolated tenant partition.</p>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <LanguageRoundedIcon sx={{ fontSize: 20 }} />
                </div>
                <div className="feature-details">
                  <h4>Corporate Identity &amp; Slug</h4>
                  <p>Provision dedicated URL workspaces and personalize your dashboard branding context.</p>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <ReceiptLongRoundedIcon sx={{ fontSize: 20 }} />
                </div>
                <div className="feature-details">
                  <h4>Automated Compliance &amp; GST</h4>
                  <p>Integrated tax invoicing, commercial licensing, and transparent subscription management.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ color: "#64748B", fontSize: "12.5px", zIndex: 2 }}>
            &copy; 2026 IAssetCare. All rights reserved.
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
                background: 'rgba(119, 119, 199, 0.12)',
                border: '1px solid rgba(119, 119, 199, 0.3)',
                color: '#7777C7',
                padding: '14px 16px',
                borderRadius: '14px',
                fontSize: '13px',
                marginBottom: '20px',
                lineHeight: '1.5'
              }}>
                <strong style={{ color: '#FFFFFF' }}>✨ First-Time Setup Detected</strong>
                <div style={{ marginTop: '2px', color: '#CBD5E1' }}>
                  Register your master organization to initialize the IAssetCare workspace.
                </div>
              </div>
            )}
            
            {success && (
              <div className="success-banner">
                <CheckCircleOutlineRoundedIcon sx={{ fontSize: 44, color: '#10B981' }} />
                <div>
                  <strong style={{ fontSize: '16px', color: '#FFFFFF' }}>Workspace Initialized!</strong>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94A3B8" }}>
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
                    <span className="input-icon"><ApartmentRoundedIcon sx={{ fontSize: 20 }} /></span>
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
                    <span className="input-icon"><LanguageRoundedIcon sx={{ fontSize: 20 }} /></span>
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
                      Workspace URL: <span className="slug-highlight">iassetcare.com/{formData.slug}</span>
                    </div>
                  )}

                  <div className="input-group">
                    <span className="input-icon"><KeyRoundedIcon sx={{ fontSize: 20 }} /></span>
                    <input
                      type="text"
                      name="licenseKey"
                      placeholder="Activation / License Key (If provided by Sales)"
                      className="auth-input"
                      value={formData.licenseKey}
                      onChange={handleInputChange}
                    />
                  </div>
                  {formData.licenseKey && (
                    <div style={{ fontSize: '12px', color: '#7777C7', marginTop: '-8px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AutoAwesomeRoundedIcon sx={{ fontSize: 14 }} /> Valid license key pre-activates your workspace immediately (no checkout required).
                    </div>
                  )}

                  <div className="input-group">
                    <select
                      name="plan"
                      className="auth-input"
                      style={{ paddingLeft: '16px', appearance: 'none', cursor: 'pointer' }}
                      value={formData.plan}
                      onChange={handleInputChange}
                      required
                    >
                      {plans.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} Plan (₹{p.price.toLocaleString('en-IN')}/yr — {p.maxAssets === -1 || p.maxAssets === 999999999 ? 'Unlimited' : `Up to ${p.maxAssets}`} assets)
                        </option>
                      ))}
                    </select>
                  </div>

                  {(formData.plan === "MSME" || formData.plan === "Large Scale") && (
                    <div className="input-group">
                      <span className="input-icon"><ReceiptLongRoundedIcon sx={{ fontSize: 20 }} /></span>
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
                      <div className="section-title">Billing &amp; Company Address</div>
                      <div className="section-sub">Tax invoice address and registered location.</div>
                    </div>
                  </div>

                  <div className="input-group">
                    <span className="input-icon"><LocationOnRoundedIcon sx={{ fontSize: 20 }} /></span>
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
                      <span className="input-icon"><LocationCityRoundedIcon sx={{ fontSize: 20 }} /></span>
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
                      <span className="input-icon"><PinDropRoundedIcon sx={{ fontSize: 20 }} /></span>
                      <input
                        type="text"
                        name="state"
                        placeholder="State (e.g., Rajasthan)"
                        className="auth-input"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <span className="input-icon"><PinDropRoundedIcon sx={{ fontSize: 20 }} /></span>
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
                    <span className="input-icon"><PersonRoundedIcon sx={{ fontSize: 20 }} /></span>
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
                    <span className="input-icon"><EmailRoundedIcon sx={{ fontSize: 20 }} /></span>
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
                    <span className="input-icon"><PhoneRoundedIcon sx={{ fontSize: 20 }} /></span>
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
                    <span className="input-icon"><LockRoundedIcon sx={{ fontSize: 20 }} /></span>
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
                      {showPassword ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
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
                    style={{ accentColor: '#7777C7', width: 16, height: 16, cursor: 'pointer' }}
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
                  {!loading && <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
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
