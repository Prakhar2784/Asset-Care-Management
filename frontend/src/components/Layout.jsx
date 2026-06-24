import { useState, useEffect, useCallback } from "react";
import { AppBar, Avatar, Badge, Box, Button, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useMediaQuery } from "@mui/material";
import { ApartmentRounded, ApprovalRounded, BusinessRounded, ConfirmationNumberRounded, DashboardRounded, Inventory2Rounded, MenuRounded, NotificationsRounded, ShieldRounded, LogoutRounded, PersonRounded, HistoryRounded, AssessmentRounded, SettingsRounded } from "@mui/icons-material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import api from "../api/axios";
import GlobalSearch from "./GlobalSearch";

const drawerWidth = 280;

const adminMenu = [
  { text: "System Dashboard", path: "/admin/dashboard", icon: <DashboardRounded /> },
  { text: "Asset Registry", path: "/admin/assets", icon: <Inventory2Rounded /> },
  { text: "All Tickets", path: "/tickets", icon: <ConfirmationNumberRounded /> },
  { text: "Approvals", path: "/admin/approvals", icon: <ApprovalRounded /> },
  { text: "Vendors", path: "/admin/vendors", icon: <BusinessRounded /> },
  { text: "Departments", path: "/admin/departments", icon: <ApartmentRounded /> },
  { text: "Reports", path: "/admin/reports", icon: <AssessmentRounded /> },
  { text: "Audit Logs", path: "/admin/audit", icon: <HistoryRounded /> },
  { text: "Settings", path: "/settings", icon: <SettingsRounded /> },
];

const employeeMenu = [
  { text: "My Portal", path: "/employee/portal", icon: <DashboardRounded /> },
  { text: "My Tickets", path: "/tickets", icon: <ConfirmationNumberRounded /> },
  { text: "Settings", path: "/settings", icon: <SettingsRounded /> },
];

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser } = useAuth();
  const { isDark } = useAppTheme();

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menu = currentUser?.role === "admin" ? adminMenu : employeeMenu;

  const bg = isDark ? '#0f172a' : '#ffffff';
  const border = isDark ? '#1e293b' : '#e2e8f0';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const hoverBg = isDark ? '#1e293b' : '#f1f5f9';
  const activeBg = isDark ? '#1e3a5f' : '#eef2ff';
  const activeColor = isDark ? '#818cf8' : '#4f46e5';

  return (
    <Box sx={{ height: "100%", color: textPrimary, bgcolor: bg, borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column", transition: "background 0.2s" }}>
      <Box sx={{ p: 3, mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, background: "linear-gradient(135deg, #4f46e5, #0ea5e9)", color: "#ffffff", display: "grid", placeItems: "center", boxShadow: "0 8px 16px rgba(79, 70, 229, 0.2)" }}>
            {currentUser?.role === "admin" ? <ShieldRounded fontSize="medium" /> : <PersonRounded fontSize="medium" />}
          </Box>
          <Box>
            <Typography fontSize={20} fontWeight={800} letterSpacing="-0.5px" color={textPrimary}>AssetCare</Typography>
            <Typography fontSize={12} color="#0ea5e9" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {currentUser?.role === "admin" ? "Admin Access" : "Employee Portal"}
            </Typography>
          </Box>
        </Box>
      </Box>

      <List sx={{ px: 2, flex: 1 }}>
        {menu.map((item) => {
          const active = location.pathname.includes(item.path);
          return (
            <ListItemButton
              key={item.text}
              onClick={() => handleNav(item.path)}
              sx={{
                borderRadius: 3, mb: 1, py: 1.5,
                color: active ? activeColor : textMuted,
                bgcolor: active ? activeBg : "transparent",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": { bgcolor: active ? activeBg : hoverBg, color: active ? activeColor : textPrimary, transform: "translateX(4px)" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontWeight: active ? 700 : 600, fontSize: 15 }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 3 }}>
        <Button fullWidth startIcon={<LogoutRounded />} onClick={handleLogout}
          sx={{ py: 1.5, color: textMuted, borderRadius: 3, border: `1px solid ${border}`, fontWeight: 700, "&:hover": { bgcolor: "#fee2e2", borderColor: "#fca5a5", color: "#ef4444" } }}>
          Secure Logout
        </Button>
      </Box>
    </Box>
  );
};

const Layout = () => {
  const isMobile = useMediaQuery("(max-width:900px)");
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();
  const { isDark } = useAppTheme();
  const navigate = useNavigate();

  const userName = currentUser?.name || "User";
  const userRole = currentUser?.role === "admin" ? "Root Access" : "Standard User";
  const userInitials = userName.substring(0, 2).toUpperCase();

  const appBarBg = isDark
    ? 'rgba(15, 23, 42, 0.92)'
    : 'rgba(255, 255, 255, 0.8)';
  const appBarBorder = isDark ? '#1e293b' : '#e2e8f0';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 10000);
      // Re-fetch instantly when any notification action happens on the Notifications page
      window.addEventListener('notifications-changed', fetchUnreadCount);
      return () => {
        clearInterval(interval);
        window.removeEventListener('notifications-changed', fetchUnreadCount);
      };
    } else {
      setUnreadCount(0);
    }
  }, [currentUser, fetchUnreadCount]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: isDark ? '#0f172a' : '#f8fafc' }}>
      {!isMobile && (
        <Drawer variant="permanent" sx={{ width: drawerWidth, "& .MuiDrawer-paper": { width: drawerWidth, border: 0, bgcolor: "transparent" } }}>
          <Sidebar />
        </Drawer>
      )}

      {isMobile && (
        <Drawer open={open} onClose={() => setOpen(false)}>
          <Box sx={{ width: 280, height: "100%" }}><Sidebar onClose={() => setOpen(false)} /></Box>
        </Drawer>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <AppBar position="sticky" elevation={0} sx={{ top: 0, bgcolor: appBarBg, backdropFilter: "blur(16px)", borderBottom: `1px solid ${appBarBorder}`, color: textPrimary, transition: "background 0.2s" }}>
          <Toolbar sx={{ px: { xs: 2, md: 4 }, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box display="flex" alignItems="center">
              {isMobile && <IconButton onClick={() => setOpen(true)} sx={{ mr: 2, color: textPrimary }}><MenuRounded /></IconButton>}
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <GlobalSearch />
              <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "right", mx: 1 }}>
                <Typography fontWeight={700} fontSize={15} color={textPrimary}>{userName}</Typography>
                <Typography fontSize={13} color={textMuted} fontWeight={500}>{userRole}</Typography>
              </Box>
              <Avatar sx={{ bgcolor: isDark ? '#1e3a5f' : '#eef2ff', color: isDark ? '#818cf8' : '#4f46e5', fontWeight: 800 }}>{userInitials}</Avatar>
              <IconButton
                onClick={() => navigate('/notifications')}
                sx={{ color: textMuted, "&:hover": { color: "#4f46e5", bgcolor: isDark ? '#1e293b' : '#eef2ff' } }}
              >
                <Badge badgeContent={unreadCount || null} color="error">
                  <NotificationsRounded />
                </Badge>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            p: { xs: 3, md: 5 },
            flex: 1,
            color: 'text.primary',
            animation: "fadeIn 0.6s ease-out forwards",
            "@keyframes fadeIn": { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } }
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
