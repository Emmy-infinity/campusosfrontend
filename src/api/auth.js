// src/api/auth.js
import { api } from "./client";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

// ─── Login ─────────────────────────────────────────────────────────
export async function login(username, password) {
  const { data } = await api.post("/token/", { username, password });
  localStorage.setItem(ACCESS_KEY, data.access);
  localStorage.setItem(REFRESH_KEY, data.refresh);
  return data;
}

// ─── Register ──────────────────────────────────────────────────────
export async function register(payload) {
  const { data } = await api.post("/register/", payload);
  // Register endpoint returns { user, access, refresh }
  if (data?.access) localStorage.setItem(ACCESS_KEY, data.access);
  if (data?.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
  return data;
}

// ─── Logout ────────────────────────────────────────────────────────
export function logout() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ─── Current user ──────────────────────────────────────────────────
export async function getMe() {
  const { data } = await api.get("/users/me/");
  return data;
}