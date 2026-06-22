import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AddTaskIcon from "@mui/icons-material/AddTask";
import VerifiedIcon from "@mui/icons-material/Verified";
import BuildIcon from "@mui/icons-material/Build";
import BusinessIcon from "@mui/icons-material/Business";
import ApprovalIcon from "@mui/icons-material/Approval";
import InsightsIcon from "@mui/icons-material/Insights";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import { Typography } from "@mui/material";

const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.14 },
  },
};

const Home = () => {
  const features = [
    {
      icon: <VerifiedIcon fontSize="large" />,
      title: "Warranty Tracking",
      text: "Track warranty, AMC, expiry dates, service coverage and renewal status for every asset.",
    },
    {
      icon: <BuildIcon fontSize="large" />,
      title: "Breakdown Management",
      text: "Create service tickets, assign responsibility and monitor the complete repair lifecycle.",
    },
    {
      icon: <BusinessIcon fontSize="large" />,
      title: "Vendor Complaints",
      text: "Manage OEM details, complaint numbers, technician visits and vendor-wise service history.",
    },
    {
      icon: <ApprovalIcon fontSize="large" />,
      title: "Department Approval",
      text: "Control repair approvals department-wise before escalation or paid service activity.",
    },
    {
      icon: <InsightsIcon fontSize="large" />,
      title: "Smart Dashboard",
      text: "View active tickets, warranty expiry, pending approvals and department-wise reports.",
    },
    {
      icon: <AddTaskIcon fontSize="large" />,
      title: "Service History",
      text: "Maintain complete service, complaint, repair and closure records for every asset.",
    },
  ];

  const stats = [
    { label: "Assets Managed", value: "1,248+" },
    { label: "Open Tickets", value: "24" },
    { label: "Warranty Alerts", value: "18" },
    { label: "Vendors", value: "42" },
  ];

  return (
    <div style={{ backgroundColor: "#F8FAFC", overflowX: "hidden" }}>
      <style>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .gradient-text {
          background: linear-gradient(135deg, #1E3A8A, #0F766E);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: 999px;
          background: rgba(15, 118, 110, 0.09);
          color: #0F766E;
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 24px;
          border: 1px solid rgba(15, 118, 110, 0.18);
        }

        .btn-gradient {
          background: linear-gradient(135deg, #1E3A8A, #0F766E);
          color: white;
          padding: 16px 32px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 16px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 14px 28px rgba(15, 118, 110, 0.28);
          transition: all 0.3s ease;
        }

        .btn-gradient:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 42px rgba(15, 118, 110, 0.38);
        }

        .btn-outline {
          padding: 16px 32px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 16px;
          color: #0F172A;
          border: 1px solid #CBD5E1;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          background: #FFFFFF;
        }

        .btn-outline:hover {
          border-color: #1E3A8A;
          color: #1E3A8A;
          transform: translateY(-4px);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
        }

        .hero-card {
          position: relative;
          width: 100%;
          min-height: 520px;
          background:
            radial-gradient(circle at 20% 20%, rgba(15, 118, 110, 0.16), transparent 35%),
            radial-gradient(circle at 80% 0%, rgba(30, 58, 138, 0.18), transparent 36%),
            linear-gradient(135deg, #FFFFFF, #EFF6FF);
          border-radius: 36px;
          border: 1px solid rgba(148, 163, 184, 0.24);
          overflow: hidden;
          box-shadow: 0 30px 70px rgba(15, 23, 42, 0.10);
        }

        .hero-card::before {
          content: "";
          position: absolute;
          inset: 20px;
          border: 1px dashed rgba(30, 58, 138, 0.20);
          border-radius: 28px;
        }

        .floating-glass-card {
          position: absolute;
          background: rgba(255, 255, 255, 0.86);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.85);
          padding: 24px;
          border-radius: 22px;
          box-shadow: 0 24px 48px rgba(15, 23, 42, 0.10);
        }

        .dashboard-main-card {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 78%;
          background: #FFFFFF;
          border-radius: 28px;
          padding: 26px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 30px 60px rgba(15, 23, 42, 0.12);
          z-index: 2;
        }

        .mini-stat {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 18px;
          padding: 18px;
        }

        .feature-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          padding: 34px 30px;
          border-radius: 28px;
          transition: all 0.35s ease;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.03);
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(135deg, #1E3A8A, #0F766E);
          opacity: 0;
          transition: 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-10px);
          border-color: rgba(15, 118, 110, 0.28);
          box-shadow: 0 24px 50px rgba(15, 23, 42, 0.09);
        }

        .feature-card:hover::before {
          opacity: 1;
        }

        .feature-icon {
          width: 66px;
          height: 66px;
          background: linear-gradient(135deg, #1E3A8A, #0F766E);
          color: white;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          box-shadow: 0 12px 24px rgba(15, 118, 110, 0.24);
        }

        .section-label {
          color: #0F766E;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1.6px;
          font-size: 13px;
        }

        .info-panel {
          background:
            radial-gradient(circle at top right, rgba(15, 118, 110, 0.12), transparent 35%),
            #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 34px;
          padding: 36px;
          box-shadow: 0 24px 54px rgba(15, 23, 42, 0.07);
        }

        .check-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
        }

        .check-circle {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(15, 118, 110, 0.12);
          color: #0F766E;
          display: grid;
          place-items: center;
          font-weight: 900;
          flex-shrink: 0;
        }

        .workflow-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 26px;
          padding: 28px;
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.05);
        }

        @media (max-width: 1024px) {
          .hero-grid,
          .split-grid {
            grid-template-columns: 1fr !important;
            gap: 56px !important;
          }

          .hero-title {
            font-size: 44px !important;
          }

          .hero-card {
            min-height: 460px;
          }

          .dashboard-main-card {
            width: 86%;
          }
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: 36px !important;
          }

          .section-title {
            font-size: 34px !important;
          }

          .dashboard-main-card {
            width: 90%;
            padding: 20px;
          }

          .floating-glass-card {
            display: none;
          }
        }
      `}</style>

      {/* HERO SECTION */}
      <section
        style={{
          paddingTop: "165px",
          paddingBottom: "90px",
          paddingLeft: "24px",
          paddingRight: "24px",
        }}
      >
        <div
          className="container hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "70px",
            alignItems: "center",
          }}
        >
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeUp} className="hero-badge">
              <Inventory2RoundedIcon fontSize="small" />
              Enterprise Asset Service Platform
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="hero-title"
              style={{
                fontSize: "64px",
                fontWeight: 950,
                color: "#0F172A",
                lineHeight: 1.05,
                marginBottom: "24px",
                letterSpacing: "-2.4px",
              }}
            >
              Manage Assets, Warranty & Service{" "}
              <span className="gradient-text">in One System.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              style={{
                fontSize: "20px",
                color: "#64748B",
                lineHeight: 1.7,
                marginBottom: "38px",
                maxWidth: "560px",
              }}
            >
              A smart platform to track company assets, warranty status,
              breakdown tickets, vendor complaints, approvals and complete
              service history.
            </motion.p>

            <motion.div
              variants={fadeUp}
              style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}
            >
              <Link to="/login" className="btn-gradient">
                Access Dashboard <ArrowForwardRoundedIcon fontSize="small" />
              </Link>

              <Link to="/modules" className="btn-outline">
                View Modules
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(100px, 1fr))",
                gap: "14px",
                marginTop: "42px",
                maxWidth: "560px",
              }}
            >
              {stats.map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "18px",
                    padding: "16px",
                    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 950,
                      color: "#1E3A8A",
                      marginBottom: "4px",
                    }}
                  >
                    {item.value}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#64748B",
                      fontWeight: 700,
                    }}
                  >
                    {item.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
            className="hero-card"
          >
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="floating-glass-card"
              style={{ top: "34px", left: "34px", width: "220px", zIndex: 3 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "14px",
                    background: "rgba(15,118,110,0.12)",
                    color: "#0F766E",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <FactCheckRoundedIcon />
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: "#0F172A" }}>96%</div>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>
                    Assets Verified
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 16, 0] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.7,
              }}
              className="floating-glass-card"
              style={{
                bottom: "34px",
                right: "34px",
                width: "245px",
                zIndex: 3,
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <WarningAmberRoundedIcon sx={{ color: "#F59E0B" }} />
                <div>
                  <div style={{ fontWeight: 900, color: "#0F172A" }}>
                    Warranty Alert
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748B" }}>
                    18 assets expiring soon
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="dashboard-main-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <Typography fontWeight={900} fontSize={20} color="#0F172A">
                    AssetCare Dashboard
                  </Typography>
                  <Typography fontSize={13} color="#64748B" fontWeight={600}>
                    Live asset health overview
                  </Typography>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "rgba(15,118,110,0.10)",
                    color: "#0F766E",
                    fontWeight: 900,
                    fontSize: "12px",
                  }}
                >
                  LIVE
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  marginBottom: "22px",
                }}
              >
                <div className="mini-stat">
                  <Inventory2RoundedIcon sx={{ color: "#1E3A8A", mb: 1 }} />
                  <div style={{ fontSize: "26px", fontWeight: 950 }}>1,248</div>
                  <div style={{ fontSize: "13px", color: "#64748B" }}>
                    Total Assets
                  </div>
                </div>

                <div className="mini-stat">
                  <BuildIcon sx={{ color: "#0F766E", mb: 1 }} />
                  <div style={{ fontSize: "26px", fontWeight: 950 }}>24</div>
                  <div style={{ fontSize: "13px", color: "#64748B" }}>
                    Active Tickets
                  </div>
                </div>
              </div>

              {[
                { name: "IT Assets", val: "82%", color: "#1E3A8A" },
                { name: "Electrical Assets", val: "58%", color: "#0F766E" },
                { name: "Under Service", val: "34%", color: "#F59E0B" },
              ].map((bar) => (
                <div key={bar.name} style={{ marginBottom: "15px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "13px",
                      fontWeight: 800,
                      marginBottom: "8px",
                      color: "#0F172A",
                    }}
                  >
                    <span>{bar.name}</span>
                    <span>{bar.val}</span>
                  </div>
                  <div
                    style={{
                      height: "9px",
                      background: "#E2E8F0",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: bar.val }}
                      transition={{ duration: 1.1, delay: 0.8 }}
                      style={{
                        height: "100%",
                        background: bar.color,
                        borderRadius: "999px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section
        style={{
          padding: "34px 24px",
          background: "#FFFFFF",
          borderTop: "1px solid #E2E8F0",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "22px",
          }}
        >
          {[
            "Centralized Asset Register",
            "Warranty & AMC Alerts",
            "Ticket Lifecycle Tracking",
            "Vendor Service Records",
          ].map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontWeight: 800,
                color: "#0F172A",
              }}
            >
              <span className="check-circle">✓</span>
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 1 */}
      <section style={{ padding: "110px 24px" }}>
        <div
          className="container split-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "0.95fr 1.05fr",
            gap: "70px",
            alignItems: "center",
          }}
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
          >
            <span className="section-label">Asset Control</span>

            <h2
              className="section-title"
              style={{
                fontSize: "46px",
                fontWeight: 950,
                color: "#0F172A",
                lineHeight: 1.15,
                letterSpacing: "-1.4px",
                margin: "16px 0 22px",
              }}
            >
              Stop managing company assets in spreadsheets.
            </h2>

            <p
              style={{
                fontSize: "18px",
                color: "#64748B",
                lineHeight: 1.75,
                marginBottom: "28px",
              }}
            >
              AssetCare Pro gives your company a complete digital record of
              IT, electrical, electronic, furniture and other movable or
              immovable assets.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                "Department-wise asset allocation",
                "Location and ownership tracking",
                "Warranty, AMC and purchase details",
                "Asset-wise complete service history",
              ].map((text) => (
                <div className="check-item" key={text}>
                  <span className="check-circle">✓</span>
                  {text}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="info-panel"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Typography fontWeight={950} fontSize={24} color="#0F172A" mb={3}>
              Asset Register Preview
            </Typography>

            {[
              {
                title: "Dell Latitude Laptop",
                meta: "IT Department · Jaipur Office",
                status: "Warranty Active",
                color: "#0F766E",
              },
              {
                title: "Canon Printer",
                meta: "Admin Department · Floor 2",
                status: "Service Due",
                color: "#F59E0B",
              },
              {
                title: "UPS Power Backup",
                meta: "Electrical Room · Basement",
                status: "Complaint Open",
                color: "#DC2626",
              },
            ].map((asset) => (
              <div
                key={asset.title}
                style={{
                  padding: "18px",
                  borderRadius: "18px",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  marginBottom: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 900, color: "#0F172A" }}>
                    {asset.title}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#64748B",
                      fontWeight: 600,
                      marginTop: "4px",
                    }}
                  >
                    {asset.meta}
                  </div>
                </div>

                <div
                  style={{
                    padding: "7px 11px",
                    borderRadius: "999px",
                    background: `${asset.color}18`,
                    color: asset.color,
                    fontWeight: 900,
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {asset.status}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 2 */}
      <section style={{ padding: "0 24px 110px" }}>
        <div
          className="container split-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: "70px",
            alignItems: "center",
          }}
        >
          <motion.div
            className="info-panel"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Typography fontWeight={950} fontSize={24} color="#0F172A" mb={3}>
              Ticket Workflow
            </Typography>

            {[
              {
                step: "01",
                title: "Asset Breakdown Reported",
                text: "User creates a complaint ticket with issue details.",
              },
              {
                step: "02",
                title: "Department Approval",
                text: "HOD/Admin verifies warranty and approval requirement.",
              },
              {
                step: "03",
                title: "Vendor Complaint Raised",
                text: "OEM/vendor complaint number and technician details are recorded.",
              },
              {
                step: "04",
                title: "Service Closed",
                text: "Repair proof, cost and closure remarks are saved.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="workflow-card"
                style={{ marginBottom: "14px" }}
              >
                <div style={{ display: "flex", gap: "16px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #1E3A8A, #0F766E)",
                      color: "#FFFFFF",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 950,
                      flexShrink: 0,
                    }}
                  >
                    {item.step}
                  </div>

                  <div>
                    <div
                      style={{
                        fontWeight: 950,
                        color: "#0F172A",
                        marginBottom: "5px",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        color: "#64748B",
                        lineHeight: 1.5,
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      {item.text}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
          >
            <span className="section-label">Service Management</span>

            <h2
              className="section-title"
              style={{
                fontSize: "46px",
                fontWeight: 950,
                color: "#0F172A",
                lineHeight: 1.15,
                letterSpacing: "-1.4px",
                margin: "16px 0 22px",
              }}
            >
              Track every complaint from breakdown to closure.
            </h2>

            <p
              style={{
                fontSize: "18px",
                color: "#64748B",
                lineHeight: 1.75,
                marginBottom: "28px",
              }}
            >
              No more missing complaint numbers, technician details, pending
              approvals or service history. Every action is tracked clearly.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                "Breakdown ticket creation",
                "Complaint and escalation tracking",
                "Vendor technician visit details",
                "Closure remarks and service cost records",
              ].map((text) => (
                <div className="check-item" key={text}>
                  <span className="check-circle">✓</span>
                  {text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        style={{
          padding: "110px 24px",
          backgroundColor: "#FFFFFF",
          borderTop: "1px solid #E2E8F0",
        }}
      >
        <div className="container">
          <div
            style={{
              textAlign: "center",
              maxWidth: "820px",
              margin: "0 auto 70px",
            }}
          >
            <span className="section-label">Core Modules</span>

            <h2
              className="section-title"
              style={{
                fontSize: "48px",
                fontWeight: 950,
                color: "#0F172A",
                margin: "16px 0",
                letterSpacing: "-1.6px",
              }}
            >
              Everything your asset team needs.
            </h2>

            <p
              style={{
                fontSize: "19px",
                color: "#64748B",
                lineHeight: 1.7,
              }}
            >
              From asset entry to warranty alerts, approvals, vendor complaint
              tracking and service closure — all modules work together.
            </p>
          </div>

          <motion.div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "28px",
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {features.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="feature-card"
              >
                <div className="feature-icon">{item.icon}</div>

                <h3
                  style={{
                    fontSize: "22px",
                    fontWeight: 950,
                    color: "#0F172A",
                    marginBottom: "12px",
                    letterSpacing: "-0.4px",
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    color: "#64748B",
                    lineHeight: 1.65,
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  {item.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "110px 24px", backgroundColor: "#F8FAFC" }}>
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75 }}
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            background:
              "radial-gradient(circle at 85% 10%, rgba(20,184,166,0.28), transparent 32%), linear-gradient(135deg, #0F172A, #1E3A8A)",
            borderRadius: "36px",
            padding: "78px 64px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "38px",
            boxShadow: "0 28px 60px rgba(15, 23, 42, 0.26)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: "650px", position: "relative", zIndex: 1 }}>
            <h2
              style={{
                fontSize: "42px",
                fontWeight: 950,
                color: "#FFFFFF",
                marginBottom: "16px",
                letterSpacing: "-1.2px",
                lineHeight: 1.18,
              }}
            >
              Ready to digitize your company asset management?
            </h2>

            <p
              style={{
                fontSize: "18px",
                color: "#CBD5E1",
                lineHeight: 1.7,
              }}
            >
              Start managing assets, warranty, breakdown tickets, vendor
              complaints and approval workflow from one clean dashboard.
            </p>
          </div>

          <Link
            to="/contact"
            className="btn-gradient"
            style={{
              padding: "20px 38px",
              fontSize: "18px",
              position: "relative",
              zIndex: 1,
              background: "#FFFFFF",
              color: "#1E3A8A",
              boxShadow: "0 18px 34px rgba(0,0,0,0.18)",
            }}
          >
            Request Demo <AutoGraphRoundedIcon />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;