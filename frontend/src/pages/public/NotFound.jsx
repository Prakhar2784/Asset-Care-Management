import { Link } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { HomeRounded, ArrowBackRounded } from "@mui/icons-material";

const ACCENT = "#FFFFFF";

export default function NotFound() {
  return (
    <Box sx={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      textAlign: "center", px: 3, bgcolor: "#0B0D12",
      backgroundImage: "radial-gradient(ellipse at 15% 0%, rgba(17,24,39,0.18) 0%, transparent 50%), radial-gradient(ellipse at 85% 100%, rgba(17,24,39,0.12) 0%, transparent 50%)",
    }}>
      <Box>
        <Typography sx={{
          fontSize: { xs: 90, md: 140 }, fontWeight: 950, lineHeight: 1,
          letterSpacing: "-4px", color: "rgba(17,24,39,0.14)",
        }}>
          404
        </Typography>
        <Typography variant="h4" fontWeight={900} sx={{ color: "#FFFFFF", mt: -3, mb: 1.5, letterSpacing: "-0.5px" }}>
          Page not found
        </Typography>
        <Typography sx={{ color: "#9CA3AF", fontSize: 16, maxWidth: 420, mx: "auto", mb: 4, lineHeight: 1.7 }}>
          The page you're looking for doesn't exist or may have been moved.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          <Button component={Link} to="/" variant="contained" startIcon={<HomeRounded />}
            sx={{
              background: "#FBBF24", color: "#111827", fontWeight: 800,
              px: 3.5, py: 1.4, borderRadius: "12px", boxShadow: "0 4px 16px rgba(17,24,39,0.4)",
              "&:hover": { background: "#F5A623" },
            }}>
            Back to Home
          </Button>
          <Button onClick={() => window.history.back()} variant="outlined" startIcon={<ArrowBackRounded />}
            sx={{ borderColor: `${ACCENT}50`, color: ACCENT, fontWeight: 700, px: 3.5, py: 1.4, borderRadius: "12px" }}>
            Go Back
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
