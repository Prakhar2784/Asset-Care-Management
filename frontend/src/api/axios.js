// frontend/src/api/axios.js
import axios from 'axios';

// Create a configured instance of axios
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Pointing to your Node.js server
});

// Add a request interceptor to attach the JWT token automatically
api.interceptors.request.use(
  (config) => {
    // Look for the user object in local storage
    const user = JSON.parse(localStorage.getItem('assetcare_user'));
    
    // If the token exists, attach it to the Authorization header
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;