import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import VerifiedIcon from "@mui/icons-material/Verified";
import BuildIcon from "@mui/icons-material/Build";
import ApprovalIcon from "@mui/icons-material/Approval";
import ReportIcon from "@mui/icons-material/Assessment";
import BusinessIcon from "@mui/icons-material/Business";
import HistoryIcon from "@mui/icons-material/History";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const Features = () => {
  const navigate = useNavigate();

  const data = [
    ["Warranty Intelligence", "Track warranty start/end dates, AMC, expiry alerts and coverage status.", <VerifiedIcon fontSize="large" />, "/admin/assets"],
    ["Breakdown Ticketing", "Raise tickets for damaged or faulty assets with priority and issue details.", <BuildIcon fontSize="large" />, "/tickets"],
    ["Department Approval", "Send requests to HOD/admin before repair, replacement or paid service.", <ApprovalIcon fontSize="large" />, "/admin/approvals"],
    ["Vendor Management", "Store OEM/vendor service contacts, emails, website and complaint process.", <BusinessIcon fontSize="large" />, "/admin/vendors"],
    ["Service History", "Maintain full repair history, complaint number, technician notes and closure remarks.", <HistoryIcon fontSize="large" />, "/tickets"],
    ["Reports", "Generate department-wise, warranty-wise, vendor-wise and breakdown reports.", <ReportIcon fontSize="large" />, "/admin/dashboard"],
  ];

  const highlights = [
    "Centralized asset records",
    "Warranty & AMC alerts",
    "Ticket lifecycle tracking",
    "Vendor complaint history",
  ];

  return (
    <>
      <style>{`
        .features-page {
          background: #ECEAE3;
          min-height: 100vh;
        }

        .features-container { max-width: 1400px; margin: 0 auto; }

        .features-hero { padding: 140px 24px 48px; }

        .feature-highlight-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 14px;
          margin-top: 34px;
        }

        .feature-highlight-item {
          background: #FFFFFF;
          border: 1px solid rgba(17,17,17,0.08);
          border-radius: 16px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #111111;
          font-size: 14px;
          font-weight: 800;
          box-shadow: 0 4px 16px rgba(17,17,17,0.05);
        }

        .feature-highlight-dot {
          width: 22px; height: 22px; border-radius: 50%;
          background: #111111; color: #CBFA57;
          display: grid; place-items: center;
          font-size: 11px; font-weight: 900; flex-shrink: 0;
        }

        .feat-section { padding: 18px 24px 100px; }

        .feat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .feat-card {
          background: #FFFFFF;
          border: 1px solid rgba(17,17,17,0.08);
          border-radius: 24px;
          padding: 32px 28px;
          display: flex; flex-direction: column;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(17,17,17,0.04);
          position: relative; overflow: hidden;
        }

        .feat-card::after {
          content: "";
          position: absolute; top: 0; left: 0;
          width: 100%; height: 4px;
          background: #CBFA57;
          transform: scaleX(0); transform-origin: left;
          transition: 0.3s ease;
        }

        .feat-card:hover {
          transform: translateY(-8px);
          border-color: rgba(17,17,17,0.18);
          box-shadow: 0 24px 48px rgba(17,17,17,0.10);
        }

        .feat-card:hover::after { transform: scaleX(1); }

        .feat-icon {
          width: 56px; height: 56px;
          background: #111111; color: #CBFA57;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          transition: all 0.3s ease;
        }

        .feat-card:hover .feat-icon { transform: rotate(-6deg) scale(1.06); }

        .feat-title { font-size: 20px; font-weight: 900; color: #111111; margin-bottom: 12px; letter-spacing: -0.4px; }

        .feat-text { font-size: 15px; line-height: 1.65; color: #6B6B65; flex: 1; font-weight: 500; }

        .feat-link {
          margin-top: 26px;
          display: inline-flex; align-items: center; gap: 7px;
          font-weight: 800; font-size: 13.5px; color: #111111;
        }

        .feat-arrow { transition: transform 0.28s ease; }
        .feat-card:hover .feat-arrow { transform: translateX(7px); }

        .features-bottom-cta {
          max-width: 1400px; margin: 28px auto 0;
          background: #111111;
          border-radius: 28px; padding: 40px 44px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 24px; flex-wrap: wrap;
          position: relative; overflow: hidden;
        }

        .features-bottom-cta::before {
          content: "";
          position: absolute; top: -80px; right: -80px;
          width: 240px; height: 240px;
          background: radial-gradient(circle, rgba(203,250,87,0.14), transparent 70%);
          border-radius: 50%; pointer-events: none;
        }

        .features-bottom-cta h2 {
          color: #FFFFFF; font-size: 30px; font-weight: 950;
          margin: 0 0 8px; letter-spacing: -0.9px; position: relative; z-index: 1;
        }

        .features-bottom-cta p {
          color: #7A7A74; font-size: 15px; line-height: 1.65; margin: 0;
          max-width: 600px; font-weight: 500; position: relative; z-index: 1;
        }

        .cta-btn {
          background: #CBFA57; color: #111111;
          border: none; padding: 14px 26px; border-radius: 999px;
          font-weight: 900; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: 0.25s ease; font-size: 14px;
          position: relative; z-index: 1; white-space: nowrap;
        }

        .cta-btn:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(203,250,87,0.3); }

        @media (max-width: 768px) {
          .features-hero { padding-top: 120px; }
          .feat-grid { grid-template-columns: 1fr; }
          .features-bottom-cta { padding: 30px 24px; }
          .features-bottom-cta h2 { font-size: 24px; }
        }
      `}</style>

      <div className="features-page">
        <div className="features-hero">
          <div className="features-container">
            <PageHeader
              label="Platform Features"
              title="Powerful features for complete asset control"
              text="AssetCare Pro is designed for companies that want proper tracking of assets, service complaints, warranties and approvals."
            />
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
          <div className="feat-grid">
            {data.map((item) => (
              <div key={item[0]} className="feat-card" onClick={() => navigate(item[3])}>
                <div className="feat-icon">{item[2]}</div>
                <h3 className="feat-title">{item[0]}</h3>
                <p className="feat-text">{item[1]}</p>
                <div className="feat-link">
                  Explore Module
                  <ArrowForwardRoundedIcon className="feat-arrow" fontSize="small" />
                </div>
              </div>
            ))}
          </div>

          <div className="features-bottom-cta">
            <div>
              <h2>Manage every asset from one clean dashboard.</h2>
              <p>Track warranty, complaints, approvals, vendors and service history with a structured workflow built for company operations.</p>
            </div>
            <button className="cta-btn" onClick={() => navigate("/login")}>
              Access Portal <ArrowForwardRoundedIcon fontSize="small" />
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default Features;
