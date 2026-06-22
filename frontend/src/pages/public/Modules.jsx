import PageHeader from "../../components/PageHeader";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import ApprovalRoundedIcon from "@mui/icons-material/ApprovalRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const Modules = () => {
  const modules = [
    {
      title: "Dashboard",
      icon: <DashboardRoundedIcon fontSize="large" />,
      text: "View asset count, active tickets, warranty alerts, pending approvals and vendor performance from one place.",
    },
    {
      title: "Asset Registry",
      icon: <Inventory2RoundedIcon fontSize="large" />,
      text: "Maintain complete asset records with category, department, location, warranty, AMC and ownership details.",
    },
    {
      title: "Warranty Management",
      icon: <VerifiedRoundedIcon fontSize="large" />,
      text: "Track warranty start date, expiry date, AMC coverage, renewal reminders and service eligibility.",
    },
    {
      title: "Breakdown Tickets",
      icon: <BuildRoundedIcon fontSize="large" />,
      text: "Create issue tickets for faulty assets, assign priority, upload proof and monitor repair progress.",
    },
    {
      title: "Department Approvals",
      icon: <ApprovalRoundedIcon fontSize="large" />,
      text: "Route repair, replacement or paid service requests to department heads and admins for approval.",
    },
    {
      title: "Vendor / OEM Management",
      icon: <BusinessRoundedIcon fontSize="large" />,
      text: "Store vendor contacts, OEM details, complaint process, emails, websites and escalation information.",
    },
    {
      title: "Service History",
      icon: <HistoryRoundedIcon fontSize="large" />,
      text: "Keep complete service history including complaint number, technician notes, repair cost and closure remarks.",
    },
    {
      title: "Preventive Maintenance",
      icon: <SettingsSuggestRoundedIcon fontSize="large" />,
      text: "Schedule routine maintenance tasks, service reminders and inspection activities to avoid breakdowns.",
    },
    {
      title: "Reports & Analytics",
      icon: <AssessmentRoundedIcon fontSize="large" />,
      text: "Generate department-wise, vendor-wise, warranty-wise and breakdown reports for better decision-making.",
    },
  ];

  return (
    <>
      <style>{`
        .modules-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(15,118,110,0.10), transparent 34%),
            radial-gradient(circle at top right, rgba(30,58,138,0.12), transparent 35%),
            #F8FAFC;
        }

        .modules-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .modules-hero {
          padding: 140px 24px 48px;
        }

        .modules-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
          margin-top: 38px;
        }

        .modules-summary-card {
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(226,232,240,0.95);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 14px 30px rgba(15,23,42,0.05);
          backdrop-filter: blur(14px);
        }

        .modules-summary-value {
          font-size: 30px;
          font-weight: 950;
          color: #1E3A8A;
          margin-bottom: 4px;
        }

        .modules-summary-label {
          font-size: 14px;
          font-weight: 800;
          color: #64748B;
        }

        .modules-section {
          padding: 20px 24px 110px;
        }

        .mod-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 30px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .mod-card {
          background: rgba(255,255,255,0.92);
          border: 1px solid #E2E8F0;
          border-radius: 30px;
          padding: 36px 32px;
          position: relative;
          overflow: hidden;
          transition: all 0.35s ease;
          box-shadow: 0 10px 26px rgba(15,23,42,0.04);
        }

        .mod-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(30,58,138,0.07), rgba(15,118,110,0.07));
          opacity: 0;
          transition: 0.35s ease;
        }

        .mod-card::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 5px;
          background: linear-gradient(135deg, #1E3A8A, #0F766E);
          transform: scaleX(0);
          transform-origin: left;
          transition: 0.35s ease;
        }

        .mod-card:hover {
          transform: translateY(-10px);
          border-color: rgba(15,118,110,0.34);
          box-shadow: 0 26px 55px rgba(15,23,42,0.10);
        }

        .mod-card:hover::before {
          opacity: 1;
        }

        .mod-card:hover::after {
          transform: scaleX(1);
        }

        .mod-number {
          position: absolute;
          top: -18px;
          right: 12px;
          font-size: 104px;
          font-weight: 950;
          color: #EEF2F7;
          z-index: 0;
          transition: all 0.35s ease;
          line-height: 1;
        }

        .mod-card:hover .mod-number {
          color: rgba(15,118,110,0.10);
          transform: translateY(6px) scale(1.04);
        }

        .mod-content {
          position: relative;
          z-index: 1;
        }

        .mod-icon {
          width: 66px;
          height: 66px;
          background: linear-gradient(135deg, #1E3A8A, #0F766E);
          color: #FFFFFF;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          box-shadow: 0 14px 28px rgba(15,118,110,0.25);
          transition: all 0.35s ease;
        }

        .mod-card:hover .mod-icon {
          transform: rotate(-6deg) scale(1.06);
          box-shadow: 0 20px 38px rgba(15,118,110,0.35);
        }

        .mod-title {
          font-size: 23px;
          font-weight: 950;
          color: #0F172A;
          margin-bottom: 14px;
          letter-spacing: -0.5px;
        }

        .mod-text {
          font-size: 16px;
          line-height: 1.65;
          color: #64748B;
          font-weight: 600;
          margin-bottom: 28px;
        }

        .mod-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #1E3A8A;
          font-size: 14px;
          font-weight: 900;
        }

        .mod-arrow {
          color: #0F766E;
          transition: transform 0.3s ease;
        }

        .mod-card:hover .mod-arrow {
          transform: translateX(8px);
        }

        .modules-flow {
          max-width: 1400px;
          margin: 38px auto 0;
          background:
            radial-gradient(circle at 90% 15%, rgba(20,184,166,0.26), transparent 32%),
            linear-gradient(135deg, #0F172A, #1E3A8A);
          border-radius: 34px;
          padding: 46px;
          box-shadow: 0 26px 58px rgba(15,23,42,0.24);
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 38px;
          align-items: center;
        }

        .modules-flow h2 {
          color: #FFFFFF;
          font-size: 34px;
          font-weight: 950;
          line-height: 1.18;
          letter-spacing: -1px;
          margin: 0 0 12px;
        }

        .modules-flow p {
          color: #CBD5E1;
          line-height: 1.7;
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .flow-steps {
          display: grid;
          gap: 14px;
        }

        .flow-step {
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.16);
          border-radius: 18px;
          padding: 16px;
          color: #FFFFFF;
          display: flex;
          gap: 14px;
          align-items: center;
          backdrop-filter: blur(12px);
        }

        .flow-step-number {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #FFFFFF;
          color: #1E3A8A;
          display: grid;
          place-items: center;
          font-weight: 950;
          flex-shrink: 0;
        }

        .flow-step-text {
          font-size: 15px;
          font-weight: 800;
          color: #E2E8F0;
        }

        @media (max-width: 900px) {
          .modules-hero {
            padding-top: 125px;
          }

          .modules-flow {
            grid-template-columns: 1fr;
            padding: 34px 26px;
          }

          .modules-flow h2 {
            font-size: 28px;
          }
        }

        @media (max-width: 640px) {
          .mod-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="modules-page">
        <div className="modules-hero">
          <div className="modules-container">
            <PageHeader
              label="System Modules"
              title="Complete modules for company asset lifecycle"
              text="Every module is designed to reduce manual work and provide clear tracking from asset purchase to service closure."
            />

            <div className="modules-summary">
              <div className="modules-summary-card">
                <div className="modules-summary-value">09</div>
                <div className="modules-summary-label">Core Modules</div>
              </div>

              <div className="modules-summary-card">
                <div className="modules-summary-value">360°</div>
                <div className="modules-summary-label">Asset Visibility</div>
              </div>

              <div className="modules-summary-card">
                <div className="modules-summary-value">24/7</div>
                <div className="modules-summary-label">Tracking Ready</div>
              </div>

              <div className="modules-summary-card">
                <div className="modules-summary-value">100%</div>
                <div className="modules-summary-label">Service History</div>
              </div>
            </div>
          </div>
        </div>

        <section className="modules-section">
          <div className="mod-grid">
            {modules.map((item, index) => (
              <div key={item.title} className="mod-card">
                <span className="mod-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="mod-content">
                  <div className="mod-icon">{item.icon}</div>

                  <h3 className="mod-title">{item.title}</h3>

                  <p className="mod-text">{item.text}</p>

                  <div className="mod-link">
                    Module Details
                    <ArrowForwardRoundedIcon
                      className="mod-arrow"
                      fontSize="small"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="modules-flow">
            <div>
              <h2>Designed around a complete operational workflow.</h2>
              <p>
                AssetCare Pro connects asset registration, warranty tracking,
                breakdown tickets, approvals, vendor service and final closure
                into one structured lifecycle.
              </p>
            </div>

            <div className="flow-steps">
              {[
                "Register asset with department, location and warranty details",
                "Detect warranty expiry, breakdown or service requirement",
                "Create ticket and route it for approval",
                "Raise vendor complaint and track closure",
              ].map((step, index) => (
                <div className="flow-step" key={step}>
                  <div className="flow-step-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="flow-step-text">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Modules;