// frontend/src/pages/vendor/VendorPortal.jsx
import { useState, useEffect } from "react";
import {
  Box, Button, Card, CardContent, Grid, Tab, Tabs, Typography, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Select, InputLabel, FormControl, Chip, CircularProgress, Alert
} from "@mui/material";
import {
  ShoppingCartRounded, VerifiedUserRounded, HandymanRounded, CheckCircleRounded,
  CancelRounded, VisibilityRounded, SaveRounded, ContactMailRounded
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import StatusChip from "../../components/StatusChip";

const VendorPortal = () => {
  const { currentUser } = useAuth();
  const { isDark } = useAppTheme();

  // Navigation
  const [tabValue, setTabValue] = useState(0);

  // States
  const [vendorProfile, setVendorProfile] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [warrantyClaims, setWarrantyClaims] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dialogs
  const [poDetailsModal, setPoDetailsModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  
  const [claimStatusModal, setClaimStatusModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [claimForm, setClaimForm] = useState({ status: "In Review", resolutionDetails: "" });

  const [ticketStatusModal, setTicketStatusModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketForm, setTicketForm] = useState({ status: "Under Repair", estimatedCost: 0 });

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch vendor profile associated with logged in user email
      const profileRes = await api.get("/vendor-portal/profile");
      setVendorProfile(profileRes.data);

      // 2. Fetch active transactions
      const [posRes, claimsRes, ticketsRes] = await Promise.all([
        api.get("/vendor-portal/purchase-orders"),
        api.get("/vendor-portal/warranty-claims"),
        api.get("/vendor-portal/tickets")
      ]);
      
      setPurchaseOrders(posRes.data);
      setWarrantyClaims(claimsRes.data);
      setTickets(ticketsRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load vendor portal details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // PO handlers
  const handleUpdatePOStatus = async (poId, status) => {
    try {
      await api.put(`/vendor-portal/purchase-orders/${poId}/status`, { status });
      fetchData();
      setPoDetailsModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Error updating Purchase Order");
    }
  };

  // Warranty Claim handlers
  const handleOpenClaimModal = (claim) => {
    setSelectedClaim(claim);
    setClaimForm({ status: claim.status === "Filed" ? "In Review" : claim.status, resolutionDetails: claim.resolutionDetails || "" });
    setClaimStatusModal(true);
  };

  const handleSubmitClaimUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/vendor-portal/warranty-claims/${selectedClaim._id}/status`, claimForm);
      setClaimStatusModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Error updating warranty claim");
    }
  };

  // Ticket Handlers
  const handleOpenTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setTicketForm({ status: ticket.status === "Vendor Assigned" ? "Under Repair" : ticket.status, estimatedCost: ticket.estimatedCost || 0 });
    setTicketStatusModal(true);
  };

  const handleSubmitTicketUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/vendor-portal/tickets/${selectedTicket._id}/status`, ticketForm);
      setTicketStatusModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Error updating ticket status");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#A855F7" }} />
      </Box>
    );
  }

  // Dashboard calculations
  const pendingPOsCount = purchaseOrders.filter(po => po.status === "Sent to Vendor").length;
  const activeClaimsCount = warrantyClaims.filter(c => ["Filed", "In Review"].includes(c.status)).length;
  const activeTicketsCount = tickets.filter(t => ["Vendor Assigned", "Under Repair"].includes(t.status)).length;

  return (
    <Box sx={{ pb: 5 }}>
      <PageHeader 
        title={`Vendor Workspace: ${vendorProfile?.name || "Service Provider"}`} 
        subtitle="Review assigned Purchase Orders, file warranty updates, and manage repair logs." 
      />

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>{error}</Alert>}

      {/* Overview Dashboard Tab */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard 
            title="Pending Purchase Orders" 
            value={pendingPOsCount} 
            icon={<ShoppingCartRounded />} 
            color="primary" 
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard 
            title="Active Warranty Claims" 
            value={activeClaimsCount} 
            icon={<VerifiedUserRounded />} 
            color="warning" 
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard 
            title="Assigned Tickets" 
            value={activeTicketsCount} 
            icon={<HandymanRounded />} 
            color="info" 
          />
        </Grid>
      </Grid>

      {/* Tabs Menu */}
      <Paper sx={{ bgcolor: "background.paper", borderRadius: "12px", border: "1px solid", borderColor: isDark ? "#222" : "#DDD8CE", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, val) => setTabValue(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: "1px solid",
            borderColor: isDark ? "#222" : "#DDD8CE",
            "& .MuiTab-root": { fontWeight: 700, fontSize: 13, textTransform: "none", color: "text.secondary" },
            "& .Mui-selected": { color: "#A855F7 !important" },
            "& .MuiTabs-indicator": { bgcolor: "#A855F7" }
          }}
        >
          <Tab icon={<ShoppingCartRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Purchase Orders" />
          <Tab icon={<VerifiedUserRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Warranty Claims" />
          <Tab icon={<HandymanRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Maintenance Tickets" />
          <Tab icon={<ContactMailRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Profile & Terms" />
        </Tabs>

        {/* Tab 0: Purchase Orders */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Purchase Orders</Typography>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? "#141414" : "#F5F2EB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>PO Number</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Date Issued</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Total Items</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Total Amount</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>PO Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Payment Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchaseOrders.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 4 }}>No Purchase Orders assigned.</TableCell></TableRow>
                  ) : (
                    purchaseOrders.map((po) => (
                      <TableRow key={po._id}>
                        <TableCell sx={{ fontWeight: 700 }}>{po.poNumber}</TableCell>
                        <TableCell>{new Date(po.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{po.items?.reduce((sum, item) => sum + item.quantity, 0)} item(s)</TableCell>
                        <TableCell>₹{po.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell><StatusChip status={po.status} /></TableCell>
                        <TableCell>
                          <Chip label={po.paymentStatus} size="small" variant="outlined" color={po.paymentStatus === 'Paid' ? 'success' : 'default'} sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => { setSelectedPO(po); setPoDetailsModal(true); }}>
                            <VisibilityRounded fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 1: Warranty Claims */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Warranty Support Claims</Typography>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? "#141414" : "#F5F2EB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Claim Number</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Asset Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Serial Number</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Issue Reported</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Claim Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Filed Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {warrantyClaims.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 4 }}>No warranty support claims registered.</TableCell></TableRow>
                  ) : (
                    warrantyClaims.map((claim) => (
                      <TableRow key={claim._id}>
                        <TableCell sx={{ fontWeight: 700 }}>{claim.claimNumber}</TableCell>
                        <TableCell>{claim.asset?.name || "N/A"}</TableCell>
                        <TableCell>{claim.asset?.serialNumber || "N/A"}</TableCell>
                        <TableCell>{claim.issueDescription}</TableCell>
                        <TableCell><StatusChip status={claim.status} /></TableCell>
                        <TableCell>{new Date(claim.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <Button variant="outlined" size="small" onClick={() => handleOpenClaimModal(claim)} sx={{ borderRadius: "8px", fontWeight: 700 }}>
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 2: Maintenance Tickets */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Assigned Breakdown Tickets</Typography>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? "#141414" : "#F5F2EB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Ticket ID</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Asset Details</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Issue / Fault</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Est. Cost (₹)</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Raiser</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ color: "text.secondary", py: 4 }}>No maintenance tickets delegated.</TableCell></TableRow>
                  ) : (
                    tickets.map((t) => (
                      <TableRow key={t._id}>
                        <TableCell sx={{ fontWeight: 700 }}>{t.ticketId}</TableCell>
                        <TableCell>{t.asset ? `${t.asset.name} (${t.asset.serialNumber})` : t.itemLabel || "N/A"}</TableCell>
                        <TableCell>{t.issue}</TableCell>
                        <TableCell>
                          <Chip label={t.priority} size="small" color={t.priority === 'Critical' ? 'error' : t.priority === 'High' ? 'warning' : 'default'} sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell><StatusChip status={t.status} /></TableCell>
                        <TableCell>₹{t.estimatedCost?.toLocaleString() || 0}</TableCell>
                        <TableCell>{t.raisedBy?.name || "System"}</TableCell>
                        <TableCell align="right">
                          <Button variant="outlined" size="small" onClick={() => handleOpenTicketModal(t)} sx={{ borderRadius: "8px", fontWeight: 700 }}>
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 3: Profile & Terms */}
        {tabValue === 3 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Vendor Registry Profile</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Vendor Name</Typography>
                <Typography variant="body1" fontWeight={700} sx={{ mb: 2 }}>{vendorProfile?.name}</Typography>
                
                <Typography variant="subtitle2" color="text.secondary">Vendor Type</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{vendorProfile?.vendorType}</Typography>
                
                <Typography variant="subtitle2" color="text.secondary">Contact Person</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{vendorProfile?.contactPerson}</Typography>
                
                <Typography variant="subtitle2" color="text.secondary">Phone Number</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{vendorProfile?.phone}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">GSTIN</Typography>
                <Typography variant="body1" fontWeight={700} sx={{ mb: 2 }}>{vendorProfile?.gstNumber || "N/A"}</Typography>
                
                <Typography variant="subtitle2" color="text.secondary">Service Category</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{vendorProfile?.serviceCategory}</Typography>
                
                <Typography variant="subtitle2" color="text.secondary">SLA Response Time</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{vendorProfile?.slaResponseTime || "N/A"}</Typography>
                
                <Typography variant="subtitle2" color="text.secondary">Payment Terms</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{vendorProfile?.paymentTerms || "N/A"}</Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* ─── DIALOG: PO DETAILS & ACTION ─── */}
      <Dialog open={poDetailsModal} onClose={() => setPoDetailsModal(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Purchase Order details: {selectedPO?.poNumber}</DialogTitle>
        <DialogContent>
          {selectedPO && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>PO Summary</Typography>
              <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: "8px", mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: isDark ? "#141414" : "#F5F2EB" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item Description</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Unit (₹)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Total (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPO.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">₹{item.unitCost?.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{item.totalCost?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Expected Delivery</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {selectedPO.expectedDeliveryDate ? new Date(selectedPO.expectedDeliveryDate).toLocaleDateString() : "Flexible"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">PO Terms</Typography>
                  <Typography variant="body2">{selectedPO.terms || "Standard delivery terms."}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setPoDetailsModal(false)}>Close</Button>
          {selectedPO?.status === 'Sent to Vendor' && (
            <>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<CancelRounded />}
                onClick={() => handleUpdatePOStatus(selectedPO._id, 'Rejected by Vendor')}
                sx={{ fontWeight: 700, borderRadius: "8px" }}
              >
                Reject PO
              </Button>
              <Button 
                variant="contained" 
                color="success" 
                startIcon={<CheckCircleRounded />}
                onClick={() => handleUpdatePOStatus(selectedPO._id, 'Accepted by Vendor')}
                sx={{ fontWeight: 700, borderRadius: "8px", color: "#fff" }}
              >
                Accept PO
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* ─── DIALOG: UPDATE CLAIM STATUS ─── */}
      <Dialog open={claimStatusModal} onClose={() => setClaimStatusModal(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <form onSubmit={handleSubmitClaimUpdate}>
          <DialogTitle sx={{ fontWeight: 900 }}>Update Warranty Ticket: {selectedClaim?.claimNumber}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={claimForm.status}
                  label="Status"
                  onChange={(e) => setClaimForm({ ...claimForm, status: e.target.value })}
                  required
                >
                  <MenuItem value="In Review">In Review</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Resolution Details / Comments"
                multiline
                rows={3}
                fullWidth
                value={claimForm.resolutionDetails}
                onChange={(e) => setClaimForm({ ...claimForm, resolutionDetails: e.target.value })}
                required={claimForm.status === 'Resolved' || claimForm.status === 'Rejected'}
                placeholder="Details of hardware replacement, SLA comments, or reason for rejection..."
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setClaimStatusModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" startIcon={<SaveRounded />} sx={{ bgcolor: "#A855F7", color: "#000", fontWeight: 700, borderRadius: "8px", "&:hover": { bgcolor: "#bce64c" } }}>
              Save Claim Status
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── DIALOG: UPDATE TICKET STATUS ─── */}
      <Dialog open={ticketStatusModal} onClose={() => setTicketStatusModal(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <form onSubmit={handleSubmitTicketUpdate}>
          <DialogTitle sx={{ fontWeight: 900 }}>Update Repair Ticket: {selectedTicket?.ticketId}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={ticketForm.status}
                  label="Status"
                  onChange={(e) => setTicketForm({ ...ticketForm, status: e.target.value })}
                  required
                >
                  <MenuItem value="Under Repair">Under Repair</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Estimated Repair Cost (₹)"
                type="number"
                fullWidth
                value={ticketForm.estimatedCost}
                onChange={(e) => setTicketForm({ ...ticketForm, estimatedCost: parseInt(e.target.value, 10) || 0 })}
                helperText="Enter the service cost, parts replacement cost, or labor fees."
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setTicketStatusModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" startIcon={<SaveRounded />} sx={{ bgcolor: "#A855F7", color: "#000", fontWeight: 700, borderRadius: "8px", "&:hover": { bgcolor: "#bce64c" } }}>
              Save Ticket
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default VendorPortal;
