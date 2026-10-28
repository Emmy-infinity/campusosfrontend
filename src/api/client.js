// src/api/client.js
import axios from "axios";

// ─── Config ────────────────────────────────────────────────────────
// Relative base URL — requests flow through Vite's proxy (see
// vite.config.js), which forwards them to Django at localhost:8000.
//
// Why relative?
//   • Works on localhost during dev
//   • Works through ngrok when someone opens the app on their phone
//   • No CORS preflight since everything is same-origin from the browser's POV
//
// If you ever deploy the frontend WITHOUT a proxy (e.g. static hosting
// + separate Django domain), swap this for an absolute URL like:
//   const BASE = import.meta.env.VITE_API_BASE || "/api";
const BASE = "/api";

// Token storage keys — used everywhere for consistency
const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

// Header that bypasses ngrok's free-tier "You are about to visit..."
// interstitial HTML page. Harmless in local dev and on Render.
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

    // Do not attempt refresh on the refresh endpoint itself
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
// Same baseURL + auth, but we do NOT set Content-Type so the browser
// adds the multipart boundary automatically. We DO send the ngrok
// bypass header so uploads don't get intercepted by the interstitial.
export const uploadApi = axios.create({
  baseURL: BASE,
  timeout: 120000,                       // uploads can be slow
  headers: { "ngrok-skip-browser-warning": "true" },
});

uploadApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Do NOT set Content-Type — let the browser handle it
    return config;
  },
  (error) => Promise.reject(error)
);

// Same 401 refresh flow for uploads
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