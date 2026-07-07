// frontend/src/api/axios.js
import axios from 'axios';

// Create a configured instance of axios
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Pointing to your Node.js server
});

// Function to dynamically resolve tenant ID
const getTenantId = (user) => {
  // 1. Try to resolve from subdomain (e.g. companyA.assetcare.com)
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'app') {
    return parts[0];
  }
  
  // 2. Try to resolve from query parameter (e.g. ?tenant=companyA) - useful for local testing
  const urlParams = new URLSearchParams(window.location.search);
  const queryTenant = urlParams.get('tenant');
  if (queryTenant) {
    return queryTenant;
  }

  // 3. Fallback to logged in user's tenant context
  if (user && user.tenantId) {
    return user.tenantId;
  }

  return 'default';
};

// Add a request interceptor to attach the JWT token and X-Tenant-Id automatically
api.interceptors.request.use(
  (config) => {
    // Look for the user object in local storage
    const user = JSON.parse(localStorage.getItem('assetcare_user'));
    
    // Attach JWT token
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }

    // Attach Tenant Identification Header
    config.headers['X-Tenant-Id'] = getTenantId(user);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Converts a relative avatar/logo path like "/uploads/avatars/photo.jpg"
// into the full backend URL using the configured base URL.
export const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';
  return `${base}${path}`;
};

export default api;