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
  ReceiptRounded, VpnKeyRounded, BuildRounded, StorefrontRounded, CloseRounded
} from "@mui/icons-material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import api, { getFileUrl } from "../api/axios";
import GlobalSearch from "./GlobalSearch";

const DRAWER_W = 256;
const ACCENT = "#7777C7";

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
  { text: "Approvals",        path: "/admin/approvals",    icon: <ApprovalRounded /> },

  { section: "Organization" },
  { text: "Enterprise Hub",   path: "/admin/enterprise",   icon: <BusinessRounded />, perm: "Settings & Config", feature: "enterpriseHub" },
  { text: "Departments",      path: "/admin/departments",  icon: <ApartmentRounded />,   perm: "Manage Departments" },

  { section: "Admin" },
  { text: "Users",                  path: "/admin/users",              icon: <PeopleRounded />,      perm: "Manage Users" },
  { text: "Subscription & Billing", path: "/admin/billing",            icon: <ReceiptRounded /> },
  { text: "Settings",               path: "/settings",                 icon: <SettingsRounded /> },
];

const hodMenu = [
  { section: "Overview" },
  { text: "Dashboard",        path: "/admin/dashboard",        icon: <DashboardRounded />,   perm: "View Dashboard" },

  { section: "My Department" },
  { text: "My Team",          path: "/admin/my-team",          icon: <PeopleRounded /> },
  { text: "Asset Registry",   path: "/admin/assets",           icon: <Inventory2Rounded />,  perms: ["View All Assets", "Register Assets", "Edit / Delete Assets"] },
  { text: "Assigned Devices", path: "/admin/assignments",      icon: <AssignmentIndRounded />, perm: "Assign Assets" },
  { text: "Maintenance",      path: "/admin/maintenance",      icon: <BuildRounded />,        perm: "View All Assets" },
  { text: "Service Centers",  path: "/admin/service-centers",  icon: <StorefrontRounded />,   perm: "View All Assets" },

  { section: "Operations" },
  { text: "Tickets",          path: "/tickets",                icon: <ConfirmationNumberRounded />, perm: "Raise Tickets" },
  { text: "Approvals",        path: "/admin/approvals",        icon: <ApprovalRounded /> },

  { section: "Account" },
  { text: "Settings",         path: "/settings",               icon: <SettingsRounded /> },
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
    ? { name: 'IAssetCare', logoUrl: null }
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

  const rawMenu = currentUser?.role === "super_admin"  ? superAdminMenu
    : hasCustomPerms                                   ? adminMenu
    : currentUser?.role === "technician"               ? technicianMenu
    : currentUser?.role === "hod"                      ? hodMenu
    : isAdminTier || employeeHasAdminPerms             ? adminMenu
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

  const brandLabel = currentUser?.role === "super_admin" ? "Platform Console"
    : currentUser?.role === "technician"                ? "Technician Portal"
    : currentUser?.role === "hod"                       ? "HOD Panel"
    : currentUser?.role === "manager"                   ? "Manager Panel"
    : currentUser?.role === "admin"                     ? "Admin Panel"
    : "Employee Portal";

  const handleNav = (path) => { navigate(path); if (onClose) onClose(); };
  const isActive  = (path) => {
    if (path.includes('?')) {
      return (location.pathname + location.search) === path;
    }
    if (path === '/settings' && location.search.includes('tab=')) {
      return false;
    }
    return location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
  };

  return (
    <Box sx={{
      height: "100%",
      background: "#000000",
      display: "flex", flexDirection: "column", overflow: "hidden",
      borderRight: "1px solid #1F2422",
      borderRadius: 0,
    }}>
      {/* Brand */}
      <Box sx={{ px: 3, pt: 3.5, pb: 3, borderBottom: "1px solid #1F2422" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: "10px", flexShrink: 0, overflow: "hidden",
            background: "transparent",
            display: "grid", placeItems: "center",
            boxShadow: "none",
          }}>
            {logoSrc
              ? <Box component="img" src={logoSrc} alt={effectiveBranding?.name} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
              : <Box component="img" src="/logo.png" alt="IAssetCare" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
            }
          </Box>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
              {effectiveBranding?.name || "IAssetCare"}
            </Typography>
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.9px" }}>
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
                  fontSize: 10, fontWeight: 800, color: "#6F7774", letterSpacing: "1.4px", textTransform: "uppercase",
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
                  color: active ? "#FFFFFF" : "#D9E2DF",
                  bgcolor: active ? "#101010" : "transparent",
                  borderLeft: `3px solid ${active ? "#7777C7" : "transparent"}`,
                  border: active ? "1px solid #1F2422" : "1px solid transparent",
                  transition: "all 0.15s ease",
                  "&:hover": { bgcolor: "#151515", color: "#FFFFFF" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: active ? "#7777C7" : "#7C8399", "& svg": { fontSize: 18 } }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{ primary: { style: { fontSize: 13, fontWeight: active ? 800 : 600, color: "inherit" } } }}
                />
                {active && <ChevronRightRounded sx={{ fontSize: 16, color: ACCENT, opacity: 0.9 }} />}
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* User Row */}
      <Box sx={{ borderTop: "1px solid #1F2422", px: 2, py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar src={getFileUrl(currentUser?.avatar) || undefined} sx={{
            width: 34, height: 34,
            background: "#7777C7",
            color: "#FFFFFF", fontWeight: 900, fontSize: 12,
            boxShadow: "0 2px 8px rgba(119, 119, 199, 0.35)",
          }}>
            {userInitials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userName}
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#7C8399", textTransform: "capitalize" }}>
              {currentUser?.role || "user"}
            </Typography>
          </Box>
        </Box>
        <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#7C8399", textAlign: "center", mt: 1.5, letterSpacing: "0.3px" }}>
          Powered by IAssetCare
        </Typography>
      </Box>
    </Box>
  );
};

