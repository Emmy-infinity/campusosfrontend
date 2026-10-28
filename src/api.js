// Open your local configuration file ──> src/api.js
import axios from "axios";

const api = axios.create({
  // 🌟 CLOUD ENGINE GATEWAY: Locked directly to your live production backend server instance
  baseURL: "https://campusos-1-43tc.onrender.com/api",
  
  // 🌟 THE EXPLICIT TIMEOUT FIX: Extends the connection threshold window to 45 seconds.
  // This completely stops Axios from dropping the network call while your Render free container wakes up!
  timeout: 45000 
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
