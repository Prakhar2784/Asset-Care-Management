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
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import StatusChip from "../../components/StatusChip";
import api from "../../api/axios";

/* ─────────────────────── helpers ─────────────────────── */
const ADMIN_TIER = ['admin', 'super_admin', 'hod', 'manager', 'it_support'];

const PRIORITY_COLOR = { Critical: "#EF4444", High: "#F97316", Medium: "#F59E0B", Low: "#22C55E" };
const STATUS_DOT = {
  "Pending Approval": "#F59E0B",
  "Under Repair":     "#8B5CF6",
  Resolved:           "#22C55E",
  Rejected:           "#EF4444",
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

const QuickAction = ({ label, icon, accent, onClick }) => (
  <Paper onClick={onClick} sx={{
    p: 2, borderRadius: "16px", border: "1px solid", borderColor: "divider",
    bgcolor: "background.paper", cursor: "pointer", textAlign: "center",
    transition: "all 0.2s", "&:hover": { borderColor: accent, bgcolor: `${accent}08`, transform: "translateY(-3px)" },
  }}>
    <Box sx={{ width: 44, height: 44, borderRadius: "14px", bgcolor: `${accent}15`, display: "grid", placeItems: "center", mx: "auto", mb: 1.2 }}>
      <Box sx={{ color: accent, "& svg": { fontSize: 22 } }}>{icon}</Box>
    </Box>
    <Typography fontSize={12} fontWeight={700} color="text.primary" lineHeight={1.3}>{label}</Typography>
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
  const DEPT_COLORS   = ["#A855F7", "#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6"];

  const inWarranty   = Math.max(0, (dashboardData?.totalAssets || 0) - (dashboardData?.warrantyExpiringSoon || 0));
  const expiringSoon = dashboardData?.warrantyExpiringSoon || 0;
  const totalAssets  = dashboardData?.totalAssets || 1;
  const healthPct    = Math.round((inWarranty / totalAssets) * 100);

  /* ── filtered KPIs ── */
  const allKpis = [
    { label: "Total Assets",      value: dashboardData?.totalAssets,         sub: "Registered in system",      icon: <Inventory2Rounded />,          accent: "#A855F7", route: "/admin/assets",    show: canViewAssets },
    { label: "Active Repairs",    value: dashboardData?.activeRepairs,        sub: "Currently under service",    icon: <BuildRounded />,               accent: "#EF4444", route: "/tickets",         show: canViewAssets },
    { label: "Pending Approvals", value: dashboardData?.pendingTickets,       sub: "Awaiting authorization",     icon: <ApprovalRounded />,            accent: "#F59E0B", route: "/admin/approvals", show: canApprove },
    { label: "Total Tickets",     value: dashboardData?.totalTickets,         sub: "All-time service requests",  icon: <ConfirmationNumberRounded />,   accent: "#3B82F6", route: "/tickets",         show: canViewTickets || isAdminTier },
    { label: "Warranty Expiring", value: dashboardData?.warrantyExpiringSoon, sub: "Within next 30 days",       icon: <ShieldRounded />,               accent: "#EA580C", route: "/admin/assets",    show: canViewAssets },
    { label: "Device Requests",   value: dashboardData?.pendingRequests,      sub: "Awaiting review",            icon: <DevicesRounded />,              accent: "#8B5CF6", route: "/admin/approvals", show: canApprove },
  ].filter(k => k.show);

  /* ── filtered quick actions ── */
  const allQuickActions = [
    { label: "Add Asset",    icon: <AddRounded />,                accent: "#A855F7", route: "/admin/assets/add",  show: canRegister },
    { label: "Approvals",    icon: <ApprovalRounded />,           accent: "#F59E0B", route: "/admin/approvals",   show: canApprove },
    { label: "Tickets",      icon: <ConfirmationNumberRounded />, accent: "#22C55E", route: "/tickets",            show: (canViewTickets || isAdminTier) && !canRegister },
    { label: "Reports",      icon: <StorageRounded />,            accent: "#8B5CF6", route: "/admin/reports",     show: canViewReports },
    { label: "Users",        icon: <PeopleRounded />,             accent: "#06B6D4", route: "/admin/users",       show: canManageUsers },
    { label: "Departments",  icon: <BusinessRounded />,           accent: "#EC4899", route: "/admin/departments", show: canManageUsers },
    { label: "Invoices",     icon: <ReceiptLongRounded />,        accent: "#EA580C", route: "/admin/invoices",    show: isAdminTier },
    { label: "Assets",       icon: <Inventory2Rounded />,         accent: "#A855F7", route: "/admin/assets",      show: canViewAssets && !canRegister },
  ].filter(a => a.show);

  /* ── banner stat strip ── */
  const bannerStats = [
    canViewAssets              && { label: "Total Assets",   value: dashboardData?.totalAssets ?? 0,          icon: <Inventory2Rounded sx={{ fontSize: 16 }} />,       color: "#C4B5FD" },
    canViewAssets              && { label: "Active Repairs", value: dashboardData?.activeRepairs ?? 0,         icon: <BuildRounded sx={{ fontSize: 16 }} />,            color: "#FCA5A5" },
    canViewAssets              && { label: "Warranty Alert", value: dashboardData?.warrantyExpiringSoon ?? 0,  icon: <ShieldRounded sx={{ fontSize: 16 }} />,           color: "#FCD34D" },
    (canViewTickets || isAdminTier) && { label: "Open Tickets", value: dashboardData?.totalTickets ?? 0,      icon: <ConfirmationNumberRounded sx={{ fontSize: 16 }} />, color: "#6EE7B7" },
  ].filter(Boolean);

  return (
    <Box sx={{ width: "100%", pb: 6 }}>

      {/* ── Welcome Banner ─────────────────────────────────────── */}
      <Box sx={{
        mb: 4, borderRadius: "24px",
        background: "linear-gradient(135deg,#4C1D95 0%,#7C3AED 45%,#A855F7 100%)",
        position: "relative", overflow: "hidden",
      }}>
        <Box sx={{ position: "absolute", right: -80, top: -80, width: 280, height: 280, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", right: 80, bottom: -100, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", left: "40%", top: -40, width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />

        <Box sx={{ p: { xs: 3, md: "28px 32px 20px" }, position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
              <CalendarTodayRounded sx={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", letterSpacing: "0.3px" }}>
                {fmtDate()}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: 22, md: 30 }, fontWeight: 900, color: "#fff", letterSpacing: "-1px", lineHeight: 1.15, mb: 0.8 }}>
              {greet()}, {user?.name?.split(" ")[0] || "there"}
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.65)", fontWeight: 500, maxWidth: 480 }}>
              {isAdminTier
                ? "Here is your asset operations summary for today. Review pending items and stay ahead."
                : "Here's a quick overview of your activity. Raise a ticket or check your requests below."}
            </Typography>
          </Box>

          {/* Action buttons — only what the user is allowed to do */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignSelf: "center" }}>
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

        {/* Stat strip — only shown when there's something relevant to display */}
        {bannerStats.length > 0 && (
          <Box sx={{
            position: "relative",
            display: "grid", gridTemplateColumns: `repeat(${bannerStats.length}, 1fr)`,
            borderTop: "1px solid rgba(255,255,255,0.12)",
          }}>
            {bannerStats.map((s, i) => (
              <Box key={s.label} sx={{
                px: { xs: 2, md: 3 }, py: 2,
                borderRight: i < bannerStats.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none",
                display: "flex", alignItems: "center", gap: 1.5,
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
          <CircularProgress size={44} sx={{ color: "#A855F7" }} />
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
                    sx={{ fontWeight: 700, color: "#A855F7", fontSize: 13, "&:hover": { bgcolor: "rgba(168,85,247,0.08)" } }}>
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
                      <ShieldRounded sx={{ color: "#A855F7", fontSize: 20 }} />
                      <Typography fontWeight={900} fontSize={16}>Asset Health</Typography>
                    </Box>

                    <Box sx={{ textAlign: "center", mb: 2.5 }}>
                      <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 100, height: 100 }}>
                        <CircularProgress variant="determinate" value={healthPct} size={100} thickness={5}
                          sx={{ color: healthPct > 70 ? "#22C55E" : healthPct > 40 ? "#F59E0B" : "#EF4444", position: "absolute" }} />
                        <CircularProgress variant="determinate" value={100} size={100} thickness={5}
                          sx={{ color: "action.selected", position: "absolute" }} />
                        <Box sx={{ position: "relative", textAlign: "center" }}>
                          <Typography fontSize={22} fontWeight={950} color="text.primary" lineHeight={1}>{healthPct}%</Typography>
                          <Typography fontSize={10} color="text.secondary" fontWeight={700}>healthy</Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Stack spacing={1.5}>
                      {[
                        { label: "In Warranty",    value: inWarranty,   color: "#22C55E" },
                        { label: "Expiring Soon",  value: expiringSoon, color: "#F59E0B" },
                        { label: "Active Repairs", value: dashboardData?.activeRepairs || 0, color: "#EF4444" },
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
                        <Chip label={`${deptTotal} total`} size="small" sx={{ fontWeight: 800, fontSize: 11, bgcolor: "rgba(168,85,247,0.1)", color: "#A855F7" }} />
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
            <Grid container spacing={3} alignItems="flex-start">

              {canViewAssets && (
                <Grid size={{ xs: 12, lg: allQuickActions.length > 0 ? 8 : 12 }}>
                  <Paper sx={{ p: 3, borderRadius: "24px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                      <Box>
                        <Typography fontWeight={900} fontSize={18} letterSpacing="-0.4px">Warranty Overview</Typography>
                        <Typography fontSize={12} color="text.secondary" mt={0.2}>Fleet warranty health across all registered assets</Typography>
                      </Box>
                      <Button size="small" endIcon={<ArrowForwardRounded />} onClick={() => navigate("/admin/assets")}
                        sx={{ fontWeight: 700, color: "#A855F7", "&:hover": { bgcolor: "rgba(168,85,247,0.08)" } }}>
                        View Assets
                      </Button>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: "flex", gap: 0.5, height: 12, borderRadius: 6, overflow: "hidden", bgcolor: "action.selected" }}>
                        {[
                          { pct: Math.round((inWarranty / totalAssets) * 100),   color: "#22C55E" },
                          { pct: Math.round((expiringSoon / totalAssets) * 100), color: "#F59E0B" },
                          { pct: 100 - Math.round((inWarranty / totalAssets) * 100) - Math.round((expiringSoon / totalAssets) * 100), color: "#EF4444" },
                        ].filter(s => s.pct > 0).map((s, i) => (
                          <Box key={i} sx={{ width: `${s.pct}%`, bgcolor: s.color, borderRadius: 6 }} />
                        ))}
                      </Box>
                      <Box sx={{ display: "flex", gap: 2.5, mt: 1.5 }}>
                        {[{ label: "In Warranty", color: "#22C55E" }, { label: "Expiring Soon", color: "#F59E0B" }, { label: "Expired / Unknown", color: "#EF4444" }].map(({ label, color }) => (
                          <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
                            <Typography fontSize={11} fontWeight={600} color="text.secondary">{label}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      {[
                        { label: "In Warranty",         value: inWarranty,   color: "#22C55E", bg: "rgba(34,197,94,0.08)",   desc: "Assets under active warranty", icon: <CheckCircleRounded /> },
                        { label: "Expiring in 30 days", value: expiringSoon, color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  desc: "Renew before they lapse",       icon: <AccessTimeRounded /> },
                        { label: "Active Repairs",       value: dashboardData?.activeRepairs || 0, color: "#EF4444", bg: "rgba(239,68,68,0.08)", desc: "Currently under service", icon: <BuildRounded /> },
                      ].map(({ label, value, color, bg, desc, icon }) => (
                        <Grid size={{ xs: 12, sm: 4 }} key={label}>
                          <Box onClick={() => navigate("/admin/assets")} sx={{ p: 2.5, borderRadius: "18px", bgcolor: bg, border: "1px solid", borderColor: `${color}33`, cursor: "pointer", transition: "all 0.2s", "&:hover": { transform: "translateY(-3px)", boxShadow: `0 12px 28px ${color}22` } }}>
                            <Box sx={{ color, mb: 1, "& svg": { fontSize: 20 } }}>{icon}</Box>
                            <Typography fontSize={28} fontWeight={950} color="text.primary" lineHeight={1} letterSpacing="-1px">{value}</Typography>
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
            <Box sx={{ p: 3, background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(168,85,247,0.05))", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "linear-gradient(135deg,#7C3AED,#A855F7)", display: "grid", placeItems: "center" }}>
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
                sx={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff", fontWeight: 800, borderRadius: "12px", py: 1.3, boxShadow: "none" }}>
                Open Full Ticket →
              </Button>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: "14px", fontWeight: 800 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;
