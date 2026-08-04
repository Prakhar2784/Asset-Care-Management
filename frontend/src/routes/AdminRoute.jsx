import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PATH_PERMISSIONS = {
  "/admin/dashboard": ["View Dashboard"],
  "/admin/analytics": ["View Dashboard"],
  "/admin/assets": ["View All Assets", "Register Assets", "Edit / Delete Assets"],
  "/admin/assets/add": ["Register Assets"],
  "/admin/approvals": ["Raise Tickets"],
  "/admin/departments": ["Manage Departments"],
  "/admin/audit": ["View Audit Logs"],
  "/admin/assignments": ["Assign Assets"],
  "/admin/users": ["Manage Users"],
  "/admin/enterprise": ["Settings & Config"],
  "/admin/invoices": ["Settings & Config"],
  "/admin/apikeys": ["Settings & Config"],
  "/admin/maintenance": ["View All Assets"],
  "/admin/service-centers": ["View All Assets"],
};

const AdminRoute = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isOnboardingAssetStep = new URLSearchParams(location.search).get("onboarding") === "1";
  if (currentUser.role === "admin" && currentUser.onboardingDone === false && !isOnboardingAssetStep) {
    return <Navigate to="/onboarding" replace />;
  }

  // 1. If user has custom permissions configured, use them to check access dynamically
  const customPerms = currentUser.customPermissions || [];
  const hasCustomPerms = customPerms.length > 0;
  if (hasCustomPerms) {
    const path = location.pathname;
    let required = PATH_PERMISSIONS[path];
    if (path.startsWith("/admin/assets/edit/")) {
      required = ["Edit / Delete Assets"];
    }
    if (required) {
      const allowed = customPerms.some(p => required.includes(p.feature) && p.allowed === true);
      if (allowed) return <Outlet />;
    } else {
      // Non-restricted paths or sub-pages pass
      return <Outlet />;
    }
  }

  // 2. Fallback to role-based default permissions
  const adminRoles = ["admin", "super_admin", "hod", "manager"];
  if (adminRoles.includes(currentUser.role)) return <Outlet />;

  if (currentUser.role === "technician") {
    const allowedTechPaths = ["/admin/maintenance", "/admin/service-centers"];
    if (allowedTechPaths.includes(location.pathname)) {
      return <Outlet />;
    }
    return <Navigate to="/technician/portal" replace />;
  }

  return <Navigate to="/employee/portal" replace />;
};

export default AdminRoute;