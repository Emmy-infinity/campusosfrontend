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
  register as apiRegister,   // ← ADD
  getMe,
} from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (username, password) => {
    await apiLogin(username, password);
    await loadUser();
  };

  // ─── ADD THIS ─────────────────────────────────────────────────────
  const register = async (payload) => {
    const data = await apiRegister(payload);
    // apiRegister stores tokens in localStorage.
    // Populate `user` from the response — no extra request needed.
    setUser(data.user);
    return data.user;
  };
  // ──────────────────────────────────────────────────────────────────

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
        register,      // ← ADD
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