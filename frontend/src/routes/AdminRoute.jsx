import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = () => {
  const { currentUser } = useAuth();

  // Double check they are logged in
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If they are logged in, but their role is NOT "admin", redirect them
  if (currentUser.role !== "admin") {
    return <Navigate to="/employee/portal" replace />;
  }

  // If they are an admin, let them access the admin page
  return <Outlet />;
};

export default AdminRoute;