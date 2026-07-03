import { useNavigate } from "react-router-dom";
import VerifiedIcon from "@mui/icons-material/Verified";
import BuildIcon from "@mui/icons-material/Build";
import ApprovalIcon from "@mui/icons-material/Approval";
import ReportIcon from "@mui/icons-material/Assessment";
import HistoryIcon from "@mui/icons-material/History";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const Features = () => {
  const navigate = useNavigate();

  const data = [
    ["Warranty Intelligence", "Track warranty start/end dates, AMC, expiry alerts and coverage status.", <VerifiedIcon fontSize="large" />, "/admin/assets"],
    ["Breakdown Ticketing", "Raise tickets for damaged or faulty assets with priority and issue details.", <BuildIcon fontSize="large" />, "/tickets"],
    ["Department Approval", "Send requests to HOD/admin before repair, replacement or paid service.", <ApprovalIcon fontSize="large" />, "/admin/approvals"],
    ["Service History", "Maintain full repair history, complaint number, technician notes and closure remarks.", <HistoryIcon fontSize="large" />, "/tickets"],
    ["Reports", "Generate department-wise, warranty-wise, vendor-wise and breakdown reports.", <ReportIcon fontSize="large" />, "/admin/dashboard"],
  ];

  const highlights = [
    "Centralized asset records",
    "Warranty & AMC alerts",
    "Ticket lifecycle tracking",
  ];

  return (
    <>
      <style>{`
        .features-page {
          background: #0B0D12;
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
          background: rgba(20,20,20,0.7);
          border: 1px solid rgba(17,24,39,0.15);
          border-radius: 16px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 800;
          box-shadow: 0 4px 16px rgba(17,17,17,0.05);
        }

        .feature-highlight-dot {
          width: 22px; height: 22px; border-radius: 50%;
          background: #111827; color: #FFFFFF;
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
          background: rgba(20,20,20,0.7);
          border: 1px solid rgba(17,24,39,0.15);
          border-radius: 24px;
          padding: 32px 28px;
          display: flex; flex-direction: column;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(17,17,17,0.04);
          position: relative; overflow: hidden;
        }

        .feat-icon {
          width: 56px; height: 56px;
          background: #111827; color: #FFFFFF;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }

        .feat-title { font-size: 20px; font-weight: 900; color: #FFFFFF; margin-bottom: 12px; letter-spacing: -0.4px; }

        .feat-text { font-size: 15px; line-height: 1.65; color: #CBD5E1; flex: 1; font-weight: 500; }

        .feat-link {
          margin-top: 26px;
          display: inline-flex; align-items: center; gap: 7px;
          font-weight: 800; font-size: 13.5px; color: #FFFFFF;
        }

        .feat-arrow { }

        .features-bottom-cta {
          max-width: 1400px; margin: 28px auto 0;
          background: #111827;
          border-radius: 28px; padding: 40px 44px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 24px; flex-wrap: wrap;
          position: relative; overflow: hidden;
        }

        .features-bottom-cta::before {
          content: "";
          position: absolute; top: -80px; right: -80px;
          width: 240px; height: 240px;
          background: radial-gradient(circle, rgba(17,24,39,0.14), transparent 70%);
          border-radius: 50%; pointer-events: none;
        }

        .features-bottom-cta h2 {
          color: #FFFFFF; font-size: 30px; font-weight: 950;
          margin: 0 0 8px; letter-spacing: -0.9px; position: relative; z-index: 1;
        }

        .features-bottom-cta p {
          color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.65; margin: 0;
          max-width: 600px; font-weight: 500; position: relative; z-index: 1;
        }

        .cta-btn {
          background: #111827; color: #FFFFFF;
          border: none; padding: 14px 26px; border-radius: 999px;
          font-weight: 900; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: 0.25s ease; font-size: 14px;
          position: relative; z-index: 1; white-space: nowrap;
        }

        .cta-btn:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(17,24,39,0.3); }

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
            <div style={{ marginBottom: 32 }}>
              <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>Platform Features</div>
              <h1 style={{ color: '#FFFFFF', fontWeight: 950, fontSize: 'clamp(32px,4vw,52px)', letterSpacing: '-1.5px', lineHeight: 1.1, margin: '0 0 16px' }}>Powerful features for complete asset control</h1>
              <p style={{ color: '#CBD5E1', fontSize: 17, fontWeight: 500, lineHeight: 1.7, maxWidth: 640, margin: 0 }}>AssetCare Pro is designed for companies that want proper tracking of assets, service complaints, warranties and approvals.</p>
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
