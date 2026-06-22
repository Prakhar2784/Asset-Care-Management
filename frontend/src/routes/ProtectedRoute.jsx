import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { currentUser } = useAuth();

  // If no user is logged in, kick them back to the login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If they are logged in, let them through to the child routes
  return <Outlet />;
};

export default ProtectedRoute;