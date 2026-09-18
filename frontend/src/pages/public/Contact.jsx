import { useState } from "react";
import { motion } from "framer-motion";
import api from "../../api/axios";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    const form = e.target;
    const payload = {
      company: form.company.value,
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      message: form.message.value,
    };
    try {
      await api.post('/contact', payload);
      setIsSuccess(true);
      form.reset();
      setTimeout(() => setIsSuccess(false), 6000);
    } catch {
      setSubmitError('Failed to send message. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');

        .contact-page {
          min-height: 100vh;
          background-color: #0B0D17;
          color: #FFFFFF;
          font-family: 'Poppins', 'Inter', -apple-system, sans-serif;
        }

        .contact-container {
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 24px;
          padding-right: 24px;
        }

        .contact-hero {
          padding: 140px 0 44px;
        }

        .contact-tag-badge {
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

        .contact-hero-title {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(34px, 4.5vw, 54px);
          line-height: 1.1;
          font-weight: 900;
          color: #FFFFFF;
          letter-spacing: -1.5px;
          margin: 0 0 16px;
        }

        .contact-hero-sub {
          font-size: 16.5px;
          line-height: 1.7;
          color: #94A3B8;
          max-width: 640px;
          margin: 0;
          font-weight: 400;
        }

        .contact-highlights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 36px;
        }

        .contact-highlight-card {
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.22);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .contact-highlight-card:hover {
          transform: translateY(-2px);
          border-color: rgba(119, 119, 199, 0.4);
        }

        .contact-highlight-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          color: #7777C7;
          background-color: #161B2E;
          flex-shrink: 0;
        }

        .contact-highlight-title {
          font-family: 'Poppins', sans-serif;
          font-size: 14.5px;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 3px;
        }
        .contact-highlight-text {
          font-size: 12.5px;
          font-weight: 500;
          color: #94A3B8;
        }

        .contact-section {
          padding: 16px 0 100px;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1.35fr 0.95fr;
          gap: 32px;
          align-items: start;
        }

        .contact-form-wrapper {
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.22);
          border-radius: 24px;
          padding: 38px;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7);
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-title h3 {
          margin: 0 0 8px;
          color: #FFFFFF;
          font-family: 'Poppins', sans-serif;
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -0.8px;
        }
        .form-title p {
          margin: 0 0 8px;
          color: #94A3B8;
          font-size: 14.5px;
          font-weight: 400;
          line-height: 1.6;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .input-label {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
        }
        .required-mark {
          color: #F87171;
          margin-left: 3px;
        }

        .contact-input {
          width: 100%;
          padding: 14px 16px;
          font-size: 14.5px;
          font-weight: 500;
          background-color: #161B2E;
          border: 1px solid rgba(119, 119, 199, 0.22);
          border-radius: 12px;
          color: #FFFFFF;
          outline: none;
          transition: all 0.22s ease;
          font-family: 'Poppins', 'Inter', sans-serif;
          box-sizing: border-box;
        }

        .contact-input::placeholder {
          color: #64748B;
          font-weight: 400;
        }
        .contact-input:hover {
          border-color: rgba(119, 119, 199, 0.35);
        }
        .contact-input:focus {
          border-color: #7777C7;
          box-shadow: 0 0 0 3px rgba(119, 119, 199, 0.15);
          background-color: #1A1E33;
        }

        .contact-btn {
          background-color: #7777C7;
          color: #0B0D17;
          padding: 16px;
          border-radius: 9999px;
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 15px;
          border: 1px solid #7777C7;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          margin-top: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 6px 20px rgba(119, 119, 199, 0.35);
        }

        .contact-btn:hover:not(:disabled) {
          background-color: #6464B8;
          border-color: #6464B8;
          color: #FFFFFF;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(119, 119, 199, 0.5);
        }
        .contact-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .contact-btn.success {
          background-color: #10B981;
          border-color: #10B981;
          color: #FFFFFF;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .contact-side-card {
          background-color: #1E233D;
          border-radius: 24px;
          padding: 32px;
          color: #FFFFFF;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(119, 119, 199, 0.22);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7);
        }

        .contact-side-card::before {
          content: "";
          position: absolute;
          top: -70px;
          right: -70px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(119, 119, 199, 0.14), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .side-title {
          font-family: 'Poppins', sans-serif;
          font-size: 20px;
          font-weight: 900;
          margin-bottom: 8px;
          letter-spacing: -0.4px;
        }
        .side-desc {
          color: #94A3B8;
          font-size: 13.5px;
          line-height: 1.6;
          margin-bottom: 24px;
          font-weight: 400;
        }

        .side-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 28px;
        }

        .side-stat-item {
          background-color: #161B2E;
          border: 1px solid rgba(119, 119, 199, 0.18);
          border-radius: 14px;
          padding: 14px;
        }

        .side-stat-value {
          font-family: 'Poppins', sans-serif;
          font-size: 22px;
          font-weight: 900;
          color: #7777C7;
          margin-bottom: 2px;
          letter-spacing: -0.8px;
        }
        .side-stat-label {
          font-family: 'Poppins', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-box {
          padding: 20px 22px;
          background-color: #1E233D;
          border-radius: 18px;
          border: 1px solid rgba(119, 119, 199, 0.22);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.22s ease;
        }

        .info-box:hover {
          transform: translateY(-2px);
          border-color: rgba(119, 119, 199, 0.4);
        }

        .info-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background-color: #161B2E;
          color: #7777C7;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .info-label {
          font-family: 'Poppins', sans-serif;
          font-size: 11px;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-weight: 800;
        }
        .info-text {
          font-size: 14.5px;
          color: #FFFFFF;
          margin-top: 3px;
          font-weight: 700;
          line-height: 1.4;
        }

        .support-note {
          background-color: #1E233D;
          border: 1px dashed rgba(119, 119, 199, 0.3);
          border-radius: 18px;
          padding: 20px 22px;
          color: #94A3B8;
          font-size: 14px;
          line-height: 1.65;
          font-weight: 400;
        }

        .support-note strong {
          color: #FFFFFF;
        }

        @media (max-width: 1024px) {
          .contact-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .contact-highlights {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .contact-hero { padding-top: 120px; }
          .contact-form-wrapper { padding: 26px 20px; }
          .side-stats { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="contact-page">
        <div className="contact-hero">
          <div className="contact-container">
            <div>
              <span className="contact-tag-badge">Contact Protocol</span>
              <h1 className="contact-hero-title">Request a system demo</h1>
              <p className="contact-hero-sub">Share your requirements and our technical team will help you configure a complete asset service and warranty management architecture.</p>
            </div>
            <div className="contact-highlights">
              {[
                { icon: <BusinessRoundedIcon sx={{ fontSize: 22 }} />, title: "Enterprise Ready", text: "Suitable for offices, factories, schools & IT teams" },
                { icon: <SupportAgentRoundedIcon sx={{ fontSize: 22 }} />, title: "Guided Walkthrough", text: "Understand modules and workflow clearly" },
                { icon: <SecurityRoundedIcon sx={{ fontSize: 22 }} />, title: "Secure Workflow", text: "Multi-level approval based service process" },
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
          <div className="contact-container">
            <motion.div className="contact-grid" initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} className="contact-form-wrapper">
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-title">
                    <h3>Get in touch with us</h3>
                    <p>Fill in your details and we will reach out within one business day to schedule a personalized session.</p>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Enterprise / Company Name<span className="required-mark">*</span></label>
                    <input name="company" placeholder="e.g., Acme Corporation" className="contact-input" required />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Your Full Name<span className="required-mark">*</span></label>
                    <input name="name" placeholder="e.g., Jane Doe" className="contact-input" required />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    <div className="input-group">
                      <label className="input-label">Work Email Address<span className="required-mark">*</span></label>
                      <input name="email" placeholder="name@company.com" className="contact-input" type="email" required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Phone Number<span className="required-mark">*</span></label>
                      <input name="phone" placeholder="10-digit mobile number" className="contact-input" type="tel" required
                        maxLength={10} pattern="[0-9]{10}"
                        onInput={e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); }}
                        title="Please enter a valid 10-digit phone number" />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Your Message<span className="required-mark">*</span></label>
                    <textarea name="message" placeholder="Tell us about the assets you manage and what you'd like to achieve with IAssetCare..." className="contact-input" style={{ minHeight: 120, resize: "vertical" }} required />
                  </div>

                  {submitError && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '12px 16px', color: '#F87171', fontSize: '13.5px', fontWeight: 600 }}>
                      {submitError}
                    </div>
                  )}

                  <button type="submit" className={`contact-btn ${isSuccess ? "success" : ""}`} disabled={isSubmitting}>
                    {isSubmitting ? "Processing Request..." : isSuccess ? (
                      <><CheckCircleRoundedIcon fontSize="small" />Request Submitted — We'll be in touch!</>
                    ) : (
                      <><SendRoundedIcon fontSize="small" />Submit Demo Request</>
                    )}
                  </button>
                </form>
              </motion.div>

              <motion.div variants={stagger} className="contact-info">
                <motion.div variants={fadeUp} className="contact-side-card">
                  <h3>IAssetCare</h3>
                  <p>Built for enterprises that require systematic asset tracking, warranty alerts, repair management and approval-based service workflows.</p>
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
                  <div className="info-icon"><EmailRoundedIcon sx={{ fontSize: 22 }} /></div>
                  <div>
                    <div className="info-label">Direct Email</div>
                    <div className="info-text">iassetcare@icpljpr.com</div>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="info-box">
                  <div className="info-icon"><PhoneRoundedIcon sx={{ fontSize: 22 }} /></div>
                  <div>
                    <div className="info-label">Support Hotline</div>
                    <div className="info-text">+91 90270 07508</div>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="info-box">
                  <div className="info-icon"><SupportAgentRoundedIcon sx={{ fontSize: 22 }} /></div>
                  <div>
                    <div className="info-label">Business Hours</div>
                    <div className="info-text">Monday – Friday · 9:00 AM – 6:00 PM IST</div>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="support-note">
                  <strong>Response Time:</strong> Our team typically responds within <strong>1 business day</strong>. For urgent support, reach out to our hotline directly at <strong>+91 90270 07508</strong>.
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Contact;
