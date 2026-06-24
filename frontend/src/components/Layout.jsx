import { useState, useEffect, useCallback } from "react";
import {
  AppBar, Avatar, Badge, Box, Button, Dialog, DialogActions,
  DialogContent, DialogTitle, Drawer, IconButton, List,
  ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography,
  useMediaQuery,
} from "@mui/material";
import {
  ApartmentRounded, ApprovalRounded, AssignmentIndRounded, BusinessRounded,
  ConfirmationNumberRounded, DashboardRounded, Inventory2Rounded, MenuRounded,
  NotificationsRounded, LogoutRounded, HistoryRounded, AssessmentRounded,
  SettingsRounded, ChevronRightRounded,
} from "@mui/icons-material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import api from "../api/axios";
import GlobalSearch from "./GlobalSearch";

const DRAWER_W = 256;
const ACCENT = "#CBFA57";

const adminMenu = [
  { text: "Dashboard",       path: "/admin/dashboard",    icon: <DashboardRounded /> },
  { text: "Asset Registry",  path: "/admin/assets",       icon: <Inventory2Rounded /> },
  { text: "Assigned Devices",path: "/admin/assignments",  icon: <AssignmentIndRounded /> },
  { text: "All Tickets",     path: "/tickets",            icon: <ConfirmationNumberRounded /> },
  { text: "Approvals",       path: "/admin/approvals",    icon: <ApprovalRounded /> },
  { text: "Vendors",         path: "/admin/vendors",      icon: <BusinessRounded /> },
  { text: "Departments",     path: "/admin/departments",  icon: <ApartmentRounded /> },
  { text: "Reports",         path: "/admin/reports",      icon: <AssessmentRounded /> },
  { text: "Audit Logs",      path: "/admin/audit",        icon: <HistoryRounded /> },
  { text: "Settings",        path: "/settings",           icon: <SettingsRounded /> },
];

const employeeMenu = [
  { text: "My Portal",  path: "/employee/portal", icon: <DashboardRounded /> },
  { text: "My Tickets", path: "/tickets",          icon: <ConfirmationNumberRounded /> },
  { text: "Settings",   path: "/settings",         icon: <SettingsRounded /> },
];

