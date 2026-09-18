import { Link } from "react-router-dom";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const Footer = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');

        .site-footer {
          background-color: #0B0D17;
          border-top: 1px solid rgba(119, 119, 199, 0.22);
          padding: 80px 0 32px;
          margin-top: 0;
          color: #94A3B8;
          font-family: 'Poppins', 'Inter', -apple-system, sans-serif;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 24px;
          padding-right: 24px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.2fr;
          gap: 48px;
          margin-bottom: 56px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .footer-brand-logo {
          width: 34px;
          height: 34px;
          object-fit: contain;
          display: block;
        }

        .footer-brand h3 {
          font-family: 'Poppins', sans-serif;
          font-size: 20px;
          font-weight: 900;
          color: #FFFFFF;
          letter-spacing: -0.4px;
          margin: 0;
        }

        .footer-desc {
          line-height: 1.7;
          font-size: 14px;
          max-width: 360px;
          color: #94A3B8;
          font-weight: 400;
          margin: 0 0 22px;
        }

        .footer-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 16px;
          border-radius: 9999px;
          background-color: #161B2E;
          border: 1px solid rgba(119, 119, 199, 0.3);
          color: #7777C7;
          font-family: 'Poppins', sans-serif;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .footer-col h4 {
          font-family: 'Poppins', sans-serif;
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 800;
          margin-bottom: 20px;
          margin-top: 0;
          letter-spacing: -0.2px;
        }

        .footer-col a {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94A3B8;
          text-decoration: none;
          margin-bottom: 13px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .footer-col a:hover {
          color: #7777C7;
          transform: translateX(4px);
        }

        .footer-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
          color: #94A3B8;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.55;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .footer-contact-item:hover {
          color: #FFFFFF;
        }

        .footer-contact-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background-color: #1E233D;
          color: #7777C7;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 24px;
          padding-right: 24px;
          border-top: 1px solid rgba(119, 119, 199, 0.12);
          padding-top: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 13px;
          color: #64748B;
        }

        .footer-bottom p {
          margin: 0;
          font-weight: 500;
        }

        .footer-bottom-links {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .footer-bottom-links a {
          color: #94A3B8;
          text-decoration: none;
          font-weight: 500;
          transition: 0.2s ease;
        }

        .footer-bottom-links a:hover {
          color: #7777C7;
        }

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
              <img src="/logo_home.png" alt="IAssetCare" className="footer-brand-logo" />
              <h3>IAssetCare</h3>
            </div>
            <p className="footer-desc">
              A professional enterprise asset service and warranty management platform to track assets, service tickets, vendor coordination, approvals and complete lifecycle logs.
            </p>
            <div className="footer-badge">
              Enterprise Asset Care System
            </div>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <Link to="/"><ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />Home</Link>
            <Link to="/features"><ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />Features</Link>
            <Link to="/modules"><ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />Modules</Link>
            <Link to="/workflow"><ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />Workflow</Link>
          </div>

          <div className="footer-col">
            <h4>Portal</h4>
            <Link to="/admin/dashboard"><ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />System Dashboard</Link>
            <Link to="/login"><ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />Secure Login</Link>
            <Link to="/contact"><ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />Request Demo</Link>
          </div>

          <div className="footer-col">
            <h4>Contact &amp; Support</h4>
            <a href="mailto:iassetcare@icpljpr.com" className="footer-contact-item">
              <div className="footer-contact-icon"><EmailRoundedIcon sx={{ fontSize: 18 }} /></div>
              <div>iassetcare@icpljpr.com</div>
            </a>
            <a href="tel:+919027007508" className="footer-contact-item">
              <div className="footer-contact-icon"><PhoneRoundedIcon sx={{ fontSize: 18 }} /></div>
              <div>+91 90270 07508</div>
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 IAssetCare. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/contact">Support</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/refund-policy">Refund &amp; Cancellation</Link>
            <Link to="/login">Login</Link>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
