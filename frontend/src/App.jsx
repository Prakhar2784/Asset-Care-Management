import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Import Route Guards
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute"; 

// Import Layouts
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Layout from "./components/Layout";

// Import Public Pages
import Home from "./pages/public/Home";
import Features from "./pages/public/Features";
import Modules from "./pages/public/Modules";
import Workflow from "./pages/public/Workflow";
import Contact from "./pages/public/Contact";
import AuthPage from "./pages/auth/AuthPage";

// Import Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard"; 
import Assets from "./pages/admin/Assets";
import AddAsset from "./pages/admin/AddAsset";
import Approvals from "./pages/admin/Approvals";
import Vendors from "./pages/admin/Vendors";
import Departments from "./pages/admin/Departments";

// Import Employee & Shared Pages
import EmployeePortal from "./pages/employee/EmployeePortal";
import Tickets from "./pages/shared/Tickets";

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
      <Routes>
        {/* PUBLIC ROUTES - Anyone can access */}
        <Route path="/" element={<WebsiteLayout><Home /></WebsiteLayout>} />
        <Route path="/features" element={<WebsiteLayout><Features /></WebsiteLayout>} />
        <Route path="/modules" element={<WebsiteLayout><Modules /></WebsiteLayout>} />
        <Route path="/workflow" element={<WebsiteLayout><Workflow /></WebsiteLayout>} />
        <Route path="/contact" element={<WebsiteLayout><Contact /></WebsiteLayout>} />
        <Route path="/login" element={<WebsiteLayout><AuthPage /></WebsiteLayout>} />

        {/* SECURE ROUTES - Must be logged in */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            
            {/* Employee Route (Admins can view this too if they navigate to it) */}
            <Route path="/employee/portal" element={<EmployeePortal />} />
            
            {/* Shared Route (Both roles use this to see tickets) */}
            <Route path="/tickets" element={<Tickets />} />

            {/* ADMIN ONLY ROUTES - Role must be "admin" */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/assets" element={<Assets />} />
              <Route path="/admin/assets/add" element={<AddAsset />} />
              <Route path="/admin/approvals" element={<Approvals />} />
              <Route path="/admin/vendors" element={<Vendors />} />
              <Route path="/admin/departments" element={<Departments />} />
            </Route>

          </Route>
        </Route>

        {/* Catch-all: Redirect unknown URLs to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;