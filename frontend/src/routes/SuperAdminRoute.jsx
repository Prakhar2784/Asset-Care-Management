import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SuperAdminRoute = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Only super_admin role may access this console
  const role = (currentUser.role || '').toLowerCase().replace(/[^a-z]/g, '');
  if (role !== 'superadmin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

export default SuperAdminRoute;
