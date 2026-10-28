// src/context/AuthContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  getMe,
} from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetches the current user profile if a token exists
  const loadUser = useCallback(async () => {
    if (!localStorage.getItem("access_token")) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Boot the auth state on first render
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Standard login flow
  const login = async (username, password) => {
    await apiLogin(username, password);
    await loadUser(); // Hydrates the `user` state so "Welcome back, [Name]" works
  };

  // Registration flow
  const register = async (payload) => {
    const data = await apiRegister(payload);
    // apiRegister stores tokens in localStorage.
    // We can populate `user` from the response directly — no extra request needed.
    setUser(data.user);
    return data.user;
  };

  // Logout flow
  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        reload: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
