// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("assetcare_user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      // Make POST request to your real backend
      const response = await api.post('/auth/login', { email, password });
      
      const user = response.data;
      setCurrentUser(user);
      localStorage.setItem("assetcare_user", JSON.stringify(user));
      
      return user;
    } catch (err) {
      const message = err.response?.data?.message || "Login failed. Please check your credentials.";
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (name, email, password, role, department) => {
    setError(null);
    try {
      // Make POST request to your real backend
      const response = await api.post('/auth/register', {
        name, email, password, role, department
      });
      
      const user = response.data;
      setCurrentUser(user);
      localStorage.setItem("assetcare_user", JSON.stringify(user));
      
      return user;
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed.";
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("assetcare_user");
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    error,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};