const Sidebar = ({ onClose }) => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { logout, currentUser } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const menu = currentUser?.role === "admin" ? adminMenu : employeeMenu;
  const userName    = currentUser?.name || "User";
  const userInitials = userName.substring(0, 2).toUpperCase();
  const isAdmin     = currentUser?.role === "admin";

  const handleNav = (path) => { navigate(path); if (onClose) onClose(); };
  const isActive  = (path) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
    <Box sx={{ height: "100%", bgcolor: "#111111", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Brand */}
      <Box sx={{ px: 3, pt: 3.5, pb: 3, borderBottom: "1px solid #1E1E1E" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: ACCENT, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Inventory2Rounded sx={{ fontSize: 19, color: "#111111" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
              AssetCare Pro
            </Typography>
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#444444", textTransform: "uppercase", letterSpacing: "0.9px" }}>
              {isAdmin ? "Admin Panel" : "Employee Portal"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 2, px: 1.5, "&::-webkit-scrollbar": { width: 0 } }}>
        <Typography sx={{ fontSize: 10, fontWeight: 800, color: "#333333", letterSpacing: "1.4px", textTransform: "uppercase", px: 1.5, mb: 1.5 }}>
          Menu
        </Typography>

        <List disablePadding>
          {menu.map((item) => {
            const active = isActive(item.path);
            return (
              <ListItemButton
                key={item.text}
                onClick={() => handleNav(item.path)}
                sx={{
                  borderRadius: "10px",
                  mb: 0.5,
                  py: 1,
                  px: 1.5,
                  color: active ? "#FFFFFF" : "#5A5A5A",
                  bgcolor: active ? "#1A1A1A" : "transparent",
                  borderLeft: `2px solid ${active ? ACCENT : "transparent"}`,
                  transition: "all 0.15s ease",
                  "&:hover": { bgcolor: "#181818", color: "#BBBBBB" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: active ? ACCENT : "#3A3A3A", "& svg": { fontSize: 18 } }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 700 : 500, color: "inherit" }}
                />
                {active && <ChevronRightRounded sx={{ fontSize: 16, color: ACCENT, opacity: 0.7 }} />}
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* User Row + Logout */}
      <Box sx={{ borderTop: "1px solid #1A1A1A", px: 2, py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: "#1E1E1E", color: ACCENT, fontWeight: 900, fontSize: 12 }}>
            {userInitials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#E0E0E0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userName}
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#444444", textTransform: "capitalize" }}>
              {currentUser?.role || "user"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setLogoutOpen(true)}
            sx={{ color: "#3A3A3A", "&:hover": { color: "#EF4444", bgcolor: "#1C1C1C" } }}>
            <LogoutRounded sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Logout Confirm */}
      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", bgcolor: "background.paper" } }}>
        <DialogTitle sx={{ fontWeight: 900, fontSize: 18, color: "text.primary" }}>Sign Out</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" fontWeight={500}>Are you sure you want to sign out?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setLogoutOpen(false)} sx={{ fontWeight: 700, color: "text.secondary" }}>Cancel</Button>
          <Button variant="contained" onClick={() => { logout(); navigate("/login"); }}
            sx={{ bgcolor: "#EF4444", "&:hover": { bgcolor: "#DC2626" }, fontWeight: 900, borderRadius: "8px", px: 3 }}>
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/* ─── Page-title map ──────────────────────────── */
const PAGE_TITLES = {
  "/admin/dashboard": "Dashboard",
  "/admin/assets/add": "Register Asset",
  "/admin/assets": "Asset Registry",
  "/admin/assignments": "Assigned Devices",
  "/admin/approvals": "Approvals",
  "/admin/vendors": "Vendors",
  "/admin/departments": "Departments",
  "/admin/reports": "Reports",
  "/admin/audit": "Audit Logs",
  "/tickets": "Tickets",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/employee/portal": "My Portal",
};

const Layout = () => {
  const isMobile = useMediaQuery("(max-width:900px)");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();
  const { isDark } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/unread-count");
      setUnreadCount(data.count);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUnreadCount();
      const iv = setInterval(fetchUnreadCount, 10000);
      window.addEventListener("notifications-changed", fetchUnreadCount);
      return () => { clearInterval(iv); window.removeEventListener("notifications-changed", fetchUnreadCount); };
    } else {
      setUnreadCount(0);
    }
  }, [currentUser, fetchUnreadCount]);

  const userInitials = (currentUser?.name || "U").substring(0, 2).toUpperCase();

  const pageTitle = Object.entries(PAGE_TITLES).find(([k]) =>
    location.pathname === k || (k !== "/" && location.pathname.startsWith(k))
  )?.[1] ?? "AssetCare Pro";

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "background.default" }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <Drawer variant="permanent"
          sx={{ width: DRAWER_W, flexShrink: 0, "& .MuiDrawer-paper": { width: DRAWER_W, border: 0, bgcolor: "transparent" } }}>
          <Sidebar />
        </Drawer>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { width: DRAWER_W, bgcolor: "transparent", border: 0 } }}>
          <Sidebar onClose={() => setDrawerOpen(false)} />
        </Drawer>
      )}

      {/* Right side */}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* AppBar */}
        <AppBar position="sticky" elevation={0} sx={{
          bgcolor: isDark ? "rgba(13,13,13,0.94)" : "rgba(236,234,227,0.90)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid",
          borderColor: isDark ? "#1E1E1E" : "#D8D3C8",
          color: "text.primary",
        }}>
          <Toolbar sx={{ px: { xs: 2, md: 3 }, minHeight: "60px !important", display: "flex", justifyContent: "space-between" }}>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {isMobile && (
                <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: "text.secondary", mr: 0.5 }}>
                  <MenuRounded />
                </IconButton>
              )}
              <Typography sx={{ fontWeight: 800, fontSize: 17, color: "text.primary", letterSpacing: "-0.4px" }}>
                {pageTitle}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <GlobalSearch />
              <IconButton onClick={() => navigate("/notifications")}
                sx={{ color: "text.secondary", "&:hover": { bgcolor: isDark ? "#1C1C1C" : "#E4DFD5", color: "text.primary" } }}>
                <Badge badgeContent={unreadCount || null} color="error"
                  sx={{ "& .MuiBadge-badge": { fontSize: 10, minWidth: 16, height: 16 } }}>
                  <NotificationsRounded />
                </Badge>
              </IconButton>
              <Avatar
                onClick={() => navigate("/settings")}
                sx={{ width: 34, height: 34, ml: 0.5, bgcolor: isDark ? "#222222" : "#141414", color: ACCENT, fontWeight: 900, fontSize: 12, cursor: "pointer", "&:hover": { opacity: 0.85 } }}>
                {userInitials}
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flex: 1, p: { xs: 3, md: 4 }, color: "text.primary" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
