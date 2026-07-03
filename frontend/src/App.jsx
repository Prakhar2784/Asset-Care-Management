import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
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

// Public Pages
const Home = lazy(() => import("./pages/public/Home"));
const Features = lazy(() => import("./pages/public/Features"));
const Modules = lazy(() => import("./pages/public/Modules"));
const Workflow = lazy(() => import("./pages/public/Workflow"));
const Contact = lazy(() => import("./pages/public/Contact"));
const TermsAndConditions = lazy(() => import("./pages/public/TermsAndConditions"));
const AuthPage = lazy(() => import("./pages/auth/AuthPage"));
const RegisterCompany = lazy(() => import("./pages/auth/RegisterCompany"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const Pricing = lazy(() => import("./pages/public/Pricing"));
const NotFound = lazy(() => import("./pages/public/NotFound"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Assets = lazy(() => import("./pages/admin/Assets"));
const AddAsset = lazy(() => import("./pages/admin/AddAsset"));
const Approvals = lazy(() => import("./pages/admin/Approvals"));
const Departments = lazy(() => import("./pages/admin/Departments"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const AssignedDevices = lazy(() => import("./pages/admin/AssignedDevices"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const EnterpriseWorkspace = lazy(() => import("./pages/admin/EnterpriseWorkspace"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const InvoiceManagement = lazy(() => import("./pages/admin/InvoiceManagement"));
const ApiKeyManagement = lazy(() => import("./pages/admin/ApiKeyManagement"));
const MaintenanceLogs = lazy(() => import("./pages/admin/MaintenanceLogs"));
const ServiceCenters = lazy(() => import("./pages/admin/ServiceCenters"));
const SuperAdminPanel = lazy(() => import("./pages/superadmin/SuperAdminPanel"));

// Employee, Technician & Shared Pages
const EmployeePortal = lazy(() => import("./pages/employee/EmployeePortal"));
const TechnicianPortal = lazy(() => import("./pages/technician/TechnicianPortal"));
const Tickets = lazy(() => import("./pages/shared/Tickets"));
const Notifications = lazy(() => import("./pages/shared/Notifications"));
const Settings = lazy(() => import("./pages/shared/Settings"));
const OnboardingWizard = lazy(() => import("./pages/admin/OnboardingWizard"));

const WebsiteLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

const RouteFallback = () => (
  <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <CircularProgress sx={{ color: "#FBBF24" }} />
  </Box>
);

function App() {
  return (
    <AuthProvider>
    <ThemeProvider>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
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
          <Route path="/onboarding" element={<OnboardingWizard />} />
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

        {/* Catch-all: show a proper 404 instead of silently redirecting */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
