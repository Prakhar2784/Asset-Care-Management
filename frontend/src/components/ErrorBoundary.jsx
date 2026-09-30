import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { RefreshRounded, HomeRounded, BugReportRounded } from "@mui/icons-material";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            bgcolor: "#F8FAFC"
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              maxWidth: 520,
              width: "100%",
              borderRadius: "20px",
              border: "1px solid #E2E8F0",
              textAlign: "center",
              bgcolor: "#FFFFFF",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "16px",
                bgcolor: "#FEF2F2",
                color: "#DC2626",
                display: "grid",
                placeItems: "center",
                mx: "auto",
                mb: 2
              }}
            >
              <BugReportRounded sx={{ fontSize: 32 }} />
            </Box>

            <Typography variant="h5" fontWeight={900} color="#0F172A" mb={1}>
              Something went wrong
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={2.5}>
              An unexpected interface error occurred. You can reload the page or navigate back to safety.
            </Typography>

            {this.state.error?.message && (
              <Box
                sx={{
                  p: 1.5,
                  mb: 3,
                  borderRadius: "10px",
                  bgcolor: "#F1F5F9",
                  border: "1px solid #E2E8F0",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "#DC2626",
                  textAlign: "left",
                  wordBreak: "break-word"
                }}
              >
                {this.state.error.message}
              </Box>
            )}

            <Box display="flex" gap={1.5} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<RefreshRounded />}
                onClick={() => window.location.reload()}
                sx={{
                  bgcolor: "#7777C7",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  borderRadius: "10px",
                  textTransform: "none",
                  px: 2.5,
                  "&:hover": { bgcolor: "#6464B8" }
                }}
              >
                Reload Page
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeRounded />}
                onClick={() => {
                  window.location.href = "/super-admin/console";
                }}
                sx={{
                  borderColor: "#CBD5E1",
                  color: "#334155",
                  fontWeight: 700,
                  borderRadius: "10px",
                  textTransform: "none",
                  px: 2.5
                }}
              >
                Go to Console
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
