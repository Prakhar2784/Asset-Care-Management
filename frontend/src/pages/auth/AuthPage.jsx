import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import { useAuth } from "../../context/AuthContext";

const ADMIN_TIER_ROLES = ["admin", "super_admin", "hod", "manager"];
const BASIC_PERMS = ["View Dashboard", "Raise Tickets"];

// Mirrors AdminRoute's access check: admin-tier roles, and employees granted
// at least one non-basic permission, land on the admin dashboard.
const landingRouteFor = (session) => {
  if (session.role === "technician") return "/technician/portal";
  if (ADMIN_TIER_ROLES.includes(session.role)) return "/admin/dashboard";
  const customPerms = session.customPermissions || [];
  const hasAdminPerm = customPerms.some(p => p.allowed && !BASIC_PERMS.includes(p.feature));
  return hasAdminPerm ? "/admin/dashboard" : "/employee/portal";
};

const AuthPage = () => {
  const navigate = useNavigate();
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
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem(`assetcare_remembered_email_${role}`, formData.email);
        } else {
          localStorage.removeItem(`assetcare_remembered_email_${role}`);
        }
        const session = await login(formData.email, formData.password, role);
        navigate(landingRouteFor(session));
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
        :root {
          --auth-primary: #111827;
          --auth-secondary: #111827;
          --auth-bg: #0B0D12;
          --text-main: #FFFFFF;
          --text-muted: #9CA3AF;
          --input-bg: rgba(20,20,20,0.75);
          --input-border: rgba(17,24,39,0.2);
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes floatSoft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }

        .auth-wrapper {
          min-height: 100vh;
          padding: 120px 24px 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(ellipse at 15% 0%, rgba(17,24,39,0.22) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 100%, rgba(17,24,39,0.16) 0%, transparent 55%),
            var(--auth-bg);
          background-attachment: fixed;
          font-family: 'Inter', sans-serif;
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
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          border: 1px solid rgba(17,24,39,0.15);
          backdrop-filter: blur(20px);
        }

        .auth-info {
          flex: 1;
          background: #111827;
          padding: 70px 50px;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          transition: all 0.4s ease;
        }

        .auth-info::before {
          content: '';
          position: absolute;
          top: 24px;
          right: 24px;
          width: 180px;
          height: 180px;
          border: 1px dashed rgba(17,24,39,0.22);
          border-radius: 50%;
          animation: floatSoft 5s ease-in-out infinite;
        }

        .auth-info::after {
          content: '';
          position: absolute;
          bottom: -20%;
          right: -20%;
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(17,24,39,0.14) 0%, rgba(0,0,0,0) 70%);
          border-radius: 50%;
        }

        .auth-brand-box {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: #111827;
          box-shadow: 0 14px 28px rgba(17,24,39,0.28);
          border: 1px solid rgba(17,24,39,0.30);
        }

        .info-list {
          margin-top: 48px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: relative;
          z-index: 1;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px;
          border-radius: 20px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(14px);
        }

        .info-icon {
          background: rgba(255,255,255,0.15);
          padding: 8px;
          border-radius: 12px;
          display: flex;
          color: #FFFFFF;
        }

        .auth-form-container {
          flex: 1;
          padding: 70px 54px;
          background: rgba(20,20,20,0.7);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .role-toggle {
          display: flex;
          background: var(--input-bg);
          padding: 6px;
          border-radius: 18px;
          margin-bottom: 32px;
          border: 1px solid rgba(17,24,39,0.2);
        }

        .role-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 10px;
          border: none;
          background: transparent;
          border-radius: 14px;
          font-weight: 800;
          font-size: 14px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .role-btn.active {
          background: rgba(20,20,20,0.7);
          color: #FFFFFF;
          box-shadow: 0 10px 20px rgba(17,17,17,0.08);
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
          color: #A0A09A;
          transition: color 0.3s ease;
          pointer-events: none;
        }

        .input-icon-right {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #A0A09A;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          display: flex;
          transition: color 0.2s ease;
        }

        .input-icon-right:hover {
          color: var(--text-main);
        }

        .auth-input {
          width: 100%;
          padding: 16px 48px;
          background-color: var(--input-bg);
          border: 1.5px solid var(--input-border);
          border-radius: 16px;
          color: var(--text-main);
          font-size: 15px;
          font-weight: 600;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        /* Additional style to ensure select tag matches input padding */
        select.auth-input {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
        }

        .auth-input::placeholder {
          color: #A0A09A;
          font-weight: 500;
        }

        .input-wrapper:focus-within .input-icon {
          color: #FFFFFF;
        }

        .input-wrapper:focus-within .auth-input {
          border-color: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(17,24,39,0.15);
          background-color: rgba(25,25,25,0.85);
        }

        .auth-btn {
          width: 100%;
          padding: 18px;
          background: #FBBF24;
          color: #111827 !important;
          -webkit-text-fill-color: #111827;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 0.3px;
          cursor: pointer;
          margin-bottom: 24px;
          transition: all 0.3s ease;
          box-shadow: 0 14px 28px rgba(251,191,36,0.22);
        }

        .auth-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 22px 42px rgba(251,191,36,0.32);
          background: #F5A623;
        }

        .auth-btn:disabled {
          opacity: 1;
          cursor: not-allowed;
          transform: none;
          color: #FFFFFF;
        }

        .auth-link {
          color: #FFFFFF;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          padding: 0;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .auth-link:hover {
          color: #333333;
        }

        .error-message { 
          background: #FEE2E2; 
          border: 1px solid #FCA5A5; 
          color: #DC2626; 
          padding: 12px; 
          border-radius: 12px; 
          font-size: 14px; 
          width: 100%; 
          margin-bottom: 16px; 
          text-align: left; 
          font-weight: 700; 
          box-sizing: border-box;
        }

        .auth-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-top: 26px;
        }

        .auth-stat-card {
          background: rgba(20,20,20,0.65);
          border: 1px solid rgba(17,24,39,0.15);
          border-radius: 16px;
          padding: 15px;
          text-align: center;
        }

        .auth-stat-card h4 {
          color: #FFFFFF;
          font-size: 22px;
          font-weight: 950;
          margin: 0 0 4px;
        }

        .auth-stat-card span {
          color: #94A3B8;
          font-size: 12px;
          font-weight: 800;
        }

        @media (max-width: 900px) {
          .auth-wrapper {
            padding: 110px 18px 40px;
          }

          .auth-container { 
            flex-direction: column; 
            border-radius: 28px;
          }

          .auth-info { 
            padding: 42px 26px; 
          }

          .auth-form-container { 
            padding: 42px 26px; 
          }

          .info-list { 
            display: none; 
          }
        }

        @media (max-width: 520px) {
          .role-toggle {
            flex-direction: column;
          }

          .auth-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="auth-wrapper">
        <div className="auth-container">
          
          <div className="auth-info" key={role}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
                <div className="auth-brand-box">
                  <Inventory2Icon fontSize="large" style={{ color: "#FFFFFF" }} />
                </div>
                <h1 style={{ fontSize: "24px", fontWeight: "900", letterSpacing: "-0.5px", margin: 0 }}>AssetCare Pro</h1>
              </div>
              <h2 style={{ fontSize: "38px", fontWeight: "950", lineHeight: "1.15", marginBottom: "16px", animation: "fadeInUp 0.5s ease", letterSpacing: "-1.2px" }}>
                {pageContent[role].leftTitle}
              </h2>
              <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.86)", lineHeight: "1.7", animation: "fadeInUp 0.6s ease", fontWeight: 500 }}>
                {pageContent[role].leftDesc}
              </p>
            </div>

            <div className="info-list" style={{ animation: "fadeInUp 0.7s ease" }}>
              <div className="info-item">
                <div className="info-icon"><CheckCircleOutlineRoundedIcon /></div>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "4px", marginTop: 0 }}>{pageContent[role].feature1Title}</h4>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.78)", margin: 0, lineHeight: 1.6 }}>{pageContent[role].feature1Desc}</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon"><CheckCircleOutlineRoundedIcon /></div>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "4px", marginTop: 0 }}>{pageContent[role].feature2Title}</h4>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.78)", margin: 0, lineHeight: 1.6 }}>{pageContent[role].feature2Desc}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-form-container">
            <h2 style={{ fontSize: "30px", fontWeight: "950", color: "var(--text-main)", marginBottom: "8px", letterSpacing: "-0.8px" }}>
              {view === "login" && "Welcome Back"}
              {view === "forgot" && "Reset Credentials"}
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", marginBottom: "32px", lineHeight: 1.6, fontWeight: 600 }}>
              {view === "login" && pageContent[role].rightLoginSub}
              {view === "forgot" && "Enter your registered email to receive recovery instructions."}
            </p>

            {view === "login" && (
              <>
                {role !== "admin" ? (
                  <>
                    <div style={{ textAlign: "center", marginBottom: "16px" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: 600 }}>System Administrator? </span>
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
                        <BadgeRoundedIcon fontSize="small" /> Employee Portal
                      </button>
                      <button
                        type="button"
                        className={`role-btn ${role === "hod" ? "active" : ""}`}
                        onClick={() => handleRoleChange("hod")}
                      >
                        <BusinessRoundedIcon fontSize="small" /> Department Access
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px", padding: "13px 16px", background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.28)", borderRadius: "14px" }}>
                    <AdminPanelSettingsRoundedIcon style={{ color: "#FBBF24", fontSize: 20 }} />
                    <span style={{ color: "#FBBF24", fontWeight: 800, fontSize: "14px", flex: 1 }}>Admin Access</span>
                    <button
                      type="button"
                      className="auth-link"
                      style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 700 }}
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
                <EmailRoundedIcon className="input-icon" fontSize="small" />
                <input name="email" value={formData.email} onChange={handleInputChange} placeholder="Work Email Address" type="email" required className="auth-input" />
              </div>

              {view === "login" && (
                <div className="input-wrapper" style={{ marginBottom: "12px" }}>
                  <LockRoundedIcon className="input-icon" fontSize="small" />
                  <input name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" type={showPassword ? "text" : "password"} required className="auth-input" />
                  <button type="button" className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                  </button>
                </div>
              )}

              {view === "login" && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "32px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "14px", cursor: "pointer", fontWeight: "600" }}>
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: "#FFFFFF", width: "16px", height: "16px" }} /> Remember me
                  </label>
                  <button type="button" className="auth-link" onClick={() => navigate('/forgot-password')}>Forgot Password?</button>
                </div>
              )}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Processing..." : view === "login" ? "Secure Login" : "Send Recovery Link"}
              </button>
            </form>

            {view === "forgot" && (
              <div style={{ color: "var(--text-muted)", fontSize: "14px", fontWeight: "600", textAlign: "center" }}>
                <button type="button" className="auth-link" onClick={() => handleViewChange("login")}>← Back to Login</button>
              </div>
            )}

            {view === "login" && (
              <div style={{
                marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--border-color, rgba(17,24,39,0.15))",
                textAlign: "center", fontSize: "14px", fontWeight: 600, color: "var(--text-muted)"
              }}>
                New company? <button type="button" className="auth-link" onClick={() => navigate('/register-company')}>Get Started Free</button>
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