/**
 * Axios JS File, that send AuthToken, and handles Event Dispatcher

  in entry file add Listener------------
  window.addEventListener("server-unreachable", (event) => {
    console.log("Server unreachable:", event.detail);
    showNotification(
      "Server is currently unreachable. Please try again later.",
      "error",
    );
  });

  window.addEventListener("server-reachable", (event) => {
    console.log("Server is back online");
    hideNetworkError(); 
  });
*/

import axios from "axios";

// Custom event dispatcher for network status
const dispatchNetworkEvent = (type, data) => {
  const event = new CustomEvent(type, { detail: data });
  window.dispatchEvent(event);
};

const api = axios.create({
  baseURL:
    "http://" +
    import.meta.env.VITE_SERVER_URL +
    ":" +
    import.meta.env.VITE_SERVER_PORT,
  timeout: 10000,
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Dispatch success event (server is reachable)
    dispatchNetworkEvent("server-reachable", { timestamp: Date.now() });
    return response;
  },
  (error) => {
    if (
      error.code === "ECONNABORTED" ||
      error.code === "ERR_NETWORK" ||
      !error.response
    ) {
      // Dispatch unreachable event
      dispatchNetworkEvent("server-unreachable", {
        error: error.message,
        timestamp: Date.now(),
      });
    }
    return Promise.reject(error);
  },
);

export default api;
