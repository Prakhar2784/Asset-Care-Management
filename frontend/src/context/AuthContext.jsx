// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // On app load: hydrate from localStorage immediately, then refresh from server
  useEffect(() => {
    const storedUser = localStorage.getItem("assetcare_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setCurrentUser(parsed);
      // Fetch fresh profile so role/permission changes take effect immediately
      api.get('/auth/me', { headers: { Authorization: `Bearer ${parsed.token}` } })
        .then(({ data }) => {
          const fresh = { ...parsed, ...data, token: parsed.token };
          setCurrentUser(fresh);
          localStorage.setItem("assetcare_user", JSON.stringify(fresh));
        })
        .catch(() => {
          // Token expired or invalid — log out
          setCurrentUser(null);
          localStorage.removeItem("assetcare_user");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, role) => {
    setError(null);
    try {
      // Make POST request to your real backend
      const response = await api.post('/auth/login', { email, password, role });
      
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

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("assetcare_user");
  };

  // Call this after admin updates current user's own profile/role
  const refreshUser = async () => {
    const storedUser = localStorage.getItem("assetcare_user");
    if (!storedUser) return;
    const parsed = JSON.parse(storedUser);
    try {
      const { data } = await api.get('/auth/me');
      const fresh = { ...parsed, ...data, token: parsed.token };
      setCurrentUser(fresh);
      localStorage.setItem("assetcare_user", JSON.stringify(fresh));
    } catch { /* ignore */ }
  };

  const value = {
    currentUser,
    login,
    logout,
    refreshUser,
    error,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};