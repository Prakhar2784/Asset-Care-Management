import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import PolicyRoundedIcon from "@mui/icons-material/PolicyRounded";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const SECTIONS = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using AssetCare Pro ("the Platform"), you confirm that you are at least 18 years of age, have the authority to bind the organisation you represent, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not access or use the Platform.

These Terms apply to all users of the Platform, including administrators, employees, IT support staff, and any other authorised personnel of your organisation.`,
  },
  {
    id: "platform",
    title: "2. Use of the Platform",
    content: `AssetCare Pro is a professional enterprise asset management system designed for tracking hardware assets, managing warranties, raising service tickets, approving device requests, and maintaining vendor records.

You agree to use the Platform only for lawful purposes and in accordance with these Terms. You must not:

• Use the Platform in any way that violates any applicable local, national, or international law or regulation.
• Attempt to gain unauthorised access to any part of the Platform or its related systems or networks.
• Transmit any unsolicited or unauthorised advertising or promotional material.
• Introduce viruses, trojans, worms, or any other material that is malicious or technologically harmful.
• Attempt to reverse-engineer, decompile, or disassemble any portion of the Platform.`,
  },
  {
    id: "accounts",
    title: "3. User Accounts & Access Control",
    content: `Access to the Platform is granted on a role-based basis. The following roles are defined within the system:

Administrator (Admin): Has full access to manage assets, approve requests, configure departments, manage vendors, and generate reports. Admins are responsible for all actions performed under their credentials.

Employee: Has access to view assigned assets, raise breakdown tickets, and submit device requests. Employees may not access other users' data or administrative functions.

You are responsible for maintaining the confidentiality of your login credentials. You must notify your system administrator immediately if you become aware of any unauthorised use of your account. AssetCare Pro will not be liable for any loss resulting from unauthorised use of your credentials.`,
  },
  {
    id: "data",
    title: "4. Data Ownership & Privacy",
    content: `All asset data, employee records, ticket histories, vendor information, and configuration settings entered into the Platform remain the sole property of your organisation.

AssetCare Pro acts as a data processor on your behalf. We do not sell, rent, or share your organisational data with third parties, except as required by law or to provide the services you have requested.

We implement industry-standard security measures including encrypted data transmission (HTTPS), hashed password storage (bcrypt), JWT-based session management, and role-based access controls to protect your data.

You are responsible for ensuring that personal data entered into the Platform — including employee names, email addresses, and contact details — is handled in compliance with applicable data protection laws, including the Information Technology Act, 2000 (India) and any applicable GDPR obligations.`,
  },
  {
    id: "ip",
    title: "5. Intellectual Property",
    content: `The Platform, including its source code, design, architecture, user interface, documentation, and all associated intellectual property, is owned by AssetCare Systems and is protected by applicable intellectual property laws.

You are granted a limited, non-exclusive, non-transferable licence to use the Platform solely for your internal business purposes. This licence does not grant you the right to copy, modify, distribute, sell, or lease any part of the Platform or its underlying software.

The AssetCare Pro name, logo, and all associated trademarks and service marks are the property of AssetCare Systems. Nothing in these Terms grants you any right to use our trademarks without our prior written consent.`,
  },
  {
    id: "availability",
    title: "6. Service Availability",
    content: `We will make reasonable efforts to ensure the Platform is available 24 hours a day, 7 days a week. However, we do not guarantee uninterrupted or error-free access to the Platform.

We reserve the right to suspend or withdraw access to the Platform, or any part of it, with or without notice for business or operational reasons, including maintenance, upgrades, security events, or technical failures.

Scheduled maintenance windows will be communicated in advance where practicable. AssetCare Systems shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Platform.`,
  },
  {
    id: "disclaimer",
    title: "7. Disclaimer of Warranties",
    content: `The Platform is provided on an "as is" and "as available" basis without any warranties of any kind, either express or implied. To the fullest extent permitted by law, AssetCare Systems disclaims all warranties, including but not limited to:

• Implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
• Any warranty that the Platform will meet your specific requirements.
• Any warranty that the Platform will be uninterrupted, timely, secure, or error-free.
• Any warranty regarding the accuracy or reliability of results obtained from the use of the Platform.

Some jurisdictions do not allow the exclusion of implied warranties, so the above exclusion may not apply to you.`,
  },
  {
    id: "liability",
    title: "8. Limitation of Liability",
    content: `To the maximum extent permitted by applicable law, AssetCare Systems and its directors, employees, partners, and agents shall not be liable for:

• Any indirect, incidental, special, consequential, or punitive damages.
• Any loss of profits, revenue, data, goodwill, or other intangible losses.
• Any damages arising from unauthorised access to or alteration of your data.
• Any damages arising from interruptions to, or cessation of, the Platform.

In no event shall AssetCare Systems' total liability to you for all claims arising out of or relating to these Terms or your use of the Platform exceed the total amount paid by you to AssetCare Systems in the twelve (12) months preceding the claim, or INR 10,000, whichever is lesser.`,
  },
  {
    id: "termination",
    title: "9. Termination",
    content: `We reserve the right to suspend or terminate your access to the Platform immediately, without prior notice or liability, for any reason, including if you breach these Terms.

Upon termination, your right to use the Platform will immediately cease. You remain responsible for all obligations incurred prior to termination. Provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.

You may also terminate your use of the Platform at any time by contacting your system administrator or our support team.`,
  },
  {
    id: "changes",
    title: "10. Changes to These Terms",
    content: `We may revise these Terms and Conditions at any time without prior notice. The most current version will always be posted on this page with the "Last Updated" date.

By continuing to access or use the Platform after revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you must stop using the Platform.

We encourage you to review these Terms periodically to stay informed about any changes.`,
  },
  {
    id: "governing",
    title: "11. Governing Law & Dispute Resolution",
    content: `These Terms and Conditions are governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.

Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or invalidity thereof, shall first be attempted to be resolved through good-faith negotiations between the parties.

If the dispute cannot be resolved through negotiation within 30 days, it shall be referred to and finally resolved by arbitration under the Arbitration and Conciliation Act, 1996. The place of arbitration shall be Jaipur, Rajasthan, India.

You agree to the exclusive jurisdiction of the courts located in Jaipur, Rajasthan, India for any matters not subject to arbitration.`,
  },
  {
    id: "contact",
    title: "12. Contact Us",
    content: `If you have any questions, concerns, or requests regarding these Terms and Conditions, please contact us:

AssetCare Systems
Tech Park, Block B, Jaipur, Rajasthan, India – 302022

Email: legal@assetcarepro.com
Support: support@assetcarepro.com
Phone: +91 800-456-7890

Business Hours: Monday to Friday, 9:00 AM – 6:00 PM IST`,
  },
];

