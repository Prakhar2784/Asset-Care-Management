import { useState, useEffect, useCallback } from "react";
import {
  AppBar, Avatar, Badge, Box, Button, Dialog, DialogActions,
  DialogContent, DialogTitle, Drawer, IconButton, List,
  ListItemButton, ListItemIcon, ListItemText, Toolbar, Tooltip, Typography,
  useMediaQuery,
} from "@mui/material";
import {
  ApartmentRounded, ApprovalRounded, AssignmentIndRounded, BusinessRounded,
  ConfirmationNumberRounded, DashboardRounded, Inventory2Rounded, MenuRounded,
  NotificationsRounded, LogoutRounded, HistoryRounded, AssessmentRounded,
  SettingsRounded, ChevronRightRounded, PeopleRounded, ShoppingCartRounded,
  DnsRounded, TrendingUpRounded, LightModeRounded, DarkModeRounded,
  ReceiptRounded, VpnKeyRounded, BuildRounded, StorefrontRounded
} from "@mui/icons-material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import api from "../api/axios";
import GlobalSearch from "./GlobalSearch";

const DRAWER_W = 256;
const ACCENT = "#FBBF24";
const ACCENT_DIM = "rgba(255,255,255,0.55)";

const adminMenu = [
  { section: "Overview" },
  { text: "Dashboard",        path: "/admin/dashboard",    icon: <DashboardRounded />,   perm: "View Dashboard" },

  { section: "Assets" },
  { text: "Asset Registry",   path: "/admin/assets",       icon: <Inventory2Rounded />,  perms: ["View All Assets", "Register Assets", "Edit / Delete Assets"] },
  { text: "Assigned Devices", path: "/admin/assignments",  icon: <AssignmentIndRounded />, perm: "Assign Assets" },
  { text: "Maintenance",      path: "/admin/maintenance",  icon: <BuildRounded />,        perm: "View All Assets" },
  { text: "Service Centers",  path: "/admin/service-centers", icon: <StorefrontRounded />, perm: "View All Assets" },

  { section: "Operations" },
  { text: "Tickets",          path: "/tickets",            icon: <ConfirmationNumberRounded />, perm: "Raise Tickets" },
  { text: "Approvals",        path: "/admin/approvals",    icon: <ApprovalRounded />,    perm: "Approve Device Requests" },

  { section: "Organization" },
  { text: "Enterprise Hub",   path: "/admin/enterprise",   icon: <BusinessRounded />, perm: "Settings & Config", feature: "enterpriseHub" },
  { text: "Departments",      path: "/admin/departments",  icon: <ApartmentRounded />,   perm: "Manage Departments" },

  { section: "Admin" },
  { text: "Reports",          path: "/admin/reports",      icon: <AssessmentRounded />,  perm: "View Reports" },
  { text: "Users",            path: "/admin/users",        icon: <PeopleRounded />,      perm: "Manage Users" },
  { text: "Settings",         path: "/settings",           icon: <SettingsRounded />,    perm: "Settings & Config" },
];

const employeeMenu = [
  { text: "My Portal",    path: "/employee/portal",  icon: <DashboardRounded /> },
  { text: "My Tickets",   path: "/tickets",           icon: <ConfirmationNumberRounded /> },
  { text: "Settings",     path: "/settings",          icon: <SettingsRounded /> },
];

const technicianMenu = [
  { text: "My Tasks",         path: "/tickets",            icon: <ConfirmationNumberRounded /> },
  { text: "Maintenance Logs",  path: "/admin/maintenance",  icon: <BuildRounded /> },
  { text: "Settings",         path: "/settings",           icon: <SettingsRounded /> },
];

const superAdminMenu = [
  { text: "Platform Console", path: "/super-admin/console", icon: <DnsRounded /> },
  { text: "Settings",         path: "/settings",            icon: <SettingsRounded /> },
];

