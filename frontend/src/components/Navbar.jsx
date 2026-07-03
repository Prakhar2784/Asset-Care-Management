import { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const links = [
    { name: "Home",     path: "/" },
    { name: "Features", path: "/features" },
    { name: "Modules",  path: "/modules" },
    { name: "Workflow", path: "/workflow" },
    { name: "Pricing",  path: "/pricing" },
    { name: "Contact",  path: "/contact" },
  ];

  return (
    <>
      <style>{`
        .nav-wrapper {
          position: fixed;
          top: 0; left: 0;
          width: 100%;
          z-index: 1000;
          padding: ${scrolled ? "10px 20px" : "20px 20px"};
          pointer-events: none;
          display: flex;
          justify-content: center;
          transition: padding 0.35s ease;
        }

        .nav-pill {
          pointer-events: auto;
          background: #000000;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 100px;
          padding: 7px 7px 7px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1100px;
          width: 100%;
          box-shadow: ${scrolled
            ? "0 8px 32px -8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)"
            : "0 2px 16px -4px rgba(0,0,0,0.3)"};
          transition: all 0.35s ease;
          position: relative;
        }

        .brand-link {
          display: flex; align-items: center; gap: 11px;
          text-decoration: none;
        }

        .brand-icon-box {
          background: #FFFFFF;
          color: #000000;
          width: 34px; height: 34px;
          border-radius: 10px;
          display: grid; place-items: center;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          flex-shrink: 0;
        }

        .brand-link:hover .brand-icon-box {
          transform: rotate(-8deg) scale(1.08);
        }

        .brand-text {
          font-size: 17px; font-weight: 900;
          color: #FFFFFF;
          letter-spacing: -0.5px;
        }

        .nav-link-track {
          display: flex; align-items: center; gap: 2px;
        }

        .nav-link-item {
          padding: 9px 18px;
          color: #FFFFFF;
          text-decoration: none;
          font-weight: 600; font-size: 14px;
          border-radius: 100px;
          transition: all 0.2s ease;
          background: transparent;
          opacity: 0.65;
        }

        .nav-link-item:hover {
          background: rgba(255,255,255,0.1);
          opacity: 1;
        }

        .nav-link-item.active {
          background: #FFFFFF;
          color: #000000;
          font-weight: 800;
          opacity: 1;
        }

        .nav-cta {
          background: #FFFFFF;
          color: #000000;
          padding: 11px 22px;
          border-radius: 100px;
          font-weight: 800; font-size: 14px;
          text-decoration: none;
          display: flex; align-items: center; gap: 7px;
          transition: all 0.2s ease;
          letter-spacing: -0.2px;
        }

        .nav-cta:hover {
          background: #E5E7EB;
          transform: translateY(-1px);
        }

        .mobile-toggle {
          display: none;
          background: transparent;
          color: #FFFFFF;
          border: none;
          width: 42px; height: 42px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          place-items: center;
        }

        .mobile-toggle:hover { background: rgba(255,255,255,0.1); }

        .mobile-menu-card {
          position: absolute;
          top: calc(100% + 12px);
          left: 0; right: 0;
          background: #000000;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 24px;
          padding: 14px;
          box-shadow: 0 20px 40px -8px rgba(0,0,0,0.6);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px) scale(0.98);
          transform-origin: top center;
          transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
        }

        .mobile-menu-card.open {
          opacity: 1; visibility: visible;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .mob-link-item {
          display: block;
          padding: 14px 20px;
          border-radius: 14px;
          color: #FFFFFF;
          text-decoration: none;
          font-weight: 700; font-size: 15px;
          transition: all 0.18s ease;
          margin-bottom: 3px;
          opacity: 0.75;
        }

        .mob-link-item:hover { background: rgba(255,255,255,0.1); opacity: 1; }
        .mob-link-item.active { background: #FFFFFF; color: #000000; opacity: 1; }

        .mob-divider { height: 1px; background: rgba(255,255,255,0.15); margin: 10px 0; }

        @media (max-width: 900px) {
          .nav-link-track, .nav-cta { display: none; }
          .mobile-toggle { display: grid; }
          .nav-pill { padding: 7px 14px 7px 22px; }
        }
      `}</style>

      <header className="nav-wrapper">
        <nav className="nav-pill">
          <Link to="/" className="brand-link" onClick={() => setOpen(false)}>
            <div className="brand-icon-box">
              <Inventory2Icon fontSize="small" />
            </div>
            <div className="brand-text">AssetCare Pro</div>
          </Link>

          <div className="nav-link-track">
            {links.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) => isActive ? "nav-link-item active" : "nav-link-item"}
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          <Link to="/login" className="nav-cta">
            <LoginRoundedIcon fontSize="small" /> Access Portal
          </Link>

          <button className="mobile-toggle" onClick={() => setOpen(!open)}>
            {open ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
          </button>

          <div className={`mobile-menu-card ${open ? "open" : ""}`}>
            {links.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) => isActive ? "mob-link-item active" : "mob-link-item"}
                onClick={() => setOpen(false)}
              >
                {item.name}
              </NavLink>
            ))}
            <div className="mob-divider" />
            <Link
              to="/login"
              className="mob-link-item"
              style={{ background: "#FFFFFF", color: "#000000", display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
              onClick={() => setOpen(false)}
            >
              <ArrowForwardRoundedIcon fontSize="small" /> Access Portal
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Navbar;
