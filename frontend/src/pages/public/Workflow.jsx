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
    {
      title: "Employee raises asset breakdown ticket",
      text: "The employee reports the issue with asset details, problem description, priority and supporting proof.",
      icon: <ConfirmationNumberRoundedIcon fontSize="large" />,
    },
    {
      title: "Department HOD reviews and approves request",
      text: "The department head checks the request and approves repair, replacement or further escalation.",
      icon: <FactCheckRoundedIcon fontSize="large" />,
    },
    {
      title: "Admin checks warranty and vendor details",
      text: "Admin verifies warranty status, AMC coverage, asset documents and available vendor support.",
      icon: <AdminPanelSettingsRoundedIcon fontSize="large" />,
    },
    {
      title: "Complaint is registered with OEM/service company",
      text: "The vendor or OEM complaint is created with complaint number, contact details and service schedule.",
      icon: <BusinessRoundedIcon fontSize="large" />,
    },
    {
      title: "Technician visit and repair status is updated",
      text: "Technician visit, diagnosis, spare parts, cost estimate and repair progress are updated in the system.",
      icon: <EngineeringRoundedIcon fontSize="large" />,
    },
    {
      title: "User confirms resolution and ticket is closed",
      text: "After repair completion, the user confirms resolution and admin closes the ticket with final remarks.",
      icon: <TaskAltRoundedIcon fontSize="large" />,
    },
  ];

  return (
    <>
      <style>{`
        .workflow-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(15,118,110,0.10), transparent 34%),
            radial-gradient(circle at top right, rgba(30,58,138,0.12), transparent 35%),
            #F8FAFC;
        }

        .workflow-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .workflow-hero {
          padding: 140px 24px 48px;
        }

        .workflow-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
          margin-top: 38px;
        }

        .workflow-summary-card {
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(226,232,240,0.95);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 14px 30px rgba(15,23,42,0.05);
          backdrop-filter: blur(14px);
        }

        .workflow-summary-value {
          font-size: 30px;
          font-weight: 950;
          color: #1E3A8A;
          margin-bottom: 4px;
        }

        .workflow-summary-label {
          font-size: 14px;
          font-weight: 800;
          color: #64748B;
        }

        .workflow-section {
          padding: 20px 24px 110px;
        }

        .work-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
          gap: 30px;
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
        }

        .work-card {
          background: rgba(255,255,255,0.92);
          border: 1px solid #E2E8F0;
          border-radius: 30px;
          padding: 36px 32px;
          position: relative;
          overflow: hidden;
          transition: all 0.35s ease;
          box-shadow: 0 10px 26px rgba(15,23,42,0.04);
        }

        .work-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(30,58,138,0.07), rgba(15,118,110,0.07));
          opacity: 0;
          transition: 0.35s ease;
        }

        .work-card::after {
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

        .work-card:hover {
          transform: translateY(-10px);
          border-color: rgba(15,118,110,0.34);
          box-shadow: 0 26px 55px rgba(15,23,42,0.10);
        }

        .work-card:hover::before {
          opacity: 1;
        }

        .work-card:hover::after {
          transform: scaleX(1);
        }

        .work-number {
          position: absolute;
          bottom: -24px;
          right: 12px;
          font-size: 132px;
          font-weight: 950;
          color: #EEF2F7;
          z-index: 0;
          line-height: 1;
          transition: all 0.35s ease;
        }

        .work-card:hover .work-number {
          color: rgba(15,118,110,0.10);
          transform: translateY(8px) scale(1.04);
        }

        .work-content {
          position: relative;
          z-index: 1;
        }

        .work-icon {
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

        .work-card:hover .work-icon {
          transform: rotate(-6deg) scale(1.06);
          box-shadow: 0 20px 38px rgba(15,118,110,0.35);
        }

        .work-badge {
          display: inline-block;
          padding: 7px 15px;
          background: rgba(15,118,110,0.10);
          color: #0F766E;
          border: 1px solid rgba(15,118,110,0.16);
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        .work-title {
          font-size: 23px;
          font-weight: 950;
          color: #0F172A;
          margin-bottom: 14px;
          line-height: 1.35;
          letter-spacing: -0.5px;
        }

        .work-text {
          font-size: 16px;
          line-height: 1.65;
          color: #64748B;
          font-weight: 600;
          margin: 0;
        }

        .workflow-timeline {
          max-width: 1400px;
          margin: 38px auto 0;
          background:
            radial-gradient(circle at 85% 20%, rgba(20,184,166,0.25), transparent 34%),
            linear-gradient(135deg, #0F172A, #1E3A8A);
          border-radius: 34px;
          padding: 46px;
          box-shadow: 0 26px 58px rgba(15,23,42,0.24);
          display: grid;
          grid-template-columns: 0.95fr 1.05fr;
          gap: 38px;
          align-items: center;
        }

        .workflow-timeline h2 {
          color: #FFFFFF;
          font-size: 34px;
          font-weight: 950;
          line-height: 1.18;
          letter-spacing: -1px;
          margin: 0 0 12px;
        }

        .workflow-timeline p {
          color: #CBD5E1;
          line-height: 1.7;
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .timeline-list {
          display: grid;
          gap: 14px;
        }

        .timeline-item {
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

        .timeline-dot {
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

        .timeline-text {
          font-size: 15px;
          font-weight: 800;
          color: #E2E8F0;
        }

        .workflow-cta {
          max-width: 1400px;
          margin: 34px auto 0;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 30px;
          padding: 34px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
          box-shadow: 0 18px 42px rgba(15,23,42,0.06);
        }

        .workflow-cta h3 {
          color: #0F172A;
          font-size: 28px;
          font-weight: 950;
          margin: 0 0 8px;
          letter-spacing: -0.8px;
        }

        .workflow-cta p {
          color: #64748B;
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          line-height: 1.6;
        }

        .workflow-cta-btn {
          background: linear-gradient(135deg, #1E3A8A, #0F766E);
          color: #FFFFFF;
          border: none;
          padding: 16px 26px;
          border-radius: 999px;
          font-weight: 900;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: 0.3s ease;
          box-shadow: 0 16px 32px rgba(15,118,110,0.26);
        }

        .workflow-cta-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 42px rgba(15,118,110,0.36);
        }

        @media (max-width: 900px) {
          .workflow-hero {
            padding-top: 125px;
          }

          .workflow-timeline {
            grid-template-columns: 1fr;
            padding: 34px 26px;
          }

          .workflow-timeline h2 {
            font-size: 28px;
          }
        }

        @media (max-width: 640px) {
          .work-grid {
            grid-template-columns: 1fr;
          }

          .workflow-cta {
            padding: 28px 22px;
          }
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
              <div className="workflow-summary-card">
                <div className="workflow-summary-value">06</div>
                <div className="workflow-summary-label">Workflow Steps</div>
              </div>

              <div className="workflow-summary-card">
                <div className="workflow-summary-value">100%</div>
                <div className="workflow-summary-label">Traceable Actions</div>
              </div>

              <div className="workflow-summary-card">
                <div className="workflow-summary-value">3-Level</div>
                <div className="workflow-summary-label">Approval Control</div>
              </div>

              <div className="workflow-summary-card">
                <div className="workflow-summary-value">Live</div>
                <div className="workflow-summary-label">Ticket Status</div>
              </div>
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

                  <span className="work-badge">
                    Step {String(index + 1).padStart(2, "0")}
                  </span>

                  <h3 className="work-title">{step.title}</h3>

                  <p className="work-text">{step.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="workflow-timeline">
            <div>
              <h2>From complaint creation to final service closure.</h2>
              <p>
                The workflow ensures every complaint has proper ownership,
                approval, vendor tracking, technician updates and final closure
                confirmation.
              </p>
            </div>

            <div className="timeline-list">
              {[
                "User reports issue with asset information",
                "HOD/Admin verifies repair approval",
                "Vendor complaint number is recorded",
                "Technician action and closure proof are saved",
              ].map((item, index) => (
                <div className="timeline-item" key={item}>
                  <div className="timeline-dot">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="timeline-text">{item}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="workflow-cta">
            <div>
              <h3>Need a controlled repair approval process?</h3>
              <p>
                Use AssetCare Pro to reduce missed complaints, manual follow-ups
                and unapproved service expenses.
              </p>
            </div>

            <button className="workflow-cta-btn">
              Start Workflow <ArrowForwardRoundedIcon fontSize="small" />
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default Workflow;