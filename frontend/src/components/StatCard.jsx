import { Box, Paper, Typography } from "@mui/material";

const StatCard = ({ title, value, subtitle, icon, color = "#737373" }) => (
  <Paper sx={{
    p: 3,
    borderRadius: "20px",
    height: "100%",
    bgcolor: "background.paper",
    border: "1px solid",
    borderColor: "divider",
    display: "flex",
    flexDirection: "column",
    transition: "all 0.2s ease",
    position: "relative",
    overflow: "hidden",
    "&:hover": { transform: "translateY(-4px)", boxShadow: "0 20px 48px rgba(0,0,0,0.08)", borderColor: color },
  }}>
    {/* Faint accent circle */}
    <Box sx={{
      position: "absolute",
      right: -24,
      top: -24,
      width: 100,
      height: 100,
      borderRadius: "50%",
      bgcolor: color,
      opacity: 0.06,
      pointerEvents: "none",
    }} />

    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "text.secondary" }}>
        {title}
      </Typography>
      <Box sx={{ color, opacity: 0.55, "& svg": { fontSize: 22 } }}>{icon}</Box>
    </Box>

    <Typography sx={{ fontSize: "40px", fontWeight: 950, color: "text.primary", lineHeight: 1, letterSpacing: "-2px", mb: 0.5 }}>
      {value}
    </Typography>

    <Typography sx={{ fontSize: 12.5, color: "text.secondary", fontWeight: 500, mt: "auto", pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
      {subtitle}
    </Typography>
  </Paper>
);

export default StatCard;
