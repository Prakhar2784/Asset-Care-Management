import { useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "../../components/PageHeader";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.14 } },
};

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => setIsSuccess(false), 5000);
      e.target.reset();
    }, 1500);
  };

  return (
    <>
      <style>{`
        .contact-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(15,118,110,0.10), transparent 34%),
            radial-gradient(circle at top right, rgba(30,58,138,0.12), transparent 35%),
            #F8FAFC;
        }

        .contact-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .contact-hero {
          padding: 140px 24px 48px;
        }

        .contact-highlights {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 18px;
          margin-top: 38px;
        }

        .contact-highlight-card {
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(226,232,240,0.95);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 14px 30px rgba(15,23,42,0.05);
          backdrop-filter: blur(14px);
        }

        .contact-highlight-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: #FFFFFF;
          background: linear-gradient(135deg, #1E3A8A, #0F766E);
          flex-shrink: 0;
        }

        .contact-highlight-title {
          font-size: 15px;
          font-weight: 900;
          color: #0F172A;
          margin-bottom: 4px;
        }

        .contact-highlight-text {
          font-size: 13px;
          font-weight: 700;
          color: #64748B;
        }

        .contact-section {
          background: transparent;
          padding: 18px 24px 110px;
        }

        .contact-grid { 
          max-width: 1400px; 
          margin: 0 auto; 
          display: grid; 
          grid-template-columns: 1.45fr 0.95fr; 
          gap: 42px; 
          align-items: start; 
        }

        .contact-form-wrapper {
          background:
            radial-gradient(circle at top right, rgba(15,118,110,0.08), transparent 32%),
            rgba(255,255,255,0.92);
          border: 1px solid #E2E8F0;
          border-radius: 34px;
          padding: 12px;
          box-shadow: 0 26px 58px rgba(15,23,42,0.08);
        }
        
        .contact-form { 
          background: #FFFFFF; 
          border: 1px solid #E2E8F0; 
          border-radius: 28px; 
          padding: 42px; 
          display: flex; 
          flex-direction: column; 
          gap: 24px; 
        }

        .form-title {
          margin-bottom: 6px;
        }

        .form-title h3 {
          margin: 0 0 8px;
          color: #0F172A;
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -0.9px;
        }

        .form-title p {
          margin: 0;
          color: #64748B;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.6;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-label {
          font-size: 14px;
          font-weight: 900;
          color: #0F172A;
        }

        .required-mark {
          color: #DC2626;
          margin-left: 4px;
        }

        .contact-input {
          width: 100%;
          padding: 16px 18px;
          font-size: 15px;
          font-weight: 600;
          background-color: #F8FAFC;
          border: 1px solid #CBD5E1;
          border-radius: 16px;
          color: #0F172A;
          outline: none;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
          box-sizing: border-box;
          appearance: none;
          -webkit-appearance: none;
        }

        .contact-input::placeholder {
          color: #94A3B8;
          font-weight: 500;
        }

        .contact-input:hover {
          border-color: #94A3B8;
          background: #FFFFFF;
        }

        .contact-input:focus {
          background-color: #FFFFFF;
          border-color: #0F766E;
          box-shadow: 0 0 0 4px rgba(15,118,110,0.12);
        }

        select.contact-input {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%2364748B' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 42px;
          cursor: pointer;
        }

        .contact-btn { 
          background: linear-gradient(135deg, #1E3A8A, #0F766E); 
          color: white; 
          padding: 18px; 
          border-radius: 16px; 
          font-weight: 900; 
          font-size: 16px; 
          border: none; 
          cursor: pointer; 
          transition: all 0.3s ease; 
          box-shadow: 0 14px 28px rgba(15,118,110,0.26); 
          margin-top: 8px; 
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .contact-btn:hover:not(:disabled) { 
          transform: translateY(-3px); 
          box-shadow: 0 22px 42px rgba(15,118,110,0.36); 
        }

        .contact-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .contact-btn.success {
          background: linear-gradient(135deg, #16A34A, #059669);
          box-shadow: 0 14px 28px rgba(22,163,74,0.24);
        }

        .contact-info { 
          display: flex; 
          flex-direction: column; 
          gap: 22px; 
        }

        .contact-side-card {
          background:
            radial-gradient(circle at 90% 10%, rgba(20,184,166,0.22), transparent 34%),
            linear-gradient(135deg, #0F172A, #1E3A8A);
          border-radius: 32px;
          padding: 34px;
          color: #FFFFFF;
          box-shadow: 0 26px 58px rgba(15,23,42,0.24);
          overflow: hidden;
          position: relative;
        }

        .contact-side-card h3 {
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -1px;
          margin: 0 0 14px;
          position: relative;
          z-index: 1;
        }

        .contact-side-card p {
          color: #CBD5E1;
          font-size: 16px;
          line-height: 1.7;
          font-weight: 600;
          margin: 0;
          position: relative;
          z-index: 1;
        }

        .side-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 28px;
          position: relative;
          z-index: 1;
        }

        .side-stat {
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 18px;
          padding: 16px;
          backdrop-filter: blur(12px);
        }

        .side-stat-value {
          font-size: 24px;
          font-weight: 950;
          margin-bottom: 4px;
        }

        .side-stat-label {
          font-size: 12px;
          font-weight: 800;
          color: #CBD5E1;
        }

        .info-box { 
          padding: 26px; 
          background: rgba(255,255,255,0.92); 
          border-radius: 24px; 
          border: 1px solid #E2E8F0; 
          box-shadow: 0 12px 30px rgba(15,23,42,0.05); 
          display: flex;
          align-items: flex-start;
          gap: 18px;
          transition: all 0.3s ease;
        }

        .info-box:hover {
          transform: translateY(-5px);
          border-color: rgba(15,118,110,0.32);
          box-shadow: 0 22px 44px rgba(15,23,42,0.09);
        }

        .info-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: rgba(15,118,110,0.10);
          color: #0F766E;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .info-label {
          font-size: 12px;
          color: #1E3A8A;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 950;
        }

        .info-text {
          font-size: 16px;
          color: #0F172A;
          margin-top: 5px;
          font-weight: 800;
          line-height: 1.5;
        }

        .support-note {
          background: #FFFFFF;
          border: 1px dashed rgba(15,118,110,0.34);
          border-radius: 24px;
          padding: 24px;
          color: #64748B;
          font-size: 15px;
          line-height: 1.7;
          font-weight: 600;
        }

        .support-note strong {
          color: #0F172A;
        }

        @media (max-width: 1000px) { 
          .contact-grid {
            grid-template-columns: 1fr;
            gap: 38px;
          }

          .contact-form {
            padding: 32px 24px;
          }
        }

        @media (max-width: 640px) {
          .contact-hero {
            padding-top: 125px;
          }

          .contact-side-card {
            padding: 28px 22px;
          }

          .side-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="contact-page">
        <div className="contact-hero">
          <div className="contact-container">
            <PageHeader
              label="Contact Protocol"
              title="Request a system demo"
              text="Share your requirements and our technical team will help you provision a complete asset service and warranty management architecture."
            />

            <div className="contact-highlights">
              <div className="contact-highlight-card">
                <div className="contact-highlight-icon">
                  <BusinessRoundedIcon />
                </div>
                <div>
                  <div className="contact-highlight-title">
                    Enterprise Ready
                  </div>
                  <div className="contact-highlight-text">
                    Suitable for offices, factories and IT teams
                  </div>
                </div>
              </div>

              <div className="contact-highlight-card">
                <div className="contact-highlight-icon">
                  <SupportAgentRoundedIcon />
                </div>
                <div>
                  <div className="contact-highlight-title">
                    Guided Demo
                  </div>
                  <div className="contact-highlight-text">
                    Understand modules and workflow clearly
                  </div>
                </div>
              </div>

              <div className="contact-highlight-card">
                <div className="contact-highlight-icon">
                  <SecurityRoundedIcon />
                </div>
                <div>
                  <div className="contact-highlight-title">
                    Secure Workflow
                  </div>
                  <div className="contact-highlight-text">
                    Approval-based asset service process
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="contact-section">
          <motion.div
            className="contact-grid"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="contact-form-wrapper">
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-title">
                  <h3>Get in touch with us</h3>
                  <p>
                    Fill in your details and we'll get back to you within one business day to schedule a personalised demo.
                  </p>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Enterprise / Company Name
                    <span className="required-mark">*</span>
                  </label>
                  <input
                    name="company"
                    placeholder="e.g., Acme Corporation"
                    className="contact-input"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Your Full Name
                    <span className="required-mark">*</span>
                  </label>
                  <input
                    name="name"
                    placeholder="e.g., Jane Doe"
                    className="contact-input"
                    required
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "24px",
                  }}
                >
                  <div className="input-group">
                    <label className="input-label">
                      Work Email Address
                      <span className="required-mark">*</span>
                    </label>
                    <input
                      name="email"
                      placeholder="name@company.com"
                      className="contact-input"
                      type="email"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      Phone Number
                      <span className="required-mark">*</span>
                    </label>
                    <input
                      name="phone"
                      placeholder="+91 00000 00000"
                      className="contact-input"
                      type="tel"
                      required
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "24px",
                  }}
                >
                  <div className="input-group">
                    <label className="input-label">
                      Organisation Size
                      <span className="required-mark">*</span>
                    </label>
                    <select name="orgSize" className="contact-input" required defaultValue="">
                      <option value="" disabled>Select team size</option>
                      <option>1 – 50 employees</option>
                      <option>51 – 200 employees</option>
                      <option>201 – 500 employees</option>
                      <option>500+ employees</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Inquiry Type</label>
                    <select name="inquiryType" className="contact-input" defaultValue="Request a Demo">
                      <option>Request a Demo</option>
                      <option>General Inquiry</option>
                      <option>Pricing Information</option>
                      <option>Technical Support</option>
                      <option>Partnership</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Your Message
                    <span className="required-mark">*</span>
                  </label>
                  <textarea
                    name="message"
                    placeholder="Tell us about your organisation, the assets you manage, and what you'd like to achieve with AssetCare Pro..."
                    className="contact-input"
                    style={{ minHeight: "140px", resize: "vertical" }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`contact-btn ${isSuccess ? "success" : ""}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Processing Request..."
                  ) : isSuccess ? (
                    <>
                      <CheckCircleRoundedIcon fontSize="small" />
                      Request Submitted
                    </>
                  ) : (
                    <>
                      <SendRoundedIcon fontSize="small" />
                      Submit Demo Request
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            <motion.div variants={staggerContainer} className="contact-info">
              <motion.div variants={fadeUp} className="contact-side-card">
                <h3>AssetCare Pro</h3>
                <p>
                  Built for organizations that need proper asset tracking,
                  warranty visibility, complaint management and approval-based
                  service control.
                </p>

                <div className="side-stats">
                  <div className="side-stat">
                    <div className="side-stat-value">360°</div>
                    <div className="side-stat-label">ASSET VISIBILITY</div>
                  </div>

                  <div className="side-stat">
                    <div className="side-stat-value">100%</div>
                    <div className="side-stat-label">SERVICE TRACKING</div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="info-box">
                <div className="info-icon">
                  <EmailRoundedIcon />
                </div>
                <div>
                  <strong className="info-label">Direct Email</strong>
                  <p className="info-text">support@assetcarepro.com</p>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="info-box">
                <div className="info-icon">
                  <PhoneRoundedIcon />
                </div>
                <div>
                  <strong className="info-label">Support Hotline</strong>
                  <p className="info-text">+91 800-456-7890</p>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="info-box">
                <div className="info-icon">
                  <LocationOnRoundedIcon />
                </div>
                <div>
                  <strong className="info-label">Office Location</strong>
                  <p className="info-text">
                    Tech Park, Block B
                    <br />
                    Jaipur, Rajasthan
                    <br />
                    India 302022
                  </p>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="support-note">
                <strong>Response Time:</strong> Our team typically responds within <strong>1 business day</strong>. For urgent support, call our hotline directly at <strong>+91 800-456-7890</strong>.
              </motion.div>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </>
  );
};

export default Contact;