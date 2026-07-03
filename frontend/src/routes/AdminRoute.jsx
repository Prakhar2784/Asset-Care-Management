import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // Double check they are logged in
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Freshly registered admins must complete the setup wizard first — except
  // the "Add Asset" step, which the wizard itself links out to
  const isOnboardingAssetStep = new URLSearchParams(location.search).get("onboarding") === "1";
  if (currentUser.role === "admin" && currentUser.onboardingDone === false && !isOnboardingAssetStep) {
    return <Navigate to="/onboarding" replace />;
  }

  // Admin-tier roles always have access
  const adminRoles = ["admin", "super_admin", "hod", "manager", "technician"];
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