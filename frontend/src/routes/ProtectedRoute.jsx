import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to={`/login?return=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;