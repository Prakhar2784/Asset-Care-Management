import { Box, Paper, Typography } from "@mui/material";

const StatCard = ({ title, value, subtitle, icon, color = "#4f46e5" }) => {
  return (
    <Paper
      sx={{
        p: { xs: 3, md: 3.5 },
        borderRadius: 4,
        height: "100%",
        position: "relative",
        overflow: "hidden",
        bgcolor: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.05)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.1)",
          borderColor: color
        }
      }}
    >
      {/* Decorative Background Glow */}
      <Box
        sx={{
          position: "absolute",
          right: -30,
          top: -30,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
          pointerEvents: "none"
        }}
      />

      {/* Icon Container */}
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 3,
          display: "grid",
          placeItems: "center",
          color: "#ffffff",
          background: `linear-gradient(135deg, ${color}, #0ea5e9)`,
          mb: 3,
          boxShadow: `0 8px 16px ${color}30`
        }}
      >
        {icon}
      </Box>

      {/* Explicit Hex Colors to fix the invisible text issue */}
      <Typography 
        sx={{ 
          color: "#64748b", 
          fontWeight: 700, 
          fontSize: 13, 
          textTransform: "uppercase", 
          letterSpacing: "0.5px" 
        }}
      >
        {title}
      </Typography>

      <Typography 
        sx={{ 
          fontSize: "32px", 
          fontWeight: 900, 
          color: "#0f172a", 
          mt: 1, 
          mb: 0.5,
          letterSpacing: "-1px",
          lineHeight: 1
        }}
      >
        {value}
      </Typography>

      <Typography 
        sx={{ 
          color: "#64748b", 
          fontSize: 14, 
          fontWeight: 500 
        }}
      >
        {subtitle}
      </Typography>
    </Paper>
  );
};

export default StatCard;