import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = () => {
  const { currentUser } = useAuth();

  // Double check they are logged in
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Admin-tier roles always have access
  const adminRoles = ["admin", "super_admin", "hod", "manager", "it_support", "technician"];
  if (adminRoles.includes(currentUser.role)) return <Outlet />;
 
  // Employees with at least one non-default admin custom permission also get access
  const customPerms = currentUser.customPermissions || [];
  const basicPerms = ["View Dashboard", "Raise Tickets"];
  const hasAdminPerm = customPerms.some(p => p.allowed && !basicPerms.includes(p.feature));
  if (currentUser.role === "employee" && hasAdminPerm) return <Outlet />;
 
  if (currentUser.role === "technician") return <Navigate to="/technician/portal" replace />;
  return <Navigate to="/employee/portal" replace />;
};

export default AdminRoute;