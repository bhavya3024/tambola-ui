import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const API_BASE = "/api/auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Show a toast notification
  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Get stored tokens
  const getTokens = () => ({
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
  });

  // Store tokens
  const storeTokens = (accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  };

  // Clear tokens
  const clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  // Fetch with auth header
  const authFetch = useCallback(async (url, options = {}) => {
    const { accessToken } = getTokens();
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return fetch(url, { ...options, headers });
  }, []);

  // Try to refresh the token
  const refreshAccessToken = useCallback(async () => {
    const { refreshToken } = getTokens();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (data.success && data.data) {
        storeTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Fetch current user profile
  const fetchUser = useCallback(async () => {
    try {
      let res = await authFetch(`${API_BASE}/me`);

      // If 401, try refreshing
      if (res.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          res = await authFetch(`${API_BASE}/me`);
        } else {
          clearTokens();
          setUser(null);
          setLoading(false);
          return;
        }
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
        }
      } else {
        clearTokens();
        setUser(null);
      }
    } catch {
      clearTokens();
      setUser(null);
    }
    setLoading(false);
  }, [authFetch, refreshAccessToken]);

  // On mount, try to load user from stored token
  useEffect(() => {
    const { accessToken } = getTokens();
    if (accessToken) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  // Register
  const register = async (username, email, password, displayName) => {
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, displayName }),
      });

      const data = await res.json();

      if (data.success) {
        storeTokens(data.data.accessToken, data.data.refreshToken);
        setUser(data.data.user);
        showToast("Welcome to Tambola! 🎯", "success");
        return { success: true };
      }

      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: "Network error. Please try again." };
    }
  };

  // Login
  const login = async (loginValue, password) => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: loginValue, password }),
      });

      const data = await res.json();

      if (data.success) {
        storeTokens(data.data.accessToken, data.data.refreshToken);
        setUser(data.data.user);
        showToast("Welcome back! 🎯", "success");
        return { success: true };
      }

      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: "Network error. Please try again." };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authFetch(`${API_BASE}/logout`, { method: "POST" });
    } catch {
      // Ignore errors — clear local state regardless
    }
    clearTokens();
    setUser(null);
    showToast("Logged out", "info");
  };

  const value = {
    user,
    loading,
    toast,
    login,
    register,
    logout,
    showToast,
    getAccessToken: () => getTokens().accessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
