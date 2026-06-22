import { Box, Button, Grid, Paper, Typography, Divider } from "@mui/material";
import { AddRounded, LaptopMacRounded, PhoneIphoneRounded, SupportAgentRounded } from "@mui/icons-material";
import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const EmployeePortal = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Mock assigned assets for the employee[cite: 26]
  const myAssets = [
    { 
      id: "AST-1042", 
      name: "MacBook Pro M2", 
      type: "Laptop", 
      status: "Active", 
      assignedDate: "12 Aug 2024", 
      icon: <LaptopMacRounded fontSize="medium" /> 
    },
    { 
      id: "AST-0891", 
      name: "iPhone 14 Corporate", 
      type: "Mobile", 
      status: "Active", 
      assignedDate: "05 Jan 2025", 
      icon: <PhoneIphoneRounded fontSize="medium" /> 
    }
  ];

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${currentUser?.name?.split(' ')[0] || 'User'}`}
        subtitle="Manage your assigned equipment and track your active service requests."
        action={
          <Button 
            variant="contained" 
            startIcon={<AddRounded />} 
            onClick={() => navigate("/tickets")}
            sx={{ 
              background: "linear-gradient(135deg, #4f46e5, #0ea5e9)", 
              color: "#fff", 
              fontWeight: 700, 
              px: 3, 
              py: 1.2, 
              borderRadius: "10px",
              boxShadow: "0 8px 16px rgba(79, 70, 229, 0.25)",
              "&:hover": { 
                transform: "translateY(-2px)", 
                boxShadow: "0 12px 20px rgba(79, 70, 229, 0.35)" 
              }
            }}
          >
            Report an Issue
          </Button>
        }
      />

      <Typography variant="h6" fontWeight={800} color="#0f172a" mb={3} mt={2} letterSpacing="-0.5px">
        My Assigned Equipment
      </Typography>

      <Grid container spacing={4}>
        {myAssets.map((asset) => (
          <Grid item xs={12} sm={6} md={4} key={asset.id}>
            <Paper 
              sx={{ 
                p: { xs: 3, md: 4 },
                color:"black", 
                borderRadius: 4, 
                bgcolor: "#ffffff", 
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.05)",
                display: "flex", 
                flexDirection: "column", 
                height: "100%",
                transition: "all 0.3s ease",
                "&:hover": { 
                  borderColor: "#4f46e5", 
                  transform: "translateY(-6px)",
                  boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.1)"
                }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box 
                  sx={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: 3, 
                    bgcolor: "#eef2ff", 
                    color: "#4f46e5", 
                    display: "grid", 
                    placeItems: "center" 
                  }}
                >
                  {asset.icon}
                </Box>
                <StatusChip label={asset.status} />
              </Box>

              <Box flex={1}>
                <Typography fontWeight={900} fontSize={20} color="#0f172a" letterSpacing="-0.5px" mb={0.5}>
                  {asset.name}
                </Typography>
                
                <Typography color="#4f46e5" fontSize={13} fontWeight={800} fontFamily="monospace" letterSpacing="0.5px" mb={2}>
                  {asset.id}
                </Typography>
                
                <Divider sx={{ my: 2, borderColor: "#f1f5f9" }} />
                
                <Typography color="#64748b" fontSize={13} fontWeight={500}>
                  Assigned On: <strong style={{ color: "#0f172a" }}>{asset.assignedDate}</strong>
                </Typography>
              </Box>

              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<SupportAgentRounded />}
                onClick={() => navigate("/tickets")}
                sx={{ 
                  mt: 4, 
                  borderColor: "#e2e8f0", 
                  color: "#0f172a", 
                  fontWeight: 700,
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                  "&:hover": { 
                    borderColor: "#ef4444", 
                    color: "#ef4444", 
                    bgcolor: "#fef2f2" 
                  } 
                }}
              >
                Raise Ticket
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default EmployeePortal;