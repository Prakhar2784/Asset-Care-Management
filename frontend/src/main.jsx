import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import App from "./App";
import "./index.css"; // Your custom True Dark CSS

// Define the True Dark Theme for Material-UI components
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#000000",
      paper: "#0a0a0a",
    },
    primary: {
      main: "#d4af37", // Professional Gold Accent
    },
    secondary: {
      main: "#3b82f6", // Blue Accent
    },
    text: {
      primary: "#ffffff",
      secondary: "#a1a1aa",
    },
    divider: "#27272a",
    success: {
      main: "#4ade80",
    },
    warning: {
      main: "#facc15",
    },
    error: {
      main: "#f87171",
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "8px",
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none", // Removes default MUI dark mode elevation overlay
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      {/* CssBaseline kicks off an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);