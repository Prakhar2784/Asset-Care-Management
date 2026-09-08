import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to={`/login?return=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;