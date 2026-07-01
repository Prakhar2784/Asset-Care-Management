import { useState, useEffect } from "react";
import {
  Box, Button, Card, CardContent, Grid, Tab, Tabs, Typography, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Select, InputLabel, FormControl, Chip, CircularProgress, Alert
} from "@mui/material";
import {
  AddRounded, CheckCircleRounded, CancelRounded, LocalShippingRounded,
  ReceiptLongRounded, ShoppingCartRounded, AttachFileRounded, CloudUploadRounded
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import StatusChip from "../../components/StatusChip";

const Procurement = () => {
  const { currentUser } = useAuth();
  const { isDark } = useAppTheme();
  
  // Navigation Tabs
  const [tabValue, setTabValue] = useState(0);
  
  // Data States
  const [prs, setPrs] = useState([]);
  const [pos, setPOs] = useState([]);
  const [grns, setGrns] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal States
  const [prModalOpen, setPRModalOpen] = useState(false);
  const [poModalOpen, setPOModalOpen] = useState(false);
  const [grnModalOpen, setGRnModalOpen] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Active items for modals
  const [selectedPR, setSelectedPR] = useState(null);
  const [selectedPO, setSelectedPO] = useState(null);
  const [selectedGRN, setSelectedGRN] = useState(null);

  // Form inputs
  const [prForm, setPrForm] = useState({ itemName: "", category: "IT Hardware", quantity: 1, estimatedUnitCost: "", justification: "" });
  const [poForm, setPoForm] = useState({ purchaseRequestId: "", vendorId: "", items: [{ name: "", quantity: 1, unitCost: "" }], terms: "", expectedDeliveryDate: "" });
  const [grnForm, setGrnForm] = useState({ purchaseOrderId: "", invoiceNumber: "", receivedItems: [], invoiceFile: null });
  const [assetForm, setAssetForm] = useState([]); // List of { name, serialNumber, department, location }

  // PR Review status
  const [reviewForm, setReviewForm] = useState({ status: "Approved", remarks: "" });

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [prsRes, posRes, grnsRes, vendorsRes, deptsRes] = await Promise.all([
        api.get("/procurement/requests"),
        api.get("/procurement/orders"),
        api.get("/procurement/grns"),
        api.get("/vendors"),
        api.get("/departments")
      ]);
      setPrs(prsRes.data);
      setPOs(posRes.data);
      setGrns(grnsRes.data);
      setVendors(vendorsRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch procurement data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers for Raising PR
  const handlePRSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/procurement/requests", prForm);
      setPRModalOpen(false);
      setPrForm({ itemName: "", category: "IT Hardware", quantity: 1, estimatedUnitCost: "", justification: "" });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit Purchase Request");
    }
  };

  // Handlers for PR Approvals
  const handlePRReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/procurement/requests/${selectedPR._id}/review`, reviewForm);
      setReviewModalOpen(false);
      setReviewForm({ status: "Approved", remarks: "" });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to review request");
    }
  };

  // Handlers for creating PO
  const handlePOPrSelect = (prId) => {
    const selected = prs.find(p => p._id === prId);
    if (selected) {
      setPoForm({
        ...poForm,
        purchaseRequestId: prId,
        items: [{ name: selected.itemName, quantity: selected.quantity, unitCost: selected.estimatedUnitCost }]
      });
    }
  };

  const handlePOSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/procurement/orders", poForm);
      setPOModalOpen(false);
      setPoForm({ purchaseRequestId: "", vendorId: "", items: [{ name: "", quantity: 1, unitCost: "" }], terms: "", expectedDeliveryDate: "" });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create Purchase Order");
    }
  };

  // Handlers for GRN
  const handleGRNPOSelect = (poId) => {
    const selected = pos.find(p => p._id === poId);
    if (selected) {
      const items = selected.items.map(item => ({
        name: item.name,
        quantityOrdered: item.quantity,
        quantityReceived: item.quantity,
        condition: "Good"
      }));
      setGrnForm({
        ...grnForm,
        purchaseOrderId: poId,
        receivedItems: items
      });
    }
  };

  const handleGRNSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("purchaseOrderId", grnForm.purchaseOrderId);
    data.append("invoiceNumber", grnForm.invoiceNumber);
    data.append("receivedItems", JSON.stringify(grnForm.receivedItems));
    if (grnForm.invoiceFile) {
      data.append("invoice", grnForm.invoiceFile);
    }

    try {
      await api.post("/procurement/grns", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setGRnModalOpen(false);
      setGrnForm({ purchaseOrderId: "", invoiceNumber: "", receivedItems: [], invoiceFile: null });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit Goods Received Note");
    }
  };

  // Handlers for registering assets from GRN
  const openAssetRegistration = (grn) => {
    setSelectedGRN(grn);
    // Create pre-filled lines for each received item (duplicate line if quantity > 1)
    const list = [];
    grn.receivedItems.forEach(item => {
      const qty = item.quantityReceived || 0;
      for (let i = 0; i < qty; i++) {
        list.push({
          name: item.name,
          serialNumber: "",
          department: "IT",
          location: "Office HQ"
        });
      }
    });
    setAssetForm(list);
    setAssetModalOpen(true);
  };

  const handleAssetFormChange = (index, field, value) => {
    const updated = [...assetForm];
    updated[index][field] = value;
    setAssetForm(updated);
  };

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/procurement/grns/${selectedGRN._id}/register-assets`, { assets: assetForm });
      setAssetModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register assets");
    }
  };

  // Stats Counters
  const pendingPRCount = prs.filter(p => p.status === "Pending Approval").length;
  const activePOCount = pos.filter(p => ['Draft', 'Sent to Vendor'].includes(p.status)).length;
  const grnPendingReg = grns.filter(g => g.status === "Pending Asset Registration").length;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#A855F7" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 5 }}>
      <PageHeader title="Procurement Workspace" subtitle="Manage purchase workflows, vendors invoices, and stock receipts." />

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>{error}</Alert>}

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard title="Pending PRs" value={pendingPRCount} icon={<ShoppingCartRounded />} color="#FFB020" subtitle="Awaiting HOD/Admin review" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Active POs" value={activePOCount} icon={<ReceiptLongRounded />} color="#14B8A6" subtitle="Awaiting vendor dispatch" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Unregistered GRNs" value={grnPendingReg} icon={<LocalShippingRounded />} color="#A855F7" subtitle="Awaiting hardware tagging" />
        </Grid>
      </Grid>

      {/* Tab Navigation */}
      <Paper sx={{ bgcolor: "background.paper", borderRadius: "12px", border: "1px solid", borderColor: isDark ? "#222" : "#DDD8CE", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, val) => setTabValue(val)}
          sx={{
            borderBottom: "1px solid",
            borderColor: isDark ? "#222" : "#DDD8CE",
            "& .MuiTab-root": { fontWeight: 700, fontSize: 13, textTransform: "none", color: "text.secondary" },
            "& .Mui-selected": { color: "#A855F7 !important" },
            "& .MuiTabs-indicator": { bgcolor: "#A855F7" }
          }}
        >
          <Tab label="Purchase Requests (PR)" />
          <Tab label="Purchase Orders (PO)" />
          <Tab label="Invoices & Receipts (GRN)" />
        </Tabs>

        {/* Tab 1: PR list */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
              <Typography variant="h6" fontWeight={800}>Requested Equipment</Typography>
              <Button
                variant="contained"
                startIcon={<AddRounded />}
                onClick={() => setPRModalOpen(true)}
                sx={{ bgcolor: "#A855F7", color: "#000", fontWeight: 700, borderRadius: "8px", "&:hover": { bgcolor: "#bce64c" } }}
              >
                Raise Purchase Request
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? "#141414" : "#F5F2EB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>PR Number</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Total Cost</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Requested By</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prs.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ color: "text.secondary", py: 4 }}>No purchase requests found.</TableCell></TableRow>
                  ) : (
                    prs.map((pr) => (
                      <TableRow key={pr._id}>
                        <TableCell sx={{ fontWeight: 700 }}>{pr.prNumber}</TableCell>
                        <TableCell>{pr.itemName}</TableCell>
                        <TableCell>{pr.category}</TableCell>
                        <TableCell>{pr.quantity}</TableCell>
                        <TableCell>₹{pr.totalCost.toLocaleString()}</TableCell>
                        <TableCell>{pr.requestedBy?.name || "System"}</TableCell>
                        <TableCell>
                          <StatusChip status={pr.status} />
                        </TableCell>
                        <TableCell align="right">
                          {pr.status === "Pending Approval" && (currentUser?.role === "admin" || currentUser?.role === "hod") && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => { setSelectedPR(pr); setReviewModalOpen(true); }}
                              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "6px" }}
                            >
                              Review
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 2: PO list */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
              <Typography variant="h6" fontWeight={800}>Vendor Purchase Orders</Typography>
              {currentUser?.role === "admin" && (
                <Button
                  variant="contained"
                  startIcon={<AddRounded />}
                  onClick={() => setPOModalOpen(true)}
                  sx={{ bgcolor: "#A855F7", color: "#000", fontWeight: 700, borderRadius: "8px", "&:hover": { bgcolor: "#bce64c" } }}
                >
                  Create Purchase Order
                </Button>
              )}
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? "#141414" : "#F5F2EB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>PO Number</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Vendor</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Linked PR</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Total Amount</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Payment Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pos.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 4 }}>No purchase orders found.</TableCell></TableRow>
                  ) : (
                    pos.map((po) => (
                      <TableRow key={po._id}>
                        <TableCell sx={{ fontWeight: 700 }}>{po.poNumber}</TableCell>
                        <TableCell>{po.vendor?.name || "Unknown"}</TableCell>
                        <TableCell>{po.purchaseRequest?.prNumber || "Direct PO"}</TableCell>
                        <TableCell>₹{po.totalAmount.toLocaleString()}</TableCell>
                        <TableCell><StatusChip status={po.status} /></TableCell>
                        <TableCell><StatusChip status={po.paymentStatus} /></TableCell>
                        <TableCell align="right">
                          {currentUser?.role === "admin" && (
                            <FormControl size="small" sx={{ width: 130 }}>
                              <Select
                                value={po.status}
                                onChange={async (e) => {
                                  try {
                                    await api.put(`/procurement/orders/${po._id}/status`, { status: e.target.value });
                                    fetchData();
                                  } catch (err) { setError("Failed to update status"); }
                                }}
                                sx={{ fontSize: 12, fontWeight: 700, borderRadius: "6px" }}
                              >
                                <MenuItem value="Draft">Draft</MenuItem>
                                <MenuItem value="Sent to Vendor">Sent to Vendor</MenuItem>
                                <MenuItem value="Partially Received">Partially Received</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 3: GRN list */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
              <Typography variant="h6" fontWeight={800}>Shipments & Receipts</Typography>
              {currentUser?.role === "admin" && (
                <Button
                  variant="contained"
                  startIcon={<AddRounded />}
                  onClick={() => setGRnModalOpen(true)}
                  sx={{ bgcolor: "#A855F7", color: "#000", fontWeight: 700, borderRadius: "8px", "&:hover": { bgcolor: "#bce64c" } }}
                >
                  Log Shipment Receipt (GRN)
                </Button>
              )}
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? "#141414" : "#F5F2EB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>GRN Number</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>PO Number</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Received Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Invoice Number</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Invoice File</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Asset Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grns.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 4 }}>No Goods Received Notes logged.</TableCell></TableRow>
                  ) : (
                    grns.map((grn) => (
                      <TableRow key={grn._id}>
                        <TableCell sx={{ fontWeight: 700 }}>{grn.grnNumber}</TableCell>
                        <TableCell>{grn.purchaseOrder?.poNumber || "Unknown"}</TableCell>
                        <TableCell>{new Date(grn.receivedDate).toLocaleDateString()}</TableCell>
                        <TableCell>{grn.invoiceNumber || "N/A"}</TableCell>
                        <TableCell>
                          {grn.invoiceFileUrl ? (
                            <Button
                              component="a"
                              href={`http://localhost:5000${grn.invoiceFileUrl}`}
                              target="_blank"
                              startIcon={<AttachFileRounded />}
                              size="small"
                              sx={{ textTransform: "none", fontSize: 11, fontWeight: 700 }}
                            >
                              Download
                            </Button>
                          ) : "No File"}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={grn.status} />
                        </TableCell>
                        <TableCell align="right">
                          {grn.status === "Pending Asset Registration" && currentUser?.role === "admin" && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => openAssetRegistration(grn)}
                              sx={{ bgcolor: "#A855F7", color: "#000", fontWeight: 700, borderRadius: "6px", textTransform: "none", "&:hover": { bgcolor: "#bce64c" } }}
                            >
                              Register Assets
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* ─── MODAL: RAISE PURCHASE REQUEST ─── */}
      <Dialog open={prModalOpen} onClose={() => setPRModalOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <form onSubmit={handlePRSubmit}>
          <DialogTitle sx={{ fontWeight: 900 }}>Raise Purchase Request</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
              <TextField
                label="Item / Product Name"
                fullWidth
                value={prForm.itemName}
                onChange={(e) => setPrForm({ ...prForm, itemName: e.target.value })}
                required
              />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={prForm.category}
                  label="Category"
                  onChange={(e) => setPrForm({ ...prForm, category: e.target.value })}
                >
                  <MenuItem value="IT Hardware">IT Hardware</MenuItem>
                  <MenuItem value="Software Licenses">Software Licenses</MenuItem>
                  <MenuItem value="Networking">Networking</MenuItem>
                  <MenuItem value="Furniture">Furniture</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Quantity"
                    type="number"
                    fullWidth
                    value={prForm.quantity}
                    onChange={(e) => setPrForm({ ...prForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Estimated Unit Cost (₹)"
                    type="number"
                    fullWidth
                    value={prForm.estimatedUnitCost}
                    onChange={(e) => setPrForm({ ...prForm, estimatedUnitCost: e.target.value })}
                    required
                  />
                </Grid>
              </Grid>
              <TextField
                label="Justification / Business Need"
                multiline
                rows={3}
                fullWidth
                value={prForm.justification}
                onChange={(e) => setPrForm({ ...prForm, justification: e.target.value })}
                required
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setPRModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: "#A855F7", color: "#000", fontWeight: 700 }}>
              Submit PR
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL: PR REVIEW (APPROVE/REJECT) ─── */}
      <Dialog open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <form onSubmit={handlePRReviewSubmit}>
          <DialogTitle sx={{ fontWeight: 900 }}>Review Purchase Request</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  value={reviewForm.status}
                  label="Action"
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                >
                  <MenuItem value="Approved">Approve</MenuItem>
                  <MenuItem value="Rejected">Reject</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Reviewer Remarks"
                multiline
                rows={3}
                fullWidth
                value={reviewForm.remarks}
                onChange={(e) => setReviewForm({ ...reviewForm, remarks: e.target.value })}
                required
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setReviewModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: reviewForm.status === "Approved" ? "#A855F7" : "#F44336", color: "#000", fontWeight: 700 }}>
              Confirm Review
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL: CREATE PURCHASE ORDER ─── */}
      <Dialog open={poModalOpen} onClose={() => setPOModalOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <form onSubmit={handlePOSubmit}>
          <DialogTitle sx={{ fontWeight: 900 }}>Create Purchase Order</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
              <FormControl fullWidth>
                <InputLabel>Select Approved PR (Optional)</InputLabel>
                <Select
                  value={poForm.purchaseRequestId}
                  label="Select Approved PR (Optional)"
                  onChange={(e) => handlePOPrSelect(e.target.value)}
                >
                  <MenuItem value="">Direct Purchase Order (No PR linkage)</MenuItem>
                  {prs.filter(p => p.status === "Approved").map(p => (
                    <MenuItem key={p._id} value={p._id}>{`${p.prNumber} - ${p.itemName} (${p.quantity} units)`}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Assign Vendor</InputLabel>
                <Select
                  value={poForm.vendorId}
                  label="Assign Vendor"
                  onChange={(e) => setPoForm({ ...poForm, vendorId: e.target.value })}
                  required
                >
                  {vendors.map(v => (
                    <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1 }}>PO Items</Typography>
              {poForm.items.map((item, idx) => (
                <Grid container spacing={2} key={idx}>
                  <Grid item xs={6}>
                    <TextField
                      label="Item Name"
                      fullWidth
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...poForm.items];
                        updated[idx].name = e.target.value;
                        setPoForm({ ...poForm, items: updated });
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      label="Qty"
                      type="number"
                      fullWidth
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...poForm.items];
                        updated[idx].quantity = parseInt(e.target.value) || 1;
                        setPoForm({ ...poForm, items: updated });
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      label="Unit Cost (₹)"
                      type="number"
                      fullWidth
                      value={item.unitCost}
                      onChange={(e) => {
                        const updated = [...poForm.items];
                        updated[idx].unitCost = e.target.value;
                        setPoForm({ ...poForm, items: updated });
                      }}
                      required
                    />
                  </Grid>
                </Grid>
              ))}

              <TextField
                label="Terms & Conditions"
                fullWidth
                value={poForm.terms}
                onChange={(e) => setPoForm({ ...poForm, terms: e.target.value })}
              />

              <TextField
                label="Expected Delivery Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={poForm.expectedDeliveryDate}
                onChange={(e) => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setPOModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: "#A855F7", color: "#000", fontWeight: 700 }}>
              Create PO
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL: LOG GOODS RECEIVED NOTE (GRN) ─── */}
      <Dialog open={grnModalOpen} onClose={() => setGRnModalOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <form onSubmit={handleGRNSubmit}>
          <DialogTitle sx={{ fontWeight: 900 }}>Log Goods Received Note</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
              <FormControl fullWidth>
                <InputLabel>Select Active PO</InputLabel>
                <Select
                  value={grnForm.purchaseOrderId}
                  label="Select Active PO"
                  onChange={(e) => handleGRNPOSelect(e.target.value)}
                  required
                >
                  {pos.filter(p => p.status !== 'Completed').map(p => (
                    <MenuItem key={p._id} value={p._id}>{`${p.poNumber} - ${p.vendor?.name}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Vendor Invoice / Bill Number"
                fullWidth
                value={grnForm.invoiceNumber}
                onChange={(e) => setGrnForm({ ...grnForm, invoiceNumber: e.target.value })}
                required
              />

              {grnForm.receivedItems.length > 0 && (
                <>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1 }}>Items Quantity Check</Typography>
                  {grnForm.receivedItems.map((item, idx) => (
                    <Grid container spacing={2} key={idx} alignItems="center">
                      <Grid item xs={5}>
                        <Typography variant="body2">{item.name}</Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="caption" color="text.secondary">Ordered: {item.quantityOrdered}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Qty Received"
                          type="number"
                          size="small"
                          fullWidth
                          value={item.quantityReceived}
                          onChange={(e) => {
                            const updated = [...grnForm.receivedItems];
                            updated[idx].quantityReceived = Math.max(0, parseInt(e.target.value) || 0);
                            setGrnForm({ ...grnForm, receivedItems: updated });
                          }}
                          required
                        />
                      </Grid>
                    </Grid>
                  ))}
                </>
              )}

              {/* File Upload Box */}
              <Box sx={{
                border: "2px dashed",
                borderColor: isDark ? "#333" : "#CCC",
                borderRadius: "12px",
                p: 3,
                textAlign: "center",
                cursor: "pointer",
                bgcolor: isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)",
                "&:hover": { borderColor: "#A855F7" }
              }} component="label">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  style={{ display: "none" }}
                  onChange={(e) => setGrnForm({ ...grnForm, invoiceFile: e.target.files[0] })}
                />
                <CloudUploadRounded sx={{ fontSize: 32, color: "text.secondary", mb: 1 }} />
                <Typography variant="body2" fontWeight={700}>
                  {grnForm.invoiceFile ? grnForm.invoiceFile.name : "Upload Invoice Receipt (PDF or Image)"}
                </Typography>
                <Typography variant="caption" color="text.secondary">Max size: 10MB</Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setGRnModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: "#A855F7", color: "#000", fontWeight: 700 }}>
              Submit GRN
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL: BULK ASSET REGISTRATION ─── */}
      <Dialog open={assetModalOpen} onClose={() => setAssetModalOpen(false)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <form onSubmit={handleAssetSubmit}>
          <DialogTitle sx={{ fontWeight: 900 }}>Bulk Asset Registry Registration</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1.5, display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Typography variant="body2" color="text.secondary">
                Assign serial numbers and departments for received equipment to import them directly into active stock.
              </Typography>
              
              <Box sx={{ maxHeight: "380px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2.5, pr: 1 }}>
                {assetForm.map((item, idx) => (
                  <Paper key={idx} sx={{ p: 2, bgcolor: isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)", border: "1px solid", borderColor: isDark ? "#222" : "#EEE", borderRadius: "10px" }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={4}>
                        <Typography variant="body2" fontWeight={700}>{item.name}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Serial Number"
                          size="small"
                          fullWidth
                          value={item.serialNumber}
                          onChange={(e) => handleAssetFormChange(idx, "serialNumber", e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Department</InputLabel>
                          <Select
                            value={item.department}
                            label="Department"
                            onChange={(e) => handleAssetFormChange(idx, "department", e.target.value)}
                          >
                            {departments.map(d => (
                              <MenuItem key={d._id} value={d.name}>{d.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setAssetModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: "#A855F7", color: "#000", fontWeight: 700 }}>
              Tag & Import Assets
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Procurement;
