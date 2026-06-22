import { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import AltRouteRoundedIcon from "@mui/icons-material/AltRouteRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const links = [
    { name: "Home", path: "/", icon: <HomeRoundedIcon fontSize="small" /> },
    { name: "Features", path: "/features", icon: <StarRoundedIcon fontSize="small" /> },
    { name: "Modules", path: "/modules", icon: <DashboardRoundedIcon fontSize="small" /> },
    { name: "Workflow", path: "/workflow", icon: <AltRouteRoundedIcon fontSize="small" /> },
    { name: "Contact", path: "/contact", icon: <EmailRoundedIcon fontSize="small" /> },
  ];

  return (
    <>
      <style>{`
        /* =========================================
           DESKTOP: FLOATING GLASS PILL
           ========================================= */
        .nav-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 1000;
          padding: ${scrolled ? "12px 20px" : "24px 20px"};
          pointer-events: none; 
          display: flex;
          justify-content: center;
          transition: padding 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-pill {
          pointer-events: auto;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 100px;
          padding: 8px 8px 8px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1100px;
          width: 100%;
          box-shadow: ${scrolled 
            ? "0 10px 40px -10px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255,255,255,1)" 
            : "0 4px 20px -5px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255,255,255,1)"};
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        /* --- Brand Identity --- */
        .brand-link {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .brand-icon-box {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: #ffffff;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .brand-link:hover .brand-icon-box {
          transform: rotate(-10deg) scale(1.1);
        }

        .brand-text {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        /* --- Desktop Link Track --- */
        .nav-link-track {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .nav-link-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          color: #475569;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          border-radius: 100px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          background: transparent;
        }

        /* Hover & Active Effects */
        .nav-link-item .icon-wrapper {
          display: flex;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .nav-link-item:hover, .nav-link-item.active {
          background: #eef2ff;
          color: #4338ca;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(67, 56, 202, 0.1);
        }

        .nav-link-item:hover .icon-wrapper, .nav-link-item.active .icon-wrapper {
          transform: scale(1.15) rotate(5deg);
          color: #4f46e5;
        }

        /* --- Call to Action Button --- */
        .nav-cta {
          background: #0f172a;
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 100px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 1px solid #1e293b;
        }

        .nav-cta:hover {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border-color: #7c3aed;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3);
        }

        /* =========================================
           MOBILE: COMPACT FLOATING DROPDOWN
           ========================================= */
        .mobile-toggle {
          display: none;
          background: ${open ? "#eef2ff" : "transparent"};
          color: ${open ? "#4f46e5" : "#0f172a"};
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .mobile-toggle:hover {
          background: #f1f5f9;
        }

        .mobile-menu-card {
          position: absolute;
          top: calc(100% + 16px);
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 24px;
          padding: 16px;
          box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.15);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px) scale(0.98);
          transform-origin: top center;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
        }

        .mobile-menu-card.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .mob-link-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 16px;
          color: #475569;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          transition: all 0.2s ease;
          margin-bottom: 4px;
        }

        .mob-link-item:hover, .mob-link-item.active {
          background: #eef2ff;
          color: #4338ca;
        }

        .mob-icon-box {
          background: #f8fafc;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .mob-link-item:hover .mob-icon-box, .mob-link-item.active .mob-icon-box {
          background: #ffffff;
          color: #4f46e5;
          box-shadow: 0 4px 12px rgba(67, 56, 202, 0.1);
        }

        @media (max-width: 900px) {
          .nav-link-track, .nav-cta { display: none; }
          .mobile-toggle { display: grid; place-items: center; }
          .nav-pill { padding: 8px 16px 8px 24px; }
        }
      `}</style>

      <header className="nav-wrapper">
        <nav className="nav-pill">
          
          <Link to="/" className="brand-link" onClick={() => setOpen(false)}>
            <div className="brand-icon-box">
              <Inventory2Icon fontSize="small" />
            </div>
            <div className="brand-text">
              AssetCare Pro
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="nav-link-track">
            {links.map((item) => (
              <NavLink 
                key={item.name} 
                to={item.path} 
                className={({ isActive }) => (isActive ? "nav-link-item active" : "nav-link-item")}
              >
                <div className="icon-wrapper">{item.icon}</div>
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* Desktop Action */}
          <Link to="/login" className="nav-cta">
            <LoginRoundedIcon fontSize="small" /> Access Portal
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button className="mobile-toggle" onClick={() => setOpen(!open)}>
            {open ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
          </button>

          {/* Mobile Floating Dropdown Card */}
          <div className={`mobile-menu-card ${open ? "open" : ""}`}>
            {links.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => (isActive ? "mob-link-item active" : "mob-link-item")}
                onClick={() => setOpen(false)}
              >
                <div className="mob-icon-box">{item.icon}</div>
                {item.name}
              </NavLink>
            ))}
            
            <div style={{ height: "1px", background: "#f1f5f9", margin: "12px 0" }}></div>
            
            <Link 
              to="/login" 
              className="nav-cta" 
              style={{ justifyContent: "center", padding: "16px", fontSize: "16px" }}
              onClick={() => setOpen(false)}
            >
              <LoginRoundedIcon /> Access Portal
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Navbar;