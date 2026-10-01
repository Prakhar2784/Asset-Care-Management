import { Box, Typography } from "@mui/material";

export default function Preloader({ message = "Loading workspace...", fullScreen = true }) {
  return (
    <Box
      sx={{
        minHeight: fullScreen ? "100vh" : "70vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#0B0C1A",
        position: fullScreen ? "fixed" : "relative",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        userSelect: "none",
        overflow: "hidden",
      }}
    >

      {/* Main card */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          px: 3,
        }}
      >
        {/* Animated Brand Logo Container */}
        <Box
          sx={{
            position: "relative",
            width: 72,
            height: 72,
            mb: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Outer rotating pulse ring */}
          <Box
            sx={{
              position: "absolute",
              inset: -6,
              borderRadius: "20px",
              border: "2px solid rgba(119, 119, 199, 0.35)",
              borderTopColor: "#7777C7",
              borderRightColor: "transparent",
              animation: "spinRing 1.8s linear infinite",
              "@keyframes spinRing": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
            }}
          />

          {/* Logo Badge */}
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "16px",
              bgcolor: "rgba(22, 27, 46, 0.85)",
              border: "1px solid rgba(119, 119, 199, 0.4)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(119, 119, 199, 0.25)",
              animation: "logoBreath 2.8s ease-in-out infinite",
              "@keyframes logoBreath": {
                "0%, 100%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.04)" },
              },
            }}
          >
            <img
              src="/logo_home.png"
              alt="IAssetCare Logo"
              style={{
                width: 38,
                height: 38,
                objectFit: "contain",
                filter: "drop-shadow(0 2px 8px rgba(119, 119, 199, 0.4))",
              }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </Box>
        </Box>

        {/* Brand Name */}
        <Typography
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "-0.5px",
            color: "#FFFFFF",
            mb: 0.5,
          }}
        >
          IAsset<span style={{ color: "#7777C7" }}>Care</span>
        </Typography>

        {/* Tagline / Subtitle */}
        <Typography
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            fontWeight: 500,
            color: "#64748B",
            letterSpacing: "0.4px",
            mb: 3,
            textTransform: "uppercase",
          }}
        >
          Enterprise Asset Intelligence
        </Typography>

        {/* Modern Sleek Progress Bar */}
        <Box
          sx={{
            width: 180,
            height: 4,
            borderRadius: "4px",
            bgcolor: "rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
            position: "relative",
            mb: 2,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: "45%",
              borderRadius: "4px",
              background: "linear-gradient(90deg, #5D5DA8 0%, #7777C7 50%, #A5A5F2 100%)",
              boxShadow: "0 0 10px rgba(119, 119, 199, 0.6)",
              animation: "smoothProgress 1.4s ease-in-out infinite",
              "@keyframes smoothProgress": {
                "0%": { left: "-45%" },
                "50%": { left: "30%", width: "55%" },
                "100%": { left: "105%", width: "45%" },
              },
            }}
          />
        </Box>

        {/* Dynamic Status Message */}
        <Typography
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12.5px",
            fontWeight: 500,
            color: "#94A3B8",
            letterSpacing: "0.2px",
            animation: "textPulse 2s ease-in-out infinite alternate",
            "@keyframes textPulse": {
              "0%": { opacity: 0.65 },
              "100%": { opacity: 1 },
            },
          }}
        >
          {message}
        </Typography>
      </Box>
    </Box>
  );
}
