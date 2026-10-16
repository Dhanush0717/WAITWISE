import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from stored token on initial mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('waitwise_token');
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success) {
            setUser(res.user);
            setActiveTicket(res.activeTicket || null);
          }
        } catch (err) {
          console.warn('Session expired or invalid token:', err.message);
          localStorage.removeItem('waitwise_token');
          setUser(null);
          setActiveTicket(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success) {
      localStorage.setItem('waitwise_token', res.token);
      setUser(res.user);
      // Fetch me to populate active ticket
      try {
        const meRes = await api.getMe();
        if (meRes.success) {
          setActiveTicket(meRes.activeTicket || null);
        }
      } catch (e) {
        // ignore
      }
      return res.user;
    }
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success) {
      localStorage.setItem('waitwise_token', res.token);
      setUser(res.user);
      return res.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('waitwise_token');
    setUser(null);
    setActiveTicket(null);
  };

  const refreshActiveTicket = async () => {
    if (user) {
      try {
        const res = await api.getMe();
        if (res.success) {
          setActiveTicket(res.activeTicket || null);
        }
      } catch (err) {
        console.error('Error refreshing active ticket:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeTicket,
        loading,
        login,
        register,
        logout,
        setActiveTicket,
        refreshActiveTicket,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
