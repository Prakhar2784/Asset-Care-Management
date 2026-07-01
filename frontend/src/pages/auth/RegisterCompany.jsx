import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";

const RegisterCompany = () => {
  const navigate = useNavigate();
  
  // Form State
  const [formData, setFormData] = useState({
    companyName: "",
    slug: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    adminPhone: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    // Slugs must be alphanumeric and lowercase only
    if (name === "slug") {
      value = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    }
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register-company", formData);
      setSuccess(true);
      setLoading(false);
      
      // Auto login the admin
      const { user } = response.data;
      localStorage.setItem("assetcare_user", JSON.stringify(user));

      setTimeout(() => {
        // Redirect to admin dashboard with the query parameter to set context
        navigate(`/admin/dashboard?tenant=${formData.slug}`);
        // Reload to force axios interceptor and theme context to fetch company branding
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Registration failed. Please check your inputs.");
    }
  };

  return (
    <div className="auth-container">
      <style>{`
        .auth-container {
          display: flex;
          min-height: 100vh;
          background: #090909;
          font-family: 'Inter', sans-serif;
          color: #ffffff;
          overflow: hidden;
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
          background: radial-gradient(circle, rgba(168,85,247,0.12) 0%, rgba(0,0,0,0) 70%);
          border: 1px dashed rgba(168,85,247,0.15);
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
          background: #A855F7;
          display: grid;
          place-items: center;
          color: #090909;
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
          background: rgba(168,85,247,0.1);
          color: #A855F7;
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
          border-color: #A855F7;
          background: #181818;
          box-shadow: 0 0 0 4px rgba(168,85,247,0.1);
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
          background: #A855F7;
          color: #090909;
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
          box-shadow: 0 8px 20px rgba(168,85,247,0.3);
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
          color: #A855F7;
          text-decoration: none;
          font-weight: 600;
        }

        .auth-link:hover {
          text-decoration: underline;
        }

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
          <h1 className="info-title">Launch Your Own Asset Workspace.</h1>
          <p className="info-desc">
            Equip your entire organization with isolated ticket management, dynamic inventories, 
            and complete hardware lifecycle tracking under your corporate identity.
          </p>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <ApartmentRoundedIcon fontSize="small" />
            </div>
            <div className="feature-details">
              <h4>Isolated Company Profile</h4>
              <p>Your team members register and operate in a secure, isolated database partition.</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <LanguageRoundedIcon fontSize="small" />
            </div>
            <div className="feature-details">
              <h4>Custom Corporate Branding</h4>
              <p>Set corporate colors and upload logos to personalize your dashboard context.</p>
            </div>
          </div>
        </div>

        <div style={{ color: "#444444", fontSize: "12px", zIndex: 2 }}>
          &copy; 2026 AssetCare PaaS. All rights reserved.
        </div>
      </div>

      {/* RIGHT FORM SIDE */}
      <div className="auth-form-side">
        <div className="form-card">
          <h2 className="form-title">Register Company</h2>
          <p className="form-sub">Create your tenant workspace and primary admin profile.</p>

          {error && <div className="error-banner">{error}</div>}
          
          {success && (
            <div className="success-banner">
              <CheckCircleOutlineRoundedIcon sx={{ fontSize: 40 }} />
              <div>
                <strong>Workspace Created!</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#888888" }}>
                  Provisioning your dashboard... redirecting shortly.
                </p>
              </div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              {/* Company Section */}
              <div className="input-group">
                <span className="input-icon"><ApartmentRoundedIcon fontSize="small" /></span>
                <input
                  type="text"
                  name="companyName"
                  placeholder="Company Name"
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
                  placeholder="Company Slug / URL (e.g., acme)"
                  className="auth-input"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div style={{ borderBottom: "1px solid #222", margin: "24px 0 20px 0" }}></div>

              {/* Admin Section */}
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
                  type="text"
                  name="adminPhone"
                  placeholder="Admin Phone Number"
                  className="auth-input"
                  value={formData.adminPhone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="input-group">
                <span className="input-icon"><LockRoundedIcon fontSize="small" /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="adminPassword"
                  placeholder="Create Admin Password"
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

              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? "Registering..." : "Launch Workspace"}
              </button>
            </form>
          )}

          <div className="auth-footer">
            Already have an active company workspace?{" "}
            <Link to="/login" className="auth-link">
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCompany;
