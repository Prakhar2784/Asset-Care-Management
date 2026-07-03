import { useState, useEffect, useRef } from "react";
import {
  Box, Button, Card, CardContent, Grid, Tab, Tabs, Typography, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Select, InputLabel, FormControl, Chip, CircularProgress, Alert, Avatar, Checkbox
} from "@mui/material";
import {
  AddRounded, CheckCircleRounded, CancelRounded, BusinessRounded,
  QrCode2Rounded, VpnKeyRounded, HandymanRounded, SwapHorizRounded,
  VerifiedUserRounded, EngineeringRounded, SettingsCellRounded, PrintRounded,
  DeleteRounded
} from "@mui/icons-material";
import QRCode from "qrcode";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import StatusChip from "../../components/StatusChip";

const EnterpriseWorkspace = () => {
  const { currentUser } = useAuth();
  const { isDark } = useAppTheme();

  // Navigation
  const [tabValue, setTabValue] = useState(0);

  // States
  const [warehouses, setWarehouses] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [amcContracts, setAmcContracts] = useState([]);
  const [warrantyClaims, setWarrantyClaims] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [departments, setDepartments] = useState([]);


  // Modals
  const [whModal, setWhModal] = useState(false);
  const [licModal, setLicModal] = useState(false);
  const [amcModal, setAmcModal] = useState(false);
  const [claimModal, setClaimModal] = useState(false);
  const [maintModal, setMaintModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [assignLicModal, setAssignLicModal] = useState(false);
  const [whTransferModal, setWhTransferModal] = useState(false);

  // Form Fields
  const [whForm, setWhForm] = useState({ name: "", code: "", location: "", managerId: "" });
  const [licForm, setLicForm] = useState({ softwareName: "", publisher: "", licenseKey: "", totalSeats: 1, expiryDate: "", renewalCost: "" });
  const [amcForm, setAmcForm] = useState({ contractNumber: "", vendorId: "", assetsCovered: [], startDate: "", endDate: "", annualCost: "" });
  const [claimForm, setClaimForm] = useState({ assetId: "", vendorId: "", issueDescription: "" });
  const [maintForm, setMaintForm] = useState({ assetId: "", taskName: "", frequency: "Quarterly", nextDueDate: "", assignedEngineerId: "" });
  const [transferForm, setTransferForm] = useState({ assetId: "", toUserId: "" });
  const [assignLicForm, setAssignLicForm] = useState({ userId: "" });
  const [whTransferForm, setWhTransferForm] = useState({ assetId: "", warehouseId: "", stockStatus: "Available" });

  // Selected item tracking
  const [activeLicense, setActiveLicense] = useState(null);
  const [selectedAssetsQR, setSelectedAssetsQR] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [whRes, licRes, amcRes, claimRes, maintRes, transRes, assetsRes, usersRes, vendorsRes, deptsRes] = await Promise.all([
        api.get("/enterprise/warehouses").catch(() => ({ data: [] })),
        api.get("/enterprise/licenses").catch(() => ({ data: [] })),
        api.get("/enterprise/amc").catch(() => ({ data: [] })),
        api.get("/enterprise/warranty/claims").catch(() => ({ data: [] })),
        api.get("/enterprise/maintenance").catch(() => ({ data: [] })),
        api.get("/enterprise/transfers").catch(() => ({ data: [] })),
        api.get("/assets").catch(() => ({ data: [] })),
        api.get("/users").catch(() => ({ data: [] })),
        api.get("/vendors").catch(() => ({ data: [] })),
        api.get("/departments").catch(() => ({ data: [] })),
      ]);
      setWarehouses(whRes.data || []);
      setLicenses(licRes.data || []);
      setAmcContracts(amcRes.data || []);
      setWarrantyClaims(claimRes.data || []);
      setSchedules(maintRes.data || []);
      setTransfers(transRes.data || []);
      setAssets(assetsRes.data || []);
      setUsers(usersRes.data || []);
      setVendors(vendorsRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Submit handlers
  const submitWarehouse = async (e) => {
    e.preventDefault();
    try {
      await api.post("/enterprise/warehouses", whForm);
      setWhModal(false);
      setWhForm({ name: "", code: "", location: "", managerId: "" });
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "Error creating warehouse"); }
  };

  const submitLicense = async (e) => {
    e.preventDefault();
    try {
      await api.post("/enterprise/licenses", licForm);
      setLicModal(false);
      setLicForm({ softwareName: "", publisher: "", licenseKey: "", totalSeats: 1, expiryDate: "", renewalCost: "" });
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "Error creating license"); }
  };

  const submitAMC = async (e) => {
    e.preventDefault();
    try {
      await api.post("/enterprise/amc", amcForm);
      setAmcModal(false);
      setAmcForm({ contractNumber: "", vendorId: "", assetsCovered: [], startDate: "", endDate: "", annualCost: "" });
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "Error creating AMC contract"); }
  };

  const submitClaim = async (e) => {
    e.preventDefault();
    try {
      await api.post("/enterprise/warranty/claims", claimForm);
      setClaimModal(false);
      setClaimForm({ assetId: "", vendorId: "", issueDescription: "" });
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "Error submitting claim"); }
  };

  const submitMaintenance = async (e) => {
    e.preventDefault();
    try {
      await api.post("/enterprise/maintenance", maintForm);
      setMaintModal(false);
      setMaintForm({ assetId: "", taskName: "", frequency: "Quarterly", nextDueDate: "", assignedEngineerId: "" });
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "Error scheduling maintenance"); }
  };

  const submitTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.post("/enterprise/transfers", transferForm);
      setTransferModal(false);
      setTransferForm({ assetId: "", toUserId: "" });
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "Error submitting transfer request"); }
  };

  const submitLicenseAssignment = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/enterprise/licenses/${activeLicense._id}/assign`, assignLicForm);
      setAssignLicModal(false);
      setAssignLicForm({ userId: "" });
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "Error assigning license seat"); }
  };

  const submitWarehouseTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.post("/enterprise/warehouses/transfer", whTransferForm);
      setWhTransferModal(false);
      setWhTransferForm({ assetId: "", warehouseId: "", stockStatus: "Available" });
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "Error transferring asset to warehouse"); }
  };

  // Approval Handlers
  const handleHODApproval = async (id, approve) => {
    try {
      await api.put(`/enterprise/transfers/${id}/hod`, { approve, remarks: approve ? "Approved by HOD" : "Rejected by HOD" });
      fetchData();
    } catch (err) { setError("HOD Approval failed"); }
  };

  const handleITApproval = async (id, approve) => {
    try {
      await api.put(`/enterprise/transfers/${id}/it`, { approve, remarks: approve ? "IT Handover Complete" : "Rejected by IT" });
      fetchData();
    } catch (err) { setError("IT Approval failed"); }
  };

  const handleCompleteMaintenance = async (id) => {
    try {
      await api.put(`/enterprise/maintenance/${id}/complete`);
      fetchData();
    } catch (err) { setError("Maintenance completion failed"); }
  };


  // Bulk Print QR Codes Handler
  const handlePrintQRCodes = async () => {
    if (selectedAssetsQR.length === 0) return;
    
    // Create new print window
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Asset QR Labels</title>
          <style>
            body { font-family: 'Inter', sans-serif; margin: 20px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
            .label-card { border: 2px solid #000; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 12px; page-break-inside: avoid; }
            .qr-code { width: 80px; height: 80px; }
            .details { display: flex; flex-direction: column; font-size: 11px; }
            .title { font-weight: 800; font-size: 13px; margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <h2 style="text-align: center; margin-bottom: 30px;">Asset Tracking Printable Labels</h2>
          <div class="grid" id="labels-container"></div>
        </body>
      </html>
    `);

    const container = printWindow.document.getElementById("labels-container");

    for (const assetId of selectedAssetsQR) {
      const a = assets.find(item => item._id === assetId);
      if (a) {
        // Generate QR code data URL (encodes the asset serialNumber and link)
        const qrDataUrl = await QRCode.toDataURL(`https://assetcare.com/assets/${a.serialNumber}`);
        
        const card = printWindow.document.createElement("div");
        card.className = "label-card";
        card.innerHTML = `
          <img class="qr-code" src="${qrDataUrl}" alt="QR code for ${a.name}" />
          <div class="details">
            <div class="title">${a.name}</div>
            <div><strong>Serial:</strong> ${a.serialNumber}</div>
            <div><strong>Cat:</strong> ${a.category}</div>
            <div><strong>Dept:</strong> ${a.department}</div>
          </div>
        `;
        container.appendChild(card);
      }
    }

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleSelectAssetQR = (assetId) => {
    setSelectedAssetsQR(prev => 
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };


  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "text.primary" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 5 }}>
      <PageHeader title="Enterprise Operations Workspace" subtitle="Centralized warehouse inventory, software seat audits, AMCs, and handovers." />

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>{error}</Alert>}

      {/* Dynamic Tabs */}
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
            "& .Mui-selected": { color: "#111827 !important" },
            "& .MuiTabs-indicator": { bgcolor: "text.primary" }
          }}
        >
          <Tab icon={<BusinessRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Warehousing" />
          <Tab icon={<VpnKeyRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Software Licenses" />
          <Tab icon={<VerifiedUserRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="AMC & Warranties" />
          <Tab icon={<HandymanRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Maintenance Schedules" />
          <Tab icon={<SwapHorizRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Asset Transfers" />
          <Tab icon={<QrCode2Rounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Print QR Codes" />
        </Tabs>

        {/* Tab 0: Warehousing */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
              <Typography variant="h6" fontWeight={800}>Warehouses & Stock</Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button variant="outlined" onClick={() => setWhTransferModal(true)} startIcon={<SwapHorizRounded />} sx={{ fontWeight: 700, borderRadius: "8px" }}>
                  Store Asset in Warehouse
                </Button>
                <Button variant="contained" onClick={() => setWhModal(true)} startIcon={<AddRounded />} sx={{ bgcolor: "text.primary", color: "#000", fontWeight: 700, borderRadius: "8px", "&:hover": { bgcolor: "#bce64c" } }}>
                  Add Warehouse
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? "#141414" : "#F5F2EB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Warehouse Code</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Warehouse Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Manager</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Stock Assets count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {warehouses.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 4 }}>No warehouses registered.</TableCell></TableRow>
                  ) : (
                    warehouses.map((wh) => {
                      const stockCount = assets.filter(a => String(a.warehouse) === String(wh._id)).length;
                      return (
                        <TableRow key={wh._id}>
                          <TableCell sx={{ fontWeight: 700 }}>{wh.code}</TableCell>
                          <TableCell>{wh.name}</TableCell>
                          <TableCell>{wh.location || "N/A"}</TableCell>
                          <TableCell>{wh.manager?.name || "Unassigned"}</TableCell>
                          <TableCell>{stockCount} assets</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 1: Licenses */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
              <Typography variant="h6" fontWeight={800}>Software & Subscriptions</Typography>
              <Button variant="contained" onClick={() => setLicModal(true)} startIcon={<AddRounded />} sx={{ bgcolor: "text.primary", color: "#000", fontWeight: 700, borderRadius: "8px", "&:hover": { bgcolor: "#bce64c" } }}>
                Purchase Software License
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? "#141414" : "#F5F2EB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Software Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Publisher</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Seats Allocated</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Expiry Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {licenses.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ color: "text.secondary", py: 4 }}>No licenses found.</TableCell></TableRow>
                  ) : (
                    licenses.map((lic) => (
                      <TableRow key={lic._id}>
                        <TableCell sx={{ fontWeight: 700 }}>{lic.softwareName}</TableCell>
                        <TableCell>{lic.publisher || "N/A"}</TableCell>
                        <TableCell>{lic.assignedSeats} / {lic.totalSeats} seats</TableCell>
                        <TableCell>{lic.expiryDate ? new Date(lic.expiryDate).toLocaleDateString() : "Lifetime"}</TableCell>
                        <TableCell><StatusChip status={lic.status} /></TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => { setActiveLicense(lic); setAssignLicModal(true); }}
                            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "6px" }}
                          >
                            Assign Seat
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

        {/* Tab 2: AMC & Warranty */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
              <Typography variant="h6" fontWeight={800}>Warranty Claims & AMC Contracts</Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button variant="outlined" onClick={() => setClaimModal(true)} startIcon={<AddRounded />} sx={{ fontWeight: 700, borderRadius: "8px" }}>
                  File Warranty Claim
                </Button>
                <Button variant="contained" onClick={() => setAmcModal(true)} startIcon={<AddRounded />} sx={{ bgcolor: "text.primary", color: "#000", fontWeight: 700, borderRadius: "8px", "&:hover": { bgcolor: "#bce64c" } }}>
                  New AMC Contract
                </Button>
              </Box>
            </Box>

            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1, mt: 2 }}>Warranty Support Claims</Typography>
            <TableContainer sx={{ mb: 4 }}>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? "#141414" : "#F5F2EB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Claim No</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Asset Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Vendor</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Issue / Fault</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {warrantyClaims.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ color: "text.secondary", py: 2 }}>No active warranty claims logged.</TableCell></TableRow>
                  ) : (
                    warrantyClaims.map((cl) => (
                      <TableRow key={cl._id}>
                        <TableCell sx={{ fontWeight: 700 }}>{cl.claimNumber}</TableCell>
                        <TableCell>{cl.asset?.name || "Deleted Asset"}</TableCell>
                        <TableCell>{cl.vendor?.name}</TableCell>
                        <TableCell>{cl.issueDescription}</TableCell>
                        <TableCell><StatusChip status={cl.status} /></TableCell>
                        <TableCell align="right">
                          {cl.status === "Filed" && (
                            <Button
                              variant="outlined"
                              size="small"
                              color="success"
                              onClick={async () => {
                                try {
                                  await api.put(`/enterprise/warranty/claims/${cl._id}/resolve`, { status: "Resolved", resolutionDetails: "Vendor resolved the issue" });
                                  fetchData();
                                } catch { setError("Failed to resolve claim"); }
                              }}
                              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "6px" }}
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Active AMC Agreements</Typography>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? "#141414" : "#F5F2EB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Contract Number</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Vendor</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Assets Covered</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Validity Period</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Annual Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {amcContracts.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 2 }}>No AMC agreements logged.</TableCell></TableRow>
                  ) : (
                    amcContracts.map((amc) => (
                      <TableRow key={amc._id}>
                        <TableCell sx={{ fontWeight: 700 }}>{amc.contractNumber}</TableCell>
                        <TableCell>{amc.vendor?.name}</TableCell>
                        <TableCell>{amc.assetsCovered?.length || 0} assets</TableCell>
                        <TableCell>{new Date(amc.startDate).toLocaleDateString()} - {new Date(amc.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>₹{amc.annualCost?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 3: Maintenance */}
        {tabValue === 3 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
              <Typography variant="h6" fontWeight={800}>Preventive Maintenance Schedules</Typography>
              <Button variant="contained" onClick={() => setMaintModal(true)} startIcon={<AddRounded />} sx={{ bgcolor: "text.primary", color: "#000", fontWeight: 700, borderRadius: "8px", "&:hover": { bgcolor: "#bce64c" } }}>
                Schedule Inspection Task
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? "#141414" : "#F5F2EB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Asset Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Task / Inspection</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Frequency</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Next Due Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Assigned Engineer</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 4 }}>No maintenance scheduled.</TableCell></TableRow>
                  ) : (
                    schedules.map((sch) => (
                      <TableRow key={sch._id}>
                        <TableCell sx={{ fontWeight: 700 }}>{sch.asset?.name}</TableCell>
                        <TableCell>{sch.taskName}</TableCell>
                        <TableCell>{sch.frequency}</TableCell>
                        <TableCell>{new Date(sch.nextDueDate).toLocaleDateString()}</TableCell>
                        <TableCell>{sch.assignedEngineer?.name || "Unassigned"}</TableCell>
                        <TableCell><StatusChip status={sch.status} /></TableCell>
                        <TableCell align="right">
                          {sch.status !== "Completed" && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleCompleteMaintenance(sch._id)}
                              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "6px" }}
                            >
                              Sign Off Complete
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

        {/* Tab 4: Transfers */}
        {tabValue === 4 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
              <Typography variant="h6" fontWeight={800}>Asset Handover Workflows</Typography>
              <Button variant="contained" onClick={() => setTransferModal(true)} startIcon={<SwapHorizRounded />} sx={{ bgcolor: "text.primary", color: "#000", fontWeight: 700, borderRadius: "8px", "&:hover": { bgcolor: "#bce64c" } }}>
                Request Asset Transfer
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? "#141414" : "#F5F2EB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Asset</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Transferring From</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Transferring To</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Stage / Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Workflow Approvals</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transfers.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 4 }}>No transfer requests.</TableCell></TableRow>
                  ) : (
                    transfers.map((tr) => (
                      <TableRow key={tr._id}>
                        <TableCell sx={{ fontWeight: 700 }}>{tr.asset?.name}</TableCell>
                        <TableCell>{tr.fromUser?.name}</TableCell>
                        <TableCell>{tr.toUser?.name}</TableCell>
                        <TableCell><StatusChip status={tr.status} /></TableCell>
                        <TableCell align="right">
                          {tr.status === "Pending HOD" && (currentUser?.role === "hod" || currentUser?.role === "admin") && (
                            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                              <IconButton color="success" size="small" onClick={() => handleHODApproval(tr._id, true)}><CheckCircleRounded /></IconButton>
                              <IconButton color="error" size="small" onClick={() => handleHODApproval(tr._id, false)}><CancelRounded /></IconButton>
                            </Box>
                          )}
                          {tr.status === "Pending IT" && currentUser?.role === "admin" && (
                            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                              <Button size="small" variant="contained" color="success" onClick={() => handleITApproval(tr._id, true)} sx={{ textTransform: "none", fontWeight: 700 }}>IT Signoff</Button>
                              <Button size="small" variant="outlined" color="error" onClick={() => handleITApproval(tr._id, false)} sx={{ textTransform: "none", fontWeight: 700 }}>Reject</Button>
                            </Box>
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

        {/* Tab 5: QR Print Sheets */}
        {tabValue === 5 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
              <Typography variant="h6" fontWeight={800}>Sticker Tag Generator</Typography>
              <Button
                variant="contained"
                disabled={selectedAssetsQR.length === 0}
                onClick={handlePrintQRCodes}
                startIcon={<PrintRounded />}
                sx={{ bgcolor: "text.primary", color: "#000", fontWeight: 700, borderRadius: "8px", "&:hover": { bgcolor: "#bce64c" } }}
              >
                Print Selected Sticker Labels ({selectedAssetsQR.length})
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? "#141414" : "#F5F2EB" }}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedAssetsQR.length > 0 && selectedAssetsQR.length < assets.length}
                        checked={assets.length > 0 && selectedAssetsQR.length === assets.length}
                        onChange={() => {
                          if (selectedAssetsQR.length === assets.length) setSelectedAssetsQR([]);
                          else setSelectedAssetsQR(assets.map(a => a._id));
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Asset Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Serial Number</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Department</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assets.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 4 }}>No assets in registry.</TableCell></TableRow>
                  ) : (
                    assets.map((a) => (
                      <TableRow key={a._id}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selectedAssetsQR.includes(a._id)} onChange={() => handleSelectAssetQR(a._id)} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{a.name}</TableCell>
                        <TableCell>{a.serialNumber}</TableCell>
                        <TableCell>{a.category}</TableCell>
                        <TableCell>{a.department}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

      </Paper>

      {/* ─── MODAL: ADD WAREHOUSE ─── */}
      <Dialog open={whModal} onClose={() => setWhModal(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <form onSubmit={submitWarehouse}>
          <DialogTitle sx={{ fontWeight: 900 }}>Register Warehouse</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
              <TextField label="Warehouse Name" fullWidth value={whForm.name} onChange={(e) => setWhForm({ ...whForm, name: e.target.value })} required />
              <TextField label="Warehouse Code" fullWidth value={whForm.code} onChange={(e) => setWhForm({ ...whForm, code: e.target.value })} required />
              <TextField label="Location / Address" fullWidth value={whForm.location} onChange={(e) => setWhForm({ ...whForm, location: e.target.value })} />
              <FormControl fullWidth>
                <InputLabel>Assign Warehouse Manager</InputLabel>
                <Select value={whForm.managerId} label="Assign Warehouse Manager" onChange={(e) => setWhForm({ ...whForm, managerId: e.target.value })}>
                  {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setWhModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: "text.primary", color: "#000", fontWeight: 700 }}>Add Warehouse</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL: TRANSFER ASSET TO WAREHOUSE ─── */}
      <Dialog open={whTransferModal} onClose={() => setWhTransferModal(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <form onSubmit={submitWarehouseTransfer}>
          <DialogTitle sx={{ fontWeight: 900 }}>Store Asset in Warehouse</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
              <FormControl fullWidth>
                <InputLabel>Select Asset</InputLabel>
                <Select value={whTransferForm.assetId} label="Select Asset" onChange={(e) => setWhTransferForm({ ...whTransferForm, assetId: e.target.value })} required>
                  {assets.filter(a => a.status !== 'In Storage').map(a => (
                    <MenuItem key={a._id} value={a._id}>{`${a.name} (${a.serialNumber})`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Target Warehouse</InputLabel>
                <Select value={whTransferForm.warehouseId} label="Target Warehouse" onChange={(e) => setWhTransferForm({ ...whTransferForm, warehouseId: e.target.value })} required>
                  {warehouses.map(wh => (
                    <MenuItem key={wh._id} value={wh._id}>{wh.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Stock Condition Status</InputLabel>
                <Select value={whTransferForm.stockStatus} label="Stock Condition Status" onChange={(e) => setWhTransferForm({ ...whTransferForm, stockStatus: e.target.value })}>
                  <MenuItem value="Available">Available for Reassignment</MenuItem>
                  <MenuItem value="Reserved">Reserved</MenuItem>
                  <MenuItem value="Damaged">Damaged / Faulty</MenuItem>
                  <MenuItem value="Lost">Lost</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setWhTransferModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: "text.primary", color: "#000", fontWeight: 700 }}>Confirm Storage</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL: PURCHASE LICENSE ─── */}
      <Dialog open={licModal} onClose={() => setLicModal(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <form onSubmit={submitLicense}>
          <DialogTitle sx={{ fontWeight: 900 }}>Purchase Software Subscription</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
              <TextField label="Software Name" fullWidth value={licForm.softwareName} onChange={(e) => setLicForm({ ...licForm, softwareName: e.target.value })} required />
              <TextField label="Publisher (e.g. Adobe, Microsoft)" fullWidth value={licForm.publisher} onChange={(e) => setLicForm({ ...licForm, publisher: e.target.value })} />
              <TextField label="Activation / License Key" fullWidth value={licForm.licenseKey} onChange={(e) => setLicForm({ ...licForm, licenseKey: e.target.value })} required />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField label="Total Seats / Allocations" type="number" fullWidth value={licForm.totalSeats} onChange={(e) => setLicForm({ ...licForm, totalSeats: e.target.value })} required />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Renewal Cost (₹)" type="number" fullWidth value={licForm.renewalCost} onChange={(e) => setLicForm({ ...licForm, renewalCost: e.target.value })} />
                </Grid>
              </Grid>
              <TextField label="Expiry / Next Renewal Date" type="date" InputLabelProps={{ shrink: true }} fullWidth value={licForm.expiryDate} onChange={(e) => setLicForm({ ...licForm, expiryDate: e.target.value })} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setLicModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: "text.primary", color: "#000", fontWeight: 700 }}>Add License</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL: ALLOCATE LICENSE SEAT ─── */}
      <Dialog open={assignLicModal} onClose={() => setAssignLicModal(false)} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <form onSubmit={submitLicenseAssignment}>
          <DialogTitle sx={{ fontWeight: 900 }}>Allocate License Seat</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
              <FormControl fullWidth>
                <InputLabel>Select Target Employee</InputLabel>
                <Select value={assignLicForm.userId} label="Select Target Employee" onChange={(e) => setAssignLicForm({ userId: e.target.value })} required>
                  {users.map(u => (
                    <MenuItem key={u._id} value={u._id}>{`${u.name} (${u.department})`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setAssignLicModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: "text.primary", color: "#000", fontWeight: 700 }}>Allocate Seat</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL: AMC CONTRACT ─── */}
      <Dialog open={amcModal} onClose={() => setAmcModal(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <form onSubmit={submitAMC}>
          <DialogTitle sx={{ fontWeight: 900 }}>Create AMC Agreement</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
              <TextField label="Contract Agreement Number" fullWidth value={amcForm.contractNumber} onChange={(e) => setAmcForm({ ...amcForm, contractNumber: e.target.value })} required />
              <FormControl fullWidth>
                <InputLabel>Select Service Vendor</InputLabel>
                <Select value={amcForm.vendorId} label="Select Service Vendor" onChange={(e) => setAmcForm({ ...amcForm, vendorId: e.target.value })} required>
                  {vendors.map(v => (
                    <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField label="Start Date" type="date" InputLabelProps={{ shrink: true }} fullWidth value={amcForm.startDate} onChange={(e) => setAmcForm({ ...amcForm, startDate: e.target.value })} required />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="End Date" type="date" InputLabelProps={{ shrink: true }} fullWidth value={amcForm.endDate} onChange={(e) => setAmcForm({ ...amcForm, endDate: e.target.value })} required />
                </Grid>
              </Grid>
              <TextField label="Annual Agreement Cost (₹)" type="number" fullWidth value={amcForm.annualCost} onChange={(e) => setAmcForm({ ...amcForm, annualCost: e.target.value })} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setAmcModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: "text.primary", color: "#000", fontWeight: 700 }}>Save Contract</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL: FILE WARRANTY CLAIM ─── */}
      <Dialog open={claimModal} onClose={() => setClaimModal(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <form onSubmit={submitClaim}>
          <DialogTitle sx={{ fontWeight: 900 }}>File Warranty Claims Ticket</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
              <FormControl fullWidth>
                <InputLabel>Select Faulty Asset</InputLabel>
                <Select value={claimForm.assetId} label="Select Faulty Asset" onChange={(e) => setClaimForm({ ...claimForm, assetId: e.target.value })} required>
                  {assets.map(a => (
                    <MenuItem key={a._id} value={a._id}>{`${a.name} (${a.serialNumber})`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Warranty Vendor</InputLabel>
                <Select value={claimForm.vendorId} label="Warranty Vendor" onChange={(e) => setClaimForm({ ...claimForm, vendorId: e.target.value })} required>
                  {vendors.map(v => (
                    <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Hardware Issue Description" multiline rows={3} fullWidth value={claimForm.issueDescription} onChange={(e) => setClaimForm({ ...claimForm, issueDescription: e.target.value })} required />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setClaimModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: "text.primary", color: "#000", fontWeight: 700 }}>Submit Ticket</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL: SCHEDULE MAINTENANCE ─── */}
      <Dialog open={maintModal} onClose={() => setMaintModal(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <form onSubmit={submitMaintenance}>
          <DialogTitle sx={{ fontWeight: 900 }}>Schedule Preventive Inspection</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
              <FormControl fullWidth>
                <InputLabel>Select Target Asset</InputLabel>
                <Select value={maintForm.assetId} label="Select Target Asset" onChange={(e) => setMaintForm({ ...maintForm, assetId: e.target.value })} required>
                  {assets.map(a => (
                    <MenuItem key={a._id} value={a._id}>{`${a.name} (${a.serialNumber})`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Inspection Action (e.g. Dusting, Battery check)" fullWidth value={maintForm.taskName} onChange={(e) => setMaintForm({ ...maintForm, taskName: e.target.value })} required />
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select value={maintForm.frequency} label="Frequency" onChange={(e) => setMaintForm({ ...maintForm, frequency: e.target.value })}>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                  <MenuItem value="Quarterly">Quarterly</MenuItem>
                  <MenuItem value="Semi-Annually">Semi-Annually</MenuItem>
                  <MenuItem value="Annually">Annually</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Next Inspection Date" type="date" InputLabelProps={{ shrink: true }} fullWidth value={maintForm.nextDueDate} onChange={(e) => setMaintForm({ ...maintForm, nextDueDate: e.target.value })} required />
              <FormControl fullWidth>
                <InputLabel>Assigned IT Engineer</InputLabel>
                <Select value={maintForm.assignedEngineerId} label="Assigned IT Engineer" onChange={(e) => setMaintForm({ ...maintForm, assignedEngineerId: e.target.value })}>
                  {users.filter(u => ['admin', 'technician'].includes(u.role)).map(u => (
                    <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setMaintModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: "text.primary", color: "#000", fontWeight: 700 }}>Set Schedule</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL: REQUEST TRANSFER ─── */}
      <Dialog open={transferModal} onClose={() => setTransferModal(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", bgcolor: "background.paper" } } }}>
        <form onSubmit={submitTransfer}>
          <DialogTitle sx={{ fontWeight: 900 }}>Request Asset Transfer</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
              <FormControl fullWidth>
                <InputLabel>Select Asset to Handover</InputLabel>
                <Select value={transferForm.assetId} label="Select Asset to Handover" onChange={(e) => setTransferForm({ ...transferForm, assetId: e.target.value })} required>
                  {assets.filter(a => a.assignedStatus === 'Assigned').map(a => (
                    <MenuItem key={a._id} value={a._id}>{`${a.name} (Assigned to: ${a.assignedEmployeeName})`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Select Target Employee</InputLabel>
                <Select value={transferForm.toUserId} label="Select Target Employee" onChange={(e) => setTransferForm({ ...transferForm, toUserId: e.target.value })} required>
                  {users.map(u => (
                    <MenuItem key={u._id} value={u._id}>{`${u.name} (${u.department})`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setTransferModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: "text.primary", color: "#000", fontWeight: 700 }}>Raise Request</Button>
          </DialogActions>
        </form>
      </Dialog>

    </Box>
  );
};

export default EnterpriseWorkspace;