const TermsAndConditions = () => {
  return (
    <>
      <style>{`
        .terms-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(17,24,39,0.06), transparent 38%),
            radial-gradient(circle at top right, rgba(17,17,17,0.03), transparent 38%),
            #0B0D12;
        }

        .terms-hero {
          background: #111827;
          padding: 160px 24px 72px;
          position: relative;
          overflow: hidden;
        }

        .terms-hero::before {
          content: "";
          position: absolute;
          top: -100px;
          right: -100px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(17,24,39,0.14), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .terms-hero-inner {
          max-width: 860px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .terms-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 999px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.35);
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          backdrop-filter: blur(12px);
          margin-bottom: 24px;
        }

        .terms-hero h1 {
          font-size: clamp(36px, 5vw, 58px);
          font-weight: 950;
          color: #FFFFFF;
          letter-spacing: -1.5px;
          line-height: 1.1;
          margin: 0 0 20px;
        }

        .terms-hero p {
          color: #CBD5E1;
          font-size: 18px;
          font-weight: 500;
          line-height: 1.7;
          margin: 0 0 28px;
          max-width: 640px;
        }

        .terms-hero-meta {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .terms-meta-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: rgba(255,255,255,0.85);
        }

        .terms-body {
          max-width: 1200px;
          margin: 0 auto;
          padding: 72px 24px 100px;
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 56px;
          align-items: start;
        }

        .terms-toc {
          position: sticky;
          top: 100px;
          background: rgba(20,20,20,0.7);
          border: 1px solid rgba(17,24,39,0.15);
          border-radius: 24px;
          padding: 28px 24px;
          box-shadow: 0 12px 32px rgba(17,17,17,0.06);
        }

        .terms-toc h4 {
          font-size: 14px;
          font-weight: 950;
          color: #FFFFFF;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 18px;
        }

        .toc-link {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #9CA3AF;
          text-decoration: none;
          padding: 7px 10px;
          border-radius: 10px;
          margin-bottom: 3px;
          transition: all 0.2s ease;
          line-height: 1.4;
        }

        .toc-link:hover {
          background: rgba(17,17,17,0.05);
          color: #FFFFFF;
          transform: translateX(4px);
        }

        .terms-sections {
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        .terms-section {
          background: rgba(20,20,20,0.7);
          border: 1px solid rgba(17,24,39,0.15);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 8px 24px rgba(15,23,42,0.04);
          transition: box-shadow 0.3s ease;
        }

        .terms-section:hover {
          box-shadow: 0 16px 40px rgba(15,23,42,0.08);
        }

        .terms-section h2 {
          font-size: 22px;
          font-weight: 950;
          color: #FFFFFF;
          letter-spacing: -0.5px;
          margin: 0 0 18px;
          padding-bottom: 16px;
          border-bottom: 2px solid rgba(17,24,39,0.25);
        }

        .terms-section-body {
          color: #CBD5E1;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.85;
          white-space: pre-line;
        }

        .terms-section-body strong {
          color: #FFFFFF;
          font-weight: 800;
        }

        .terms-highlights {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto 0;
          padding: 0 24px 72px;
        }

        .terms-highlight-card {
          background: rgba(20,20,20,0.7);
          border: 1px solid rgba(17,24,39,0.15);
          border-radius: 22px;
          padding: 28px 24px;
          box-shadow: 0 8px 22px rgba(15,23,42,0.05);
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .terms-hl-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #111827;
          color: #FFFFFF;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .terms-hl-title {
          font-size: 15px;
          font-weight: 900;
          color: #FFFFFF;
          margin-bottom: 5px;
        }

        .terms-hl-text {
          font-size: 13px;
          font-weight: 600;
          color: #94A3B8;
          line-height: 1.5;
        }

        .terms-footer-note {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px 80px;
          text-align: center;
        }

        .terms-footer-note p {
          color: #64748B;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.7;
        }

        .terms-footer-note a {
          color: #FFFFFF;
          font-weight: 800;
          text-decoration: none;
        }

        .terms-footer-note a:hover {
          text-decoration: underline;
        }

        @media (max-width: 900px) {
          .terms-body {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .terms-toc {
            position: static;
            display: none;
          }

          .terms-section {
            padding: 28px 22px;
          }
        }
      `}</style>

      <div className="terms-page">
        {/* Hero */}
        <div className="terms-hero">
          <motion.div
            className="terms-hero-inner"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="terms-hero-badge">
              <GavelRoundedIcon fontSize="small" />
              Legal Agreement
            </div>
            <h1>Terms &amp; Conditions</h1>
            <p>
              Please read these Terms and Conditions carefully before using the AssetCare Pro platform. By accessing the system, you agree to be bound by these terms.
            </p>
            <div className="terms-hero-meta">
              <span className="terms-meta-pill">
                <PolicyRoundedIcon fontSize="small" />
                Effective Date: 1 January 2026
              </span>
              <span className="terms-meta-pill">
                <VerifiedUserRoundedIcon fontSize="small" />
                Last Updated: 24 June 2026
              </span>
            </div>
          </motion.div>
        </div>

        {/* Highlight Cards */}
        <motion.div
          className="terms-highlights"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {[
            { icon: <SecurityRoundedIcon />, title: "Data Security", text: "Your organisational data is encrypted in transit and at rest at all times." },
            { icon: <VerifiedUserRoundedIcon />, title: "Role-Based Access", text: "Strict admin and employee access controls protect sensitive information." },
            { icon: <GavelRoundedIcon />, title: "Legal Compliance", text: "Platform usage is governed under Indian law with Jaipur jurisdiction." },
            { icon: <PolicyRoundedIcon />, title: "Your Data, Your Rights", text: "You own all data entered into the platform. We never sell or share it." },
          ].map((item, i) => (
            <motion.div key={i} variants={fadeUp} className="terms-highlight-card">
              <div className="terms-hl-icon">{item.icon}</div>
              <div>
                <div className="terms-hl-title">{item.title}</div>
                <div className="terms-hl-text">{item.text}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Body: TOC + Sections */}
        <div className="terms-body">
          {/* Table of Contents */}
          <aside className="terms-toc">
            <h4>Contents</h4>
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="toc-link">
                {s.title}
              </a>
            ))}
          </aside>

          {/* Sections */}
          <motion.div
            className="terms-sections"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {SECTIONS.map((s) => (
              <motion.section key={s.id} id={s.id} variants={fadeUp} className="terms-section">
                <h2>{s.title}</h2>
                <div className="terms-section-body">{s.content}</div>
              </motion.section>
            ))}
          </motion.div>
        </div>

        {/* Footer Note */}
        <div className="terms-footer-note">
          <p>
            For questions about these Terms, please <Link to="/contact">contact our support team</Link>. You can also email us at{" "}
            <a href="mailto:legal@assetcarepro.com">legal@assetcarepro.com</a>.
          </p>
        </div>
      </div>
    </>
  );
};

export default TermsAndConditions;