const Sidebar = ({ onClose }) => {
  const navigate       = useNavigate();
  const location       = useLocation();
  const { currentUser } = useAuth();
  const { branding }    = useAppTheme();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  // Super admin always shows platform identity — never a customer's branding
  const effectiveBranding = isSuperAdmin
    ? { name: 'AssetCare Pro', logoUrl: null }
    : branding;
  const logoSrc = effectiveBranding?.logoUrl
    ? (effectiveBranding.logoUrl.startsWith("http") ? effectiveBranding.logoUrl : `${api.defaults.baseURL?.replace(/\/api\/?$/, "")}${effectiveBranding.logoUrl}`)
    : null;

  const adminRoles = ["admin", "super_admin", "hod", "manager", "technician"];
  const customPerms = currentUser?.customPermissions || [];
  const hasCustomPerms = customPerms.length > 0;
  const isAdminTier = adminRoles.includes(currentUser?.role);

  // For admin-tier users: default ALLOW (custom perms only restrict)
  // For employees with custom perms: default DENY (custom perms only grant)
  const isAllowed = (perm, perms) => {
    // perms = array means ANY match is sufficient (OR logic)
    if (perms) return perms.some(p => isAllowed(p));
    if (!perm) return true;
    if (!hasCustomPerms) return isAdminTier;
    const entry = customPerms.find(p => p.feature === perm);
    if (entry) return entry.allowed;
    return isAdminTier; // not in list: admins default allow, employees default deny
  };

  // Employees with at least one admin feature explicitly granted
  const employeeHasAdminPerms = !isAdminTier &&
    customPerms.some(p => p.allowed && !["View Dashboard", "Raise Tickets"].includes(p.feature));

  const rawMenu = currentUser?.role === "super_admin" ? superAdminMenu
    : currentUser?.role === "technician" ? technicianMenu
    : isAdminTier || employeeHasAdminPerms ? adminMenu
    : employeeMenu;

  const tenantFeatures = currentUser?.features || {};
  const isFeatureEnabled = (feature) => !feature || tenantFeatures[feature] !== false;

  // Employees never see section headings — only admins do
  const menu = rawMenu.filter(item => {
    if (item.section) return isAdminTier;
    return isAllowed(item.perm, item.perms) && isFeatureEnabled(item.feature);
  });

  const userName     = currentUser?.name || "User";
  const userInitials = userName.substring(0, 2).toUpperCase();

  const brandLabel = currentUser?.role === "super_admin"            ? "Platform Console"
    : currentUser?.role === "technician"                            ? "Technician Portal"
    : adminRoles.includes(currentUser?.role)                        ? "Admin Panel"
    : "Employee Portal";

  const handleNav = (path) => { navigate(path); if (onClose) onClose(); };
  const isActive  = (path) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
    <Box sx={{
      height: "100%",
      background: "#111827",
      display: "flex", flexDirection: "column", overflow: "hidden",
      borderRight: "1px solid rgba(255,255,255,0.06)",
    }}>
      {/* Brand */}
      <Box sx={{ px: 3, pt: 3.5, pb: 3, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: "10px", flexShrink: 0, overflow: "hidden",
            background: logoSrc ? "transparent" : "#111827",
            display: "grid", placeItems: "center",
            boxShadow: logoSrc ? "none" : "0 4px 16px rgba(17,24,39,0.5)",
          }}>
            {logoSrc
              ? <Box component="img" src={logoSrc} alt={effectiveBranding?.name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <Inventory2Rounded sx={{ fontSize: 19, color: "#FFFFFF" }} />
            }
          </Box>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
              {effectiveBranding?.name || "AssetCare Pro"}
            </Typography>
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: ACCENT_DIM, textTransform: "uppercase", letterSpacing: "0.9px" }}>
              {brandLabel}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 2, px: 1.5, "&::-webkit-scrollbar": { width: 0 } }}>
        <List disablePadding>
          {menu.map((item, idx) => {
            if (item.section) {
              return (
                <Typography key={`section-${idx}`} sx={{
                  fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)",
                  letterSpacing: "1.4px", textTransform: "uppercase",
                  px: 1.5, mt: idx === 0 ? 0 : 2, mb: 0.5,
                }}>
                  {item.section}
                </Typography>
              );
            }
            const active = isActive(item.path);
            return (
              <ListItemButton
                key={item.text}
                onClick={() => handleNav(item.path)}
                sx={{
                  borderRadius: "10px", mb: 0.25, py: 0.85, px: 1.5,
                  color: active ? "#FFFFFF" : "#9CA3AF",
                  bgcolor: active ? "rgba(255,255,255,0.1)" : "transparent",
                  borderLeft: `2px solid ${active ? ACCENT : "transparent"}`,
                  transition: "all 0.15s ease",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "#FFFFFF" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: active ? ACCENT : "#7B8899", "& svg": { fontSize: 18 } }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{ primary: { style: { fontSize: 13, fontWeight: active ? 700 : 500, color: "inherit" } } }}
                />
                {active && <ChevronRightRounded sx={{ fontSize: 16, color: ACCENT, opacity: 0.7 }} />}
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* User Row */}
      <Box sx={{ borderTop: "1px solid rgba(17,24,39,0.1)", px: 2, py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar src={currentUser?.avatar ? `http://localhost:5000${currentUser.avatar}` : undefined} sx={{
            width: 34, height: 34,
            background: "#111827",
            color: "#FFFFFF", fontWeight: 900, fontSize: 12,
            boxShadow: "0 2px 8px rgba(17,24,39,0.4)",
          }}>
            {userInitials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#E0E0E0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userName}
            </Typography>
            <Typography sx={{ fontSize: 11, color: ACCENT_DIM, textTransform: "capitalize" }}>
              {currentUser?.role || "user"}
            </Typography>
          </Box>
        </Box>
        <Typography sx={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)", textAlign: "center", mt: 1.5, letterSpacing: "0.3px" }}>
          Powered by AssetCare Pro
        </Typography>
      </Box>
    </Box>
  );
};

const PAGE_TITLES = {
  "/super-admin/console": "Platform Console",
  "/admin/dashboard":     "Dashboard",
  "/admin/assets/add":    "Register Asset",
  "/admin/assets":        "Asset Registry",
  "/admin/assignments":   "Assigned Devices",
  "/admin/enterprise":    "Enterprise Hub",
  "/admin/analytics":     "Analytics",
  "/admin/approvals":     "Approvals",
  "/admin/departments":   "Departments",
  "/admin/reports":       "Reports",
  "/admin/audit":         "Audit Logs",
  "/admin/invoices":      "Invoice Management",
  "/admin/apikeys":       "API Key Management",
  "/admin/maintenance":   "Maintenance Logs",
  "/tickets":             "Tickets",
  "/notifications":       "Notifications",
  "/settings":            "Settings",
  "/employee/portal":     "My Portal",
};

const Layout = () => {
  const isMobile = useMediaQuery("(max-width:900px)");
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [logoutOpen, setLogoutOpen]   = useState(false);
  const { currentUser, logout }       = useAuth();
  const { isDark, toggleMode }        = useAppTheme();
  const navigate                      = useNavigate();
  const location                      = useLocation();

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

      {!isMobile && (
        <Drawer variant="permanent"
          sx={{ width: DRAWER_W, flexShrink: 0, "& .MuiDrawer-paper": { width: DRAWER_W, border: 0, bgcolor: "transparent" } }}>
          <Sidebar />
        </Drawer>
      )}

      {isMobile && (
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
          slotProps={{ paper: { sx: { width: DRAWER_W, bgcolor: "transparent", border: 0 } } }}>
          <Sidebar onClose={() => setDrawerOpen(false)} />
        </Drawer>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        <AppBar position="sticky" elevation={0} sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
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
              <Tooltip title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                <IconButton onClick={toggleMode}
                  sx={{ color: "text.secondary", "&:hover": { bgcolor: "action.hover", color: "text.primary" } }}>
                  {isDark ? <LightModeRounded sx={{ fontSize: 20 }} /> : <DarkModeRounded sx={{ fontSize: 20 }} />}
                </IconButton>
              </Tooltip>
              <GlobalSearch />
              <IconButton onClick={() => navigate("/notifications")}
                sx={{ color: "text.secondary", "&:hover": { bgcolor: "action.hover", color: "text.primary" } }}>
                <Badge badgeContent={unreadCount || null} color="error"
                  sx={{ "& .MuiBadge-badge": { fontSize: 10, minWidth: 16, height: 16 } }}>
                  <NotificationsRounded />
                </Badge>
              </IconButton>
              <Avatar
                onClick={() => navigate("/settings")}
                src={currentUser?.avatar ? `http://localhost:5000${currentUser.avatar}` : undefined}
                sx={{
                  width: 34, height: 34, ml: 0.5, cursor: "pointer",
                  background: "#111827",
                  color: "#FFFFFF", fontWeight: 900, fontSize: 12,
                  boxShadow: isDark ? "0 2px 8px rgba(17,24,39,0.4)" : "0 2px 8px rgba(17,24,39,0.25)",
                  "&:hover": { opacity: 0.85 }
                }}>
                {userInitials}
              </Avatar>
              <IconButton onClick={() => setLogoutOpen(true)}
                sx={{ ml: 0.5, color: "text.secondary", "&:hover": { color: "#EF4444", bgcolor: isDark ? "rgba(239,68,68,0.1)" : "#FEE2E2" } }}>
                <LogoutRounded sx={{ fontSize: 19 }} />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} maxWidth="xs" fullWidth
          slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
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

        <Box sx={{ flex: 1, p: { xs: 3, md: 4 }, color: "text.primary" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
