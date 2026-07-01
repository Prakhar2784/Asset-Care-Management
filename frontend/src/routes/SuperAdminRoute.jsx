import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SuperAdminRoute = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Only super_admin role may access this console
  if (currentUser.role !== "super_admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

export default SuperAdminRoute;
