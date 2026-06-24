import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import { useAuth } from "../../context/AuthContext"; 

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  
  // UI State
  const [view, setView] = useState("login");
  const [role, setRole] = useState("employee"); 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form State - ADDED department here
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "" 
  });

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
      rightRegSub: "Register to track and manage your assigned company assets."
    },
    admin: {
      leftTitle: "Intelligent Asset Management.",
      leftDesc: "Streamline the equipment lifecycle, automate repair approvals, and track enterprise warranties effortlessly.",
      feature1Title: "Centralized Control",
      feature1Desc: "Manage asset registries and oversee all department workflows.",
      feature2Title: "Vendor Escalation",
      feature2Desc: "Directly escalate approved repairs to your network of OEM partners.",
      rightLoginSub: "Enter your root credentials to access the system dashboard.",
      rightRegSub: "Create an administrative profile to manage enterprise assets."
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); 
  };

  const handleViewChange = (newView) => {
    setView(newView);
    setError("");
    setFormData({ name: "", email: "", password: "", confirmPassword: "", department: "" });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError("");
    setFormData({ name: "", email: "", password: "", confirmPassword: "", department: "" });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (view === "login") {
        const session = await login(formData.email, formData.password, role);
        if (session.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/employee/portal");
        }
      } 
      else if (view === "register") {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        // ADDED: Passing formData.department to the register function
        const session = await register(formData.name, formData.email, formData.password, role, formData.department);
        if (session.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/employee/portal");
        }
      } 
      else if (view === "forgot") {
        await api.post('/auth/forgot-password', { email: formData.email });
        alert("If that email is registered, a reset link has been sent. Check your inbox.");
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
          --auth-primary: #1E3A8A; 
          --auth-secondary: #0F766E; 
          --auth-bg: #F8FAFC; 
          --text-main: #0F172A; 
          --text-muted: #64748B; 
          --input-bg: #F8FAFC; 
          --input-border: #CBD5E1;
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
            radial-gradient(circle at top left, rgba(15,118,110,0.10), transparent 34%),
            radial-gradient(circle at top right, rgba(30,58,138,0.12), transparent 35%),
            var(--auth-bg); 
          font-family: 'Inter', sans-serif; 
        }

        .auth-container {
          width: 100%;
          max-width: 1200px;
          background: rgba(255,255,255,0.92);
          border-radius: 36px;
          box-shadow: 0 30px 70px rgba(15, 23, 42, 0.12);
          display: flex;
          overflow: hidden;
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          border: 1px solid #E2E8F0;
          backdrop-filter: blur(20px);
        }

        .auth-info {
          flex: 1;
          background:
            radial-gradient(circle at top right, rgba(20,184,166,0.26), transparent 35%),
            linear-gradient(135deg, #0F172A, #1E3A8A);
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
          border: 1px dashed rgba(255,255,255,0.20);
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
          background: radial-gradient(circle, rgba(20,184,166,0.22) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
        }

        .auth-brand-box {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #1E3A8A, #0F766E);
          box-shadow: 0 14px 28px rgba(15,118,110,0.34);
          border: 1px solid rgba(255,255,255,0.16);
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
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(14px);
        }

        .info-icon { 
          background: rgba(255,255,255,0.16); 
          padding: 8px; 
          border-radius: 12px; 
          display: flex; 
          color: #5EEAD4;
        }

        .auth-form-container {
          flex: 1;
          padding: 70px 54px;
          background: #ffffff;
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
          border: 1px solid #E2E8F0;
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
          background: #ffffff;
          color: var(--auth-primary);
          box-shadow: 0 10px 20px rgba(15,23,42,0.08);
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
          color: #94A3B8; 
          transition: color 0.3s ease; 
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
          color: var(--text-main); 
        }

        .auth-input { 
          width: 100%; 
          padding: 16px 48px; 
          background-color: var(--input-bg); 
          border: 1px solid var(--input-border); 
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
          color: #94A3B8; 
          font-weight: 500; 
        }

        .input-wrapper:focus-within .input-icon { 
          color: var(--auth-secondary); 
        }

        .input-wrapper:focus-within .auth-input { 
          border-color: var(--auth-secondary); 
          box-shadow: 0 0 0 4px rgba(15,118,110,0.12); 
          background-color: #ffffff; 
        }

        .auth-btn { 
          width: 100%; 
          padding: 18px; 
          background: linear-gradient(135deg, var(--auth-primary), var(--auth-secondary)); 
          color: white; 
          border: none; 
          border-radius: 16px; 
          font-size: 16px; 
          font-weight: 900; 
          cursor: pointer; 
          margin-bottom: 24px; 
          transition: all 0.3s ease; 
          box-shadow: 0 14px 28px rgba(15,118,110,0.26); 
        }

        .auth-btn:hover { 
          transform: translateY(-3px); 
          box-shadow: 0 22px 42px rgba(15,118,110,0.38); 
        }

        .auth-btn:disabled { 
          opacity: 0.7; 
          cursor: not-allowed; 
          transform: none; 
        }

        .auth-link { 
          color: var(--auth-primary); 
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
          color: var(--auth-secondary); 
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
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 15px;
          text-align: center;
        }

        .auth-stat-card h4 {
          color: #1E3A8A;
          font-size: 22px;
          font-weight: 950;
          margin: 0 0 4px;
        }

        .auth-stat-card span {
          color: #64748B;
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
                  <Inventory2Icon fontSize="large" />
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
              {view === "register" && "Create Workspace"}
              {view === "forgot" && "Reset Credentials"}
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", marginBottom: "32px", lineHeight: 1.6, fontWeight: 600 }}>
              {view === "login" && pageContent[role].rightLoginSub}
              {view === "register" && pageContent[role].rightRegSub}
              {view === "forgot" && "Enter your registered email to receive recovery instructions."}
            </p>

            {view !== "forgot" && (
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
                  className={`role-btn ${role === "admin" ? "active" : ""}`}
                  onClick={() => handleRoleChange("admin")}
                >
                  <AdminPanelSettingsRoundedIcon fontSize="small" /> Admin Access
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              {error && <div className="error-message">{error}</div>}

              {view === "register" && (
                <>
                  <div className="input-wrapper">
                    <PersonRoundedIcon className="input-icon" fontSize="small" />
                    <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Full Name" required className="auth-input" />
                  </div>
                  
                  {/* ADDED: Department Dropdown */}
                  <div className="input-wrapper">
                    <ApartmentRoundedIcon className="input-icon" fontSize="small" />
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      className="auth-input"
                    >
                      <option value="" disabled>Select Department</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Administration">Administration</option>
                      <option value="Finance & Accounts">Finance & Accounts</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                </>
              )}

              <div className="input-wrapper">
                <EmailRoundedIcon className="input-icon" fontSize="small" />
                <input name="email" value={formData.email} onChange={handleInputChange} placeholder="Work Email Address" type="email" required className="auth-input" />
              </div>

              {(view === "login" || view === "register") && (
                <div className="input-wrapper" style={{ marginBottom: view === "login" ? "12px" : "16px" }}>
                  <LockRoundedIcon className="input-icon" fontSize="small" />
                  <input name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" type={showPassword ? "text" : "password"} required className="auth-input" />
                  <button type="button" className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                  </button>
                </div>
              )}

              {view === "register" && (
                <div className="input-wrapper" style={{ marginBottom: "32px" }}>
                  <LockRoundedIcon className="input-icon" fontSize="small" />
                  <input name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Confirm Password" type={showConfirmPassword ? "text" : "password"} required className="auth-input" />
                  <button type="button" className="input-icon-right" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                  </button>
                </div>
              )}

              {view === "login" && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "32px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "14px", cursor: "pointer", fontWeight: "600" }}>
                    <input type="checkbox" style={{ accentColor: "var(--auth-secondary)", width: "16px", height: "16px" }} /> Remember me
                  </label>
                  <button type="button" className="auth-link" onClick={() => navigate('/forgot-password')}>Forgot Password?</button>
                </div>
              )}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Processing..." : view === "login" ? "Secure Login" : view === "register" ? "Complete Registration" : "Send Recovery Link"}
              </button>
            </form>

            <div style={{ color: "var(--text-muted)", fontSize: "14px", fontWeight: "600", textAlign: "center" }}>
              {view === "login" && <>Don't have an account? <button type="button" className="auth-link" onClick={() => handleViewChange("register")}>Register Here</button></>}
              {view === "register" && <>Already have an account? <button type="button" className="auth-link" onClick={() => handleViewChange("login")}>Sign In</button></>}
              {view === "forgot" && <button type="button" className="auth-link" onClick={() => handleViewChange("login")}>← Back to Login</button>}
            </div>

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