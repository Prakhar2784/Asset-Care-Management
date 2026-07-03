import React, { useState, useEffect } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog,
  DialogContent, Grid, IconButton,
  LinearProgress, Paper, Snackbar, Stack, Typography,
} from "@mui/material";
import {
  Inventory2Rounded, ConfirmationNumberRounded, ApprovalRounded,
  ArrowForwardRounded, CloseRounded, TaskAltRounded,
  BusinessRounded, AddRounded, BuildRounded, DevicesRounded,
  ShieldRounded, SpeedRounded, PeopleRounded,
  NotificationsActiveRounded, CalendarTodayRounded,
  CheckCircleRounded, AccessTimeRounded,
  ReceiptLongRounded, StorageRounded,
  EventNoteRounded,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import StatusChip from "../../components/StatusChip";
import api from "../../api/axios";

/* ─────────────────────── helpers ─────────────────────── */
const ADMIN_TIER = ['admin', 'super_admin', 'hod', 'manager'];

// Meaning is conveyed by the label text itself, not color — kept neutral gray for all states
const PRIORITY_COLOR = { Critical: "#9CA3AF", High: "#9CA3AF", Medium: "#9CA3AF", Low: "#9CA3AF" };
const STATUS_DOT = {
  "Pending Approval": "#9CA3AF",
  "Under Repair":     "#9CA3AF",
  Resolved:           "#9CA3AF",
  Rejected:           "#9CA3AF",
};
const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};
const fmtDate = () =>
  new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/* ─────────────────────── sub-components ─────────────────────── */
