import { Link } from "react-router-dom";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const Footer = () => {
  return (
    <>
      <style>{`
        .site-footer {
          background:
            radial-gradient(circle at top left, rgba(15,118,110,0.12), transparent 34%),
            linear-gradient(135deg, #0F172A, #111827);
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 80px 24px 26px;
          color: #CBD5E1;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .site-footer::before {
          content: "";
          position: absolute;
          top: -120px;
          right: -120px;
          width: 360px;
          height: 360px;
          background: radial-gradient(circle, rgba(20,184,166,0.22), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.2fr;
          gap: 48px;
          margin-bottom: 62px;
          position: relative;
          z-index: 1;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .footer-brand-icon {
          background: linear-gradient(135deg, #1E3A8A, #0F766E);
          color: #FFFFFF;
          padding: 10px;
          border-radius: 14px;
          display: flex;
          box-shadow: 0 12px 24px rgba(15,118,110,0.28);
        }

        .footer-brand h3 {
          font-size: 24px;
          font-weight: 950;
          color: #FFFFFF;
          letter-spacing: -0.6px;
          margin: 0;
        }

        .footer-desc {
          line-height: 1.75;
          font-size: 15px;
          max-width: 380px;
          color: #CBD5E1;
          font-weight: 500;
          margin-bottom: 26px;
        }

        .footer-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 15px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: #E2E8F0;
          font-size: 13px;
          font-weight: 800;
          backdrop-filter: blur(12px);
        }

        .footer-col h4 {
          color: #FFFFFF;
          font-size: 16px;
          font-weight: 900;
          margin-bottom: 24px;
          margin-top: 0;
          letter-spacing: -0.2px;
        }

        .footer-col a {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #CBD5E1;
          text-decoration: none;
          margin-bottom: 15px;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.25s ease;
        }

        .footer-col a:hover {
          color: #5EEAD4;
          transform: translateX(5px);
        }

        .footer-col a svg {
          opacity: 0;
          transform: translateX(-5px);
          transition: all 0.25s ease;
        }

        .footer-col a:hover svg {
          opacity: 1;
          transform: translateX(0);
        }

        .footer-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 18px;
          color: #CBD5E1;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.5;
        }

        .footer-contact-icon {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: rgba(20,184,166,0.12);
          color: #5EEAD4;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          border-top: 1px solid rgba(255,255,255,0.10);
          padding-top: 24px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 14px;
          color: #94A3B8;
          position: relative;
          z-index: 1;
        }

        .footer-bottom p {
          margin: 0;
          font-weight: 600;
        }

        .footer-bottom-links {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
        }

        .footer-bottom-links a {
          color: #94A3B8;
          text-decoration: none;
          font-weight: 600;
          transition: 0.25s ease;
        }

        .footer-bottom-links a:hover {
          color: #5EEAD4;
        }

        @media (max-width: 900px) {
          .footer-container {
            grid-template-columns: 1fr;
            gap: 38px;
          }

          .site-footer {
            padding-top: 64px;
          }
        }
      `}</style>

      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-col">
            <div className="footer-brand">
              <div className="footer-brand-icon">
                <Inventory2Icon fontSize="small" />
              </div>
              <h3>AssetCare Pro</h3>
            </div>

            <p className="footer-desc">
              A professional asset service and warranty management platform for
              enterprises to track assets, breakdown tickets, vendors,
              approvals and complete service history.
            </p>

            <div className="footer-badge">
              Enterprise Asset Management System
            </div>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <Link to="/">
              <ArrowForwardRoundedIcon fontSize="small" />
              Home
            </Link>
            <Link to="/features">
              <ArrowForwardRoundedIcon fontSize="small" />
              Features
            </Link>
            <Link to="/modules">
              <ArrowForwardRoundedIcon fontSize="small" />
              Modules
            </Link>
            <Link to="/workflow">
              <ArrowForwardRoundedIcon fontSize="small" />
              Workflow
            </Link>
          </div>

          <div className="footer-col">
            <h4>Portal</h4>
            <Link to="/admin/dashboard">
              <ArrowForwardRoundedIcon fontSize="small" />
              System Dashboard
            </Link>
            <Link to="/login">
              <ArrowForwardRoundedIcon fontSize="small" />
              Secure Login
            </Link>
            <Link to="/contact">
              <ArrowForwardRoundedIcon fontSize="small" />
              Request Demo
            </Link>
          </div>

          <div className="footer-col">
            <h4>Contact</h4>

            <div className="footer-contact-item">
              <div className="footer-contact-icon">
                <EmailRoundedIcon fontSize="small" />
              </div>
              <div>
                admin@assetcare.com
                <br />
                support@assetcarepro.com
              </div>
            </div>

            <div className="footer-contact-item">
              <div className="footer-contact-icon">
                <PhoneRoundedIcon fontSize="small" />
              </div>
              <div>+91 800-456-7890</div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 AssetCare Systems. All rights reserved.</p>

          <div className="footer-bottom-links">
            <Link to="/contact">Support</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/login">Login</Link>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;