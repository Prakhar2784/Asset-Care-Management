import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const SECTIONS = [
  {
    id: "overview",
    title: "1. Overview & Commitment",
    content: `IAssetCare ("we", "our", or "the Platform") is committed to protecting the privacy, confidentiality, and security of personal and organizational data. This Privacy Policy explains what information we collect, how we process and store it, and your rights under Indian data protection legislation (Information Technology Act, 2000 and Digital Personal Data Protection Act, 2023) and global security best practices.`,
  },
  {
    id: "collection",
    title: "2. Information We Collect",
    content: `We collect information necessary to operate our enterprise asset and service management platform:

• Account Information: Business email address, administrator name, phone number, company name, GSTIN, and billing address.
• Asset & Hardware Registry: Serial numbers, device models, purchase dates, warranty terms, and service ticket histories entered by your organization.
• User Access Credentials: Encrypted login identifiers and session authentication tokens (passwords are stored exclusively as irreversible bcrypt hashes).
• Usage & System Logs: Server request timestamps, IP addresses, browser agent metadata, and audit logs to prevent unauthorized access.`,
  },
  {
    id: "use",
    title: "3. How We Use Your Information",
    content: `The information collected is used exclusively for legitimate business and platform operations:

• Providing, maintaining, and enhancing asset tracking, SLA monitoring, and warranty radar services.
• Generating authentic commercial tax invoices, processing subscription renewals via Razorpay, and sending transactional notifications.
• Providing customer support, diagnostic assistance, and resolving technical maintenance inquiries.
• Ensuring tenant database isolation and enforcing role-based permissions.`,
  },
  {
    id: "security",
    title: "4. Data Security & Storage",
    content: `We maintain strict technical and operational safeguards to protect your data:

• End-to-End Encryption: All data in transit is encrypted using modern TLS (HTTPS) with 256-bit SSL encryption.
• Database Isolation: Each organization is assigned dedicated tenant database contexts preventing cross-tenant data access.
• Secure Cloud Hosting: Backend services and data stores are hosted on enterprise cloud infrastructure with continuous uptime monitoring, regular automated backups, and firewall protection.`,
  },
  {
    id: "sharing",
    title: "5. Third-Party Disclosures",
    content: `We do not sell, rent, or trade your personal or organizational data to any third parties. Data is shared strictly with trusted operational infrastructure partners solely for service delivery:

• Payment Processing: Razorpay Software Private Limited for secure payment gateway processing and automated invoice billing.
• Cloud Storage & Infrastructure: MongoDB Atlas and Cloudinary for isolated database storage and encrypted attachment handling.
• Regulatory Compliance: Legal authorities only when mandated by applicable law, court order, or official governmental request.`,
  },
  {
    id: "cookies",
    title: "6. Cookies & Local Session Data",
    content: `We use local browser storage and secure HTTP-only cookies strictly for user session state, dark/light theme preference, and multi-tenant authentication routing. We do not use third-party tracking or advertising cookies.`,
  },
  {
    id: "rights",
    title: "7. Your Rights & Data Retention",
    content: `Your organization maintains complete ownership of all entered data. You have the right to:

• Access, review, or export your complete asset inventory, ticket logs, and invoice history at any time.
• Request correction or deletion of personal employee records.
• Request complete account termination and tenant database purge upon subscription expiration.`,
  },
  {
    id: "contact",
    title: "8. Privacy Officer Contact",
    content: `For any privacy inquiries, data subject requests, or security concerns, please contact our Data Protection Officer:

IAssetCare (ICPL)
Email: iassetcare@icpljpr.com
Phone: +91 90270 07508`,
  },
];

export default function PrivacyPolicy() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');

        .privacy-page {
          min-height: 100vh;
          background-color: #0B0D17;
          color: #FFFFFF;
          font-family: 'Poppins', 'Inter', -apple-system, sans-serif;
        }

        .privacy-hero {
          padding: 140px 0 44px;
        }

        .privacy-container {
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 24px;
          padding-right: 24px;
        }

        .privacy-hero-badge {
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

        .privacy-hero h1 {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(34px, 4.5vw, 54px);
          line-height: 1.1;
          font-weight: 900;
          color: #FFFFFF;
          letter-spacing: -1.5px;
          margin: 0 0 16px;
        }

        .privacy-hero p {
          font-size: 16.5px;
          line-height: 1.7;
          color: #94A3B8;
          max-width: 760px;
          margin: 0;
          font-weight: 400;
        }

        .privacy-content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px 100px;
        }

        .privacy-card {
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.22);
          border-radius: 20px;
          padding: 32px 28px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .privacy-card:hover {
          transform: translateY(-2px);
          border-color: rgba(119, 119, 199, 0.4);
        }

        .privacy-card h2 {
          font-family: 'Poppins', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.3px;
          margin: 0 0 14px;
        }

        .privacy-card p {
          color: #94A3B8;
          font-size: 14.5px;
          line-height: 1.75;
          white-space: pre-line;
          margin: 0;
          font-weight: 400;
        }

        @media (max-width: 768px) {
          .privacy-card { padding: 24px 20px; }
          .privacy-hero { padding-top: 120px; }
        }
      `}</style>

      <div className="privacy-page">
        <section className="privacy-hero">
          <div className="privacy-container">
            <div className="privacy-hero-badge">
              <SecurityRoundedIcon sx={{ fontSize: 16, color: "#7777C7" }} />
              Data Security &amp; Trust
            </div>
            <h1>Privacy Policy</h1>
            <p>
              Your privacy is our priority. Learn how IAssetCare collects, processes, encrypts, and safeguards your corporate and personal data across our cloud services.
            </p>
          </div>
        </section>

        <main className="privacy-content-wrapper">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            {SECTIONS.map((sec) => (
              <motion.div key={sec.id} variants={fadeUp} className="privacy-card">
                <h2>{sec.title}</h2>
                <p>{sec.content}</p>
              </motion.div>
            ))}
          </motion.div>
        </main>
      </div>
    </>
  );
}