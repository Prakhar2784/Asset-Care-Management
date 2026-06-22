import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Drawer,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  CircularProgress
} from "@mui/material";
import { AddRounded, DownloadRounded, VisibilityRounded, CloseRounded } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import api from "../../api/axios";

const Assets = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await api.get('/assets'); 
        setAssets(response.data);
      } catch (error) {
        console.error("Failed to fetch assets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const getWarrantyStatus = (warrantyEnd) => {
    if (!warrantyEnd) return "N/A";
    const endDate = new Date(warrantyEnd);
    return endDate > new Date() ? "In Warranty" : "Expired";
  };

  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#f8fafc",
      color: "#0f172a",
      borderRadius: "12px",
      "& fieldset": { borderColor: "#e2e8f0" },
      "&:hover fieldset": { borderColor: "#cbd5e1" },
      "&.Mui-focused fieldset": { borderColor: "#4f46e5", borderWidth: "2px" },
    },
    "& .MuiInputLabel-root": { color: "#64748b" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#4f46e5" },
    "& .MuiSvgIcon-root": { color: "#64748b" },
  };

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter((asset) => {
      const matchesSearch =
        asset.name?.toLowerCase().includes(search.toLowerCase()) ||
        asset._id?.toLowerCase().includes(search.toLowerCase()) ||
        asset.serialNumber?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = category === "All" || asset.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [search, category, assets]);

  // NEW: CSV Export Handler
  const handleExportCSV = () => {
    if (filteredAssets.length === 0) return;

    // 1. Define Headers
    const headers = [
      "Asset ID", 
      "Name", 
      "Serial Number", 
      "Category", 
      "Form Factor", 
      "Department", 
      "Location", 
      "Status", 
      "Warranty Status"
    ];

    // 2. Map Data to Rows
    const rows = filteredAssets.map(asset => {
      return [
        `AST-${asset._id.slice(-5).toUpperCase()}`,
        `"${asset.name || ''}"`, // Quotes handle commas in strings
        `"${asset.serialNumber || ''}"`,
        `"${asset.category || ''}"`,
        `"${asset.formFactor || ''}"`,
        `"${asset.department || ''}"`,
        `"${asset.location || 'Unassigned'}"`,
        `"${asset.status || ''}"`,
        `"${getWarrantyStatus(asset.warrantyEnd)}"`
      ];
    });

    // 3. Combine and Encode
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // 4. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Asset_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="Asset Registry"
        subtitle="Centralized database for hardware telemetry, lifecycle tracking, and maintenance operations."
        action={
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button 
              variant="outlined" 
              startIcon={<DownloadRounded />}
              onClick={handleExportCSV}
              disabled={filteredAssets.length === 0}
              sx={{ 
                borderColor: "#e2e8f0", 
                color: "#0f172a", 
                borderRadius: "10px", 
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { bgcolor: "#f8fafc", borderColor: "#cbd5e1" },
                "&.Mui-disabled": { borderColor: "#e2e8f0", color: "#94a3b8" }
              }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={() => navigate("/admin/assets/add")}
              sx={{ 
                background: "linear-gradient(135deg, #4f46e5, #0ea5e9)", 
                color: "#ffffff", 
                fontWeight: 700,
                textTransform: "none",
                px: 3,
                borderRadius: "10px",
                boxShadow: "0 8px 16px rgba(79, 70, 229, 0.25)",
                "&:hover": { 
                  transform: "translateY(-2px)", 
                  boxShadow: "0 12px 20px rgba(79, 70, 229, 0.35)",
                  background: "linear-gradient(135deg, #4338ca, #0284c7)"
                } 
              }}
            >
              Provision Asset
            </Button>
          </Box>
        }
      />

      {/* Filters */}
      <Paper 
        sx={{ 
          p: 3, 
          borderRadius: "16px", 
          mb: 4, 
          bgcolor: "#ffffff", 
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.05)"
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <TextField
              fullWidth
              sx={inputStyles}
              label="Search by asset name, ID or serial number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              sx={inputStyles}
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <MenuItem value="All">All Categories</MenuItem>
              <MenuItem value="IT Asset">IT Asset</MenuItem>
              <MenuItem value="Electrical">Electrical</MenuItem>
              <MenuItem value="Electronic">Electronic</MenuItem>
              <MenuItem value="Furniture">Furniture</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => { setSearch(""); setCategory("All"); }}
              sx={{ 
                height: "100%", 
                minHeight: "56px",
                borderColor: "#e2e8f0", 
                color: "#64748b",
                borderRadius: "12px",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { bgcolor: "#f8fafc", color: "#0f172a", borderColor: "#cbd5e1" }
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Table */}
      <Paper 
        sx={{ 
          borderRadius: "16px", 
          overflow: "hidden", 
          bgcolor: "#ffffff", 
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 30px -10px rgba(15, 23, 42, 0.05)"
        }}
      >
        <Box sx={{ overflowX: "auto" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={5} minHeight="300px">
              <CircularProgress sx={{ color: "#4f46e5" }} />
            </Box>
          ) : filteredAssets.length === 0 ? (
            <Box p={5} textAlign="center">
              <Typography color="#64748b" fontWeight={600} fontSize="16px">
                No assets found in the registry. Click "Provision Asset" to add one.
              </Typography>
            </Box>
          ) : (
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  {["Asset Identification", "Category", "Department", "Location", "Warranty", "Status", "Action"].map(
                    (head) => (
                      <TableCell key={head} sx={{ color: "#64748b", fontWeight: 700, borderBottom: "1px solid #e2e8f0", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {head}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow 
                    key={asset._id} 
                    sx={{ 
                      "&:hover": { bgcolor: "#f8fafc" }, 
                      "& td": { borderBottom: "1px solid #e2e8f0" },
                      transition: "background-color 0.2s ease"
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "15px" }}>{asset.name}</Typography>
                      <Typography sx={{ fontSize: "13px", color: "#64748b", fontFamily: "monospace", mt: 0.5 }}>
                        AST-{asset._id.slice(-5).toUpperCase()} • {asset.serialNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: "#0f172a", fontWeight: 500 }}>{asset.category}</TableCell>
                    <TableCell sx={{ color: "#0f172a", fontWeight: 500 }}>{asset.department}</TableCell>
                    <TableCell sx={{ color: "#64748b", fontWeight: 500 }}>{asset.location || "Unassigned"}</TableCell>
                    <TableCell>
                      <StatusChip label={getWarrantyStatus(asset.warrantyEnd)} />
                    </TableCell>
                    <TableCell>
                      <StatusChip label={asset.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityRounded />}
                        onClick={() => setSelected(asset)}
                        sx={{ 
                          borderColor: "#e2e8f0", 
                          color: "#0f172a", 
                          textTransform: "none",
                          borderRadius: "8px",
                          fontWeight: 600,
                          "&:hover": { borderColor: "#4f46e5", color: "#4f46e5", bgcolor: "#eef2ff" } 
                        }}
                      >
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Paper>

      {/* Detail Drawer */}
      <Drawer 
        anchor="right" 
        open={Boolean(selected)} 
        onClose={() => setSelected(null)}
        PaperProps={{ sx: { bgcolor: "#ffffff", color: "#0f172a", borderLeft: "1px solid #e2e8f0" } }}
      >
        <Box sx={{ width: { xs: "100vw", sm: 400, md: 450 }, p: { xs: 3, md: 4 } }}>
          {selected && (
            <>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
                <Box>
                  <Typography sx={{ variant: "h5", fontWeight: 900, letterSpacing: "-0.5px", fontSize: "24px", color: "#0f172a" }}>
                    {selected.name}
                  </Typography>
                  <Typography sx={{ color: "#4f46e5", fontFamily: "monospace", fontWeight: 600, mt: 1, fontSize: "16px" }}>
                    AST-{selected._id.slice(-5).toUpperCase()}
                  </Typography>
                </Box>
                <IconButton onClick={() => setSelected(null)} sx={{ color: "#64748b", bgcolor: "#f1f5f9", "&:hover": { bgcolor: "#e2e8f0" } }}>
                  <CloseRounded />
                </IconButton>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 5 }}>
                {[
                  ["Category Classification", selected.category],
                  ["Deployment Type", selected.formFactor || "Movable"],
                  ["Assigned Department", selected.department],
                  ["Physical Location", selected.location || "Unassigned"],
                  ["OEM / Vendor Partner", selected.vendor || "Standard OEM"],
                  ["Hardware Serial", selected.serialNumber],
                  ["Warranty Expiry", selected.warrantyEnd ? new Date(selected.warrantyEnd).toLocaleDateString() : "N/A"],
                ].map(([label, value]) => (
                  <Box
                    key={label}
                    sx={{
                      p: 2,
                      borderRadius: "12px",
                      bgcolor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <Typography sx={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontWeight: 700, color: "#0f172a", textAlign: "right", maxWidth: "60%" }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Button 
                fullWidth 
                variant="contained" 
                onClick={() => navigate("/tickets")}
                sx={{ 
                  py: 1.5, 
                  bgcolor: "#0f172a", 
                  color: "#ffffff", 
                  fontWeight: 700, 
                  textTransform: "none",
                  fontSize: "16px",
                  borderRadius: "12px",
                  "&:hover": { bgcolor: "#1e293b", transform: "translateY(-2px)" },
                  transition: "all 0.2s ease"
                }}
              >
                Log Breakdown Ticket
              </Button>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default Assets;