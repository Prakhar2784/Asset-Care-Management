import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const Workflow = () => {
  const steps = [
    { title: "Employee raises asset breakdown ticket", text: "The employee reports the issue with asset details, problem description, priority and supporting proof.", icon: <ConfirmationNumberRoundedIcon fontSize="large" /> },
    { title: "Department HOD reviews and approves request", text: "The department head checks the request and approves repair, replacement or further escalation.", icon: <FactCheckRoundedIcon fontSize="large" /> },
    { title: "Admin checks warranty and vendor details", text: "Admin verifies warranty status, AMC coverage, asset documents and available vendor support.", icon: <AdminPanelSettingsRoundedIcon fontSize="large" /> },
    { title: "Complaint is registered with OEM/service company", text: "The vendor or OEM complaint is created with complaint number, contact details and service schedule.", icon: <BusinessRoundedIcon fontSize="large" /> },
    { title: "Technician visit and repair status is updated", text: "Technician visit, diagnosis, spare parts, cost estimate and repair progress are updated in the system.", icon: <EngineeringRoundedIcon fontSize="large" /> },
    { title: "User confirms resolution and ticket is closed", text: "After repair completion, the user confirms resolution and admin closes the ticket with final remarks.", icon: <TaskAltRoundedIcon fontSize="large" /> },
  ];

  return (
    <>
      <style>{`
        .workflow-page { min-height: 100vh; background: #ECEAE3; }
        .workflow-container { max-width: 1400px; margin: 0 auto; }
        .workflow-hero { padding: 140px 24px 44px; }

        .workflow-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px; margin-top: 32px;
        }

        .workflow-summary-card {
          background: #FFFFFF;
          border: 1px solid rgba(17,17,17,0.08);
          border-radius: 18px; padding: 18px;
          box-shadow: 0 4px 16px rgba(17,17,17,0.05);
        }

        .workflow-summary-value {
          font-size: 30px; font-weight: 950;
          color: #111111; margin-bottom: 3px;
          letter-spacing: -1px; line-height: 1;
        }

        .workflow-summary-label { font-size: 13px; font-weight: 700; color: #8A8A84; }

        .workflow-section { padding: 16px 24px 100px; }

        .work-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
          gap: 22px; max-width: 1400px; margin: 0 auto;
        }

        .work-card {
          background: #FFFFFF;
          border: 1px solid rgba(17,17,17,0.08);
          border-radius: 24px; padding: 32px 28px;
          position: relative; overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(17,17,17,0.04);
        }

        .work-card::after {
          content: "";
          position: absolute; left: 0; bottom: 0;
          width: 100%; height: 4px;
          background: #CBFA57;
          transform: scaleX(0); transform-origin: left;
          transition: 0.3s ease;
        }

        .work-card:hover {
          transform: translateY(-8px);
          border-color: rgba(17,17,17,0.18);
          box-shadow: 0 24px 48px rgba(17,17,17,0.10);
        }

        .work-card:hover::after { transform: scaleX(1); }

        .work-number {
          position: absolute; bottom: -20px; right: 14px;
          font-size: 120px; font-weight: 950;
          color: rgba(17,17,17,0.04); z-index: 0; line-height: 1;
          transition: all 0.3s ease;
        }

        .work-card:hover .work-number { color: rgba(203,250,87,0.18); }

        .work-content { position: relative; z-index: 1; }

        .work-icon {
          width: 54px; height: 54px;
          background: #111111; color: #CBFA57;
          border-radius: 15px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
          transition: all 0.3s ease;
        }

        .work-card:hover .work-icon { transform: rotate(-5deg) scale(1.05); }

        .work-badge {
          display: inline-block;
          padding: 6px 12px;
          background: rgba(17,17,17,0.06); color: #111111;
          border-radius: 999px; font-size: 11px; font-weight: 900;
          letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 14px;
        }

        .work-title { font-size: 18px; font-weight: 900; color: #111111; margin-bottom: 12px; line-height: 1.35; letter-spacing: -0.3px; }

        .work-text { font-size: 14.5px; line-height: 1.65; color: #6B6B65; font-weight: 500; margin: 0; }

        .workflow-timeline {
          max-width: 1400px; margin: 28px auto 0;
          background: #111111;
          border-radius: 28px; padding: 44px;
          display: grid; grid-template-columns: 0.95fr 1.05fr;
          gap: 38px; align-items: center;
          position: relative; overflow: hidden;
        }

        .workflow-timeline::before {
          content: "";
          position: absolute; top: -80px; right: -80px;
          width: 240px; height: 240px;
          background: radial-gradient(circle, rgba(203,250,87,0.10), transparent 70%);
          border-radius: 50%; pointer-events: none;
        }

        .workflow-timeline h2 {
          color: #FFFFFF; font-size: 32px; font-weight: 950;
          line-height: 1.18; letter-spacing: -1px; margin: 0 0 12px;
          position: relative; z-index: 1;
        }

        .workflow-timeline p {
          color: #7A7A74; line-height: 1.7; font-size: 15px;
          font-weight: 500; margin: 0; position: relative; z-index: 1;
        }

        .timeline-list { display: grid; gap: 12px; position: relative; z-index: 1; }

        .timeline-item {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px; padding: 14px 16px;
          display: flex; gap: 14px; align-items: center;
        }

        .timeline-dot {
          width: 36px; height: 36px; border-radius: 10px;
          background: #CBFA57; color: #111111;
          display: grid; place-items: center;
          font-weight: 950; font-size: 13px; flex-shrink: 0;
        }

        .timeline-text { font-size: 14px; font-weight: 700; color: #D4D4CE; }

        .workflow-cta {
          max-width: 1400px; margin: 24px auto 0;
          background: #FFFFFF;
          border: 1px solid rgba(17,17,17,0.08);
          border-radius: 24px; padding: 32px 36px;
          display: flex; justify-content: space-between; align-items: center;
          gap: 24px; flex-wrap: wrap;
          box-shadow: 0 8px 24px rgba(17,17,17,0.06);
        }

        .workflow-cta h3 { color: #111111; font-size: 26px; font-weight: 950; margin: 0 0 7px; letter-spacing: -0.7px; }

        .workflow-cta p { color: #6B6B65; font-size: 15px; font-weight: 500; margin: 0; line-height: 1.6; }

        .workflow-cta-btn {
          background: #111111; color: #CBFA57;
          border: none; padding: 14px 24px; border-radius: 999px;
          font-weight: 900; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: 0.25s ease; font-size: 14px; white-space: nowrap;
        }

        .workflow-cta-btn:hover { background: #222222; transform: translateY(-3px); box-shadow: 0 10px 24px rgba(17,17,17,0.2); }

        @media (max-width: 900px) {
          .workflow-hero { padding-top: 120px; }
          .workflow-timeline { grid-template-columns: 1fr; padding: 30px 24px; }
          .workflow-timeline h2 { font-size: 26px; }
        }

        @media (max-width: 640px) {
          .work-grid { grid-template-columns: 1fr; }
          .workflow-cta { padding: 26px 22px; }
        }
      `}</style>

      <div className="workflow-page">
        <div className="workflow-hero">
          <div className="workflow-container">
            <PageHeader
              label="System Protocol"
              title="Clear approval and service workflow"
              text="Every breakdown complaint follows a structured process so nothing is missed and every service action is traceable through the system."
            />
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
              <h2>From complaint creation to final service closure.</h2>
              <p>The workflow ensures every complaint has proper ownership, approval, vendor tracking, technician updates and final closure confirmation.</p>
            </div>
            <div className="timeline-list">
              {[
                "User reports issue with asset information",
                "HOD/Admin verifies repair approval",
                "Vendor complaint number is recorded",
                "Technician action and closure proof are saved",
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
              <p>Use AssetCare Pro to reduce missed complaints, manual follow-ups and unapproved service expenses.</p>
            </div>
            <Link to="/login" className="workflow-cta-btn">
              Start Workflow <ArrowForwardRoundedIcon fontSize="small" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default Workflow;
