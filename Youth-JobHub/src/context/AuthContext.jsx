import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "../services/api"; // Removed unused 'api' import

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("userInfo");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("Error parsing stored user info:", e);
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Keep user in sync with localStorage in case other tabs change it
    const onStorage = (e) => {
      if (e.key === "userInfo") {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch (err) {
          console.error("Error parsing user info from storage event:", err);
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Helper function for error message extraction
  const extractErrorMessage = (err) => {
    let errorMessage = "Network error";
    const body = err.response?.data;
    
    if (body) {
      if (typeof body === "string") {
        errorMessage = body;
      } else if (body.message) {
        errorMessage = body.message;
      } else if (body.errors) {
        // common shapes: array of { msg } or object of arrays
        if (Array.isArray(body.errors)) {
          errorMessage = body.errors.map((e) => e.msg || e).join("; ");
        } else if (typeof body.errors === "object") {
          try {
            errorMessage = Object.values(body.errors)
              .flat()
              .map((v) => (v.msg ? v.msg : v))
              .join("; ");
          } catch (error) {
            errorMessage = JSON.stringify(body.errors);
          }
        }
      } else {
        try {
          errorMessage = JSON.stringify(body);
        } catch (error) {
          errorMessage = String(body);
        }
      }
    } else {
      errorMessage = err.message || errorMessage;
    }
    
    return { errorMessage, details: body };
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/register", data);
      const result = res.data;
      if (result.success) {
        if (result.token) {
          localStorage.setItem("token", result.token);
        }
        if (result.user) {
          localStorage.setItem("userInfo", JSON.stringify(result.user));
          setUser(result.user);
        }
        return { success: true, user: result.user, token: result.token };
      }
      return { success: false, error: result.message || "Registration failed" };
    } catch (err) {
      console.error("Auth register error:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        body: err.response?.data,
        message: err.message,
      });

      const { errorMessage, details } = extractErrorMessage(err);
      return { success: false, error: errorMessage, details };
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", credentials);
      const result = res.data;
      if (result.success) {
        if (result.token) {
          localStorage.setItem("token", result.token);
        }
        if (result.user) {
          localStorage.setItem("userInfo", JSON.stringify(result.user));
          setUser(result.user);
        }
        return { success: true, user: result.user, token: result.token };
      }
      return { success: false, error: result.message || "Login failed" };
    } catch (err) {
      console.error("Auth login error:", {
        status: err.response?.status,
        body: err.response?.data,
        message: err.message,
      });

      const { errorMessage, details } = extractErrorMessage(err);
      return { success: false, error: errorMessage, details };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};

export default AuthContext;