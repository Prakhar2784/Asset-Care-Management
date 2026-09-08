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
    { icon: <VerifiedIcon />, title: "Warranty Optimization", text: "Optimize warranty coverage, AMC contracts, renewal schedules, and service provider agreements for your entire inventory." },
    { icon: <BuildIcon />, title: "Support Ticket System", text: "Register service requests, assign responsibility, and track the repair timeline from open to completion." },
    { icon: <BusinessIcon />, title: "Vendor Coordination", text: "Maintain detailed OEM contact info, service booking numbers, technician schedules, and vendor performance history." },
    { icon: <ApprovalIcon />, title: "Departmental Approval", text: "Verify and approve maintenance tasks at the department level before initiating paid services." },
    { icon: <InsightsIcon />, title: "Live Analytics Dashboard", text: "Monitor active service tickets, upcoming warranty dates, pending approvals, and comprehensive cost summaries." },
    { icon: <AddTaskIcon />, title: "Complete Service History", text: "Build a permanent digital archive of every test, maintenance visit, component replacement, and final resolution." },
  ];

  const stats = [
    { label: "Assets Managed", value: "1,248+" },
    { label: "Open Tickets", value: "24" },
    { label: "Warranty Alerts", value: "18" },
    { label: "Vendors", value: "42" },
  ];

  return (
    <div style={{ backgroundColor: "#051C12", overflowX: "hidden" }}>
      <style>{`
        .h-container { max-width: 1200px; margin: 0 auto; }

        .h-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 16px; border-radius: 999px;
          background: rgba(5,28,18,0.15); color: #FFFFFF;
          border: 1px solid rgba(5,28,18,0.25);
          font-weight: 800; font-size: 13px; margin-bottom: 22px;
          letter-spacing: 0.2px;
        }

        .h-btn-primary {
          background: #B4F105; color: #051C12;
          padding: 15px 30px; border-radius: 999px;
          font-weight: 800; font-size: 15px;
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.22s ease;
          letter-spacing: -0.2px;
          box-shadow: 0 6px 20px rgba(5,28,18,0.4);
        }
        .h-btn-primary:hover { background: #c1f824; transform: translateY(-3px); box-shadow: 0 14px 32px rgba(180,241,5,0.4); }

        .h-btn-outline {
          padding: 15px 30px; border-radius: 999px;
          font-weight: 800; font-size: 15px;
          color: #FFFFFF; border: 1.5px solid rgba(255,255,255,0.3);
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.22s ease;
          background: rgba(5,28,18,0.06);
        }
        .h-btn-outline:hover { border-color: #FFFFFF; background: rgba(5,28,18,0.12); transform: translateY(-3px); }

        .h-hero-visual {
          background: rgba(7, 47, 31, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(5,28,18,0.2);
          border-radius: 28px;
          padding: 28px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(5,28,18,0.1);
        }

        .h-hero-visual::before {
          content: "";
          position: absolute;
          top: -60px; right: -60px;
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(5,28,18,0.18), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .h-mini-stat {
          background: rgba(7,47,31,0.6);
          border: 1px solid rgba(5,28,18,0.1);
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
          background: rgba(7,47,31,0.7);
          border: 1px solid rgba(5,28,18,0.15);
          padding: 30px 28px;
          border-radius: 24px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .h-feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 48px rgba(5,28,18,0.10);
          border-color: rgba(5,28,18,0.16);
        }

        .h-feature-icon {
          width: 54px; height: 54px;
          background: #051C12; color: #FFFFFF;
          border-radius: 15px;
          display: grid; place-items: center;
          margin-bottom: 20px;
          box-shadow: 0 4px 16px rgba(5,28,18,0.4);
        }

        .h-check-circle {
          width: 24px; height: 24px; border-radius: "50%";
          background: rgba(5,28,18,0.15);
          color: #FFFFFF;
          display: grid; place-items: center;
          font-weight: 900; font-size: 12px;
          flex-shrink: 0; border-radius: 50%;
        }

        .h-check-item {
          display: flex; align-items: center; gap: 12px;
          font-size: 15px; font-weight: 700; color: #FFFFFF;
        }

        .h-info-panel {
          background: rgba(7,47,31,0.7);
          border: 1px solid rgba(5,28,18,0.15);
          border-radius: 28px;
          padding: 32px;
          box-shadow: 0 20px 48px rgba(5,28,18,0.06);
        }

        .h-asset-row {
          padding: 16px; border-radius: 16px;
          background: rgba(7,47,31,0.65); border: 1px solid rgba(5,28,18,0.15);
          margin-bottom: 12px;
          display: flex; justify-content: space-between; gap: 12px; align-items: center;
        }

        .h-workflow-card {
          background: rgba(7,47,31,0.7);
          border: 1px solid rgba(5,28,18,0.15);
          border-radius: 20px; padding: 22px;
          margin-bottom: 12px;
          box-shadow: 0 4px 16px rgba(5,28,18,0.04);
        }

        .h-section-label {
          color: #FFFFFF; font-weight: 900;
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
            <motion.h1 variants={fadeUp} className="h-hero-title" style={{ fontSize: 62, fontWeight: 950, color: "#FFFFFF", lineHeight: 1.06, marginBottom: 22, letterSpacing: "-2.2px" }}>
              MANAGE ASSETS<br/>WARRANTY &amp; SERVICE
            </motion.h1>

            <div style={{ display: "inline-flex", gap: "10px", padding: "8px 20px", background: "rgba(180, 241, 5, 0.12)", border: "1.5px solid rgba(180, 241, 5, 0.25)", borderRadius: "8px", color: "#B4F105", fontWeight: "800", fontSize: "13px", marginBottom: "28px", letterSpacing: "1px" }}>
              <span>REGISTER</span> <span style={{ color: "rgba(255,255,255,0.25)" }}>|</span> <span>TRACK</span> <span style={{ color: "rgba(255,255,255,0.25)" }}>|</span> <span>MANAGE</span> <span style={{ color: "rgba(255,255,255,0.25)" }}>|</span> <span>RENEW</span>
            </div>

            <motion.p variants={fadeUp} style={{ fontSize: 18, color: "#9CA3AF", lineHeight: 1.72, marginBottom: 34, maxWidth: 520, fontWeight: 500 }}>
              Complete solution to manage warranty &amp; service of <span style={{ color: "#B4F105", fontWeight: 800 }}>Movable</span> and <span style={{ color: "#B4F105", fontWeight: 800 }}>Immovable</span> Assets.
            </motion.p>

            <motion.div variants={fadeUp} style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link to="/login" className="h-btn-primary">
                Access Dashboard <ArrowForwardRoundedIcon fontSize="small" />
              </Link>
              <a 
                href={(import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "/download/desktop-app") || "/download/desktop-app"} 
                className="h-btn-outline" 
                style={{ borderColor: "#B4F105", color: "#B4F105" }}
              >
                Download Desktop App
              </a>
              <Link to="/modules" className="h-btn-outline">View Modules</Link>
            </motion.div>

            <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 40, maxWidth: 520 }}>
              {stats.map((item) => (
                <div key={item.label} style={{ background: "rgba(7,47,31,0.75)", border: "1px solid rgba(5,28,18,0.15)", borderRadius: 16, padding: "14px 12px", boxShadow: "0 4px 16px rgba(5,28,18,0.05)" }}>
                  <div style={{ fontSize: 22, fontWeight: 950, color: "#FFFFFF", marginBottom: 3, letterSpacing: "-0.8px" }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: "#879A91", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>{item.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="h-hero-visual">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div>
                <div style={{ fontWeight: 900, color: "#FFFFFF", fontSize: 17, letterSpacing: "-0.4px" }}>IAssetCare Dashboard</div>
                <div style={{ fontSize: 12, color: "#879A91", fontWeight: 600, marginTop: 2 }}>Live asset health overview</div>
              </div>
              <div style={{ padding: "6px 12px", borderRadius: 999, background: "rgba(5,28,18,0.12)", color: "#FFFFFF", fontWeight: 900, fontSize: 11, border: "1px solid rgba(5,28,18,0.22)", letterSpacing: "1px" }}>LIVE</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div className="h-mini-stat">
                <Inventory2RoundedIcon sx={{ color: "#FFFFFF", fontSize: 20, mb: 0.8 }} />
                <div style={{ fontSize: 28, fontWeight: 950, color: "#FFFFFF", letterSpacing: "-1px", lineHeight: 1 }}>1,248</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4, fontWeight: 600 }}>Total Assets</div>
              </div>
              <div className="h-mini-stat">
                <BuildIcon sx={{ color: "#FFFFFF", fontSize: 20, mb: 0.8 }} />
                <div style={{ fontSize: 28, fontWeight: 950, color: "#FFFFFF", letterSpacing: "-1px", lineHeight: 1 }}>24</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4, fontWeight: 600 }}>Active Tickets</div>
              </div>
            </div>

            {[
              { name: "IT Assets", val: "82%", width: "82%", color: "#FFFFFF" },
              { name: "Electrical", val: "58%", width: "58%", color: "#B4F105" },
              { name: "Under Service", val: "34%", width: "34%", color: "#F97316" },
            ].map((bar) => (
              <div key={bar.name} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, marginBottom: 7, color: "#FFFFFF" }}>
                  <span style={{ color: "#879A91" }}>{bar.name}</span>
                  <span>{bar.val}</span>
                </div>
                <div className="h-bar-track">
                  <motion.div initial={{ width: 0 }} animate={{ width: bar.width }} transition={{ duration: 1.1, delay: 0.8 }} style={{ height: "100%", background: bar.color, borderRadius: 999 }} />
                </div>
              </div>
            ))}

            <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(5,28,18,0.08)", borderRadius: 14, border: "1px solid rgba(5,28,18,0.16)", display: "flex", gap: 12, alignItems: "center" }}>
              <WarningAmberRoundedIcon sx={{ color: "#F97316", fontSize: 20, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, color: "#FFFFFF", fontSize: 13 }}>Warranty Alert</div>
                <div style={{ fontSize: 12, color: "#879A91", fontWeight: 600 }}>18 assets expiring within 30 days</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section style={{ background: "rgba(5,28,18,0.12)", padding: "28px 24px" }}>
        <div className="h-container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
          {[
            "Centralized Asset Registry",
            "Warranty Tracking",
            "Service Reminders",
            "Claim & Ticket Management",
            "Document Storage",
            "Reports & Analytics",
            "Multi-Location Management"
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, color: "#FFFFFF", fontSize: 13.5 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#B4F105", color: "#051C12", display: "grid", placeItems: "center", fontWeight: 950, fontSize: 10, flexShrink: 0 }}>✓</span>
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
            <h2 className="h-section-title" style={{ fontSize: 44, fontWeight: 950, color: "#FFFFFF", lineHeight: 1.14, letterSpacing: "-1.4px", margin: "14px 0 20px" }}>
              Managing company assets in spreadsheets.
            </h2>
            <p style={{ fontSize: 17, color: "#9CA3AF", lineHeight: 1.76, marginBottom: 26, fontWeight: 500 }}>
              IAssetCare gives your company a complete digital record of IT, electrical, electronic, furniture and other movable or immovable assets.
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
            <div style={{ fontWeight: 950, fontSize: 20, color: "#FFFFFF", marginBottom: 22, letterSpacing: "-0.4px" }}>Asset Register Preview</div>
            {[
              { title: "Dell Latitude Laptop", meta: "IT Department · Jaipur Office", status: "Warranty Active", color: "#4ADE80", bg: "rgba(74,222,128,0.12)" },
              { title: "Canon Printer", meta: "Admin Department · Floor 2", status: "Service Due", color: "#B4F105", bg: "rgba(180,241,5,0.12)" },
              { title: "UPS Power Backup", meta: "Electrical Room · Basement", status: "Complaint Open", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
            ].map((asset) => (
              <div key={asset.title} className="h-asset-row">
                <div>
                  <div style={{ fontWeight: 800, color: "#FFFFFF", fontSize: 14 }}>{asset.title}</div>
                  <div style={{ fontSize: 12.5, color: "#879A91", fontWeight: 600, marginTop: 3 }}>{asset.meta}</div>
                </div>
                <div style={{ padding: "6px 12px", borderRadius: 999, background: asset.bg, color: asset.color, fontWeight: 800, fontSize: 11.5, whiteSpace: "nowrap" }}>
                  {asset.status}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PEACE OF MIND ACCENT BANNER */}
      <section style={{ padding: "60px 24px", background: "radial-gradient(circle at center, rgba(180,241,5,0.12) 0%, transparent 70%)" }}>
        <div className="h-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(180, 241, 5, 0.1)", border: "2px solid #B4F105", display: "grid", placeItems: "center", marginBottom: 24, boxShadow: "0 0 20px rgba(180, 241, 5, 0.3)" }}>
            <VerifiedIcon sx={{ color: "#B4F105", fontSize: 40 }} />
          </div>
          <h2 style={{ fontSize: "36px", fontWeight: "950", color: "#FFFFFF", letterSpacing: "-1px", textTransform: "uppercase", margin: 0 }}>
            One Platform.<br/><span style={{ color: "#B4F105" }}>Complete Peace of Mind.</span>
          </h2>
        </div>
      </section>

      {/* SECTION 2 — Service Management */}
      <section style={{ padding: "0 24px 100px" }}>
        <div className="h-container h-split-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 64, alignItems: "center" }}>
          <motion.div className="h-info-panel" initial={{ opacity: 0, x: -36 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.75 }}>
            <div style={{ fontWeight: 950, fontSize: 20, color: "#FFFFFF", marginBottom: 22, letterSpacing: "-0.4px" }}>Ticket Workflow</div>
            {[
              { step: "01", title: "Service Request Registered", text: "User creates a ticket with issue details." },
              { step: "02", title: "Departmental Verification", text: "HOD/Admin reviews service eligibility and warranty details." },
              { step: "03", title: "Vendor Coordination Active", text: "OEM contact details and technician visit schedules are saved." },
              { step: "04", title: "Service Completed", text: "Resolution details, costs, and feedback are recorded." },
            ].map((item) => (
              <div key={item.step} className="h-workflow-card">
                <div style={{ display: "flex", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(5,28,18,0.12)", color: "#FFFFFF", display: "grid", placeItems: "center", fontWeight: 950, fontSize: 13, flexShrink: 0 }}>
                    {item.step}
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, color: "#FFFFFF", marginBottom: 4, fontSize: 14 }}>{item.title}</div>
                    <div style={{ color: "#879A91", lineHeight: 1.55, fontWeight: 600, fontSize: 13 }}>{item.text}</div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}>
            <span className="h-section-label">Service Management</span>
            <h2 className="h-section-title" style={{ fontSize: 44, fontWeight: 950, color: "#FFFFFF", lineHeight: 1.14, letterSpacing: "-1.4px", margin: "14px 0 20px" }}>
              Track every service ticket end to end.
            </h2>
            <p style={{ fontSize: 17, color: "#9CA3AF", lineHeight: 1.76, marginBottom: 26, fontWeight: 500 }}>
              Keep every service request, technician contact, pending approval, and repair milestone fully organized in a clear, real-time timeline.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {["Seamless service ticket registration", "Transparent approval workflows", "Detailed vendor coordination logs", "Verification proof and maintenance logs"].map((text) => (
                <div className="h-check-item" key={text}>
                  <span className="h-check-circle">✓</span>{text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section style={{ padding: "100px 24px", background: "rgba(5,28,18,0.12)" }}>
        <div className="h-container">
          <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 60px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 999, background: "rgba(5,28,18,0.10)", border: "1px solid rgba(5,28,18,0.20)", color: "#FFFFFF", fontWeight: 800, fontSize: 12, marginBottom: 18, letterSpacing: "1.2px", textTransform: "uppercase" }}>
              Core Modules
            </div>
            <h2 style={{ fontSize: 46, fontWeight: 950, color: "#FFFFFF", margin: "0 0 16px", letterSpacing: "-1.6px", lineHeight: 1.1 }}>
              Everything your asset team needs.
            </h2>
            <p style={{ fontSize: 17, color: "#879A91", lineHeight: 1.7, fontWeight: 500 }}>
              From asset entry to warranty alerts, approvals, vendor complaint tracking and service closure — all modules work together.
            </p>
          </div>

          <motion.div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}>
            {features.map((item) => (
              <motion.div key={item.title} variants={fadeUp} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "28px 24px", transition: "all 0.3s ease", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(5,28,18,0.06)"; e.currentTarget.style.borderColor = "rgba(5,28,18,0.20)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
                <div style={{ width: 50, height: 50, background: "#B4F105", color: "#051C12", borderRadius: 14, display: "grid", placeItems: "center", marginBottom: 18 }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "#FFFFFF", marginBottom: 10, letterSpacing: "-0.3px" }}>{item.title}</h3>
                <p style={{ color: "#879A91", lineHeight: 1.65, fontSize: 14.5, fontWeight: 500, margin: 0 }}>{item.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Home;
