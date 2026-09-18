import { Link } from "react-router-dom";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const Workflow = () => {
  const steps = [
    { title: "Employee registers service request", text: "The employee reports the issue with asset details, problem description, priority and supporting photos.", icon: <ConfirmationNumberRoundedIcon sx={{ fontSize: 26 }} /> },
    { title: "Department HOD reviews & approves", text: "The department head verifies the request and approves repair, replacement or further escalation.", icon: <FactCheckRoundedIcon sx={{ fontSize: 26 }} /> },
    { title: "Admin checks warranty & vendor", text: "Admin verifies active warranty status, AMC coverage, asset documents and authorized vendor support.", icon: <AdminPanelSettingsRoundedIcon sx={{ fontSize: 26 }} /> },
    { title: "Forwarded to OEM / service partner", text: "Vendor ticket is logged with reference number, contact person details and service visit schedule.", icon: <BusinessRoundedIcon sx={{ fontSize: 26 }} /> },
    { title: "Technician visit & repair updates", text: "Technician diagnosis, spare part requirements, cost estimate and repair progress are tracked live.", icon: <EngineeringRoundedIcon sx={{ fontSize: 26 }} /> },
    { title: "Resolution confirmed & ticket closed", text: "After repair completion, user confirms resolution and admin archives the ticket with full cost logs.", icon: <TaskAltRoundedIcon sx={{ fontSize: 26 }} /> },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');

        .workflow-page {
          min-height: 100vh;
          background-color: #0B0D17;
          color: #FFFFFF;
          font-family: 'Poppins', 'Inter', -apple-system, sans-serif;
        }

        .workflow-container {
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 24px;
          padding-right: 24px;
        }

        .workflow-hero {
          padding: 140px 0 44px;
        }

        .workflow-tag-badge {
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

        .workflow-hero-title {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(34px, 4.5vw, 54px);
          line-height: 1.1;
          font-weight: 900;
          color: #FFFFFF;
          letter-spacing: -1.5px;
          margin: 0 0 16px;
        }

        .workflow-hero-sub {
          font-size: 16.5px;
          line-height: 1.7;
          color: #94A3B8;
          max-width: 640px;
          margin: 0;
          font-weight: 400;
        }

        .workflow-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-top: 36px;
        }

        .workflow-summary-card {
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.22);
          border-radius: 16px;
          padding: 18px 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .workflow-summary-card:hover {
          transform: translateY(-2px);
          border-color: rgba(119, 119, 199, 0.4);
        }

        .workflow-summary-value {
          font-family: 'Poppins', sans-serif;
          font-size: 28px;
          font-weight: 900;
          color: #FFFFFF;
          margin-bottom: 3px;
          letter-spacing: -0.8px;
          line-height: 1.1;
        }

        .workflow-summary-label {
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .workflow-section {
          padding: 16px 0 100px;
        }

        /* 3-3 Grid Layout */
        .work-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .work-card {
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.22);
          border-radius: 20px;
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
          display: flex;
          flex-direction: column;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .work-card:hover {
          transform: translateY(-4px);
          border-color: rgba(119, 119, 199, 0.4);
          box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.7), 0 0 20px rgba(119, 119, 199, 0.12);
        }

        .work-number {
          position: absolute;
          bottom: -15px;
          right: 14px;
          font-family: 'Poppins', sans-serif;
          font-size: 110px;
          font-weight: 900;
          color: rgba(119, 119, 199, 0.05);
          z-index: 0;
          line-height: 1;
          pointer-events: none;
          user-select: none;
        }

        .work-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .work-icon {
          width: 50px;
          height: 50px;
          background-color: #161B2E;
          color: #7777C7;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        .work-badge {
          display: inline-block;
          align-self: flex-start;
          padding: 5px 12px;
          background-color: #161B2E;
          color: #7777C7;
          border: 1px solid rgba(119, 119, 199, 0.3);
          border-radius: 9999px;
          font-family: 'Poppins', sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .work-title {
          font-family: 'Poppins', sans-serif;
          font-size: 18px;
          font-weight: 900;
          color: #FFFFFF;
          margin-bottom: 10px;
          line-height: 1.35;
          letter-spacing: -0.3px;
        }

        .work-text {
          font-size: 14px;
          line-height: 1.65;
          color: #94A3B8;
          font-weight: 400;
          margin: 0;
          flex: 1;
        }

        .workflow-timeline {
          margin-top: 40px;
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.25);
          border-radius: 28px;
          padding: 44px;
          display: grid;
          grid-template-columns: 0.95fr 1.05fr;
          gap: 40px;
          align-items: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7);
        }

        .workflow-timeline::before {
          content: "";
          position: absolute;
          top: -80px;
          right: -80px;
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, rgba(119, 119, 199, 0.14), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .workflow-timeline h2 {
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

        .workflow-timeline p {
          color: #94A3B8;
          line-height: 1.7;
          font-size: 15px;
          font-weight: 400;
          margin: 0;
          position: relative;
          z-index: 1;
        }

        .timeline-list {
          display: grid;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .timeline-item {
          background-color: #161B2E;
          border: 1px solid rgba(119, 119, 199, 0.2);
          border-radius: 14px;
          padding: 14px 18px;
          display: flex;
          gap: 14px;
          align-items: center;
          transition: border-color 0.2s ease;
        }
        .timeline-item:hover {
          border-color: rgba(119, 119, 199, 0.35);
        }

        .timeline-dot {
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

        .timeline-text {
          font-size: 14px;
          font-weight: 600;
          color: #E2E8F0;
        }

        .workflow-cta {
          margin-top: 28px;
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.22);
          border-radius: 24px;
          padding: 34px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .workflow-cta h3 {
          font-family: 'Poppins', sans-serif;
          color: #FFFFFF;
          font-size: 24px;
          font-weight: 900;
          margin: 0 0 6px;
          letter-spacing: -0.6px;
        }

        .workflow-cta p {
          color: #94A3B8;
          font-size: 14.5px;
          font-weight: 400;
          margin: 0;
          line-height: 1.6;
        }

        .workflow-cta-btn {
          background-color: #7777C7;
          color: #0B0C1A;
          border: 1px solid #7777C7;
          padding: 14px 28px;
          border-radius: 9999px;
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          font-size: 14px;
          white-space: nowrap;
          text-decoration: none;
          box-shadow: 0 6px 20px rgba(119, 119, 199, 0.35);
        }

        .workflow-cta-btn:hover {
          background-color: #6464B8;
          border-color: #6464B8;
          color: #FFFFFF;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(119, 119, 199, 0.5);
        }

        @media (max-width: 1024px) {
          .work-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .workflow-summary {
            grid-template-columns: repeat(2, 1fr);
          }
          .workflow-timeline {
            grid-template-columns: 1fr;
            padding: 32px 24px;
          }
          .workflow-timeline h2 {
            font-size: 26px;
          }
        }

        @media (max-width: 640px) {
          .workflow-hero { padding-top: 120px; }
          .work-grid { grid-template-columns: 1fr; }
          .workflow-cta { padding: 26px 20px; }
        }
      `}</style>

      <div className="workflow-page">
        <div className="workflow-hero">
          <div className="workflow-container">
            <div>
              <span className="workflow-tag-badge">System Protocol</span>
              <h1 className="workflow-hero-title">Clear approval &amp; service workflow</h1>
              <p className="workflow-hero-sub">Every service request follows a structured 6-step lifecycle so nothing is missed and every service action remains permanently verifiable.</p>
            </div>
            <div className="workflow-summary">
              {[
                { value: "06", label: "Workflow Steps" },
                { value: "100%", label: "Traceable Actions" },
                { value: "3-Level", label: "Approval Control" },
                { value: "Live", label: "Ticket Status" },
              ].map((s) => (
                <div key={s.label} className="workflow-summary-card">
                  <div className="workflow-summary-value">{s.value}</div>
                  <div className="workflow-summary-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="workflow-section">
          <div className="workflow-container">
            {/* 3-3 Grid: 6 boxes evenly laid out */}
            <div className="work-grid">
              {steps.map((step, index) => (
                <div key={step.title} className="work-card">
                  <span className="work-number">{index + 1}</span>
                  <div className="work-content">
                    <div className="work-icon">{step.icon}</div>
                    <span className="work-badge">Step {String(index + 1).padStart(2, "0")}</span>
                    <h3 className="work-title">{step.title}</h3>
                    <p className="work-text">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="workflow-timeline">
              <div>
                <h2>From request creation to verified service completion.</h2>
                <p>The workflow ensures every service request has proper ownership, approval, vendor tracking, technician updates and final completion confirmation.</p>
              </div>
              <div className="timeline-list">
                {[
                  "User reports issue with asset information & photos",
                  "HOD & Admin verify warranty & approve service action",
                  "Vendor ticket reference number & SLA are recorded",
                  "Technician action, spare cost & resolution are saved",
                ].map((item, index) => (
                  <div className="timeline-item" key={item}>
                    <div className="timeline-dot">{String(index + 1).padStart(2, "0")}</div>
                    <div className="timeline-text">{item}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="workflow-cta">
              <div>
                <h3>Need a controlled repair approval process?</h3>
                <p>Use IAssetCare to eliminate missed requests, manual follow-ups and unapproved service expenses.</p>
              </div>
              <Link to="/login" className="workflow-cta-btn">
                Start Workflow <ArrowForwardRoundedIcon fontSize="small" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Workflow;
