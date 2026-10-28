// src/api/client.js
import axios from "axios";

// ─── Config ────────────────────────────────────────────────────────
// In local dev, VITE_API_URL is undefined, so BASE becomes "/api" (Vite proxy handles it).
// In production (Render), VITE_API_URL must be set to your backend URL.
const BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : "/api";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

const COMMON_HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

// ─── Main API instance (JSON by default) ───────────────────────────
export const api = axios.create({
  baseURL: BASE,
  headers: COMMON_HEADERS,
  timeout: 30000,
});

// Attach access token on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh on 401 (simple-jwt flow)
let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const refresh = localStorage.getItem(REFRESH_KEY);

    if (
      status === 401 &&
      refresh &&
      !original._retry &&
      !original.url?.includes("/token/refresh/")
    ) {
      original._retry = true;

      try {
        refreshing =
          refreshing ||
          axios
            .post(`${BASE}/token/refresh/`, { refresh }, { headers: COMMON_HEADERS })
            .then((res) => {
              localStorage.setItem(ACCESS_KEY, res.data.access);
              return res.data.access;
            });

        const newToken = await refreshing;
        refreshing = null;

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        refreshing = null;
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ─── Upload instance (multipart) ───────────────────────────────────
export const uploadApi = axios.create({
  baseURL: BASE,
  timeout: 120000,
  headers: { "ngrok-skip-browser-warning": "true" },
});

uploadApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

uploadApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const refresh = localStorage.getItem(REFRESH_KEY);

    if (status === 401 && refresh && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post(
          `${BASE}/token/refresh/`,
          { refresh },
          { headers: COMMON_HEADERS }
        );
        localStorage.setItem(ACCESS_KEY, res.data.access);
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${res.data.access}`;
        return uploadApi(original);
      } catch (refreshError) {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
