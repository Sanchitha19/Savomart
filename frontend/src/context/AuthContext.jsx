import React, { createContext, useState, useEffect, useContext } from 'react';
import { getMe, setAuthToken } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem("savomart_token");
      if (savedToken) {
        try {
          // Temporarily set the token in Axios interceptor to verify
          setAuthToken(savedToken);
          const userData = await getMe();
          
          // If call succeeds, set state
          setToken(savedToken);
          setUser(userData);
        } catch (error) {
          console.error("Session restore failed, token may be expired:", error);
          // Clean up invalid session
          localStorage.removeItem("savomart_token");
          setAuthToken(null);
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    setAuthToken(newToken);
    localStorage.setItem("savomart_token", newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem("savomart_token");
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{
      token,
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
