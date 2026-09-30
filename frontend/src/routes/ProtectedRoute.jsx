import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#F8FAFC" }}>
        <CircularProgress sx={{ color: "#7777C7" }} />
      </Box>
    );
  }

  if (!currentUser) {
    return <Navigate to={`/login?return=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;