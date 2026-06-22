import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import VerifiedIcon from "@mui/icons-material/Verified";
import BuildIcon from "@mui/icons-material/Build";
import ApprovalIcon from "@mui/icons-material/Approval";
import ReportIcon from "@mui/icons-material/Assessment";
import BusinessIcon from "@mui/icons-material/Business";
import HistoryIcon from "@mui/icons-material/History";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

const Features = () => {
  const navigate = useNavigate();

  const data = [
    [
      "Warranty Intelligence",
      "Track warranty start/end dates, AMC, expiry alerts and coverage status.",
      <VerifiedIcon fontSize="large" />,
      "/admin/assets",
    ],
    [
      "Breakdown Ticketing",
      "Raise tickets for damaged or faulty assets with priority and issue details.",
      <BuildIcon fontSize="large" />,
      "/tickets",
    ],
    [
      "Department Approval",
      "Send requests to HOD/admin before repair, replacement or paid service.",
      <ApprovalIcon fontSize="large" />,
      "/admin/approvals",
    ],
    [
      "Vendor Management",
      "Store OEM/vendor service contacts, emails, website and complaint process.",
      <BusinessIcon fontSize="large" />,
      "/admin/vendors",
    ],
    [
      "Service History",
      "Maintain full repair history, complaint number, technician notes and closure remarks.",
      <HistoryIcon fontSize="large" />,
      "/tickets",
    ],
    [
      "Reports",
      "Generate department-wise, warranty-wise, vendor-wise and breakdown reports.",
      <ReportIcon fontSize="large" />,
      "/admin/dashboard",
    ],
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
          background:
            radial-gradient(circle at top left, rgba(15,118,110,0.10), transparent 32%),
            radial-gradient(circle at top right, rgba(30,58,138,0.12), transparent 34%),
            #F8FAFC;
          min-height: 100vh;
        }

        .features-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .features-hero {
          padding: 140px 24px 52px;
        }

        .feature-highlight-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 18px;
          margin-top: 38px;
        }

        .feature-highlight-item {
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: 18px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #0F172A;
          font-size: 15px;
          font-weight: 800;
          box-shadow: 0 12px 28px rgba(15,23,42,0.05);
          backdrop-filter: blur(14px);
        }

        .feature-highlight-icon {
          color: #0F766E;
          display: flex;
        }

        .feat-section {
          padding: 18px 24px 105px;
        }

        .feat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 30px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .feat-card {
          background: rgba(255,255,255,0.9);
          border: 1px solid #E2E8F0;
          border-radius: 28px;
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: all 0.35s ease;
          box-shadow: 0 10px 24px rgba(15,23,42,0.04);
          position: relative;
          overflow: hidden;
        }

        .feat-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(30,58,138,0.07), rgba(15,118,110,0.07));
          opacity: 0;
          transition: 0.35s ease;
        }

        .feat-card::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 5px;
          background: linear-gradient(135deg, #1E3A8A, #0F766E);
          transform: scaleX(0);
          transform-origin: left;
          transition: 0.35s ease;
        }

        .feat-card:hover {
          transform: translateY(-10px);
          border-color: rgba(15,118,110,0.32);
          box-shadow: 0 26px 55px rgba(15,23,42,0.10);
        }

        .feat-card:hover::before {
          opacity: 1;
        }

        .feat-card:hover::after {
          transform: scaleX(1);
        }

        .feat-card-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .feat-icon {
          width: 66px;
          height: 66px;
          background: linear-gradient(135deg, #1E3A8A, #0F766E);
          color: #ffffff;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          box-shadow: 0 14px 28px rgba(15,118,110,0.26);
          transition: all 0.35s ease;
        }

        .feat-card:hover .feat-icon {
          transform: rotate(-6deg) scale(1.06);
          box-shadow: 0 20px 36px rgba(15,118,110,0.34);
        }

        .feat-title {
          font-size: 23px;
          font-weight: 900;
          color: #0F172A;
          margin-bottom: 14px;
          letter-spacing: -0.5px;
        }

        .feat-text {
          font-size: 16px;
          line-height: 1.65;
          color: #64748B;
          flex: 1;
          font-weight: 600;
        }

        .feat-link {
          margin-top: 30px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 900;
          font-size: 14px;
          color: #1E3A8A;
        }

        .feat-arrow {
          transition: transform 0.3s ease;
          color: #0F766E;
        }

        .feat-card:hover .feat-arrow {
          transform: translateX(8px);
        }

        .features-bottom-cta {
          max-width: 1400px;
          margin: 0 auto;
          margin-top: 34px;
          background:
            radial-gradient(circle at 85% 20%, rgba(20,184,166,0.25), transparent 34%),
            linear-gradient(135deg, #0F172A, #1E3A8A);
          border-radius: 32px;
          padding: 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          box-shadow: 0 26px 58px rgba(15,23,42,0.24);
        }

        .features-bottom-cta h2 {
          color: #FFFFFF;
          font-size: 32px;
          font-weight: 950;
          margin: 0 0 10px;
          letter-spacing: -1px;
        }

        .features-bottom-cta p {
          color: #CBD5E1;
          font-size: 16px;
          line-height: 1.6;
          margin: 0;
          max-width: 680px;
          font-weight: 600;
        }

        .cta-btn {
          background: #FFFFFF;
          color: #1E3A8A;
          border: none;
          padding: 15px 24px;
          border-radius: 999px;
          font-weight: 900;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: 0.3s ease;
          box-shadow: 0 16px 32px rgba(0,0,0,0.18);
        }

        .cta-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 42px rgba(0,0,0,0.22);
        }

        @media (max-width: 768px) {
          .features-hero {
            padding-top: 125px;
          }

          .feat-grid {
            grid-template-columns: 1fr;
          }

          .features-bottom-cta {
            padding: 34px 26px;
          }

          .features-bottom-cta h2 {
            font-size: 28px;
          }
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
                  <span className="feature-highlight-icon">
                    <CheckCircleRoundedIcon fontSize="small" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="feat-section">
          <div className="feat-grid">
            {data.map((item) => (
              <div
                key={item[0]}
                className="feat-card"
                onClick={() => navigate(item[3])}
              >
                <div className="feat-card-content">
                  <div className="feat-icon">{item[2]}</div>

                  <h3 className="feat-title">{item[0]}</h3>

                  <p className="feat-text">{item[1]}</p>

                  <div className="feat-link">
                    Explore Module
                    <ArrowForwardRoundedIcon
                      className="feat-arrow"
                      fontSize="small"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="features-bottom-cta">
            <div>
              <h2>Manage every asset from one clean dashboard.</h2>
              <p>
                Track warranty, complaints, approvals, vendors and service
                history with a structured workflow built for company operations.
              </p>
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