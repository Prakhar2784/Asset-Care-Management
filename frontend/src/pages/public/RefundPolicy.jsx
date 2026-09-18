import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PolicyRoundedIcon from "@mui/icons-material/PolicyRounded";

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
    title: "1. Overview",
    content: `Thank you for subscribing to IAssetCare. We are dedicated to providing enterprise-grade asset management, warranty monitoring, and workflow automation solutions. This Refund and Cancellation Policy outlines the conditions under which subscriptions may be cancelled and refunds or credit adjustments are granted.`,
  },
  {
    id: "cancellation",
    title: "2. Subscription Cancellation",
    content: `• Self-Service Cancellation: Organization administrators may cancel their subscription at any time directly through the Billing & Subscription Settings portal or by contacting support.
• Continued Access: Upon cancellation, your subscription remains fully active and accessible with all included features until the end of your paid billing term (Plan Expiry Date).
• No Unsolicited Renewals: Once cancelled, no further recurring renewals or charges will occur.`,
  },
  {
    id: "proration",
    title: "3. Prorated Upgrade Credit Adjustments",
    content: `When upgrading between subscription tiers (e.g., from Home User to MSME or Large Scale):

• Automated Credit: Any unused days remaining on your active plan are automatically calculated as a prorated daily credit: (Current Plan Price / 365) × Remaining Days.
• Instant Deduction: This credit is deducted directly from your upgrade invoice prior to tax calculations, ensuring you never pay twice for overlapping periods.
• Fresh 1-Year Cycle: Your new upgraded tier immediately starts a full fresh annual commercial term from the date of upgrade payment.`,
  },
  {
    id: "refunds",
    title: "4. Refund Eligibility & Exceptions",
    content: `Because IAssetCare provides instant digital access to software features, cloud database allocation, and licensing credentials, standard subscription fees are generally non-refundable. However, full or partial refunds will be processed under the following verified conditions:

• Duplicate Transactions: If your account was charged more than once for the same subscription order due to network or gateway lag.
• Technical Incompatibility: If our technical engineering team is unable to resolve a critical system failure preventing platform access within 7 business days of an initial onboarding ticket.
• Timely Request: Refund requests for accidental duplicate payments must be submitted within 7 calendar days of the transaction timestamp.`,
  },
  {
    id: "processing",
    title: "5. Refund Method & Timelines",
    content: `• Gateway Processing: Approved refunds are credited directly back to the original payment source (Credit/Debit Card, UPI, NetBanking, or Corporate Wallet) via our Razorpay payment gateway integration.
• Settlement Window: Standard bank refund turnaround times range between 5 to 7 business days, depending on your card issuer or banking network.
• Official Credit Note: A digital Credit Note / Refund Invoice referencing your original invoice number will be issued to your registered billing email.`,
  },
  {
    id: "contact",
    title: "6. Billing Support & Inquiries",
    content: `For any billing inquiries, invoice clarifications, or refund requests, please reach out to our dedicated accounts team:

IAssetCare Accounts & Billing
Email: iassetcare@icpljpr.com
Phone: +91 90270 07508

Business Hours: Monday to Friday, 9:00 AM – 6:00 PM IST`,
  },
];

export default function RefundPolicy() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');

        .refund-page {
          min-height: 100vh;
          background-color: #0B0D17;
          color: #FFFFFF;
          font-family: 'Poppins', 'Inter', -apple-system, sans-serif;
        }

        .refund-hero {
          padding: 140px 0 44px;
        }

        .refund-container {
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 24px;
          padding-right: 24px;
        }

        .refund-hero-badge {
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

        .refund-hero h1 {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(34px, 4.5vw, 54px);
          line-height: 1.1;
          font-weight: 900;
          color: #FFFFFF;
          letter-spacing: -1.5px;
          margin: 0 0 16px;
        }

        .refund-hero p {
          font-size: 16.5px;
          line-height: 1.7;
          color: #94A3B8;
          max-width: 760px;
          margin: 0;
          font-weight: 400;
        }

        .refund-content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px 100px;
        }

        .refund-card {
          background-color: #1E233D;
          border: 1px solid rgba(119, 119, 199, 0.22);
          border-radius: 20px;
          padding: 32px 28px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .refund-card:hover {
          transform: translateY(-2px);
          border-color: rgba(119, 119, 199, 0.4);
        }

        .refund-card h2 {
          font-family: 'Poppins', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.3px;
          margin: 0 0 14px;
        }

        .refund-card p {
          color: #94A3B8;
          font-size: 14.5px;
          line-height: 1.75;
          white-space: pre-line;
          margin: 0;
          font-weight: 400;
        }

        @media (max-width: 768px) {
          .refund-card { padding: 24px 20px; }
          .refund-hero { padding-top: 120px; }
        }
      `}</style>

      <div className="refund-page">
        <section className="refund-hero">
          <div className="refund-container">
            <div className="refund-hero-badge">
              <PolicyRoundedIcon sx={{ fontSize: 16, color: "#7777C7" }} />
              Billing &amp; Subscriptions
            </div>
            <h1>Refund &amp; Cancellation Policy</h1>
            <p>
              Review our transparent subscription policies, prorated upgrade credit adjustments, and refund terms.
            </p>
          </div>
        </section>

        <main className="refund-content-wrapper">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            {SECTIONS.map((sec) => (
              <motion.div key={sec.id} variants={fadeUp} className="refund-card">
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