import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import ApprovalRoundedIcon from "@mui/icons-material/ApprovalRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";

const Modules = () => {
  const modules = [
    { title: "Dashboard", icon: <DashboardRoundedIcon sx={{ fontSize: 26 }} />, text: "View asset counts, active tickets, warranty expiry alerts, pending approvals and vendor performance." },
    { title: "Asset Registry", icon: <Inventory2RoundedIcon sx={{ fontSize: 26 }} />, text: "Maintain complete asset records with category, department, location, warranty, AMC and ownership." },
    { title: "Warranty Tracking", icon: <VerifiedRoundedIcon sx={{ fontSize: 26 }} />, text: "Track warranty start/end dates, AMC coverage, renewal reminders and service provider eligibility." },
    { title: "Service Tickets", icon: <BuildRoundedIcon sx={{ fontSize: 26 }} />, text: "Create service requests for faulty assets, assign priority, attach photos and monitor repair milestones." },
    { title: "Approvals Engine", icon: <ApprovalRoundedIcon sx={{ fontSize: 26 }} />, text: "Route repair, replacement or paid service requests to department heads and admins with 1-click approvals." },
    { title: "Service History", icon: <HistoryRoundedIcon sx={{ fontSize: 26 }} />, text: "Keep permanent service records including resolution notes, technician logs, repair costs and invoices." },
    { title: "Preventive Care", icon: <SettingsSuggestRoundedIcon sx={{ fontSize: 26 }} />, text: "Schedule routine maintenance tasks, recurring service reminders and periodic health checkups." },
    { title: "Reports & Analytics", icon: <AssessmentRoundedIcon sx={{ fontSize: 26 }} />, text: "Generate department-wise, vendor-wise, warranty-wise and request reports for smarter decisions." },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');

        .modules-page {
          min-height: 100vh;
          background-color: #0B0D17;
          color: #FFFFFF;
          font-family: 'Poppins', 'Inter', -apple-system, sans-serif;
        }

        .modules-container {
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 24px;
          padding-right: 24px;
        }

        .modules-hero {
          padding: 140px 0 44px;
        }

        .modules-tag-badge {
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

        .modules-hero-title {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(34px, 4.5vw, 54px);
          line-height: 1.1;
          font-weight: 900;
          color: #FFFFFF;
          letter-spacing: -1.5px;
          margin: 0 0 16px;
        }

        .modules-hero-sub {
          font-size: 16.5px;
          line-height: 1.7;
          color: #94A3B8;
          max-width: 640px;
          margin: 0;
          font-weight: 400;
        }

        .modules-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-top: 36px;
        }

        .modules-summary-card {
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.22);
          border-radius: 16px;
          padding: 18px 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .modules-summary-card:hover {
          transform: translateY(-2px);
          border-color: rgba(119, 119, 199, 0.4);
        }

        .modules-summary-value {
          font-family: 'Poppins', sans-serif;
          font-size: 28px;
          font-weight: 900;
          color: #FFFFFF;
          margin-bottom: 3px;
          letter-spacing: -0.8px;
          line-height: 1.1;
        }

        .modules-summary-label {
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .modules-section {
          padding: 16px 0 100px;
        }

        /* 4x2 Grid Layout */
        .mod-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .mod-card {
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.22);
          border-radius: 20px;
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
          display: flex;
          flex-direction: column;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mod-card:hover {
          transform: translateY(-4px);
          border-color: rgba(119, 119, 199, 0.4);
          box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.7), 0 0 20px rgba(119, 119, 199, 0.12);
        }

        .mod-number {
          position: absolute;
          top: -10px;
          right: 14px;
          font-family: 'Poppins', sans-serif;
          font-size: 72px;
          font-weight: 900;
          color: rgba(119, 119, 199, 0.05);
          z-index: 0;
          line-height: 1;
          pointer-events: none;
          user-select: none;
        }

        .mod-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .mod-icon {
          width: 48px;
          height: 48px;
          background-color: #161B2E;
          color: #7777C7;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        .mod-title {
          font-family: 'Poppins', sans-serif;
          font-size: 17.5px;
          font-weight: 900;
          color: #FFFFFF;
          margin-bottom: 10px;
          letter-spacing: -0.3px;
        }

        .mod-text {
          font-size: 13.5px;
          line-height: 1.6;
          color: #94A3B8;
          font-weight: 400;
          margin: 0;
          flex: 1;
        }

        .modules-flow {
          margin-top: 40px;
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.25);
          border-radius: 28px;
          padding: 44px;
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 40px;
          align-items: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7);
        }

        .modules-flow::before {
          content: "";
          position: absolute;
          top: -80px;
          left: -80px;
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, rgba(119, 119, 199, 0.14), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .modules-flow h2 {
          font-family: 'Poppins', sans-serif;
          color: #FFFFFF;
          font-size: 30px;
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: -1px;
          margin: 0 0 12px;
          position: relative;
          z-index: 1;
        }

        .modules-flow p {
          color: #94A3B8;
          line-height: 1.7;
          font-size: 15px;
          font-weight: 400;
          margin: 0;
          position: relative;
          z-index: 1;
        }

        .flow-steps {
          display: grid;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .flow-step {
          background-color: #171B2E;
          border: 1px solid rgba(119, 119, 199, 0.15);
          border-radius: 14px;
          padding: 14px 18px;
          display: flex;
          gap: 14px;
          align-items: center;
          transition: border-color 0.2s ease;
        }
        .flow-step:hover {
          border-color: rgba(119, 119, 199, 0.35);
        }

        .flow-step-number {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background-color: #1E233D;
          color: #7777C7;
          display: grid;
          place-items: center;
          font-family: 'Poppins', sans-serif;
          font-weight: 900;
          font-size: 12px;
          flex-shrink: 0;
        }

        .flow-step-text {
          font-size: 14px;
          font-weight: 600;
          color: #E2E8F0;
        }

        @media (max-width: 1024px) {
          .mod-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .modules-summary {
            grid-template-columns: repeat(2, 1fr);
          }
          .modules-flow {
            grid-template-columns: 1fr;
            padding: 32px 24px;
          }
          .modules-flow h2 {
            font-size: 26px;
          }
        }

        @media (max-width: 640px) {
          .modules-hero { padding-top: 120px; }
          .mod-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="modules-page">
        <div className="modules-hero">
          <div className="modules-container">
            <div>
              <span className="modules-tag-badge">System Modules</span>
              <h1 className="modules-hero-title">Complete modules for enterprise asset lifecycle</h1>
              <p className="modules-hero-sub">Every module is built to eliminate manual friction and provide complete tracking from asset acquisition to service closure.</p>
            </div>
            <div className="modules-summary">
              {[
                { value: "08", label: "Core Modules" },
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
          <div className="modules-container">
            {/* Even 4x2 Grid */}
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
                <p>IAssetCare connects asset registration, warranty monitoring, service requests, approvals, vendor tracking and final closure into one structured lifecycle.</p>
              </div>
              <div className="flow-steps">
                {[
                  "Register asset with department, location and warranty details",
                  "Detect warranty expiry, maintenance or service requirements",
                  "Create request and route it through departmental approval",
                  "Coordinate with vendor/OEM and track verified resolution",
                ].map((step, index) => (
                  <div className="flow-step" key={step}>
                    <div className="flow-step-number">{String(index + 1).padStart(2, "0")}</div>
                    <div className="flow-step-text">{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Modules;
