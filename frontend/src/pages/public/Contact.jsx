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
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
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
        .contact-page { min-height: 100vh; background: #ECEAE3; }
        .contact-container { max-width: 1400px; margin: 0 auto; }
        .contact-hero { padding: 140px 24px 44px; }

        .contact-highlights {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px; margin-top: 32px;
        }

        .contact-highlight-card {
          background: #FFFFFF;
          border: 1px solid rgba(17,17,17,0.08);
          border-radius: 18px; padding: 18px;
          display: flex; align-items: center; gap: 14px;
          box-shadow: 0 4px 16px rgba(17,17,17,0.05);
        }

        .contact-highlight-icon {
          width: 44px; height: 44px; border-radius: 13px;
          display: grid; place-items: center;
          color: #CBFA57; background: #111111; flex-shrink: 0;
        }

        .contact-highlight-title { font-size: 14px; font-weight: 900; color: #111111; margin-bottom: 3px; }
        .contact-highlight-text { font-size: 12.5px; font-weight: 600; color: #8A8A84; }

        .contact-section { background: transparent; padding: 16px 24px 100px; }

        .contact-grid {
          max-width: 1400px; margin: 0 auto;
          display: grid; grid-template-columns: 1.45fr 0.95fr;
          gap: 38px; align-items: start;
        }

        .contact-form-wrapper {
          background: #FFFFFF;
          border: 1px solid rgba(17,17,17,0.08);
          border-radius: 28px; padding: 10px;
          box-shadow: 0 8px 32px rgba(17,17,17,0.07);
        }

        .contact-form {
          background: #FFFFFF;
          border: 1px solid rgba(17,17,17,0.06);
          border-radius: 22px; padding: 38px;
          display: flex; flex-direction: column; gap: 22px;
        }

        .form-title h3 { margin: 0 0 8px; color: #111111; font-size: 26px; font-weight: 950; letter-spacing: -0.8px; }
        .form-title p { margin: 0; color: #6B6B65; font-size: 14.5px; font-weight: 500; line-height: 1.6; }

        .input-group { display: flex; flex-direction: column; gap: 7px; }

        .input-label { font-size: 13.5px; font-weight: 900; color: #111111; }
        .required-mark { color: #DC2626; margin-left: 3px; }

        .contact-input {
          width: 100%; padding: 14px 16px;
          font-size: 14.5px; font-weight: 500;
          background-color: #F9F8F5;
          border: 1.5px solid rgba(17,17,17,0.12);
          border-radius: 14px; color: #111111;
          outline: none; transition: all 0.25s ease;
          font-family: 'Inter', sans-serif;
          box-sizing: border-box; appearance: none; -webkit-appearance: none;
        }

        .contact-input::placeholder { color: #A0A09A; font-weight: 500; }
        .contact-input:hover { border-color: rgba(17,17,17,0.24); background: #FFFFFF; }
        .contact-input:focus { background-color: #FFFFFF; border-color: #111111; box-shadow: 0 0 0 3px rgba(17,17,17,0.08); }

        select.contact-input {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%23111111' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center;
          padding-right: 40px; cursor: pointer;
        }

        .contact-btn {
          background: #111111; color: #CBFA57;
          padding: 16px; border-radius: 14px;
          font-weight: 900; font-size: 15px;
          border: none; cursor: pointer;
          transition: all 0.25s ease; margin-top: 4px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }

        .contact-btn:hover:not(:disabled) { background: #222222; transform: translateY(-2px); box-shadow: 0 12px 24px rgba(17,17,17,0.22); }
        .contact-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .contact-btn.success { background: #16A34A; color: #FFFFFF; }

        .contact-info { display: flex; flex-direction: column; gap: 18px; }

        .contact-side-card {
          background: #111111; border-radius: 28px; padding: 32px;
          color: #FFFFFF; position: relative; overflow: hidden;
        }

        .contact-side-card::before {
          content: "";
          position: absolute; top: -70px; right: -70px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(203,250,87,0.14), transparent 70%);
          border-radius: 50%; pointer-events: none;
        }

        .contact-side-card h3 {
          font-size: 28px; font-weight: 950; letter-spacing: -0.9px;
          margin: 0 0 12px; position: relative; z-index: 1;
        }

        .contact-side-card p {
          color: #7A7A74; font-size: 15px; line-height: 1.7;
          font-weight: 500; margin: 0; position: relative; z-index: 1;
        }

        .side-stats {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 12px; margin-top: 24px; position: relative; z-index: 1;
        }

        .side-stat {
          background: rgba(203,250,87,0.08);
          border: 1px solid rgba(203,250,87,0.16);
          border-radius: 16px; padding: 14px;
        }

        .side-stat-value { font-size: 24px; font-weight: 950; color: #CBFA57; margin-bottom: 3px; letter-spacing: -0.8px; }
        .side-stat-label { font-size: 11px; font-weight: 800; color: #7A7A74; text-transform: uppercase; letter-spacing: "0.6px"; }

        .info-box {
          padding: 22px; background: #FFFFFF;
          border-radius: 20px; border: 1px solid rgba(17,17,17,0.08);
          box-shadow: 0 4px 16px rgba(17,17,17,0.05);
          display: flex; align-items: flex-start; gap: 16px;
          transition: all 0.25s ease;
        }

        .info-box:hover { transform: translateY(-4px); border-color: rgba(17,17,17,0.18); box-shadow: 0 16px 36px rgba(17,17,17,0.08); }

        .info-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: rgba(17,17,17,0.06); color: #111111;
          display: grid; place-items: center; flex-shrink: 0;
        }

        .info-label { font-size: 11px; color: #8A8A84; text-transform: uppercase; letter-spacing: "1px"; font-weight: 900; }
        .info-text { font-size: 15px; color: #111111; margin-top: 4px; font-weight: 800; line-height: 1.5; }

        .support-note {
          background: #FFFFFF; border: 1.5px dashed rgba(17,17,17,0.18);
          border-radius: 20px; padding: 22px;
          color: #6B6B65; font-size: 14.5px; line-height: 1.7; font-weight: 500;
        }

        .support-note strong { color: #111111; }

        @media (max-width: 1000px) {
          .contact-grid { grid-template-columns: 1fr; gap: 30px; }
          .contact-form { padding: 28px 22px; }
        }

        @media (max-width: 640px) {
          .contact-hero { padding-top: 120px; }
          .side-stats { grid-template-columns: 1fr; }
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
              {[
                { icon: <BusinessRoundedIcon />, title: "Enterprise Ready", text: "Suitable for offices, factories and IT teams" },
                { icon: <SupportAgentRoundedIcon />, title: "Guided Demo", text: "Understand modules and workflow clearly" },
                { icon: <SecurityRoundedIcon />, title: "Secure Workflow", text: "Approval-based asset service process" },
              ].map((h) => (
                <div key={h.title} className="contact-highlight-card">
                  <div className="contact-highlight-icon">{h.icon}</div>
                  <div>
                    <div className="contact-highlight-title">{h.title}</div>
                    <div className="contact-highlight-text">{h.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="contact-section">
          <motion.div className="contact-grid" initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="contact-form-wrapper">
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-title">
                  <h3>Get in touch with us</h3>
                  <p>Fill in your details and we'll get back to you within one business day to schedule a personalised demo.</p>
                </div>

                <div className="input-group">
                  <label className="input-label">Enterprise / Company Name<span className="required-mark">*</span></label>
                  <input name="company" placeholder="e.g., Acme Corporation" className="contact-input" required />
                </div>

                <div className="input-group">
                  <label className="input-label">Your Full Name<span className="required-mark">*</span></label>
                  <input name="name" placeholder="e.g., Jane Doe" className="contact-input" required />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                  <div className="input-group">
                    <label className="input-label">Work Email Address<span className="required-mark">*</span></label>
                    <input name="email" placeholder="name@company.com" className="contact-input" type="email" required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Phone Number<span className="required-mark">*</span></label>
                    <input name="phone" placeholder="+91 00000 00000" className="contact-input" type="tel" required />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                  <div className="input-group">
                    <label className="input-label">Organisation Size<span className="required-mark">*</span></label>
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
                  <label className="input-label">Your Message<span className="required-mark">*</span></label>
                  <textarea name="message" placeholder="Tell us about your organisation, the assets you manage, and what you'd like to achieve with AssetCare Pro..." className="contact-input" style={{ minHeight: 130, resize: "vertical" }} required />
                </div>

                <button type="submit" className={`contact-btn ${isSuccess ? "success" : ""}`} disabled={isSubmitting}>
                  {isSubmitting ? "Processing Request..." : isSuccess ? (
                    <><CheckCircleRoundedIcon fontSize="small" />Request Submitted</>
                  ) : (
                    <><SendRoundedIcon fontSize="small" />Submit Demo Request</>
                  )}
                </button>
              </form>
            </motion.div>

            <motion.div variants={stagger} className="contact-info">
              <motion.div variants={fadeUp} className="contact-side-card">
                <h3>AssetCare Pro</h3>
                <p>Built for organizations that need proper asset tracking, warranty visibility, complaint management and approval-based service control.</p>
                <div className="side-stats">
                  <div className="side-stat">
                    <div className="side-stat-value">360°</div>
                    <div className="side-stat-label">Asset Visibility</div>
                  </div>
                  <div className="side-stat">
                    <div className="side-stat-value">100%</div>
                    <div className="side-stat-label">Service Tracking</div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="info-box">
                <div className="info-icon"><EmailRoundedIcon /></div>
                <div>
                  <div className="info-label">Direct Email</div>
                  <div className="info-text">support@assetcarepro.com</div>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="info-box">
                <div className="info-icon"><PhoneRoundedIcon /></div>
                <div>
                  <div className="info-label">Support Hotline</div>
                  <div className="info-text">+91 800-456-7890</div>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="info-box">
                <div className="info-icon"><LocationOnRoundedIcon /></div>
                <div>
                  <div className="info-label">Office Location</div>
                  <div className="info-text">Tech Park, Block B<br />Jaipur, Rajasthan<br />India 302022</div>
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
