// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api"; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("userInfo")) || null
  );
  const [loading, setLoading] = useState(true);

  // Load current user on app start
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.getCurrentUser();
        setUser(res.user || res);
        localStorage.setItem("userInfo", JSON.stringify(res.user || res));
      } catch {
        setUser(null);
        localStorage.removeItem("userInfo");
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem("token");
    if (token) fetchUser();
    else setLoading(false);
  }, []);

  // Login function
  const login = async (credentials) => {
    const res = await api.login(credentials);

    if (res.token) {
      localStorage.setItem("token", res.token);
    }
    if (res.user) {
      localStorage.setItem("userInfo", JSON.stringify(res.user));
      setUser(res.user);
    }

    return res;
  };

  // Register function
  const register = async (userData) => {
    const res = await api.register(userData);

    if (res.token) {
      localStorage.setItem("token", res.token);
    }
    if (res.user) {
      localStorage.setItem("userInfo", JSON.stringify(res.user));
      setUser(res.user);
    }

    return res;
  };

  // Logout function
  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.log("Logout error ignored:", e);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ---------------------------
// ✅ Exported Hook (REQUIRED)
// ---------------------------
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
