import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Import Route Guards
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import SuperAdminRoute from "./routes/SuperAdminRoute";

// Import Layouts
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";

// Import Public Pages
import Home from "./pages/public/Home";
import Features from "./pages/public/Features";
import Modules from "./pages/public/Modules";
import Workflow from "./pages/public/Workflow";
import Contact from "./pages/public/Contact";
import TermsAndConditions from "./pages/public/TermsAndConditions";
import AuthPage from "./pages/auth/AuthPage";
import RegisterCompany from "./pages/auth/RegisterCompany";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Pricing from "./pages/public/Pricing";

// Import Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import Assets from "./pages/admin/Assets";
import AddAsset from "./pages/admin/AddAsset";
import Approvals from "./pages/admin/Approvals";
import Departments from "./pages/admin/Departments";
import AuditLogs from "./pages/admin/AuditLogs";
import Reports from "./pages/admin/Reports";
import AssignedDevices from "./pages/admin/AssignedDevices";
import UserManagement from "./pages/admin/UserManagement";
import EnterpriseWorkspace from "./pages/admin/EnterpriseWorkspace";
import Analytics from "./pages/admin/Analytics";
import InvoiceManagement from "./pages/admin/InvoiceManagement";
import ApiKeyManagement from "./pages/admin/ApiKeyManagement";
import MaintenanceLogs from "./pages/admin/MaintenanceLogs";
import ServiceCenters from "./pages/admin/ServiceCenters";
import SuperAdminPanel from "./pages/superadmin/SuperAdminPanel";

// Import Employee, Technician & Shared Pages
import EmployeePortal from "./pages/employee/EmployeePortal";
import TechnicianPortal from "./pages/technician/TechnicianPortal";
import Tickets from "./pages/shared/Tickets";
import Notifications from "./pages/shared/Notifications";
import Settings from "./pages/shared/Settings";

const WebsiteLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

function App() {
  return (
    <AuthProvider>
    <ThemeProvider>
      <ScrollToTop />
      <Routes>
        {/* PUBLIC ROUTES - Anyone can access */}
        <Route path="/" element={<WebsiteLayout><Home /></WebsiteLayout>} />
        <Route path="/features" element={<WebsiteLayout><Features /></WebsiteLayout>} />
        <Route path="/modules" element={<WebsiteLayout><Modules /></WebsiteLayout>} />
        <Route path="/workflow" element={<WebsiteLayout><Workflow /></WebsiteLayout>} />
        <Route path="/contact" element={<WebsiteLayout><Contact /></WebsiteLayout>} />
        <Route path="/terms" element={<WebsiteLayout><TermsAndConditions /></WebsiteLayout>} />
        <Route path="/pricing" element={<WebsiteLayout><Pricing /></WebsiteLayout>} />
        <Route path="/login" element={<WebsiteLayout><AuthPage /></WebsiteLayout>} />
        <Route path="/register-company" element={<RegisterCompany />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* SECURE ROUTES - Must be logged in */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            
            {/* Employee Route (Admins can view this too if they navigate to it) */}
            <Route path="/employee/portal" element={<EmployeePortal />} />
            <Route path="/technician/portal" element={<TechnicianPortal />} />
            
            {/* Shared Route (Both roles use this to see tickets) */}
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADMIN ONLY ROUTES - Role must be "admin" */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/assets" element={<Assets />} />
              <Route path="/admin/assets/add" element={<AddAsset />} />
              <Route path="/admin/approvals" element={<Approvals />} />
              <Route path="/admin/departments" element={<Departments />} />
              <Route path="/admin/audit" element={<AuditLogs />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/assignments" element={<AssignedDevices />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/enterprise" element={<EnterpriseWorkspace />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/invoices" element={<InvoiceManagement />} />
              <Route path="/admin/apikeys" element={<ApiKeyManagement />} />
              <Route path="/admin/maintenance" element={<MaintenanceLogs />} />
              <Route path="/admin/service-centers" element={<ServiceCenters />} />
            </Route>

            {/* SUPER ADMIN ONLY - Platform console */}
            <Route element={<SuperAdminRoute />}>
              <Route path="/super-admin/console" element={<SuperAdminPanel />} />
            </Route>

          </Route>
        </Route>

        {/* Catch-all: Redirect unknown URLs to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
    </AuthProvider>
  );
}

export default App;