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
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const Home = () => {
  const features = [
    { icon: <VerifiedIcon />, title: "Warranty Tracking", text: "Track warranty, AMC, expiry dates, service coverage and renewal status for every asset." },
    { icon: <BuildIcon />, title: "Breakdown Management", text: "Create service tickets, assign responsibility and monitor the complete repair lifecycle." },
    { icon: <BusinessIcon />, title: "Vendor Complaints", text: "Manage OEM details, complaint numbers, technician visits and vendor-wise service history." },
    { icon: <ApprovalIcon />, title: "Department Approval", text: "Control repair approvals department-wise before escalation or paid service activity." },
    { icon: <InsightsIcon />, title: "Smart Dashboard", text: "View active tickets, warranty expiry, pending approvals and department-wise reports." },
    { icon: <AddTaskIcon />, title: "Service History", text: "Maintain complete service, complaint, repair and closure records for every asset." },
  ];

  const stats = [
    { label: "Assets Managed", value: "1,248+" },
    { label: "Open Tickets", value: "24" },
    { label: "Warranty Alerts", value: "18" },
    { label: "Vendors", value: "42" },
  ];

  return (
    <div style={{ backgroundColor: "#ECEAE3", overflowX: "hidden" }}>
      <style>{`
        .h-container { max-width: 1200px; margin: 0 auto; }

        .h-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 16px; border-radius: 999px;
          background: #111111; color: #CBFA57;
          font-weight: 800; font-size: 13px; margin-bottom: 22px;
          letter-spacing: 0.2px;
        }

        .h-btn-primary {
          background: #111111; color: #CBFA57;
          padding: 15px 30px; border-radius: 999px;
          font-weight: 800; font-size: 15px;
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.22s ease;
          letter-spacing: -0.2px;
        }
        .h-btn-primary:hover { background: #222222; transform: translateY(-3px); box-shadow: 0 14px 28px rgba(17,17,17,0.22); }

        .h-btn-outline {
          padding: 15px 30px; border-radius: 999px;
          font-weight: 800; font-size: 15px;
          color: #111111; border: 1.5px solid rgba(17,17,17,0.25);
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.22s ease;
          background: rgba(255,255,255,0.5);
        }
        .h-btn-outline:hover { border-color: #111111; background: rgba(255,255,255,0.8); transform: translateY(-3px); }

        .h-hero-visual {
          background: #111111;
          border-radius: 28px;
          padding: 28px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(17,17,17,0.3);
        }

        .h-hero-visual::before {
          content: "";
          position: absolute;
          top: -60px; right: -60px;
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(203,250,87,0.18), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .h-mini-stat {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px;
          padding: 18px;
        }

        .h-bar-track {
          height: 8px;
          background: rgba(255,255,255,0.08);
          border-radius: 999px;
          overflow: hidden;
        }

        .h-feature-card {
          background: #FFFFFF;
          border: 1px solid rgba(17,17,17,0.08);
          padding: 30px 28px;
          border-radius: 24px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .h-feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 48px rgba(17,17,17,0.10);
          border-color: rgba(17,17,17,0.16);
        }

        .h-feature-icon {
          width: 54px; height: 54px;
          background: #111111; color: #CBFA57;
          border-radius: 15px;
          display: grid; place-items: center;
          margin-bottom: 20px;
        }

        .h-check-circle {
          width: 24px; height: 24px; border-radius: "50%";
          background: rgba(17,17,17,0.08);
          color: #111111;
          display: grid; place-items: center;
          font-weight: 900; font-size: 12px;
          flex-shrink: 0; border-radius: 50%;
        }

        .h-check-item {
          display: flex; align-items: center; gap: 12px;
          font-size: 15px; font-weight: 700; color: #111111;
        }

        .h-info-panel {
          background: #FFFFFF;
          border: 1px solid rgba(17,17,17,0.08);
          border-radius: 28px;
          padding: 32px;
          box-shadow: 0 20px 48px rgba(17,17,17,0.06);
        }

        .h-asset-row {
          padding: 16px; border-radius: 16px;
          background: #F9F8F5; border: 1px solid rgba(17,17,17,0.07);
          margin-bottom: 12px;
          display: flex; justify-content: space-between; gap: 12px; align-items: center;
        }

        .h-workflow-card {
          background: #FFFFFF;
          border: 1px solid rgba(17,17,17,0.08);
          border-radius: 20px; padding: 22px;
          margin-bottom: 12px;
          box-shadow: 0 4px 16px rgba(17,17,17,0.04);
        }

        .h-section-label {
          color: #111111; font-weight: 900;
          text-transform: uppercase; letter-spacing: 1.8px; font-size: 12px;
        }

        @media (max-width: 1024px) {
          .h-hero-grid, .h-split-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .h-hero-title { font-size: 44px !important; }
        }
        @media (max-width: 640px) {
          .h-hero-title { font-size: 36px !important; }
          .h-section-title { font-size: 32px !important; }
        }
      `}</style>

      {/* HERO */}
      <section style={{ paddingTop: 160, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}>
        <div className="h-container h-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="h-badge">
              <Inventory2RoundedIcon sx={{ fontSize: 16 }} />
              Enterprise Asset Service Platform
            </motion.div>

            <motion.h1 variants={fadeUp} className="h-hero-title" style={{ fontSize: 62, fontWeight: 950, color: "#111111", lineHeight: 1.06, marginBottom: 22, letterSpacing: "-2.2px" }}>
              Manage Assets, Warranty &amp; Service{" "}
              <span style={{ color: "#111111", position: "relative" }}>
                in One System.
                <span style={{ position: "absolute", bottom: -6, left: 0, right: 0, height: 6, background: "#CBFA57", borderRadius: 4 }} />
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} style={{ fontSize: 18, color: "#6B6B65", lineHeight: 1.72, marginBottom: 34, maxWidth: 520, fontWeight: 500 }}>
              A smart platform to track company assets, warranty status, breakdown tickets, vendor complaints, approvals and complete service history.
            </motion.p>

            <motion.div variants={fadeUp} style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link to="/login" className="h-btn-primary">
                Access Dashboard <ArrowForwardRoundedIcon fontSize="small" />
              </Link>
              <Link to="/modules" className="h-btn-outline">View Modules</Link>
            </motion.div>

            <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 40, maxWidth: 520 }}>
              {stats.map((item) => (
                <div key={item.label} style={{ background: "#FFFFFF", border: "1px solid rgba(17,17,17,0.08)", borderRadius: 16, padding: "14px 12px", boxShadow: "0 4px 16px rgba(17,17,17,0.05)" }}>
                  <div style={{ fontSize: 22, fontWeight: 950, color: "#111111", marginBottom: 3, letterSpacing: "-0.8px" }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: "#8A8A84", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>{item.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="h-hero-visual">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div>
                <div style={{ fontWeight: 900, color: "#FFFFFF", fontSize: 17, letterSpacing: "-0.4px" }}>AssetCare Dashboard</div>
                <div style={{ fontSize: 12, color: "#7A7A74", fontWeight: 600, marginTop: 2 }}>Live asset health overview</div>
              </div>
              <div style={{ padding: "6px 12px", borderRadius: 999, background: "rgba(203,250,87,0.12)", color: "#CBFA57", fontWeight: 900, fontSize: 11, border: "1px solid rgba(203,250,87,0.22)", letterSpacing: "1px" }}>LIVE</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div className="h-mini-stat">
                <Inventory2RoundedIcon sx={{ color: "#CBFA57", fontSize: 20, mb: 0.8 }} />
                <div style={{ fontSize: 28, fontWeight: 950, color: "#FFFFFF", letterSpacing: "-1px", lineHeight: 1 }}>1,248</div>
                <div style={{ fontSize: 12, color: "#6B6B65", marginTop: 4, fontWeight: 600 }}>Total Assets</div>
              </div>
              <div className="h-mini-stat">
                <BuildIcon sx={{ color: "#CBFA57", fontSize: 20, mb: 0.8 }} />
                <div style={{ fontSize: 28, fontWeight: 950, color: "#FFFFFF", letterSpacing: "-1px", lineHeight: 1 }}>24</div>
                <div style={{ fontSize: 12, color: "#6B6B65", marginTop: 4, fontWeight: 600 }}>Active Tickets</div>
              </div>
            </div>

            {[
              { name: "IT Assets", val: "82%", width: "82%", color: "#CBFA57" },
              { name: "Electrical", val: "58%", width: "58%", color: "#A8E03A" },
              { name: "Under Service", val: "34%", width: "34%", color: "#F59E0B" },
            ].map((bar) => (
              <div key={bar.name} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, marginBottom: 7, color: "#CBFA57" }}>
                  <span style={{ color: "#A0A09A" }}>{bar.name}</span>
                  <span>{bar.val}</span>
                </div>
                <div className="h-bar-track">
                  <motion.div initial={{ width: 0 }} animate={{ width: bar.width }} transition={{ duration: 1.1, delay: 0.8 }} style={{ height: "100%", background: bar.color, borderRadius: 999 }} />
                </div>
              </div>
            ))}

            <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(203,250,87,0.08)", borderRadius: 14, border: "1px solid rgba(203,250,87,0.16)", display: "flex", gap: 12, alignItems: "center" }}>
              <WarningAmberRoundedIcon sx={{ color: "#F59E0B", fontSize: 20, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, color: "#FFFFFF", fontSize: 13 }}>Warranty Alert</div>
                <div style={{ fontSize: 12, color: "#7A7A74", fontWeight: 600 }}>18 assets expiring within 30 days</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section style={{ background: "#111111", padding: "28px 24px" }}>
        <div className="h-container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18 }}>
          {["Centralized Asset Register", "Warranty & AMC Alerts", "Ticket Lifecycle Tracking", "Vendor Service Records"].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, color: "#FFFFFF", fontSize: 14 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#CBFA57", color: "#111111", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 11, flexShrink: 0 }}>✓</span>
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 1 — Asset Control */}
      <section style={{ padding: "100px 24px" }}>
        <div className="h-container h-split-grid" style={{ display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 64, alignItems: "center" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}>
            <span className="h-section-label">Asset Control</span>
            <h2 className="h-section-title" style={{ fontSize: 44, fontWeight: 950, color: "#111111", lineHeight: 1.14, letterSpacing: "-1.4px", margin: "14px 0 20px" }}>
              Stop managing company assets in spreadsheets.
            </h2>
            <p style={{ fontSize: 17, color: "#6B6B65", lineHeight: 1.76, marginBottom: 26, fontWeight: 500 }}>
              AssetCare Pro gives your company a complete digital record of IT, electrical, electronic, furniture and other movable or immovable assets.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {["Department-wise asset allocation", "Location and ownership tracking", "Warranty, AMC and purchase details", "Asset-wise complete service history"].map((text) => (
                <div className="h-check-item" key={text}>
                  <span className="h-check-circle">✓</span>{text}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="h-info-panel" initial={{ opacity: 0, x: 36 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.75 }}>
            <div style={{ fontWeight: 950, fontSize: 20, color: "#111111", marginBottom: 22, letterSpacing: "-0.4px" }}>Asset Register Preview</div>
            {[
              { title: "Dell Latitude Laptop", meta: "IT Department · Jaipur Office", status: "Warranty Active", color: "#16A34A", bg: "#DCFCE7" },
              { title: "Canon Printer", meta: "Admin Department · Floor 2", status: "Service Due", color: "#D97706", bg: "#FEF3C7" },
              { title: "UPS Power Backup", meta: "Electrical Room · Basement", status: "Complaint Open", color: "#DC2626", bg: "#FEE2E2" },
            ].map((asset) => (
              <div key={asset.title} className="h-asset-row">
                <div>
                  <div style={{ fontWeight: 800, color: "#111111", fontSize: 14 }}>{asset.title}</div>
                  <div style={{ fontSize: 12.5, color: "#8A8A84", fontWeight: 600, marginTop: 3 }}>{asset.meta}</div>
                </div>
                <div style={{ padding: "6px 12px", borderRadius: 999, background: asset.bg, color: asset.color, fontWeight: 800, fontSize: 11.5, whiteSpace: "nowrap" }}>
                  {asset.status}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 2 — Service Management */}
      <section style={{ padding: "0 24px 100px" }}>
        <div className="h-container h-split-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 64, alignItems: "center" }}>
          <motion.div className="h-info-panel" initial={{ opacity: 0, x: -36 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.75 }}>
            <div style={{ fontWeight: 950, fontSize: 20, color: "#111111", marginBottom: 22, letterSpacing: "-0.4px" }}>Ticket Workflow</div>
            {[
              { step: "01", title: "Asset Breakdown Reported", text: "User creates a complaint ticket with issue details." },
              { step: "02", title: "Department Approval", text: "HOD/Admin verifies warranty and approval requirement." },
              { step: "03", title: "Vendor Complaint Raised", text: "OEM/vendor complaint number and technician details are recorded." },
              { step: "04", title: "Service Closed", text: "Repair proof, cost and closure remarks are saved." },
            ].map((item) => (
              <div key={item.step} className="h-workflow-card">
                <div style={{ display: "flex", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#111111", color: "#CBFA57", display: "grid", placeItems: "center", fontWeight: 950, fontSize: 13, flexShrink: 0 }}>
                    {item.step}
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, color: "#111111", marginBottom: 4, fontSize: 14 }}>{item.title}</div>
                    <div style={{ color: "#8A8A84", lineHeight: 1.55, fontWeight: 600, fontSize: 13 }}>{item.text}</div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}>
            <span className="h-section-label">Service Management</span>
            <h2 className="h-section-title" style={{ fontSize: 44, fontWeight: 950, color: "#111111", lineHeight: 1.14, letterSpacing: "-1.4px", margin: "14px 0 20px" }}>
              Track every complaint from breakdown to closure.
            </h2>
            <p style={{ fontSize: 17, color: "#6B6B65", lineHeight: 1.76, marginBottom: 26, fontWeight: 500 }}>
              No more missing complaint numbers, technician details, pending approvals or service history. Every action is tracked clearly.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {["Breakdown ticket creation", "Complaint and escalation tracking", "Vendor technician visit details", "Closure remarks and service cost records"].map((text) => (
                <div className="h-check-item" key={text}>
                  <span className="h-check-circle">✓</span>{text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section style={{ padding: "100px 24px", background: "#111111" }}>
        <div className="h-container">
          <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 60px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 999, background: "rgba(203,250,87,0.10)", border: "1px solid rgba(203,250,87,0.20)", color: "#CBFA57", fontWeight: 800, fontSize: 12, marginBottom: 18, letterSpacing: "1.2px", textTransform: "uppercase" }}>
              Core Modules
            </div>
            <h2 style={{ fontSize: 46, fontWeight: 950, color: "#FFFFFF", margin: "0 0 16px", letterSpacing: "-1.6px", lineHeight: 1.1 }}>
              Everything your asset team needs.
            </h2>
            <p style={{ fontSize: 17, color: "#7A7A74", lineHeight: 1.7, fontWeight: 500 }}>
              From asset entry to warranty alerts, approvals, vendor complaint tracking and service closure — all modules work together.
            </p>
          </div>

          <motion.div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}>
            {features.map((item) => (
              <motion.div key={item.title} variants={fadeUp} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "28px 24px", transition: "all 0.3s ease", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(203,250,87,0.06)"; e.currentTarget.style.borderColor = "rgba(203,250,87,0.20)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
                <div style={{ width: 50, height: 50, background: "#CBFA57", color: "#111111", borderRadius: 14, display: "grid", placeItems: "center", marginBottom: 18 }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "#FFFFFF", marginBottom: 10, letterSpacing: "-0.3px" }}>{item.title}</h3>
                <p style={{ color: "#7A7A74", lineHeight: 1.65, fontSize: 14.5, fontWeight: 500, margin: 0 }}>{item.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "100px 24px", background: "#ECEAE3" }}>
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          style={{ maxWidth: 1200, margin: "0 auto", background: "#111111", borderRadius: 32, padding: "68px 56px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 36, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, background: "radial-gradient(circle, rgba(203,250,87,0.14), transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ maxWidth: 600, position: "relative", zIndex: 1 }}>
            <h2 style={{ fontSize: 40, fontWeight: 950, color: "#FFFFFF", marginBottom: 14, letterSpacing: "-1.2px", lineHeight: 1.18 }}>
              Ready to digitize your company asset management?
            </h2>
            <p style={{ fontSize: 17, color: "#7A7A74", lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
              Start managing assets, warranty, breakdown tickets, vendor complaints and approval workflow from one clean dashboard.
            </p>
          </div>
          <Link to="/contact" style={{ background: "#CBFA57", color: "#111111", padding: "18px 34px", borderRadius: 999, fontWeight: 900, fontSize: 16, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, position: "relative", zIndex: 1, transition: "all 0.22s ease", letterSpacing: "-0.3px" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 14px 28px rgba(203,250,87,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
            Request Demo <AutoGraphRoundedIcon fontSize="small" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