const KpiCard = ({ label, value, sub, icon, accent, onClick }) => (
  <Paper onClick={onClick} sx={{
    p: 2.8, borderRadius: "20px", border: "1px solid", borderColor: "divider",
    bgcolor: "background.paper", cursor: "pointer", position: "relative", overflow: "hidden",
    transition: "all 0.22s", "&:hover": { transform: "translateY(-4px)", boxShadow: `0 20px 48px ${accent}22`, borderColor: accent },
  }}>
    <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: accent, borderRadius: "20px 0 0 20px" }} />
    <Box sx={{ width: 42, height: 42, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: `${accent}18` }}>
      <Box sx={{ color: accent, "& svg": { fontSize: 22 } }}>{icon}</Box>
    </Box>
    <Typography sx={{ fontSize: 34, fontWeight: 950, color: "text.primary", lineHeight: 1.1, letterSpacing: "-1.5px", mt: 2, mb: 0.3 }}>
      {value ?? "—"}
    </Typography>
    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary", mb: 0.3 }}>{label}</Typography>
    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{sub}</Typography>
  </Paper>
);

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// Calendar sized for the purple hero banner (light text/cells on translucent glass)
const HeroMiniCalendar = () => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthLabel = viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const firstDayOfWeek = viewDate.getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const isCurrentMonth = viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();
  const cells = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const changeMonth = (delta) =>
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1));

  return (
    <Box sx={{
      width: 260, borderRadius: "18px", p: 2,
      bgcolor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
      backdropFilter: "blur(10px)",
    }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          <EventNoteRounded sx={{ fontSize: 15, color: "#fff" }} />
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "0.1px", color: "#fff" }}>{monthLabel}</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton size="small" onClick={() => changeMonth(-1)}
            sx={{ width: 22, height: 22, color: "#fff", bgcolor: "rgba(255,255,255,0.12)", "&:hover": { bgcolor: "rgba(255,255,255,0.22)" } }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>‹</Typography>
          </IconButton>
          <IconButton size="small" onClick={() => changeMonth(1)}
            sx={{ width: 22, height: 22, color: "#fff", bgcolor: "rgba(255,255,255,0.12)", "&:hover": { bgcolor: "rgba(255,255,255,0.22)" } }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>›</Typography>
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", mb: 0.5 }}>
        {WEEKDAYS.map((d, i) => (
          <Typography key={i} align="center" sx={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{d}</Typography>
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
        {cells.map((day, i) => {
          const isToday = isCurrentMonth && day === today.getDate();
          return (
            <Box key={i} sx={{
              aspectRatio: "1", display: "grid", placeItems: "center", borderRadius: "8px",
              fontSize: 12, fontWeight: isToday ? 700 : 500,
              color: isToday ? "#111827" : day ? "rgba(255,255,255,0.88)" : "transparent",
              bgcolor: isToday ? "#FBBF24" : "transparent",
            }}>
              {day || "-"}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const QuickAction = ({ label, icon, accent, onClick }) => (
  <Paper onClick={onClick} sx={{
    p: 2, borderRadius: "16px", border: "1px solid", borderColor: "divider",
    bgcolor: "background.paper", cursor: "pointer", textAlign: "center",
    transition: "all 0.2s", "&:hover": { borderColor: accent, bgcolor: `${accent}08`, transform: "translateY(-3px)" },
  }}>
    <Box sx={{ width: 44, height: 44, borderRadius: "14px", bgcolor: `${accent}15`, display: "grid", placeItems: "center", mx: "auto", mb: 1.2 }}>
      <Box sx={{ color: accent, "& svg": { fontSize: 22 } }}>{icon}</Box>
    </Box>
    <Typography fontSize={12} fontWeight={700} color="text.primary" sx={{ lineHeight: 1.3 }}>{label}</Typography>
  </Paper>
);

const TicketRow = ({ ticket, onClick }) => {
  const dot = STATUS_DOT[ticket.status] || "#94A3B8";
  const pri = PRIORITY_COLOR[ticket.priority] || "#94A3B8";
  return (
    <Box onClick={onClick} sx={{
      display: "flex", alignItems: "center", gap: 2, px: 2, py: 1.6,
      borderRadius: "14px", cursor: "pointer", transition: "all 0.18s",
      "&:hover": { bgcolor: "action.hover" },
    }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: dot, flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography fontSize={13} fontWeight={700} color="text.primary" noWrap>{ticket.issue}</Typography>
        <Typography fontSize={11} color="text.secondary" noWrap>{ticket.asset} · {ticket.date}</Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        <Box sx={{ px: 1, py: 0.25, borderRadius: "6px", fontSize: 10, fontWeight: 800, bgcolor: `${pri}18`, color: pri }}>
          {ticket.priority}
        </Box>
        <StatusChip label={ticket.status} />
      </Box>
    </Box>
  );
};

/* ─────────────────────── main component ─────────────────────── */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { currentUser: user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [snackbar, setSnackbar]           = useState({ open: false, message: "", severity: "success" });

  /* ── permission helpers ── */
  const isAdminTier = ADMIN_TIER.includes(user?.role);
  const customPerms = user?.customPermissions || [];
  const hasPerm = (feature) => {
    if (isAdminTier) return true;
    return customPerms.some(p => p.feature === feature && p.allowed);
  };

  const canViewAssets  = hasPerm('View All Assets') || hasPerm('Register Assets') || hasPerm('Edit / Delete Assets') || hasPerm('Assign Assets');
  const canRegister    = hasPerm('Register Assets');
  const canApprove     = hasPerm('Approve Device Requests');
  const canViewTickets = hasPerm('Raise Tickets') || hasPerm('Manage All Tickets');
  const canManageUsers = isAdminTier;
  const canViewReports = isAdminTier;

  useEffect(() => {
    api.get("/dashboard/stats")
      .then(r => setDashboardData(r.data))
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  const recentTickets = (dashboardData?.recentTickets || []).map(t => ({
    id: t.ticketId,
    asset: t.asset?.name || "Unknown Asset",
    issue: t.issue,
    status: t.status,
    priority: t.priority,
    date: new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    raisedBy: t.raisedBy?.name || "Employee",
    department: t.asset?.department || "Unassigned",
  }));

  const deptBreakdown = dashboardData?.departmentBreakdown || [];
  const deptTotal     = deptBreakdown.reduce((s, d) => s + d.count, 0) || 1;
  const DEPT_COLORS   = ["#374151", "#4B5563", "#6B7280", "#9CA3AF", "#B0B7C3", "#D1D5DB"];

  const inWarranty   = Math.max(0, (dashboardData?.totalAssets || 0) - (dashboardData?.warrantyExpiringSoon || 0));
  const expiringSoon = dashboardData?.warrantyExpiringSoon || 0;
  const totalAssets  = dashboardData?.totalAssets || 1;
  const healthPct    = Math.round((inWarranty / totalAssets) * 100);

  /* ── filtered KPIs ── */
  const allKpis = [
    { label: "Total Assets",      value: dashboardData?.totalAssets,         sub: "Registered in system",      icon: <Inventory2Rounded />,          accent: "#FBBF24", route: "/admin/assets",    show: canViewAssets },
    { label: "Active Repairs",    value: dashboardData?.activeRepairs,        sub: "Currently under service",    icon: <BuildRounded />,               accent: "#FBBF24", route: "/tickets",         show: canViewAssets },
    { label: "Pending Approvals", value: dashboardData?.pendingTickets,       sub: "Awaiting authorization",     icon: <ApprovalRounded />,            accent: "#FBBF24", route: "/admin/approvals", show: canApprove },
    { label: "Total Tickets",     value: dashboardData?.totalTickets,         sub: "All-time service requests",  icon: <ConfirmationNumberRounded />,   accent: "#FBBF24", route: "/tickets",         show: canViewTickets || isAdminTier },
    { label: "Warranty Expiring", value: dashboardData?.warrantyExpiringSoon, sub: "Within 30 days or overdue",       icon: <ShieldRounded />,               accent: "#FBBF24", route: "/admin/assets",    show: canViewAssets },
    { label: "Device Requests",   value: dashboardData?.pendingRequests,      sub: "Awaiting review",            icon: <DevicesRounded />,              accent: "#FBBF24", route: "/admin/approvals", show: canApprove },
  ].filter(k => k.show);

  /* ── filtered quick actions ── */
  const allQuickActions = [
    { label: "Add Asset",    icon: <AddRounded />,                accent: "#FBBF24", route: "/admin/assets/add",  show: canRegister },
    { label: "Approvals",    icon: <ApprovalRounded />,           accent: "#FBBF24", route: "/admin/approvals",   show: canApprove },
    { label: "Tickets",      icon: <ConfirmationNumberRounded />, accent: "#FBBF24", route: "/tickets",            show: (canViewTickets || isAdminTier) && !canRegister },
    { label: "Reports",      icon: <StorageRounded />,            accent: "#FBBF24", route: "/admin/reports",     show: canViewReports },
    { label: "Users",        icon: <PeopleRounded />,             accent: "#FBBF24", route: "/admin/users",       show: canManageUsers },
    { label: "Departments",  icon: <BusinessRounded />,           accent: "#FBBF24", route: "/admin/departments", show: canManageUsers },
    { label: "Invoices",     icon: <ReceiptLongRounded />,        accent: "#FBBF24", route: "/admin/invoices",    show: isAdminTier },
    { label: "Assets",       icon: <Inventory2Rounded />,         accent: "#FBBF24", route: "/admin/assets",      show: canViewAssets && !canRegister },
  ].filter(a => a.show);

  /* ── banner stat strip ── */
  const bannerStats = [
    canViewAssets              && { label: "Total Assets",   value: dashboardData?.totalAssets ?? 0,          icon: <Inventory2Rounded sx={{ fontSize: 16 }} />,       color: "#C4B5FD", route: "/admin/assets" },
    canViewAssets              && { label: "Active Repairs", value: dashboardData?.activeRepairs ?? 0,         icon: <BuildRounded sx={{ fontSize: 16 }} />,            color: "#FCA5A5", route: "/tickets" },
    canViewAssets              && { label: "Warranty Alert", value: dashboardData?.warrantyExpiringSoon ?? 0,  icon: <ShieldRounded sx={{ fontSize: 16 }} />,           color: "#FCD34D", route: "/admin/assets?filter=warranty" },
    (canViewTickets || isAdminTier) && { label: "Open Tickets", value: dashboardData?.totalTickets ?? 0,      icon: <ConfirmationNumberRounded sx={{ fontSize: 16 }} />, color: "#6EE7B7", route: "/tickets" },
  ].filter(Boolean);

  return (
    <Box sx={{ width: "100%", pb: 6 }}>

      {/* ── Welcome Banner ─────────────────────────────────────── */}
      <Box sx={{
        mb: 4, borderRadius: "24px",
        background: "linear-gradient(135deg,#1F2937 0%,#111827 60%,#0B0D12 100%)",
        position: "relative", overflow: "hidden",
      }}>
        <Box sx={{ position: "absolute", right: -80, top: -80, width: 280, height: 280, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", right: 80, bottom: -100, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", left: "40%", top: -40, width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />

        <Box sx={{ p: { xs: 3, md: "24px 32px 16px" }, position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
              <CalendarTodayRounded sx={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", letterSpacing: "0.3px" }}>
                {fmtDate()}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: 22, md: 30 }, fontWeight: 900, color: "#fff", letterSpacing: "-1px", lineHeight: 1.15, mb: 0.8 }}>
              {greet()}, {user?.name?.split(" ")[0] || "there"}
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.65)", fontWeight: 500, maxWidth: 480, mb: 2.5 }}>
              {isAdminTier
                ? "Here is your asset operations summary for today. Review pending items and stay ahead."
                : "Here's a quick overview of your activity. Raise a ticket or check your requests below."}
            </Typography>

            {/* Action buttons — only what the user is allowed to do */}
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {canRegister && (
                <Button variant="contained" startIcon={<AddRounded />} onClick={() => navigate("/admin/assets/add")}
                  sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 800, fontSize: 13, borderRadius: "12px", px: 2.5, py: 1, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" }, boxShadow: "none", textTransform: "none" }}>
                  Register Asset
                </Button>
              )}
              {canApprove && (
                <Button variant="contained" startIcon={<NotificationsActiveRounded />} onClick={() => navigate("/admin/approvals")}
                  sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 800, fontSize: 13, borderRadius: "12px", px: 2.5, py: 1, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" }, boxShadow: "none", textTransform: "none" }}>
                  Approvals {dashboardData?.pendingTickets > 0 && `(${dashboardData.pendingTickets})`}
                </Button>
              )}
              {!isAdminTier && !canRegister && !canApprove && canViewTickets && (
                <Button variant="contained" startIcon={<ConfirmationNumberRounded />} onClick={() => navigate("/tickets")}
                  sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 800, fontSize: 13, borderRadius: "12px", px: 2.5, py: 1, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" }, boxShadow: "none", textTransform: "none" }}>
                  My Tickets
                </Button>
              )}
            </Box>
          </Box>

          {/* SVG illustration + mini calendar — only on medium screens and up */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1.5, flexShrink: 0 }}>

          <Box sx={{ display: { xs: "none", lg: "block" }, width: 160, height: 140, flexShrink: 0 }}>
            <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
              {/* Ground shadow */}
              <ellipse cx="110" cy="148" rx="85" ry="7" fill="rgba(0,0,0,0.12)"/>

              {/* Soft glow behind monitor */}
              <circle cx="118" cy="70" r="52" fill="rgba(255,255,255,0.06)"/>

              {/* Monitor stand */}
              <rect x="108" y="112" width="10" height="16" rx="2" fill="rgba(255,255,255,0.35)"/>
              <rect x="90" y="126" width="46" height="6" rx="3" fill="rgba(255,255,255,0.35)"/>

              {/* Monitor frame */}
              <rect x="48" y="38" width="140" height="78" rx="10" fill="#1E1B3A" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
              <rect x="58" y="48" width="120" height="58" rx="4" fill="#FFFFFF"/>

              {/* Bar chart on screen */}
              <rect x="68" y="80" width="10" height="18" rx="2" fill="#C4B5FD"/>
              <rect x="84" y="68" width="10" height="30" rx="2" fill="#111827"/>
              <rect x="100" y="74" width="10" height="24" rx="2" fill="#111827"/>
              <rect x="116" y="60" width="10" height="38" rx="2" fill="#111827"/>
              <rect x="132" y="70" width="10" height="28" rx="2" fill="#C4B5FD"/>
              {/* Trend line */}
              <path d="M68 76 L84 62 L100 70 L116 52 L132 64 L148 56" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="148" cy="56" r="3" fill="#9CA3AF"/>

              {/* Notification badge on monitor */}
              <circle cx="176" cy="46" r="7" fill="#FBBF24"/>
              <path d="M173 46l2 2 4-4" stroke="#111827" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>

              {/* Person — sitting, looking at screen */}
              <path d="M18 148L18 132C18 118 30 108 46 108C62 108 74 118 74 132L74 148Z" fill="#111827"/>
              <path d="M18 148L18 132C18 118 30 108 46 108C62 108 74 118 74 132L74 148Z" fill="url(#bodyGrad)" opacity="0.5"/>
              <circle cx="46" cy="90" r="14" fill="#FDBA74"/>
              {/* Hair */}
              <path d="M32 88C32 74 38 66 46 66C54 66 60 72 60 82C60 84 59 86 58 88C56 82 50 84 46 78C42 84 34 84 32 88Z" fill="#292524"/>
              {/* Arm resting toward keyboard */}
              <path d="M60 118C68 116 76 118 80 124" stroke="#FDBA74" strokeWidth="7" strokeLinecap="round"/>

              {/* Keyboard */}
              <rect x="64" y="122" width="34" height="10" rx="3" fill="rgba(255,255,255,0.85)"/>

              {/* Floating dashed accent */}
              <circle cx="30" cy="46" r="10" fill="none" stroke="#FBBF24" strokeWidth="2" strokeDasharray="3 3"/>
              <circle cx="30" cy="46" r="3.5" fill="#FBBF24"/>

              {/* Speech/insight bubble */}
              <path d="M186 78C186 72 190.5 68 196 68H208C213.5 68 218 72 218 78V82C218 87.5 213.5 92 208 92H198L189 99V92C187 90 186 85 186 78Z" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.25)"/>
              <rect x="194" y="75" width="18" height="3" rx="1.5" fill="#6EE7B7"/>
              <rect x="194" y="82" width="12" height="3" rx="1.5" fill="#6EE7B7"/>

              <defs>
                <linearGradient id="bodyGrad" x1="18" y1="108" x2="74" y2="148" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#111827"/>
                  <stop offset="1" stopColor="#111827" stopOpacity="0"/>
                </linearGradient>
              </defs>
            </svg>
          </Box>

            <HeroMiniCalendar />
          </Box>
        </Box>

        {/* Stat strip — only shown when there's something relevant to display */}
        {bannerStats.length > 0 && (
          <Box sx={{
            position: "relative",
            display: "grid", gridTemplateColumns: `repeat(${bannerStats.length}, 1fr)`,
            borderTop: "1px solid rgba(255,255,255,0.12)",
          }}>
            {bannerStats.map((s, i) => (
              <Box key={s.label} onClick={() => s.route && navigate(s.route)} sx={{
                px: { xs: 2, md: 3 }, py: 2,
                borderRight: i < bannerStats.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none",
                display: "flex", alignItems: "center", gap: 1.5,
                cursor: s.route ? "pointer" : "default",
                transition: "background-color 0.15s",
                "&:hover": s.route ? { bgcolor: "rgba(255,255,255,0.06)" } : {},
              }}>
                <Box sx={{ width: 34, height: 34, borderRadius: "9px", flexShrink: 0, bgcolor: "rgba(255,255,255,0.1)", display: "grid", placeItems: "center", color: s.color }}>
                  {s.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.value}</Typography>
                  <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, mt: 0.3, whiteSpace: "nowrap" }}>{s.label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px", fontWeight: 600 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh", gap: 2 }}>
          <CircularProgress size={44} sx={{ color: "text.primary" }} />
          <Typography color="text.secondary" fontWeight={600}>Loading dashboard…</Typography>
        </Box>
      ) : (
        <>
          {/* ── KPI Cards ───────────────────────────────────────── */}
          {allKpis.length > 0 && (
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
              {allKpis.map((k, i) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                  <KpiCard {...k} onClick={() => navigate(k.route)} />
                </Grid>
              ))}
            </Grid>
          )}

          {/* ── Middle row: Tickets + Right sidebar ─────────────── */}
          <Grid container spacing={3} sx={{ mb: 3 }} alignItems="flex-start">

            {/* Recent Tickets */}
            <Grid size={{ xs: 12, lg: canViewAssets ? 8 : 12 }}>
              <Paper sx={{ borderRadius: "24px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", overflow: "hidden" }}>
                <Box sx={{ px: 3, py: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
                  <Box>
                    <Typography fontWeight={900} fontSize={18} letterSpacing="-0.4px">Recent Tickets</Typography>
                    <Typography fontSize={12} color="text.secondary" fontWeight={500} mt={0.2}>Click a row to view full details</Typography>
                  </Box>
                  <Button size="small" endIcon={<ConfirmationNumberRounded />} onClick={() => navigate("/tickets")}
                    sx={{ fontWeight: 700, color: "text.primary", fontSize: 13, "&:hover": { bgcolor: "rgba(17,24,39,0.08)" } }}>
                    View All
                  </Button>
                </Box>

                <Box sx={{ px: 3, py: 1.5, display: "flex", gap: 2.5, flexWrap: "wrap", borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.default" }}>
                  {Object.entries(STATUS_DOT).map(([s, c]) => (
                    <Box key={s} sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: c }} />
                      <Typography fontSize={11} fontWeight={600} color="text.secondary">{s}</Typography>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ p: 1.5 }}>
                  {recentTickets.length === 0 ? (
                    <Box sx={{ py: 3, textAlign: "center" }}>
                      <TaskAltRounded sx={{ fontSize: 32, color: "text.disabled", mb: 0.5 }} />
                      <Typography color="text.disabled" fontWeight={600} fontSize={13}>No recent tickets</Typography>
                    </Box>
                  ) : recentTickets.map(t => (
                    <TicketRow key={t.id} ticket={t} onClick={() => setSelectedTicket(t)} />
                  ))}
                </Box>
              </Paper>
            </Grid>

            {/* Right sidebar — asset health & dept breakdown, only for users who can view assets */}
            {canViewAssets && (
              <Grid size={{ xs: 12, lg: 4 }}>
                <Stack spacing={3}>
                  <Paper sx={{ p: 3, borderRadius: "24px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
                      <ShieldRounded sx={{ color: "text.primary", fontSize: 20 }} />
                      <Typography fontWeight={900} fontSize={16}>Asset Health</Typography>
                    </Box>

                    <Box sx={{ textAlign: "center", mb: 2.5 }}>
                      <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 100, height: 100 }}>
                        <CircularProgress variant="determinate" value={healthPct} size={100} thickness={5}
                          sx={{ color: healthPct > 70 ? "#4B5563" : healthPct > 40 ? "#9CA3AF" : "#D1D5DB", position: "absolute" }} />
                        <CircularProgress variant="determinate" value={100} size={100} thickness={5}
                          sx={{ color: "action.selected", position: "absolute" }} />
                        <Box sx={{ position: "relative", textAlign: "center" }}>
                          <Typography fontSize={22} fontWeight={950} color="text.primary" sx={{ lineHeight: 1 }}>{healthPct}%</Typography>
                          <Typography fontSize={10} color="text.secondary" fontWeight={700}>healthy</Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Stack spacing={1.5}>
                      {[
                        { label: "In Warranty",    value: inWarranty,   color: "#4B5563" },
                        { label: "Expiring Soon",  value: expiringSoon, color: "#9CA3AF" },
                        { label: "Active Repairs", value: dashboardData?.activeRepairs || 0, color: "#D1D5DB" },
                      ].map(({ label, value, color }) => (
                        <Box key={label}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
                              <Typography fontSize={12} fontWeight={600} color="text.secondary">{label}</Typography>
                            </Box>
                            <Typography fontSize={12} fontWeight={800} color="text.primary">{value}</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={totalAssets > 0 ? Math.round((value / totalAssets) * 100) : 0}
                            sx={{ height: 5, borderRadius: 3, bgcolor: "action.selected", "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }} />
                        </Box>
                      ))}
                    </Stack>
                  </Paper>

                  {deptBreakdown.length > 0 && (
                    <Paper sx={{ p: 3, borderRadius: "24px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                        <Typography fontWeight={900} fontSize={16}>Assets by Dept.</Typography>
                        <Chip label={`${deptTotal} total`} size="small" sx={{ fontWeight: 800, fontSize: 11, bgcolor: "rgba(17,24,39,0.1)", color: "text.primary" }} />
                      </Box>
                      <Stack spacing={1.8}>
                        {deptBreakdown.slice(0, 6).map((d, i) => {
                          const pct   = Math.round((d.count / deptTotal) * 100);
                          const color = DEPT_COLORS[i % DEPT_COLORS.length];
                          return (
                            <Box key={d._id || "Unknown"}>
                              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.6 }}>
                                <Typography fontSize={12} fontWeight={700} color="text.primary" noWrap sx={{ maxWidth: "70%" }}>{d._id || "Unassigned"}</Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                  <Typography fontSize={11} color="text.secondary">{pct}%</Typography>
                                  <Typography fontSize={12} fontWeight={800} color={color}>{d.count}</Typography>
                                </Box>
                              </Box>
                              <LinearProgress variant="determinate" value={pct}
                                sx={{ height: 6, borderRadius: 3, bgcolor: "action.selected", "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }} />
                            </Box>
                          );
                        })}
                      </Stack>
                    </Paper>
                  )}
                </Stack>
              </Grid>
            )}
          </Grid>

          {/* ── Warranty Overview + Quick Actions ──────────────── */}
          {(canViewAssets || allQuickActions.length > 0) && (
            <Grid container spacing={3} sx={{ alignItems: "flex-start" }}>

              {canViewAssets && (
                <Grid size={{ xs: 12, lg: allQuickActions.length > 0 ? 8 : 12 }}>
                  <Paper sx={{ p: 3, borderRadius: "24px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                      <Box>
                        <Typography fontWeight={900} fontSize={18} letterSpacing="-0.4px">Warranty Overview</Typography>
                        <Typography fontSize={12} color="text.secondary" mt={0.2}>Fleet warranty health across all registered assets</Typography>
                      </Box>
                      <Button size="small" endIcon={<ArrowForwardRounded />} onClick={() => navigate("/admin/assets")}
                        sx={{ fontWeight: 700, color: "text.primary", "&:hover": { bgcolor: "rgba(17,24,39,0.08)" } }}>
                        View Assets
                      </Button>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: "flex", gap: 0.5, height: 12, borderRadius: 6, overflow: "hidden", bgcolor: "action.selected" }}>
                        {[
                          { pct: Math.round((inWarranty / totalAssets) * 100),   color: "#4B5563" },
                          { pct: Math.round((expiringSoon / totalAssets) * 100), color: "#9CA3AF" },
                          { pct: 100 - Math.round((inWarranty / totalAssets) * 100) - Math.round((expiringSoon / totalAssets) * 100), color: "#D1D5DB" },
                        ].filter(s => s.pct > 0).map((s, i) => (
                          <Box key={i} sx={{ width: `${s.pct}%`, bgcolor: s.color, borderRadius: 6 }} />
                        ))}
                      </Box>
                      <Box sx={{ display: "flex", gap: 2.5, mt: 1.5 }}>
                        {[{ label: "In Warranty", color: "#4B5563" }, { label: "Expiring Soon", color: "#9CA3AF" }, { label: "Expired / Unknown", color: "#D1D5DB" }].map(({ label, color }) => (
                          <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
                            <Typography fontSize={11} fontWeight={600} color="text.secondary">{label}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      {[
                        { label: "In Warranty",         value: inWarranty,   color: "#4B5563", bg: "rgba(75,85,99,0.1)",   desc: "Assets under active warranty", icon: <CheckCircleRounded /> },
                        { label: "Expiring in 30 days", value: expiringSoon, color: "#9CA3AF", bg: "rgba(156,163,175,0.1)",  desc: "Renew before they lapse",       icon: <AccessTimeRounded /> },
                        { label: "Active Repairs",       value: dashboardData?.activeRepairs || 0, color: "#D1D5DB", bg: "rgba(209,213,219,0.1)", desc: "Currently under service", icon: <BuildRounded /> },
                      ].map(({ label, value, color, bg, desc, icon }) => (
                        <Grid size={{ xs: 12, sm: 4 }} key={label}>
                          <Box onClick={() => navigate("/admin/assets")} sx={{ p: 2.5, borderRadius: "18px", bgcolor: bg, border: "1px solid", borderColor: `${color}33`, cursor: "pointer", transition: "all 0.2s", "&:hover": { transform: "translateY(-3px)", boxShadow: `0 12px 28px ${color}22` } }}>
                            <Box sx={{ color, mb: 1, "& svg": { fontSize: 20 } }}>{icon}</Box>
                            <Typography fontSize={28} fontWeight={950} color="text.primary" sx={{ lineHeight: 1, letterSpacing: "-1px" }}>{value}</Typography>
                            <Typography fontSize={12} fontWeight={800} color={color} mt={0.5}>{label}</Typography>
                            <Typography fontSize={11} color="text.secondary" mt={0.3}>{desc}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {allQuickActions.length > 0 && (
                <Grid size={{ xs: 12, lg: canViewAssets ? 4 : 12 }}>
                  <Paper sx={{ p: 3, borderRadius: "24px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", height: "100%" }}>
                    <Typography fontWeight={900} fontSize={18} letterSpacing="-0.4px" mb={0.3}>Quick Actions</Typography>
                    <Typography fontSize={12} color="text.secondary" mb={2.5}>Jump to any section instantly</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                      {allQuickActions.map(a => <QuickAction key={a.label} {...a} onClick={() => navigate(a.route)} />)}
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </>
      )}

      {/* ── Ticket Detail Dialog ─────────────────────────────── */}
      <Dialog open={!!selectedTicket} onClose={() => setSelectedTicket(null)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "24px", border: "1px solid", borderColor: "divider" } }}>
        {selectedTicket && (
          <>
            <Box sx={{ p: 3, background: "linear-gradient(135deg,rgba(17,24,39,0.1),rgba(17,24,39,0.05))", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "#111827", display: "grid", placeItems: "center" }}>
                  <ConfirmationNumberRounded sx={{ color: "#fff", fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography fontWeight={900} fontSize={18}>{selectedTicket.issue}</Typography>
                  <Typography fontSize={12} color="text.secondary">{selectedTicket.id} · {selectedTicket.asset}</Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setSelectedTicket(null)} sx={{ bgcolor: "action.hover", borderRadius: "10px" }}><CloseRounded /></IconButton>
            </Box>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 3 }}>
                {[
                  { label: "Status",     value: selectedTicket.status },
                  { label: "Priority",   value: selectedTicket.priority },
                  { label: "Department", value: selectedTicket.department },
                  { label: "Raised By",  value: selectedTicket.raisedBy },
                  { label: "Date",       value: selectedTicket.date },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ p: 1.5, borderRadius: "12px", bgcolor: "background.default", border: "1px solid", borderColor: "divider" }}>
                    <Typography fontSize={10} fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing="0.6px" mb={0.3}>{label}</Typography>
                    <Typography fontSize={13} fontWeight={800} color="text.primary">{value}</Typography>
                  </Box>
                ))}
              </Box>
              <Button fullWidth variant="contained" onClick={() => { setSelectedTicket(null); navigate("/tickets"); }}
                sx={{ background: "#FBBF24", color: "#111827", fontWeight: 800, borderRadius: "12px", py: 1.3, boxShadow: "none" }}>
                Open Full Ticket →
              </Button>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: "14px", fontWeight: 800 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;
