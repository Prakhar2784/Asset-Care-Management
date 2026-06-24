import { Link } from "react-router-dom";
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
    { title: "Dashboard", icon: <DashboardRoundedIcon fontSize="large" />, text: "View asset count, active tickets, warranty alerts, pending approvals and vendor performance from one place." },
    { title: "Asset Registry", icon: <Inventory2RoundedIcon fontSize="large" />, text: "Maintain complete asset records with category, department, location, warranty, AMC and ownership details." },
    { title: "Warranty Management", icon: <VerifiedRoundedIcon fontSize="large" />, text: "Track warranty start date, expiry date, AMC coverage, renewal reminders and service eligibility." },
    { title: "Breakdown Tickets", icon: <BuildRoundedIcon fontSize="large" />, text: "Create issue tickets for faulty assets, assign priority, upload proof and monitor repair progress." },
    { title: "Department Approvals", icon: <ApprovalRoundedIcon fontSize="large" />, text: "Route repair, replacement or paid service requests to department heads and admins for approval." },
    { title: "Vendor / OEM Management", icon: <BusinessRoundedIcon fontSize="large" />, text: "Store vendor contacts, OEM details, complaint process, emails, websites and escalation information." },
    { title: "Service History", icon: <HistoryRoundedIcon fontSize="large" />, text: "Keep complete service history including complaint number, technician notes, repair cost and closure remarks." },
    { title: "Preventive Maintenance", icon: <SettingsSuggestRoundedIcon fontSize="large" />, text: "Schedule routine maintenance tasks, service reminders and inspection activities to avoid breakdowns." },
    { title: "Reports & Analytics", icon: <AssessmentRoundedIcon fontSize="large" />, text: "Generate department-wise, vendor-wise, warranty-wise and breakdown reports for better decision-making." },
  ];

  return (
    <>
      <style>{`
        .modules-page { min-height: 100vh; background: #ECEAE3; }
        .modules-container { max-width: 1400px; margin: 0 auto; }
        .modules-hero { padding: 140px 24px 44px; }

        .modules-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px; margin-top: 32px;
        }

        .modules-summary-card {
          background: #FFFFFF;
          border: 1px solid rgba(17,17,17,0.08);
          border-radius: 18px; padding: 18px;
          box-shadow: 0 4px 16px rgba(17,17,17,0.05);
        }

        .modules-summary-value {
          font-size: 30px; font-weight: 950;
          color: #111111; margin-bottom: 3px;
          letter-spacing: -1px; line-height: 1;
        }

        .modules-summary-label { font-size: 13px; font-weight: 700; color: #8A8A84; }

        .modules-section { padding: 16px 24px 100px; }

        .mod-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 22px; max-width: 1400px; margin: 0 auto;
        }

        .mod-card {
          background: #FFFFFF;
          border: 1px solid rgba(17,17,17,0.08);
          border-radius: 24px; padding: 32px 28px;
          position: relative; overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(17,17,17,0.04);
        }

        .mod-card::after {
          content: "";
          position: absolute; left: 0; bottom: 0;
          width: 100%; height: 4px;
          background: #CBFA57;
          transform: scaleX(0); transform-origin: left;
          transition: 0.3s ease;
        }

        .mod-card:hover {
          transform: translateY(-8px);
          border-color: rgba(17,17,17,0.18);
          box-shadow: 0 24px 48px rgba(17,17,17,0.10);
        }

        .mod-card:hover::after { transform: scaleX(1); }

        .mod-number {
          position: absolute; top: -10px; right: 16px;
          font-size: 96px; font-weight: 950;
          color: rgba(17,17,17,0.04); z-index: 0; line-height: 1;
          transition: all 0.3s ease;
        }

        .mod-card:hover .mod-number { color: rgba(203,250,87,0.16); }

        .mod-content { position: relative; z-index: 1; }

        .mod-icon {
          width: 54px; height: 54px;
          background: #111111; color: #CBFA57;
          border-radius: 15px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          transition: all 0.3s ease;
        }

        .mod-card:hover .mod-icon { transform: rotate(-5deg) scale(1.05); }

        .mod-title { font-size: 19px; font-weight: 900; color: #111111; margin-bottom: 12px; letter-spacing: -0.3px; }

        .mod-text { font-size: 14.5px; line-height: 1.65; color: #6B6B65; font-weight: 500; margin-bottom: 24px; }

        .mod-link {
          display: inline-flex; align-items: center; gap: 7px;
          font-weight: 800; font-size: 13px; color: #111111;
        }

        .mod-arrow { transition: transform 0.28s ease; }
        .mod-card:hover .mod-arrow { transform: translateX(7px); }

        .modules-flow {
          max-width: 1400px; margin: 28px auto 0;
          background: #111111;
          border-radius: 28px; padding: 44px;
          display: grid; grid-template-columns: 1fr 1.2fr;
          gap: 38px; align-items: center;
          position: relative; overflow: hidden;
        }

        .modules-flow::before {
          content: "";
          position: absolute; top: -80px; left: -80px;
          width: 240px; height: 240px;
          background: radial-gradient(circle, rgba(203,250,87,0.10), transparent 70%);
          border-radius: 50%; pointer-events: none;
        }

        .modules-flow h2 {
          color: #FFFFFF; font-size: 32px; font-weight: 950;
          line-height: 1.18; letter-spacing: -1px; margin: 0 0 12px;
          position: relative; z-index: 1;
        }

        .modules-flow p {
          color: #7A7A74; line-height: 1.7; font-size: 15px;
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
          background: #CBFA57; color: #111111;
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
            <PageHeader
              label="System Modules"
              title="Complete modules for company asset lifecycle"
              text="Every module is designed to reduce manual work and provide clear tracking from asset purchase to service closure."
            />
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
                  <div className="mod-link">
                    Module Details
                    <ArrowForwardRoundedIcon className="mod-arrow" fontSize="small" />
                  </div>
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
