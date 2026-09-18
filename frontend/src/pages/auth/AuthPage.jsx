import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useAuth } from "../../context/AuthContext";

const ADMIN_TIER_ROLES = ["admin", "hod", "manager"];
const BASIC_PERMS = ["View Dashboard", "Raise Tickets"];

const landingRouteFor = (session) => {
  if (session.role === "super_admin") return "/super-admin/console";
  if (session.role === "technician") return "/technician/portal";
  if (ADMIN_TIER_ROLES.includes(session.role)) return "/admin/dashboard";
  const customPerms = session.customPermissions || [];
  const hasAdminPerm = customPerms.some(p => p.allowed && !BASIC_PERMS.includes(p.feature));
  return hasAdminPerm ? "/admin/dashboard" : "/employee/portal";
};

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  
  // UI State
  const [view, setView] = useState("login");
  const [role, setRole] = useState("employee"); 
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Check if first-run setup is required
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const { data } = await api.get("/auth/setup-status");
        if (data.needsSetup) {
          navigate("/register-company");
        }
      } catch (err) {
        console.error("Failed to check setup status:", err);
      }
    };
    checkSetupStatus();
  }, [navigate]);

  // Check for deactivation notice
  useEffect(() => {
    if (searchParams.get('deactivated') === '1' || searchParams.get('deactivated') === 'true') {
      setError("Company account is deactivated. Please contact the platform administrator.");
    }
  }, [searchParams]);

  // Load remembered email when role tab changes
  useEffect(() => {
    const saved = localStorage.getItem(`assetcare_remembered_email_${role}`);
    if (saved) {
      setFormData(f => ({ ...f, email: saved }));
      setRememberMe(true);
    } else {
      setFormData(f => ({ ...f, email: "" }));
      setRememberMe(false);
    }
  }, [role]);

  // Dynamic Content based on selected role
  const pageContent = {
    employee: {
      leftTitle: "Your Equipment Workspace.",
      leftDesc: "Easily report breakdowns, track the repair status of your assigned assets, and get back to work faster.",
      feature1Title: "One-Click Reporting",
      feature1Desc: "Quickly raise tickets for faulty or damaged equipment.",
      feature2Title: "Real-Time Tracking",
      feature2Desc: "See exactly when your repair request is approved and assigned.",
      rightLoginSub: "Enter your credentials to access your employee portal.",
    },
    hod: {
      leftTitle: "Department Management.",
      leftDesc: "Oversee your department's assets, track maintenance schedules, and manage equipment requests from your team.",
      feature1Title: "Department Overview",
      feature1Desc: "Monitor all assets and maintenance activity for your department.",
      feature2Title: "Maintenance Calendar",
      feature2Desc: "Stay on top of scheduled maintenance and asset availability.",
      rightLoginSub: "Enter your credentials to access your department dashboard.",
    },
    admin: {
      leftTitle: "Intelligent Asset Management.",
      leftDesc: "Streamline the equipment lifecycle, automate repair approvals, and track enterprise warranties effortlessly.",
      feature1Title: "Centralized Control",
      feature1Desc: "Manage asset registries and oversee all department workflows.",
      feature2Title: "Vendor Escalation",
      feature2Desc: "Directly escalate approved repairs to your network of OEM partners.",
      rightLoginSub: "Enter your system administrator credentials.",
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); 
  };

  const handleViewChange = (newView) => {
    setView(newView);
    setError("");
    setFormData({ email: "", password: "" });
    setShowPassword(false);
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError("");
    setFormData({ email: "", password: "" });
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (view === "login") {
        if (rememberMe) {
          localStorage.setItem(`assetcare_remembered_email_${role}`, formData.email);
        } else {
          localStorage.removeItem(`assetcare_remembered_email_${role}`);
        }
        const session = await login(formData.email, formData.password, role);
        const returnTo = searchParams.get('return');
        navigate(returnTo && returnTo.startsWith('/') ? returnTo : landingRouteFor(session));
      }
      else if (view === "forgot") {
        const { data } = await api.post('/auth/forgot-password', { email: formData.email });
        alert(data?.message || "If that email is registered, you'll receive a one-time code to reset your password.");
        handleViewChange("login");
      }
    } catch (err) {
      setError(err.message);
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

        .auth-brand-box {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-info-title {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(28px, 3vw, 38px);
          font-weight: 900;
          line-height: 1.2;
          margin-bottom: 16px;
          letter-spacing: -1px;
          color: #FFFFFF;
        }

        .auth-info-desc {
          font-size: 15.5px;
          color: #94A3B8;
          line-height: 1.7;
          font-weight: 400;
          margin: 0;
        }

        .info-list {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          z-index: 1;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 20px;
          border-radius: 16px;
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.18);
          transition: border-color 0.2s ease;
        }
        .info-item:hover {
          border-color: rgba(119, 119, 199, 0.35);
        }

        .info-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background-color: #161B2E;
          color: #7777C7;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .auth-form-container {
          flex: 1;
          padding: 60px 48px;
          background-color: #1E233D;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .auth-heading {
          font-family: 'Poppins', sans-serif;
          font-size: 28px;
          font-weight: 900;
          color: #FFFFFF;
          margin: 0 0 8px;
          letter-spacing: -0.8px;
        }

        .auth-subheading {
          font-size: 14.5px;
          color: #94A3B8;
          margin: 0 0 24px;
          line-height: 1.6;
          font-weight: 400;
        }

        .new-company-banner {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          margin-bottom: 22px;
          background-color: #161B2E;
          border: 1px solid rgba(119, 119, 199, 0.22);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .new-company-banner:hover {
          border-color: rgba(119, 119, 199, 0.4);
          background-color: #1E233D;
        }

        .role-toggle {
          display: flex;
          background-color: #161B2E;
          padding: 5px;
          border-radius: 14px;
          margin-bottom: 24px;
          border: 1px solid rgba(119, 119, 199, 0.18);
        }

        .role-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 10px;
          border: none;
          background: transparent;
          border-radius: 10px;
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 13.5px;
          color: #94A3B8;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .role-btn.active {
          background-color: #7777C7;
          color: #0B0D17;
          font-weight: 800;
          box-shadow: 0 4px 14px rgba(119, 119, 199, 0.35);
        }

        .input-wrapper {
          position: relative;
          width: 100%;
          margin-bottom: 16px;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #7777C7;
          transition: color 0.2s ease;
          pointer-events: none;
        }

        .input-icon-right {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          display: flex;
          transition: color 0.2s ease;
        }
        .input-icon-right:hover {
          color: #FFFFFF;
        }

        .auth-input {
          width: 100%;
          padding: 15px 48px;
          background-color: #161B2E;
          border: 1px solid rgba(119, 119, 199, 0.22);
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 14.5px;
          font-weight: 500;
          outline: none;
          transition: all 0.22s ease;
          box-sizing: border-box;
          font-family: 'Poppins', 'Inter', sans-serif;
        }

        .auth-input::placeholder {
          color: #64748B;
          font-weight: 400;
        }

        .auth-input:hover {
          border-color: rgba(119, 119, 199, 0.35);
        }

        .auth-input:focus {
          border-color: #7777C7;
          box-shadow: 0 0 0 3px rgba(119, 119, 199, 0.15);
          background-color: #0E101D;
        }

        .auth-btn {
          width: 100%;
          padding: 16px;
          background-color: #7777C7;
          color: #0B0C1A;
          border: 1px solid #7777C7;
          border-radius: 9999px;
          font-family: 'Poppins', sans-serif;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.2px;
          cursor: pointer;
          margin-bottom: 24px;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 6px 20px rgba(119, 119, 199, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .auth-btn:hover:not(:disabled) {
          background-color: #6464B8;
          border-color: #6464B8;
          color: #FFFFFF;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(119, 119, 199, 0.5);
        }

        .auth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-link {
          color: #7777C7;
          background: none;
          border: none;
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .auth-link:hover {
          color: #8C8CE0;
          text-decoration: underline;
        }

        .error-message { 
          background: rgba(239, 68, 68, 0.12); 
          border: 1px solid rgba(239, 68, 68, 0.3); 
          color: #F87171; 
          padding: 12px 16px; 
          border-radius: 12px; 
          font-size: 13.5px; 
          width: 100%; 
          margin-bottom: 16px; 
          text-align: left; 
          font-weight: 600; 
          box-sizing: border-box;
        }

        .auth-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 10px;
        }

        .auth-stat-card {
          background-color: #171B2E;
          border: 1px solid rgba(119, 119, 199, 0.15);
          border-radius: 14px;
          padding: 14px 10px;
          text-align: center;
          transition: border-color 0.2s ease;
        }
        .auth-stat-card:hover {
          border-color: rgba(119, 119, 199, 0.35);
        }

        .auth-stat-card h4 {
          font-family: 'Poppins', sans-serif;
          color: #FFFFFF;
          font-size: 20px;
          font-weight: 900;
          margin: 0 0 2px;
          letter-spacing: -0.5px;
        }

        .auth-stat-card span {
          color: #94A3B8;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media (max-width: 900px) {
          .auth-wrapper { padding: 110px 18px 40px; }
          .auth-container { flex-direction: column; border-radius: 24px; }
          .auth-info { padding: 36px 24px; border-right: none; border-bottom: 1px solid rgba(119, 119, 199, 0.12); }
          .auth-form-container { padding: 36px 24px; }
          .info-list { display: none; }
        }

        @media (max-width: 520px) {
          .role-toggle { flex-direction: column; }
          .auth-stats { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="auth-wrapper">
        <div className="auth-container">
          
          {/* Left Hero Column */}
          <div className="auth-info" key={role}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
                <div className="auth-brand-box">
                  <img src="/logo_home.png" alt="IAssetCare" style={{ width: 28, height: 28, display: 'block', objectFit: 'contain' }} />
                </div>
                <span style={{ fontFamily: 'Poppins', fontSize: "20px", fontWeight: "900", letterSpacing: "-0.4px", color: "#FFFFFF" }}>IAssetCare</span>
              </div>
              <h2 className="auth-info-title">
                {pageContent[role].leftTitle}
              </h2>
              <p className="auth-info-desc">
                {pageContent[role].leftDesc}
              </p>
            </div>

            <div className="info-list">
              <div className="info-item">
                <div className="info-icon"><CheckCircleOutlineRoundedIcon sx={{ fontSize: 20 }} /></div>
                <div>
                  <h4 style={{ fontFamily: 'Poppins', fontSize: "15px", fontWeight: "800", marginBottom: "3px", marginTop: 0, color: '#FFFFFF' }}>{pageContent[role].feature1Title}</h4>
                  <p style={{ fontSize: "13.5px", color: "#94A3B8", margin: 0, lineHeight: 1.55 }}>{pageContent[role].feature1Desc}</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon"><CheckCircleOutlineRoundedIcon sx={{ fontSize: 20 }} /></div>
                <div>
                  <h4 style={{ fontFamily: 'Poppins', fontSize: "15px", fontWeight: "800", marginBottom: "3px", marginTop: 0, color: '#FFFFFF' }}>{pageContent[role].feature2Title}</h4>
                  <p style={{ fontSize: "13.5px", color: "#94A3B8", margin: 0, lineHeight: 1.55 }}>{pageContent[role].feature2Desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="auth-form-container">
            <h2 className="auth-heading">
              {view === "login" && "Welcome Back"}
              {view === "forgot" && "Reset Credentials"}
            </h2>
            <p className="auth-subheading">
              {view === "login" && pageContent[role].rightLoginSub}
              {view === "forgot" && "Enter your registered email to receive recovery instructions."}
            </p>

            {view === "login" && (
              <button
                type="button"
                className="new-company-banner"
                onClick={() => navigate('/register-company')}
              >
                <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#94A3B8" }}>New company?</span>
                <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#7777C7", display: "flex", alignItems: "center", gap: 4 }}>Get Started <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} /></span>
              </button>
            )}

            {view === "login" && (
              <>
                {role !== "admin" ? (
                  <>
                    <div style={{ textAlign: "center", marginBottom: "14px" }}>
                      <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500 }}>System Administrator? </span>
                      <button
                        type="button"
                        className="auth-link"
                        style={{ fontSize: "13px" }}
                        onClick={() => handleRoleChange("admin")}
                      >
                        Sign in here →
                      </button>
                    </div>
                    <div className="role-toggle">
                      <button
                        type="button"
                        className={`role-btn ${role === "employee" ? "active" : ""}`}
                        onClick={() => handleRoleChange("employee")}
                      >
                        <BadgeRoundedIcon sx={{ fontSize: 18 }} /> Employee Portal
                      </button>
                      <button
                        type="button"
                        className={`role-btn ${role === "hod" ? "active" : ""}`}
                        onClick={() => handleRoleChange("hod")}
                      >
                        <BusinessRoundedIcon sx={{ fontSize: 18 }} /> Department Access
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", padding: "12px 16px", background: "#171B2E", border: "1px solid rgba(119, 119, 199, 0.2)", borderRadius: "12px" }}>
                    <AdminPanelSettingsRoundedIcon sx={{ color: "#7777C7", fontSize: 20 }} />
                    <span style={{ color: "#FFFFFF", fontWeight: 800, fontSize: "14px", flex: 1 }}>Admin Access</span>
                    <button
                      type="button"
                      className="auth-link"
                      style={{ fontSize: "13px", color: "#94A3B8", fontWeight: 600 }}
                      onClick={() => handleRoleChange("employee")}
                    >
                      ← Back
                    </button>
                  </div>
                )}
              </>
            )}

            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              {error && <div className="error-message">{error}</div>}

              <div className="input-wrapper">
                <EmailRoundedIcon className="input-icon" sx={{ fontSize: 20 }} />
                <input name="email" value={formData.email} onChange={handleInputChange} placeholder="Work Email Address" type="email" required className="auth-input" />
              </div>

              {view === "login" && (
                <div className="input-wrapper" style={{ marginBottom: "14px" }}>
                  <LockRoundedIcon className="input-icon" sx={{ fontSize: 20 }} />
                  <input name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" type={showPassword ? "text" : "password"} required className="auth-input" />
                  <button type="button" className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                  </button>
                </div>
              )}

              {view === "login" && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "26px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94A3B8", fontSize: "13.5px", cursor: "pointer", fontWeight: "500" }}>
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: "#7777C7", width: "15px", height: "15px", cursor: "pointer" }} /> Remember me
                  </label>
                  <Link to="/forgot-password" className="auth-link" style={{ cursor: "pointer" }}>Forgot Password?</Link>
                </div>
              )}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Processing..." : view === "login" ? "Secure Login" : "Send Recovery Link"}
              </button>
            </form>

            {view === "forgot" && (
              <div style={{ color: "#94A3B8", fontSize: "14px", fontWeight: "500", textAlign: "center" }}>
                <button type="button" className="auth-link" onClick={() => handleViewChange("login")}>← Back to Login</button>
              </div>
            )}

            <div className="auth-stats">
              <div className="auth-stat-card">
                <h4>10K+</h4>
                <span>Assets</span>
              </div>

              <div className="auth-stat-card">
                <h4>500+</h4>
                <span>Tickets</span>
              </div>

              <div className="auth-stat-card">
                <h4>99%</h4>
                <span>Uptime</span>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export default AuthPage;