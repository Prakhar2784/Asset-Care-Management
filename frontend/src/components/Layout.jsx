import { useState, useEffect, useCallback } from "react";
import { AppBar, Avatar, Badge, Box, Button, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useMediaQuery } from "@mui/material";
import { ApartmentRounded, ApprovalRounded, BusinessRounded, ConfirmationNumberRounded, DashboardRounded, Inventory2Rounded, MenuRounded, NotificationsRounded, ShieldRounded, LogoutRounded, PersonRounded, HistoryRounded, AssessmentRounded } from "@mui/icons-material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

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
];

const employeeMenu = [
  { text: "My Portal", path: "/employee/portal", icon: <DashboardRounded /> },
  { text: "My Tickets", path: "/tickets", icon: <ConfirmationNumberRounded /> },
];

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser } = useAuth();

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menu = currentUser?.role === "admin" ? adminMenu : employeeMenu;

  return (
    <Box sx={{ height: "100%", color: "#0f172a", bgcolor: "#ffffff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 3, mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, background: "linear-gradient(135deg, #4f46e5, #0ea5e9)", color: "#ffffff", display: "grid", placeItems: "center", boxShadow: "0 8px 16px rgba(79, 70, 229, 0.2)" }}>
            {currentUser?.role === "admin" ? <ShieldRounded fontSize="medium" /> : <PersonRounded fontSize="medium" />}
          </Box>
          <Box>
            <Typography fontSize={20} fontWeight={800} letterSpacing="-0.5px">AssetCare</Typography>
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
                color: active ? "#4f46e5" : "#64748b",
                bgcolor: active ? "#eef2ff" : "transparent",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": { bgcolor: active ? "#e0e7ff" : "#f1f5f9", color: active ? "#4f46e5" : "#0f172a", transform: "translateX(4px)" },
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
        <Button fullWidth startIcon={<LogoutRounded />} onClick={handleLogout} sx={{ py: 1.5, color: "#64748b", borderRadius: 3, border: "1px solid #e2e8f0", fontWeight: 700, "&:hover": { bgcolor: "#fee2e2", borderColor: "#fca5a5", color: "#ef4444" } }}>
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
  const navigate = useNavigate();

  const userName = currentUser?.name || "User";
  const userRole = currentUser?.role === "admin" ? "Root Access" : "Standard User";
  const userInitials = userName.substring(0, 2).toUpperCase();

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
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchUnreadCount]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "#f8fafc" }}>
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
        <AppBar position="sticky" elevation={0} sx={{ top: 0, bgcolor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(16px)", borderBottom: "1px solid #e2e8f0", color: "#0f172a" }}>
          <Toolbar sx={{ px: { xs: 2, md: 4 }, py: 1.5 }}>
            {isMobile && <IconButton onClick={() => setOpen(true)} sx={{ mr: 2, color: "#0f172a" }}><MenuRounded /></IconButton>}

            <Box ml="auto" display="flex" alignItems="center" gap={3}>
              <IconButton
                onClick={() => navigate('/notifications')}
                sx={{ color: "#64748b", "&:hover": { color: "#4f46e5", bgcolor: "#eef2ff" } }}
              >
                <Badge badgeContent={unreadCount || null} color="error">
                  <NotificationsRounded />
                </Badge>
              </IconButton>
              <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "right" }}>
                <Typography fontWeight={700} fontSize={15} color="#0f172a">{userName}</Typography>
                <Typography fontSize={13} color="#64748b" fontWeight={500}>{userRole}</Typography>
              </Box>
              <Avatar sx={{ bgcolor: "#eef2ff", color: "#4f46e5", fontWeight: 800 }}>{userInitials}</Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            p: { xs: 3, md: 5 },
            flex: 1,
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
