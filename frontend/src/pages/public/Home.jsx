import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import VerifiedIcon from "@mui/icons-material/Verified";
import BuildIcon from "@mui/icons-material/Build";
import BusinessIcon from "@mui/icons-material/Business";
import ApprovalIcon from "@mui/icons-material/Approval";
import InsightsIcon from "@mui/icons-material/Insights";
import AddTaskIcon from "@mui/icons-material/AddTask";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const Home = () => {
  const features = [
    { icon: <VerifiedIcon sx={{ fontSize: 24 }} />, title: "Warranty Optimization", text: "Optimize warranty coverage, AMC contracts, renewal schedules, and service provider agreements for your entire inventory." },
    { icon: <BuildIcon sx={{ fontSize: 24 }} />, title: "Support Ticket System", text: "Register service requests, assign responsibility, and track the repair timeline from open to completion." },
    { icon: <BusinessIcon sx={{ fontSize: 24 }} />, title: "Vendor Coordination", text: "Maintain detailed OEM contact info, service booking numbers, technician schedules, and vendor performance history." },
    { icon: <ApprovalIcon sx={{ fontSize: 24 }} />, title: "Departmental Approval", text: "Verify and approve maintenance tasks at the department level before initiating paid services." },
    { icon: <InsightsIcon sx={{ fontSize: 24 }} />, title: "Live Analytics Dashboard", text: "Monitor active service tickets, upcoming warranty dates, pending approvals, and comprehensive cost summaries." },
    { icon: <AddTaskIcon sx={{ fontSize: 24 }} />, title: "Complete Service History", text: "Build a permanent digital archive of every test, maintenance visit, component replacement, and final resolution." },
  ];

  const stats = [
    { label: "Assets Managed", value: "1,248+" },
    { label: "Open Tickets", value: "24" },
    { label: "Warranty Alerts", value: "18" },
    { label: "Vendors", value: "42" },
  ];

  return (
    <main className="midnight-home">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');

        .midnight-home {
          /* Spacing Scale */
          --space-8: 8px;
          --space-12: 12px;
          --space-16: 16px;
          --space-20: 20px;
          --space-24: 24px;
          --space-32: 32px;
          --space-48: 48px;
          --space-64: 64px;
          --space-96: 96px;

          /* Color Palette: Dark Midnight Navy (#0B0D17) & Deep Slate Card (#1E233D) with #7777C7 Accents */
          --bg-canvas: #0B0D17;
          --bg-surface: #1E233D;
          --bg-surface-subtle: #161B2E;
          --bg-surface-elevated: #252B49;
          --border-light: rgba(119, 119, 199, 0.22);
          --border-subtle: rgba(119, 119, 199, 0.12);
          --border-medium: rgba(119, 119, 199, 0.38);

          --accent-primary: #7777C7;
          --accent-primary-hover: #6464B8;

          --text-primary: #FFFFFF;
          --text-secondary: #94A3B8;
          --text-muted: #64748B;

          /* Status Accents */
          --emerald-text: #7777C7;
          --emerald-tint: rgba(119, 119, 199, 0.14);
          --emerald-border: rgba(119, 119, 199, 0.35);

          --amber-text: #FBBF24;
          --amber-tint: rgba(245, 158, 11, 0.14);
          --amber-border: rgba(245, 158, 11, 0.3);

          --crimson-text: #F87171;
          --crimson-tint: rgba(239, 68, 68, 0.14);
          --crimson-border: rgba(239, 68, 68, 0.3);

          /* Rounded Geometry */
          --radius-sm: 8px;
          --radius-md: 14px;
          --radius-lg: 20px;
          --radius-xl: 28px;
          --radius-full: 9999px;

          /* Typography Stack — Original Website Font */
          --font-heading: 'Poppins', sans-serif;
          --font-body: 'Poppins', 'Inter', -apple-system, sans-serif;

          background-color: var(--bg-canvas);
          color: var(--text-primary);
          font-family: var(--font-body);
          overflow-x: hidden;
          min-height: 100vh;
        }

        .midnight-container {
          max-width: 1200px;
          margin: 0 auto;
          padding-left: var(--space-24);
          padding-right: var(--space-24);
        }

        /* ─── Typography Utility Classes (Matching Original Site) ─ */
        .midnight-hero-title {
          font-family: var(--font-heading);
          font-size: 56px;
          line-height: 1.08;
          font-weight: 900;
          color: #FFFFFF;
          letter-spacing: -1.8px;
          text-transform: uppercase;
          margin: 0 0 22px;
        }

        .midnight-section-heading {
          font-family: var(--font-heading);
          font-size: 40px;
          line-height: 1.15;
          font-weight: 900;
          color: #FFFFFF;
          letter-spacing: -1.2px;
          margin: 0 0 var(--space-16);
        }

        .midnight-body {
          font-family: var(--font-body);
          font-size: 16.5px;
          line-height: 1.7;
          font-weight: 400;
          color: var(--text-secondary);
        }

        .midnight-meta {
          font-family: var(--font-body);
          font-size: 13px;
          line-height: 1.5;
          font-weight: 500;
          color: var(--text-muted);
        }

        /* ─── Buttons ─────────────────────────────────────────── */
        .midnight-btn-solid {
          min-height: 52px;
          padding: 0 32px;
          background-color: #7777C7;
          color: #0B0C1A;
          border-radius: var(--radius-full);
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 15px;
          line-height: 1;
          letter-spacing: -0.2px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-8);
          border: 1px solid #7777C7;
          box-shadow: 0 6px 20px rgba(119, 119, 199, 0.35);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .midnight-btn-solid:hover {
          background-color: #6464B8;
          border-color: #6464B8;
          color: #FFFFFF;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(119, 119, 199, 0.5);
        }
        .midnight-btn-solid:focus-visible {
          outline: 2px solid #7777C7;
          outline-offset: 2px;
        }

        .midnight-btn-outline {
          min-height: 52px;
          padding: 0 30px;
          border-radius: var(--radius-full);
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 15px;
          line-height: 1;
          letter-spacing: -0.2px;
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background-color: #10121C;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-8);
          transition: all 0.22s ease;
        }
        .midnight-btn-outline:hover {
          background-color: #1A1D2E;
          border-color: #7777C7;
          transform: translateY(-2px);
        }
        .midnight-btn-outline:focus-visible {
          outline: 2px solid #7777C7;
          outline-offset: 2px;
        }

        /* ─── Cards & Surfaces ────────────────────────────────── */
        .midnight-card {
          background-color: #1E233D;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-xl);
          padding: var(--space-32);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7);
        }

        .midnight-stat-card {
          background-color: #1E233D;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 16px 14px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .midnight-stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(119, 119, 199, 0.4);
        }

        .midnight-stat-number {
          font-family: var(--font-heading);
          font-size: 24px;
          line-height: 1.1;
          font-weight: 900;
          color: #FFFFFF;
          letter-spacing: -0.8px;
          margin-bottom: 3px;
        }

        .midnight-stat-label {
          font-family: var(--font-heading);
          font-size: 11px;
          line-height: 1.3;
          font-weight: 800;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .midnight-icon-circle {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          background-color: #1E233D;
          color: #7777C7;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .midnight-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: var(--radius-full);
          font-family: var(--font-heading);
          font-size: 12px;
          line-height: 1.4;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .midnight-tag-strip {
          display: inline-flex;
          align-items: center;
          gap: var(--space-12);
          font-family: var(--font-heading);
          font-size: 13px;
          font-weight: 800;
          color: #7777C7;
          letter-spacing: 1.2px;
          margin-bottom: 26px;
          text-transform: uppercase;
          background-color: #111424;
          border: 1px solid rgba(119, 119, 199, 0.35);
          border-radius: 6px;
          padding: 7px 16px;
        }

        .midnight-bar-track {
          height: 8px;
          background-color: #1E233B;
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        /* ─── 7 Capability Pills Grid ─────────────────────────── */
        .midnight-capabilities-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .midnight-capability-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: #1E233D;
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 13px 18px;
          min-height: 52px;
          box-sizing: border-box;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .midnight-capability-pill:hover {
          transform: translateY(-2px);
          border-color: rgba(119, 119, 199, 0.4);
        }

        .midnight-capability-icon {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background-color: #161B2E;
          color: #7777C7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .midnight-capability-text {
          font-family: var(--font-heading);
          font-weight: 700;
          color: #FFFFFF;
          font-size: 13.5px;
          letter-spacing: -0.2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ─── Core Modules Grid ───────────────────────────────── */
        .midnight-modules-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .midnight-feature-card {
          background-color: #1E233D;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          height: 100%;
          box-sizing: border-box;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .midnight-feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(119, 119, 199, 0.4);
          box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.7), 0 0 20px rgba(119, 119, 199, 0.12);
        }

        .midnight-asset-row {
          padding: var(--space-16) var(--space-20);
          border-bottom: 1px solid var(--border-light);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-16);
          transition: background-color 0.15s ease;
        }
        .midnight-asset-row:last-child {
          border-bottom: none;
        }
        .midnight-asset-row:hover {
          background-color: rgba(119, 119, 199, 0.05);
        }

        .midnight-workflow-item {
          padding: var(--space-16) var(--space-20);
          border-bottom: 1px solid var(--border-light);
          display: flex;
          gap: var(--space-16);
          align-items: flex-start;
          transition: background-color 0.15s ease;
        }
        .midnight-workflow-item:last-child {
          border-bottom: none;
        }
        .midnight-workflow-item:hover {
          background-color: rgba(119, 119, 199, 0.05);
        }

        .midnight-check-item {
          display: flex;
          align-items: center;
          gap: var(--space-16);
          font-size: 15.5px;
          line-height: 1.5;
          font-weight: 600;
          color: #E2E8F0;
        }

        /* ─── Responsive Media Queries ────────────────────────── */
        @media (max-width: 1024px) {
          .midnight-hero-grid, .midnight-split-grid {
            grid-template-columns: 1fr !important;
            gap: var(--space-48) !important;
          }
          .midnight-capabilities-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .midnight-modules-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .midnight-hero-title {
            font-size: 44px !important;
          }
          .midnight-section-heading {
            font-size: 34px !important;
          }
        }

        @media (max-width: 640px) {
          .midnight-container {
            padding-left: var(--space-16);
            padding-right: var(--space-16);
          }
          .midnight-capabilities-grid {
            grid-template-columns: 1fr !important;
          }
          .midnight-modules-grid {
            grid-template-columns: 1fr !important;
          }
          .midnight-hero-title {
            font-size: 34px !important;
          }
          .midnight-section-heading {
            font-size: 26px !important;
          }
          .midnight-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .midnight-card, .midnight-feature-card {
            padding: var(--space-20);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* ─── 1. HERO & METRICS SECTION ────────────────────────────────────────────── */}
      <section style={{
        paddingTop: "140px",
        paddingBottom: "55px",
        borderBottom: "1px solid var(--border-light)"
      }}>
        <div className="midnight-container midnight-hero-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "56px", alignItems: "center" }}>
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            
            {/* Page Title (Poppins 900 Uppercase) */}
            <motion.h1 variants={fadeUp} className="midnight-hero-title">
              MANAGE ASSETS<br/>WARRANTY &amp;<br/>SERVICE
            </motion.h1>

            {/* Tag Strip */}
            <motion.div variants={fadeUp} className="midnight-tag-strip">
              <span>REGISTER</span> <span style={{ color: "rgba(119, 119, 199, 0.4)" }}>|</span>
              <span>TRACK</span> <span style={{ color: "rgba(119, 119, 199, 0.4)" }}>|</span>
              <span>MANAGE</span> <span style={{ color: "rgba(119, 119, 199, 0.4)" }}>|</span>
              <span>RENEW</span>
            </motion.div>

            {/* Paragraph Body */}
            <motion.p variants={fadeUp} className="midnight-body" style={{ marginBottom: "34px", maxWidth: 520, fontSize: "17.5px" }}>
              Complete solution to manage warranty &amp; service of <strong style={{ color: "#7777C7", fontWeight: 800 }}>Movable</strong> and <strong style={{ color: "#7777C7", fontWeight: 800 }}>Immovable</strong> Assets.
            </motion.p>

            {/* Action Buttons */}
            <motion.div variants={fadeUp} style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", marginBottom: "44px" }}>
              <Link to="/login" className="midnight-btn-solid">
                Access Dashboard <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
              </Link>
              <Link to="/modules" className="midnight-btn-outline">
                View Modules
              </Link>
            </motion.div>

            {/* Stat Cards Grid (4 items) */}
            <motion.div variants={fadeUp} className="midnight-stats-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              maxWidth: 520
            }}>
              {stats.map((item) => (
                <div key={item.label} className="midnight-stat-card">
                  <div className="midnight-stat-number">
                    {item.value}
                  </div>
                  <div className="midnight-stat-label">
                    {item.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column: Dashboard Preview Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} style={{ position: "relative" }}>
            <div className="midnight-card" style={{ padding: "32px", position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 18, color: "#FFFFFF", letterSpacing: "-0.4px" }}>
                    IAssetCare Dashboard
                  </div>
                  <div className="midnight-meta" style={{ marginTop: 2 }}>
                    Live asset health overview
                  </div>
                </div>
                <span className="midnight-badge" style={{ border: "1px solid rgba(119, 119, 199, 0.4)", color: "#7777C7", backgroundColor: "rgba(119, 119, 199, 0.1)", padding: "4px 14px", fontSize: 11 }}>
                  LIVE
                </span>
              </div>

              {/* 2 KPI Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "22px" }}>
                <div style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderRadius: "var(--radius-md)",
                  padding: "18px 20px",
                  border: "1px solid rgba(119, 119, 199, 0.15)"
                }}>
                  <Inventory2RoundedIcon sx={{ color: "#FFFFFF", fontSize: 22, marginBottom: "8px" }} />
                  <div className="midnight-stat-number" style={{ fontSize: 30, lineHeight: 1, marginBottom: 4 }}>
                    1,248
                  </div>
                  <div className="midnight-stat-label" style={{ fontSize: 12, textTransform: "none", letterSpacing: "normal", fontWeight: 600 }}>
                    Total Assets
                  </div>
                </div>

                <div style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderRadius: "var(--radius-md)",
                  padding: "18px 20px",
                  border: "1px solid rgba(119, 119, 199, 0.15)"
                }}>
                  <BuildIcon sx={{ color: "#FFFFFF", fontSize: 22, marginBottom: "8px" }} />
                  <div className="midnight-stat-number" style={{ fontSize: 30, lineHeight: 1, marginBottom: 4 }}>
                    24
                  </div>
                  <div className="midnight-stat-label" style={{ fontSize: 12, textTransform: "none", letterSpacing: "normal", fontWeight: 600 }}>
                    Active Tickets
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              {[
                { name: "IT Assets", val: "82%", width: "82%", color: "#FFFFFF" },
                { name: "Electrical", val: "58%", width: "58%", color: "#7777C7" },
                { name: "Under Service", val: "34%", width: "34%", color: "#F97316" },
              ].map((bar) => (
                <div key={bar.name} style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span className="midnight-body" style={{ fontSize: 13.5, fontWeight: 500, color: "#CBD5E1" }}>{bar.name}</span>
                    <span className="midnight-body" style={{ fontSize: 13.5, fontWeight: 700, color: "#FFFFFF" }}>{bar.val}</span>
                  </div>
                  <div className="midnight-bar-track">
                    <motion.div initial={{ width: 0 }} animate={{ width: bar.width }} transition={{ duration: 0.8, delay: 0.3 }} style={{ height: "100%", backgroundColor: bar.color, borderRadius: "var(--radius-full)" }} />
                  </div>
                </div>
              ))}

              {/* Alert Banner */}
              <div style={{
                marginTop: "22px",
                padding: "16px 20px",
                backgroundColor: "var(--bg-surface-subtle)",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                display: "flex",
                gap: "14px",
                alignItems: "center"
              }}>
                <WarningAmberRoundedIcon sx={{ color: "#F59E0B", fontSize: 22, flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, color: "#FFFFFF", fontSize: 14 }}>
                    Warranty Alert
                  </div>
                  <div className="midnight-meta" style={{ marginTop: 2 }}>
                    18 assets expiring within 30 days
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 2. TRUST / CAPABILITIES STRIP (7 BOXES) ─────────────────────────────── */}
      <section style={{ backgroundColor: "#0B0D17", padding: "32px 0", borderBottom: "1px solid var(--border-light)" }}>
        <div className="midnight-container">
          <div className="midnight-capabilities-grid">
            {[
              "Centralized Asset Registry",
              "Warranty Tracking",
              "Service Reminders",
              "Claim & Ticket Management",
              "Document Storage",
              "Reports & Analytics",
              "Multi-Location Management"
            ].map((item) => (
              <div key={item} className="midnight-capability-pill">
                <div className="midnight-capability-icon">
                  ✓
                </div>
                <span className="midnight-capability-text">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "55px 0", backgroundColor: "#0B0D17", borderTop: "1px solid var(--border-light)" }}>
        <div className="midnight-container midnight-split-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "56px", alignItems: "center" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeUp}>
            <span className="midnight-badge" style={{ backgroundColor: "#171B2E", color: "#7777C7", border: "1px solid rgba(119, 119, 199, 0.35)", marginBottom: "16px" }}>
              Asset Control
            </span>
            <h2 className="midnight-section-heading">
              Managing company assets in spreadsheets.
            </h2>
            <p className="midnight-body" style={{ marginBottom: "26px" }}>
              IAssetCare gives your company a complete digital record of IT, electrical, electronic, furniture and other movable or immovable assets.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {["Department-wise asset allocation", "Location and ownership tracking", "Warranty, AMC and purchase details", "Asset-wise complete service history"].map((text) => (
                <div className="midnight-check-item" key={text}>
                  <div className="midnight-icon-circle" style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "#1E233D" }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: "#7777C7" }}>✓</span>
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="midnight-card" style={{ padding: 0, overflow: "hidden", borderRadius: "var(--radius-lg)" }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)", backgroundColor: "var(--bg-surface-subtle)" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, color: "#FFFFFF", letterSpacing: "-0.3px" }}>
                Asset Register Preview
              </div>
            </div>
            {[
              { title: "Dell Latitude Laptop", meta: "IT Department · Jaipur Office", status: "Warranty Active", color: "#7777C7", bg: "rgba(119, 119, 199, 0.14)", border: "rgba(119, 119, 199, 0.35)" },
              { title: "Canon Printer", meta: "Admin Department · Floor 2", status: "Service Due", color: "var(--amber-text)", bg: "var(--amber-tint)", border: "var(--amber-border)" },
              { title: "UPS Power Backup", meta: "Electrical Room · Basement", status: "Complaint Open", color: "var(--crimson-text)", bg: "var(--crimson-tint)", border: "var(--crimson-border)" },
            ].map((asset) => (
              <div key={asset.title} className="midnight-asset-row">
                <div>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "#FFFFFF", fontSize: 14 }}>{asset.title}</div>
                  <div className="midnight-meta" style={{ marginTop: 2 }}>{asset.meta}</div>
                </div>
                <span className="midnight-badge" style={{ backgroundColor: asset.bg, color: asset.color, border: `1px solid ${asset.border}`, whiteSpace: "nowrap", padding: "4px 12px", fontSize: "11px" }}>
                  {asset.status}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── 4. SECTION 2 — SERVICE MANAGEMENT ───────────────────────────────────── */}
      <section style={{ padding: "55px 0", backgroundColor: "#0B0D17", borderTop: "1px solid var(--border-light)" }}>
        <div className="midnight-container midnight-split-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "56px", alignItems: "center" }}>
          <motion.div className="midnight-card" style={{ padding: 0, overflow: "hidden", borderRadius: "var(--radius-lg)" }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)", backgroundColor: "var(--bg-surface-subtle)" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, color: "#FFFFFF", letterSpacing: "-0.3px" }}>
                Ticket Workflow
              </div>
            </div>
            {[
              { step: "01", title: "Service Request Registered", text: "User creates a ticket with issue details." },
              { step: "02", title: "Departmental Verification", text: "HOD/Admin reviews service eligibility and warranty details." },
              { step: "03", title: "Vendor Coordination Active", text: "OEM contact details and technician visit schedules are saved." },
              { step: "04", title: "Service Completed", text: "Resolution details, costs, and feedback are recorded." },
            ].map((item) => (
              <div key={item.step} className="midnight-workflow-item">
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "#1E233D",
                  color: "#7777C7",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--font-heading)",
                  fontWeight: 900,
                  fontSize: 12,
                  flexShrink: 0
                }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, color: "#FFFFFF", fontSize: 14 }}>
                    {item.title}
                  </div>
                  <div className="midnight-body" style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 2 }}>
                    {item.text}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeUp}>
            <span className="midnight-badge" style={{ backgroundColor: "#171B2E", color: "#7777C7", border: "1px solid rgba(119, 119, 199, 0.35)", marginBottom: "16px" }}>
              Service Management
            </span>
            <h2 className="midnight-section-heading">
              Track every service ticket end to end.
            </h2>
            <p className="midnight-body" style={{ marginBottom: "26px" }}>
              Keep every service request, technician contact, pending approval, and repair milestone fully organized in a clear, real-time timeline.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {["Seamless service ticket registration", "Transparent approval workflows", "Detailed vendor coordination logs", "Verification proof and maintenance logs"].map((text) => (
                <div className="midnight-check-item" key={text}>
                  <div className="midnight-icon-circle" style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "#1E233D" }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: "#7777C7" }}>✓</span>
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 5. FEATURES GRID (CORE MODULES) ─────────────────────────────────────── */}
      <section style={{ padding: "55px 0", backgroundColor: "#0B0D17", borderTop: "1px solid var(--border-light)" }}>
        <div className="midnight-container">
          <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 54px" }}>
            <span className="midnight-badge" style={{ backgroundColor: "#171B2E", color: "#7777C7", border: "1px solid rgba(119, 119, 199, 0.35)", marginBottom: "16px" }}>
              Core Modules
            </span>
            <h2 className="midnight-section-heading" style={{ fontSize: "44px", marginBottom: "16px" }}>
              Everything your asset team needs.
            </h2>
            <p className="midnight-body" style={{ margin: 0 }}>
              From asset entry to warranty alerts, approvals, vendor complaint tracking and service closure — all modules work together.
            </p>
          </div>

          <motion.div className="midnight-modules-grid"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}>
            {features.map((item) => (
              <motion.div key={item.title} variants={fadeUp} className="midnight-feature-card">
                <div className="midnight-icon-circle" style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", marginBottom: "18px", backgroundColor: "#1E233D" }}>
                  <span style={{ color: "#7777C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.icon}
                  </span>
                </div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 900, color: "#FFFFFF", marginBottom: "8px", letterSpacing: "-0.3px" }}>
                  {item.title}
                </h3>
                <p className="midnight-body" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6 }}>
                  {item.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    </main>
  );
};

export default Home;





