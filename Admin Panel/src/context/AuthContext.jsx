/**
 * Authentication Context
 * Provides global authentication state and methods
 */

import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService.js';
import { getToken, getStoredAdmin, setStoredAdmin } from '../utils/token.js';

const AuthContext = createContext(null);

/**
 * AuthProvider component
 * Provides authentication state to the app
 */
export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore admin from localStorage on mount
  useEffect(() => {
    const token = getToken();
    const storedAdmin = getStoredAdmin();
    if (token && storedAdmin) {
      setAdmin(storedAdmin);
    }
    setLoading(false);
  }, []);

  /**
   * Login function
   * @param {string} username - Admin username
   * @param {string} password - Admin password
   * @returns {Promise<boolean>} Success status
   */
  const login = async (username, password) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.login(username, password);

      if (response && response.token && response.admin) {
        setAdmin(response.admin);
        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (err) {
      setError(err?.message || 'Login amalga oshmadi');
      setLoading(false);
      return false;
    }
  };

  /**
   * Logout function
   */
  const logout = () => {
    authService.logout();
    setAdmin(null);
    setError(null);
  };

  /**
   * Update stored admin (used after profile update)
   */
  const updateAdmin = (updated) => {
    setAdmin(updated);
    setStoredAdmin(updated);
  };

  const value = {
    admin,
    loading,
    error,
    login,
    logout,
    updateAdmin,
    isAuthenticated: !!admin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 * @returns {object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
