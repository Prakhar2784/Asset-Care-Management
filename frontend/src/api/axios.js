// frontend/src/api/axios.js
import axios from 'axios';

// Create a configured instance of axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `${window.location.origin}/api`,
});

// Function to dynamically resolve tenant ID
const getTenantId = (user) => {
  // 1. Try to resolve from subdomain (e.g. companyA.assetcare.com)
  const hostname = window.location.hostname;
  const isIpOrLocal = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname === 'localhost' || hostname === '127.0.0.1';
  if (!isIpOrLocal) {
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'app') {
      return parts[0];
    }
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

// Add a response interceptor to handle session invalidation and company deactivation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 403 && (data?.code === 'COMPANY_DEACTIVATED' || data?.message?.includes('Company account is deactivated') || data?.message?.includes('deactivated'))) {
        localStorage.removeItem('assetcare_user');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login?deactivated=1';
        }
      } else if (status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('assetcare_user');
      }
    }
    return Promise.reject(error);
  }
);

// Converts a relative avatar/logo/attachment path like "/uploads/avatars/photo.jpg"
// into the full URL using the origin or configured base URL.
export const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  let base = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
  if (!base || base === '') {
    base = typeof window !== 'undefined' ? window.location.origin : '';
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

export default api;