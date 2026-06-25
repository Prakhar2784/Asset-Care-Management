import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import App from "./App";
import "./index.css";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#F5F4F0",
      paper: "#ffffff",
    },
    primary: {
      main: "#111111",
      contrastText: "#CBFA57",
    },
    secondary: {
      main: "#CBFA57",
      contrastText: "#111111",
    },
    text: {
      primary: "#111111",
      secondary: "#6B6B65",
    },
    divider: "rgba(17,17,17,0.10)",
    success: {
      main: "#16a34a",
    },
    warning: {
      main: "#d97706",
    },
    error: {
      main: "#dc2626",
    },
    action: {
      hover: "rgba(17,17,17,0.04)",
      selected: "rgba(17,17,17,0.08)",
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
          backgroundImage: "none",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(17,17,17,0.03)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: "#111111",
          fontWeight: 700,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
