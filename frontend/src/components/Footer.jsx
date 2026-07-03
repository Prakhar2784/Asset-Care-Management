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
          background: #000000;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding: 72px 24px 24px;
          color: #9CA3AF;
          font-family: 'Inter', sans-serif;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.2fr;
          gap: 48px;
          margin-bottom: 56px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 18px;
        }

        .footer-brand-icon {
          background: #111827;
          color: #FFFFFF;
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .footer-brand h3 {
          font-size: 20px;
          font-weight: 900;
          color: #FFFFFF;
          letter-spacing: -0.5px;
          margin: 0;
        }

        .footer-desc {
          line-height: 1.75;
          font-size: 14.5px;
          max-width: 360px;
          color: #9CA3AF;
          font-weight: 500;
          margin-bottom: 22px;
        }

        .footer-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          border-radius: 999px;
          background: rgba(17,24,39,0.08);
          border: 1px solid rgba(17,24,39,0.18);
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.3px;
        }

        .footer-col h4 {
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 900;
          margin-bottom: 22px;
          margin-top: 0;
          letter-spacing: -0.2px;
        }

        .footer-col a {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #7A7A74;
          text-decoration: none;
          margin-bottom: 14px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.22s ease;
        }

        .footer-col a:hover {
          color: #FFFFFF;
          transform: translateX(4px);
        }

        .footer-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
          color: #7A7A74;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.55;
        }

        .footer-contact-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(17,24,39,0.08);
          color: #FFFFFF;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          border-top: 1px solid rgba(255,255,255,0.07);
          padding-top: 22px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 13px;
          color: #9CA3AF;
        }

        .footer-bottom p { margin: 0; font-weight: 600; }

        .footer-bottom-links {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
        }

        .footer-bottom-links a {
          color: #9CA3AF;
          text-decoration: none;
          font-weight: 600;
          transition: 0.2s ease;
        }

        .footer-bottom-links a:hover { color: #FFFFFF; }

        @media (max-width: 900px) {
          .footer-container {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .site-footer { padding-top: 56px; }
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
              A professional asset service and warranty management platform for enterprises to track assets, breakdown tickets, vendors, approvals and complete service history.
            </p>
            <div className="footer-badge">
              Enterprise Asset Management System
            </div>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <Link to="/"><ArrowForwardRoundedIcon fontSize="small" />Home</Link>
            <Link to="/features"><ArrowForwardRoundedIcon fontSize="small" />Features</Link>
            <Link to="/modules"><ArrowForwardRoundedIcon fontSize="small" />Modules</Link>
            <Link to="/workflow"><ArrowForwardRoundedIcon fontSize="small" />Workflow</Link>
          </div>

          <div className="footer-col">
            <h4>Portal</h4>
            <Link to="/admin/dashboard"><ArrowForwardRoundedIcon fontSize="small" />System Dashboard</Link>
            <Link to="/login"><ArrowForwardRoundedIcon fontSize="small" />Secure Login</Link>
            <Link to="/contact"><ArrowForwardRoundedIcon fontSize="small" />Request Demo</Link>
          </div>

          <div className="footer-col">
            <h4>Contact</h4>
            <div className="footer-contact-item">
              <div className="footer-contact-icon"><EmailRoundedIcon fontSize="small" /></div>
              <div>admin@assetcare.com<br />support@assetcarepro.com</div>
            </div>
            <div className="footer-contact-item">
              <div className="footer-contact-icon"><PhoneRoundedIcon fontSize="small" /></div>
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
