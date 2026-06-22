import React, { useState, useEffect } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Snackbar,
  Typography,
  CircularProgress
} from "@mui/material";
import {
  Inventory2Rounded,
  ConfirmationNumberRounded,
  ApprovalRounded,
  ArrowForwardRounded,
  CloseRounded,
  WarningAmberRounded,
  TaskAltRounded,
  BusinessRounded,
  AddRounded,
  TimelineRounded,
  BuildRounded,
  DevicesRounded
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import StatusChip from "../../components/StatusChip";
import api from "../../api/axios";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setDashboardData(response.data);
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
        setError("Failed to sync live data. Please verify your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  const [alerts, setAlerts] = useState([
    {
      id: "ALR-001",
      title: "System Notification",
      type: "warning",
      message: "Regular system maintenance is scheduled for this weekend. Some services may be delayed.",
      actionText: "Acknowledge",
      route: "/admin/dashboard",
    }
  ]);

  const handleTicketOpen = (ticket) => { setSelectedTicket(ticket); setTicketDialogOpen(true); };
  const handleAlertOpen = (alert) => { setSelectedAlert(alert); setAlertDialogOpen(true); };
  const handleDismissAlert = (alertId) => {
    setAlerts((prev) => prev.filter((item) => item.id !== alertId));
    setSnackbar({ open: true, message: "Alert dismissed successfully.", severity: "success" });
  };
  const handleAlertAction = () => {
    if (selectedAlert?.route) navigate(selectedAlert.route);
    setAlertDialogOpen(false);
  };

  const quickLinks = [
    { label: "Review Approvals", icon: <ApprovalRounded />, route: "/admin/approvals" },
    { label: "Vendor Directory", icon: <BusinessRounded />, route: "/admin/vendors" },
    { label: "Add New Asset", icon: <AddRounded />, route: "/admin/assets/add" },
    { label: "Ticket Timeline", icon: <TimelineRounded />, route: "/tickets" },
  ];

  const stats = [
    { title: "Total Assets", value: dashboardData?.totalAssets ?? "—", subtitle: "Registered in system", icon: <Inventory2Rounded sx={{ fontSize: 40 }} />, color: "#1E3A8A", route: "/admin/assets" },
    { title: "Total Tickets", value: dashboardData?.totalTickets ?? "—", subtitle: "All-time service requests", icon: <ConfirmationNumberRounded sx={{ fontSize: 40 }} />, color: "#0F766E", route: "/tickets" },
    { title: "Active Repairs", value: dashboardData?.activeRepairs ?? "—", subtitle: "Currently with vendors", icon: <BuildRounded sx={{ fontSize: 40 }} />, color: "#DC2626", route: "/tickets" },
    { title: "Pending Approvals", value: dashboardData?.pendingTickets ?? "—", subtitle: "Requires HOD authorization", icon: <ApprovalRounded sx={{ fontSize: 40 }} />, color: "#D97706", route: "/admin/approvals" },
    { title: "Warranty Expiring", value: dashboardData?.warrantyExpiringSoon ?? "—", subtitle: "Within next 30 days", icon: <WarningAmberRounded sx={{ fontSize: 40 }} />, color: "#EA580C", route: "/admin/assets" },
    { title: "Device Requests", value: dashboardData?.pendingRequests ?? "—", subtitle: "Awaiting admin review", icon: <DevicesRounded sx={{ fontSize: 40 }} />, color: "#7C3AED", route: "/admin/approvals" },
  ];

  const recentTickets = dashboardData?.recentTickets?.map(ticket => ({
    id: ticket.ticketId,
    asset: ticket.asset?.name || "Unknown Asset",
    issue: ticket.issue,
    status: ticket.status,
    priority: ticket.priority,
    date: new Date(ticket.createdAt).toLocaleDateString(),
    raisedBy: ticket.raisedBy?.name || "Employee",
    department: ticket.asset?.department || "Unassigned",
    timeline: [
      `Ticket Created: ${new Date(ticket.createdAt).toLocaleDateString()}`,
      `Current Status: ${ticket.status}`
    ]
  })) || [];

  const deptBreakdown = dashboardData?.departmentBreakdown || [];
  const deptTotal = deptBreakdown.reduce((sum, d) => sum + d.count, 0) || 1;

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="System Overview"
        subtitle="Real-time overview for asset service, warranty tracking, tickets and pending operational workflows."
        action={
          <Button
            variant="contained" startIcon={<AddRounded />} onClick={() => navigate("/admin/assets/add")}
            sx={{ background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", fontWeight: 900, textTransform: "none", fontSize: "15px", px: 3, py: 1.2, borderRadius: "14px", boxShadow: "0 14px 28px rgba(15,118,110,0.26)", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 20px 36px rgba(15,118,110,0.36)", background: "linear-gradient(135deg, #1D4ED8, #0D9488)" } }}
          >
            Provision New Asset
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: "12px", fontWeight: 600 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress sx={{ color: "#0F766E" }} />
        </Box>
      ) : (
        <>
          {/* 6 Stat Cards in 2 rows of 3 */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} lg={4} key={index}>
                <Box onClick={() => navigate(stat.route)} sx={{ cursor: "pointer", height: "100%", transition: "0.3s ease", "&:hover": { transform: "translateY(-5px)" } }}>
                  <StatCard title={stat.title} value={stat.value} subtitle={stat.subtitle} icon={stat.icon} color={stat.color} />
                </Box>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            {/* Active Service Tickets */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: "28px", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 16px 40px rgba(15,23,42,0.06)" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2, mb: 3, flexDirection: { xs: "column", sm: "row" } }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: "22px", letterSpacing: "-0.7px" }}>Active Service Tickets</Typography>
                    <Typography sx={{ color: "#64748B", fontSize: "14px", fontWeight: 600, mt: 0.5 }}>Click any ticket to view service details and timeline.</Typography>
                  </Box>
                  <Button endIcon={<ArrowForwardRounded />} onClick={() => navigate("/tickets")} sx={{ color: "#1E3A8A", fontWeight: 900, textTransform: "none", borderRadius: "12px", "&:hover": { bgcolor: "rgba(15,118,110,0.08)", color: "#0F766E" } }}>
                    View All
                  </Button>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {recentTickets.length === 0 ? (
                    <Box p={4} textAlign="center" sx={{ border: "1px dashed #CBD5E1", borderRadius: "20px", bgcolor: "#F8FAFC" }}>
                      <Typography color="#64748b" fontWeight={600}>No recent tickets found.</Typography>
                    </Box>
                  ) : (
                    recentTickets.map((ticket) => (
                      <Box
                        key={ticket.id} onClick={() => handleTicketOpen(ticket)}
                        sx={{ p: { xs: 2, md: 2.5 }, borderRadius: "20px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, transition: "all 0.3s ease", cursor: "pointer", "&:hover": { borderColor: "rgba(15,118,110,0.35)", bgcolor: "#FFFFFF", transform: "translateY(-3px)", boxShadow: "0 14px 30px rgba(15,23,42,0.08)" } }}
                      >
                        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                          <Avatar sx={{ background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", fontWeight: 900, width: 52, height: 52, boxShadow: "0 12px 24px rgba(15,118,110,0.20)" }}>
                            {ticket.asset.charAt(0)}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.3, mb: 0.7, flexWrap: "wrap" }}>
                              <Typography sx={{ fontFamily: "monospace", fontSize: "13px", color: "#1E3A8A", fontWeight: 900 }}>{ticket.id}</Typography>
                              <StatusChip label={ticket.priority} />
                            </Box>
                            <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: "16px", lineHeight: 1.4 }}>{ticket.issue}</Typography>
                            <Typography sx={{ fontSize: "13px", color: "#64748B", mt: 0.5, fontWeight: 600 }}>{ticket.asset} • Logged: {ticket.date}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ alignSelf: { xs: "flex-start", md: "center" } }}>
                          <StatusChip label={ticket.status} />
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Right Column: Alerts + Quick Links + Dept Breakdown */}
            <Grid item xs={12} lg={4}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* System Alerts + Quick Links */}
                <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: "28px", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 16px 40px rgba(15,23,42,0.06)" }}>
                  <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: "22px", mb: 2.5, letterSpacing: "-0.7px" }}>System Alerts</Typography>

                  {alerts.length === 0 ? (
                    <Paper sx={{ p: 3, borderRadius: "20px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", textAlign: "center", mb: 3 }}>
                      <TaskAltRounded sx={{ color: "#0F766E", fontSize: 38, mb: 1 }} />
                      <Typography sx={{ color: "#0F172A", fontWeight: 900 }}>No Active Alerts</Typography>
                      <Typography sx={{ color: "#64748B", fontSize: "14px", mt: 0.5 }}>Everything looks good right now.</Typography>
                    </Paper>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
                      {alerts.map((item) => <AlertBox key={item.id} alert={item} onOpen={() => handleAlertOpen(item)} onDismiss={() => handleDismissAlert(item.id)} />)}
                    </Box>
                  )}

                  <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: "20px", mb: 2 }}>Quick Links</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {quickLinks.map((link) => (
                      <Button key={link.label} variant="outlined" fullWidth startIcon={link.icon} endIcon={<ArrowForwardRounded />} onClick={() => navigate(link.route)}
                        sx={{ borderColor: "#E2E8F0", color: "#0F172A", justifyContent: "space-between", textTransform: "none", py: 1.4, px: 2, borderRadius: "14px", fontWeight: 800, "& .MuiButton-startIcon": { color: "#0F766E" }, "&:hover": { bgcolor: "rgba(15,118,110,0.08)", borderColor: "rgba(15,118,110,0.35)", color: "#0F766E" } }}>
                        <Box sx={{ flex: 1, textAlign: "left" }}>{link.label}</Box>
                      </Button>
                    ))}
                  </Box>
                </Paper>

                {/* Department Breakdown */}
                {deptBreakdown.length > 0 && (
                  <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: "28px", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 16px 40px rgba(15,23,42,0.06)" }}>
                    <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: "20px", mb: 2.5, letterSpacing: "-0.5px" }}>Assets by Department</Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {deptBreakdown.map((dept) => (
                        <Box key={dept._id || "Unknown"}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography fontSize={13} fontWeight={700} color="#0F172A">{dept._id || "Unassigned"}</Typography>
                            <Typography fontSize={13} fontWeight={800} color="#0F766E">{dept.count}</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.round((dept.count / deptTotal) * 100)}
                            sx={{ height: 8, borderRadius: 4, bgcolor: "#F1F5F9", "& .MuiLinearProgress-bar": { bgcolor: "#0F766E", borderRadius: 4 } }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                )}
              </Box>
            </Grid>
          </Grid>
        </>
      )}

      {/* Ticket Detail Dialog */}
      <Dialog open={ticketDialogOpen} onClose={() => setTicketDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "28px", overflow: "hidden", border: "1px solid #E2E8F0" } }}>
        {selectedTicket && (
          <>
            <DialogTitle sx={{ p: 0, background: "radial-gradient(circle at top right, rgba(15,118,110,0.14), transparent 35%), linear-gradient(135deg, #F8FAFC, #FFFFFF)" }}>
              <DialogHeader icon={<ConfirmationNumberRounded />} title="Ticket Details" subtitle={`${selectedTicket.id} • ${selectedTicket.asset}`} onClose={() => setTicketDialogOpen(false)} />
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 3 }}>
              <Paper sx={{ p: 2.5, borderRadius: "20px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", mb: 3 }}>
                <DetailLine label="Issue" value={selectedTicket.issue} />
                <DetailLine label="Department" value={selectedTicket.department} />
                <DetailLine label="Raised By" value={selectedTicket.raisedBy} />
                <DetailLine label="Date" value={selectedTicket.date} />
                <DetailLine label="Priority" value={selectedTicket.priority} />
                <DetailLine label="Status" value={selectedTicket.status} />
              </Paper>
              <Typography sx={{ fontSize: "18px", color: "#0F172A", fontWeight: 900, mb: 2 }}>Service Flow</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {selectedTicket.timeline.map((step, index) => (
                  <Box key={index} sx={{ p: 2, borderRadius: "16px", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(15,118,110,0.10)", color: "#0F766E", fontWeight: 900 }}>{index + 1}</Box>
                    <Typography sx={{ color: "#475569", fontWeight: 700 }}>{step}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
                <Button variant="contained" onClick={() => navigate("/tickets")} sx={{ background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", fontWeight: 900, textTransform: "none", borderRadius: "14px", px: 3 }}>
                  Open Tickets Page
                </Button>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Alert Detail Dialog */}
      <Dialog open={alertDialogOpen} onClose={() => setAlertDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: "28px", overflow: "hidden", border: "1px solid #E2E8F0" } }}>
        {selectedAlert && (
          <>
            <DialogTitle sx={{ p: 0, background: selectedAlert.type === "critical" ? "linear-gradient(135deg, rgba(220,38,38,0.08), #FFFFFF)" : "linear-gradient(135deg, rgba(245,158,11,0.12), #FFFFFF)" }}>
              <DialogHeader icon={<WarningAmberRounded />} title={selectedAlert.title} subtitle={selectedAlert.id} onClose={() => setAlertDialogOpen(false)} danger={selectedAlert.type === "critical"} />
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 3 }}>
              <Typography sx={{ color: "#475569", fontWeight: 700, lineHeight: 1.7, mb: 3 }}>{selectedAlert.message}</Typography>
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
                <Button onClick={() => setAlertDialogOpen(false)} sx={{ color: "#64748B", fontWeight: 900, textTransform: "none" }}>Cancel</Button>
                <Button variant="contained" onClick={handleAlertAction} sx={{ background: "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", fontWeight: 900, textTransform: "none", borderRadius: "12px", px: 3 }}>
                  {selectedAlert.actionText}
                </Button>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: "14px", fontWeight: 800 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

const AlertBox = ({ alert, onOpen, onDismiss }) => {
  const isCritical = alert.type === "critical";
  return (
    <Paper sx={{ p: 2.2, borderRadius: "18px", bgcolor: isCritical ? "#FEF2F2" : "#FFFBEB", border: isCritical ? "1px solid #FECACA" : "1px solid #FDE68A", cursor: "pointer", transition: "0.3s ease", "&:hover": { transform: "translateY(-3px)", boxShadow: "0 14px 28px rgba(15,23,42,0.08)" } }} onClick={onOpen}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 900, color: isCritical ? "#991B1B" : "#92400E", fontSize: "14px", mb: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>{alert.title}</Typography>
          <Typography sx={{ color: isCritical ? "#7F1D1D" : "#78350F", fontSize: "14px", fontWeight: 600, lineHeight: 1.6 }}>{alert.message}</Typography>
        </Box>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDismiss(); }} sx={{ width: 32, height: 32, color: isCritical ? "#991B1B" : "#92400E" }}>
          <CloseRounded fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
};

const DialogHeader = ({ icon, title, subtitle, onClose, danger = false }) => (
  <Box sx={{ p: 3, display: "flex", alignItems: "flex-start", gap: 2 }}>
    <Box sx={{ width: 54, height: 54, borderRadius: "16px", background: danger ? "linear-gradient(135deg, #991B1B, #DC2626)" : "linear-gradient(135deg, #1E3A8A, #0F766E)", color: "#FFFFFF", display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ fontWeight: 900, fontSize: "24px", color: "#0F172A" }}>{title}</Typography>
      <Typography sx={{ mt: 0.5, color: "#64748B", fontWeight: 700, lineHeight: 1.5 }}>{subtitle}</Typography>
    </Box>
    <IconButton onClick={onClose}><CloseRounded /></IconButton>
  </Box>
);

const DetailLine = ({ label, value }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, borderBottom: "1px solid #E2E8F0", py: 1.1, flexWrap: "wrap" }}>
    <Typography sx={{ color: "#64748B", fontWeight: 800 }}>{label}</Typography>
    <Typography sx={{ color: "#0F172A", fontWeight: 900 }}>{value}</Typography>
  </Box>
);

export default AdminDashboard;
