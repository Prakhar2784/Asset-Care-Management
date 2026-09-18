import { useNavigate } from "react-router-dom";
import VerifiedIcon from "@mui/icons-material/Verified";
import BuildIcon from "@mui/icons-material/Build";
import BusinessIcon from "@mui/icons-material/Business";
import ApprovalIcon from "@mui/icons-material/Approval";
import ReportIcon from "@mui/icons-material/Assessment";
import HistoryIcon from "@mui/icons-material/History";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const Features = () => {
  const navigate = useNavigate();

  const data = [
    ["Warranty Intelligence", "Track warranty start/end dates, AMC contracts, renewal alerts and service eligibility across all assets.", <VerifiedIcon sx={{ fontSize: 28 }} />, "/admin/assets"],
    ["Service Request Management", "Raise service tickets for damaged or faulty assets with priority, issue photos and complete logs.", <BuildIcon sx={{ fontSize: 28 }} />, "/tickets"],
    ["Multi-Level Approvals", "Route maintenance requests to department HODs and admin before initiating repair or paid service.", <ApprovalIcon sx={{ fontSize: 28 }} />, "/admin/approvals"],
    ["Vendor & OEM Coordination", "Manage vendor directories, service schedules, technician contact details and service SLA records.", <BusinessIcon sx={{ fontSize: 28 }} />, "/admin/vendors"],
    ["Permanent Service History", "Maintain full repair history, resolution details, technician notes, spare costs and closure remarks.", <HistoryIcon sx={{ fontSize: 28 }} />, "/tickets"],
    ["Reports & Analytics", "Generate department-wise, warranty-wise, vendor-wise and request summaries for informed decisions.", <ReportIcon sx={{ fontSize: 28 }} />, "/admin/dashboard"],
  ];

  const highlights = [
    "Centralized Asset Records",
    "Automated Warranty Alerts",
    "Approval-Based Service Control",
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');

        .features-page {
          background-color: #0B0D17;
          min-height: 100vh;
          color: #FFFFFF;
          font-family: 'Poppins', 'Inter', -apple-system, sans-serif;
        }

        .features-container {
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 24px;
          padding-right: 24px;
        }

        .features-hero {
          padding: 140px 0 48px;
        }

        .features-tag-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 9999px;
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          line-height: 1.4;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          background-color: #161B2E;
          color: #7777C7;
          border: 1px solid rgba(119, 119, 199, 0.35);
          margin-bottom: 16px;
        }

        .features-hero-title {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(34px, 4.5vw, 54px);
          line-height: 1.1;
          font-weight: 900;
          color: #FFFFFF;
          letter-spacing: -1.5px;
          margin: 0 0 16px;
        }

        .features-hero-sub {
          font-size: 16.5px;
          line-height: 1.7;
          color: #94A3B8;
          max-width: 640px;
          margin: 0;
          font-weight: 400;
        }

        .feature-highlight-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 36px;
        }

        .feature-highlight-item {
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.22);
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .feature-highlight-item:hover {
          transform: translateY(-2px);
          border-color: rgba(119, 119, 199, 0.4);
        }

        .feature-highlight-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: #161B2E;
          color: #7777C7;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .feat-section {
          padding: 16px 0 100px;
        }

        .feat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .feat-card {
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.22);
          border-radius: 20px;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
          position: relative;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .feat-card:hover {
          transform: translateY(-4px);
          border-color: rgba(119, 119, 199, 0.4);
          box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.7), 0 0 20px rgba(119, 119, 199, 0.12);
        }

        .feat-icon {
          width: 52px;
          height: 52px;
          background-color: #161B2E;
          color: #7777C7;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 22px;
        }

        .feat-title {
          font-family: 'Poppins', sans-serif;
          font-size: 19px;
          font-weight: 900;
          color: #FFFFFF;
          margin-bottom: 12px;
          letter-spacing: -0.4px;
        }

        .feat-text {
          font-size: 14.5px;
          line-height: 1.65;
          color: #94A3B8;
          flex: 1;
          font-weight: 400;
          margin: 0;
        }

        .feat-link {
          margin-top: 26px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-weight: 800;
          font-size: 13.5px;
          color: #7777C7;
          transition: gap 0.2s ease;
        }
        .feat-card:hover .feat-link {
          gap: 10px;
          color: #8C8CE0;
        }

        .features-bottom-cta {
          margin-top: 40px;
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.25);
          border-radius: 28px;
          padding: 44px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          flex-wrap: wrap;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7);
        }

        .features-bottom-cta::before {
          content: "";
          position: absolute;
          top: -80px;
          right: -80px;
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, rgba(119, 119, 199, 0.16), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .features-bottom-cta h2 {
          font-family: 'Poppins', sans-serif;
          color: #FFFFFF;
          font-size: 30px;
          font-weight: 900;
          margin: 0 0 10px;
          letter-spacing: -0.9px;
          position: relative;
          z-index: 1;
        }

        .features-bottom-cta p {
          color: #94A3B8;
          font-size: 15px;
          line-height: 1.65;
          margin: 0;
          max-width: 600px;
          font-weight: 400;
          position: relative;
          z-index: 1;
        }

        .cta-btn {
          background-color: #7777C7;
          color: #0B0C1A;
          border: 1px solid #7777C7;
          padding: 14px 28px;
          border-radius: 9999px;
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 14.5px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          z-index: 1;
          white-space: nowrap;
          box-shadow: 0 6px 20px rgba(119, 119, 199, 0.35);
        }

        .cta-btn:hover {
          background-color: #6464B8;
          border-color: #6464B8;
          color: #FFFFFF;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(119, 119, 199, 0.5);
        }

        @media (max-width: 1024px) {
          .feat-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .feature-highlight-strip {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .features-hero { padding-top: 120px; }
          .feat-grid { grid-template-columns: 1fr; }
          .features-bottom-cta { padding: 32px 24px; }
          .features-bottom-cta h2 { font-size: 24px; }
        }
      `}</style>

      <div className="features-page">
        <div className="features-hero">
          <div className="features-container">
            <div>
              <span className="features-tag-badge">Platform Features</span>
              <h1 className="features-hero-title">Powerful features for complete asset control</h1>
              <p className="features-hero-sub">IAssetCare is designed for enterprises that require systematic tracking of movable and immovable assets, service requests, warranties and approvals.</p>
            </div>
            <div className="feature-highlight-strip">
              {highlights.map((item) => (
                <div key={item} className="feature-highlight-item">
                  <span className="feature-highlight-dot">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="feat-section">
          <div className="features-container">
            <div className="feat-grid">
              {data.map((item) => (
                <div key={item[0]} className="feat-card" onClick={() => navigate(item[3])}>
                  <div className="feat-icon">{item[2]}</div>
                  <h3 className="feat-title">{item[0]}</h3>
                  <p className="feat-text">{item[1]}</p>
                  <div className="feat-link">
                    Explore Module
                    <ArrowForwardRoundedIcon fontSize="small" />
                  </div>
                </div>
              ))}
            </div>

            <div className="features-bottom-cta">
              <div>
                <h2>Manage every asset from one clean dashboard.</h2>
                <p>Track warranty, service requests, approvals, vendors and service history with a structured workflow built for company operations.</p>
              </div>
              <button className="cta-btn" onClick={() => navigate("/login")}>
                Access Portal <ArrowForwardRoundedIcon fontSize="small" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Features;
