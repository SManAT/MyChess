import axios from "axios";

/**
 * Usage: import api from './api.js'; // Adjust path as needed
 */

const api = axios.create({
  baseURL:
    "http://" +
    import.meta.env.VITE_SERVER_URL +
    ":" +
    import.meta.env.VITE_SERVER_PORT,
});

// Add request interceptor to include auth token
// add automatic the token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (userId) {
      config.headers["userid"] = userId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
