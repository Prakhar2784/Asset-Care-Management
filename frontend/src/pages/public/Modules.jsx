import { Link } from "react-router-dom";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import ApprovalRoundedIcon from "@mui/icons-material/ApprovalRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const Modules = () => {
  const modules = [
    { title: "Dashboard", icon: <DashboardRoundedIcon fontSize="large" />, text: "View asset count, active tickets, warranty alerts, pending approvals and vendor performance from one place." },
    { title: "Asset Registry", icon: <Inventory2RoundedIcon fontSize="large" />, text: "Maintain complete asset records with category, department, location, warranty, AMC and ownership details." },
    { title: "Warranty Management", icon: <VerifiedRoundedIcon fontSize="large" />, text: "Track warranty start date, expiry date, AMC coverage, renewal reminders and service eligibility." },
    { title: "Breakdown Tickets", icon: <BuildRoundedIcon fontSize="large" />, text: "Create issue tickets for faulty assets, assign priority, upload proof and monitor repair progress." },
    { title: "Department Approvals", icon: <ApprovalRoundedIcon fontSize="large" />, text: "Route repair, replacement or paid service requests to department heads and admins for approval." },
    { title: "Service History", icon: <HistoryRoundedIcon fontSize="large" />, text: "Keep complete service history including complaint number, technician notes, repair cost and closure remarks." },
    { title: "Preventive Maintenance", icon: <SettingsSuggestRoundedIcon fontSize="large" />, text: "Schedule routine maintenance tasks, service reminders and inspection activities to avoid breakdowns." },
    { title: "Reports & Analytics", icon: <AssessmentRoundedIcon fontSize="large" />, text: "Generate department-wise, vendor-wise, warranty-wise and breakdown reports for better decision-making." },
  ];

  return (
    <>
      <style>{`
        .modules-page { min-height: 100vh; background: #080812; }
        .modules-container { max-width: 1400px; margin: 0 auto; }
        .modules-hero { padding: 140px 24px 44px; }

        .modules-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px; margin-top: 32px;
        }

        .modules-summary-card {
          background: rgba(15,10,40,0.55);
          border: 1px solid rgba(168,85,247,0.15);
          border-radius: 18px; padding: 18px;
          box-shadow: 0 4px 16px rgba(17,17,17,0.05);
        }

        .modules-summary-value {
          font-size: 30px; font-weight: 950;
          color: #FFFFFF; margin-bottom: 3px;
          letter-spacing: -1px; line-height: 1;
        }

        .modules-summary-label { font-size: 13px; font-weight: 700; color: #94A3B8; }

        .modules-section { padding: 16px 24px 100px; }

        .mod-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 22px; max-width: 1400px; margin: 0 auto;
        }

        .mod-card {
          background: rgba(15,10,40,0.55);
          border: 1px solid rgba(168,85,247,0.15);
          border-radius: 24px; padding: 32px 28px;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 16px rgba(17,17,17,0.04);
        }

        .mod-number {
          position: absolute; top: -10px; right: 16px;
          font-size: 96px; font-weight: 950;
          color: rgba(168,85,247,0.07); z-index: 0; line-height: 1;
        }

        .mod-content { position: relative; z-index: 1; }

        .mod-icon {
          width: 54px; height: 54px;
          background: linear-gradient(135deg, #7C3AED, #A855F7); color: #FFFFFF;
          border-radius: 15px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }

        .mod-title { font-size: 19px; font-weight: 900; color: #FFFFFF; margin-bottom: 12px; letter-spacing: -0.3px; }

        .mod-text { font-size: 14.5px; line-height: 1.65; color: #CBD5E1; font-weight: 500; margin-bottom: 24px; }

        .mod-link {
          display: inline-flex; align-items: center; gap: 7px;
          font-weight: 800; font-size: 13px; color: #FFFFFF;
        }

        .mod-arrow { }

        .modules-flow {
          max-width: 1400px; margin: 28px auto 0;
          background: linear-gradient(135deg, #7C3AED, #A855F7);
          border-radius: 28px; padding: 44px;
          display: grid; grid-template-columns: 1fr 1.2fr;
          gap: 38px; align-items: center;
          position: relative; overflow: hidden;
        }

        .modules-flow::before {
          content: "";
          position: absolute; top: -80px; left: -80px;
          width: 240px; height: 240px;
          background: radial-gradient(circle, rgba(168,85,247,0.10), transparent 70%);
          border-radius: 50%; pointer-events: none;
        }

        .modules-flow h2 {
          color: #FFFFFF; font-size: 32px; font-weight: 950;
          line-height: 1.18; letter-spacing: -1px; margin: 0 0 12px;
          position: relative; z-index: 1;
        }

        .modules-flow p {
          color: rgba(255,255,255,0.8); line-height: 1.7; font-size: 15px;
          font-weight: 500; margin: 0; position: relative; z-index: 1;
        }

        .flow-steps { display: grid; gap: 12px; position: relative; z-index: 1; }

        .flow-step {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px; padding: 14px 16px;
          display: flex; gap: 14px; align-items: center;
        }

        .flow-step-number {
          width: 36px; height: 36px; border-radius: 10px;
          background: #A855F7; color: #FFFFFF;
          display: grid; place-items: center;
          font-weight: 950; font-size: 13px; flex-shrink: 0;
        }

        .flow-step-text { font-size: 14px; font-weight: 700; color: #D4D4CE; }

        @media (max-width: 900px) {
          .modules-hero { padding-top: 120px; }
          .modules-flow { grid-template-columns: 1fr; padding: 30px 24px; }
          .modules-flow h2 { font-size: 26px; }
        }

        @media (max-width: 640px) { .mod-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="modules-page">
        <div className="modules-hero">
          <div className="modules-container">
            <div style={{ marginBottom: 32 }}>
              <div style={{ color: '#A855F7', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>System Modules</div>
              <h1 style={{ color: '#FFFFFF', fontWeight: 950, fontSize: 'clamp(32px,4vw,52px)', letterSpacing: '-1.5px', lineHeight: 1.1, margin: '0 0 16px' }}>Complete modules for company asset lifecycle</h1>
              <p style={{ color: '#CBD5E1', fontSize: 17, fontWeight: 500, lineHeight: 1.7, maxWidth: 640, margin: 0 }}>Every module is designed to reduce manual work and provide clear tracking from asset purchase to service closure.</p>
            </div>
            <div className="modules-summary">
              {[
                { value: "09", label: "Core Modules" },
                { value: "360°", label: "Asset Visibility" },
                { value: "24/7", label: "Tracking Ready" },
                { value: "100%", label: "Service History" },
              ].map((s) => (
                <div key={s.label} className="modules-summary-card">
                  <div className="modules-summary-value">{s.value}</div>
                  <div className="modules-summary-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="modules-section">
          <div className="mod-grid">
            {modules.map((item, index) => (
              <div key={item.title} className="mod-card">
                <span className="mod-number">{String(index + 1).padStart(2, "0")}</span>
                <div className="mod-content">
                  <div className="mod-icon">{item.icon}</div>
                  <h3 className="mod-title">{item.title}</h3>
                  <p className="mod-text">{item.text}</p>

                </div>
              </div>
            ))}
          </div>

          <div className="modules-flow">
            <div>
              <h2>Designed around a complete operational workflow.</h2>
              <p>AssetCare Pro connects asset registration, warranty tracking, breakdown tickets, approvals, vendor service and final closure into one structured lifecycle.</p>
            </div>
            <div className="flow-steps">
              {[
                "Register asset with department, location and warranty details",
                "Detect warranty expiry, breakdown or service requirement",
                "Create ticket and route it for approval",
                "Raise vendor complaint and track closure",
              ].map((step, index) => (
                <div className="flow-step" key={step}>
                  <div className="flow-step-number">{String(index + 1).padStart(2, "0")}</div>
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