export const PageTitle = ({ title }) => (
  <Typography
    component="h1"
    className="page-title"
    sx={{
      fontWeight: 800,
      fontSize: 17,
      color: "#0A0A0A",
      letterSpacing: "-0.4px",
      lineHeight: 1.2,
      fontFamily: "inherit",
      m: 0,
      p: 0,
    }}
  >
    {title}
  </Typography>
);

const PAGE_TITLES = {
  "/super-admin/console":        "Platform Console",
  "/admin/dashboard":            "Dashboard",
  "/admin/assets/add":           "Register Asset",
  "/admin/assets/edit":          "Edit Asset",
  "/admin/assets":               "Asset Registry",
  "/admin/assignments":          "Assigned Devices",
  "/admin/maintenance":          "Maintenance",
  "/admin/service-centers":      "Service Centers",
  "/admin/tickets":              "Tickets",
  "/tickets":                    "Tickets",
  "/admin/approvals":            "Approvals",
  "/admin/departments":          "Departments",
  "/admin/users":                "Users",
  "/admin/my-team":              "Department Team",
  "/admin/enterprise":           "Enterprise Hub",
  "/admin/analytics":            "Analytics",
  "/admin/audit":                "Audit Logs",
  "/admin/invoices":             "Invoice Management",
  "/admin/apikeys":              "API Key Management",
  "/admin/subscription-billing": "Subscription & Billing",
  "/admin/billing/invoice":      "Invoice Details",
  "/admin/billing":              "Subscription & Billing",
  "/admin/checkout":             "Checkout",
  "/employee/portal":            "My Portal",
  "/technician/portal":          "Technician Portal",
  "/notifications":              "Notifications",
  "/settings":                   "Settings",
  "/onboarding":                 "Onboarding",
  "/scan":                       "Scan Asset",
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

  const getPageTitle = (pathname) => {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    const match = Object.entries(PAGE_TITLES)
      .filter(([route]) => route !== "/" && pathname.startsWith(route))
      .sort((a, b) => b[0].length - a[0].length)[0];
    return match ? match[1] : "Dashboard";
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "#F0F2F1" }}>

      {!isMobile && (
        <Drawer variant="permanent"
          sx={{ width: DRAWER_W, flexShrink: 0, "& .MuiDrawer-paper": { width: DRAWER_W, border: 0, bgcolor: "transparent", borderRadius: 0 } }}>
          <Sidebar />
        </Drawer>
      )}

      {isMobile && (
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
          slotProps={{ paper: { sx: { width: DRAWER_W, bgcolor: "transparent", border: 0, borderRadius: 0 } } }}>
          <Sidebar onClose={() => setDrawerOpen(false)} />
        </Drawer>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        <AppBar position="sticky" elevation={0} sx={{
          bgcolor: "#FFFFFF",
          borderBottom: "1px solid #E3E7E5",
          color: "#0A0A0A",
        }}>
          <Toolbar sx={{ px: { xs: 2, md: 3 }, minHeight: "60px !important", display: "flex", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {isMobile && (
                <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: "#61706B", mr: 0.5, "&:hover": { bgcolor: "#F0F2F1", color: "#0C1C16" } }}>
                  <MenuRounded />
                </IconButton>
              )}
              <PageTitle title={pageTitle} />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <GlobalSearch />
              <IconButton onClick={() => navigate("/notifications")}
                sx={{ color: "#61706B", "&:hover": { bgcolor: "#F0F2F1", color: "#0C1C16" } }}>
                <Badge badgeContent={unreadCount || null} color="error"
                  sx={{ "& .MuiBadge-badge": { fontSize: 10, minWidth: 16, height: 16 } }}>
                  <NotificationsRounded />
                </Badge>
              </IconButton>
              <Avatar
                onClick={() => navigate("/settings")}
                src={getFileUrl(currentUser?.avatar) || undefined}
                sx={{
                  width: 34, height: 34, ml: 0.5, cursor: "pointer",
                  background: "#7777C7",
                  color: "#FFFFFF", fontWeight: 900, fontSize: 12,
                  boxShadow: "0 2px 8px rgba(119, 119, 199, 0.35)",
                  "&:hover": { opacity: 0.85 }
                }}>
                {userInitials}
              </Avatar>
              <IconButton onClick={() => setLogoutOpen(true)}
                sx={{ ml: 0.5, color: "#61706B", "&:hover": { color: "#EF4444", bgcolor: "rgba(239, 68, 68, 0.15)" } }}>
                <LogoutRounded sx={{ fontSize: 19 }} />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Logout Confirmation Modal */}
        <Dialog
          open={logoutOpen}
          onClose={() => setLogoutOpen(false)}
          maxWidth="xs"
          fullWidth
          slotProps={{
            backdrop: {
              sx: {
                bgcolor: "rgba(0, 0, 0, 0.55)",
                backdropFilter: "blur(2px)",
              }
            },
            paper: {
              sx: {
                width: "100%",
                maxWidth: "420px",
                borderRadius: "24px",
                bgcolor: "#FFFFFF",
                p: { xs: 2.5, sm: 3.5 },
                pt: { xs: 3, sm: 3.5 },
                position: "relative",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.18)",
                border: "1px solid #E3E7E5",
                textAlign: "center",
                overflow: "visible",
              }
            }
          }}
        >
          {/* Close X Button */}
          <IconButton
            onClick={() => setLogoutOpen(false)}
            aria-label="Close"
            sx={{
              position: "absolute",
              top: 14,
              right: 14,
              color: "#61706B",
              bgcolor: "transparent",
              "&:hover": { color: "#0A0A0A", bgcolor: "#F0F2F1" }
            }}
          >
            <CloseRounded sx={{ fontSize: 20 }} />
          </IconButton>

          {/* Centered Modal Content */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            {/* Top Illustration */}
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mb: 2,
                mt: 0.5,
              }}
            >
              <Box
                component="img"
                src="/logout-illustration.png"
                alt="Logout Confirmation"
                sx={{
                  width: "160px",
                  maxWidth: "100%",
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </Box>

            {/* Single Heading */}
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: 19, sm: 21 },
                fontWeight: 800,
                color: "#0A0A0A",
                letterSpacing: "-0.4px",
                lineHeight: 1.3,
                textAlign: "center",
                mb: 3.5,
              }}
            >
              Are you sure you want to logout?
            </Typography>

            {/* Action Buttons */}
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                width: "100%",
                justifyContent: "center",
                flexDirection: { xs: "column-reverse", sm: "row" },
              }}
            >
              <Button
                onClick={() => setLogoutOpen(false)}
                sx={{
                  flex: 1,
                  py: 1.25,
                  borderRadius: "12px",
                  bgcolor: "#FFFFFF",
                  color: "#0A0A0A",
                  border: "1px solid #D9E0DF",
                  fontWeight: 700,
                  fontSize: 14.5,
                  textTransform: "none",
                  boxShadow: "none",
                  minHeight: "44px",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: "#F6F6FD",
                    borderColor: "#C9C9EA",
                    boxShadow: "none",
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setLogoutOpen(false);
                  logout();
                  navigate("/login");
                }}
                sx={{
                  flex: 1,
                  py: 1.25,
                  borderRadius: "12px",
                  bgcolor: "#7777C7",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: 14.5,
                  textTransform: "none",
                  boxShadow: "none",
                  minHeight: "44px",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: "#6969B8",
                    boxShadow: "none",
                  },
                }}
              >
                Log out
              </Button>
            </Box>
          </Box>
        </Dialog>

        <Box sx={{ flex: 1, p: { xs: 3, md: 4 }, color: "#0A0A0A" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
