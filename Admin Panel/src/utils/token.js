/**
 * Token & admin storage utilities
 * Handles JWT token and admin info storage in localStorage
 */

const TOKEN_KEY = 'admin_token';
const ADMIN_KEY = 'admin_data';

/**
 * Save token to localStorage
 */
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Get token from localStorage
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Remove token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Save admin info to localStorage
 */
export const setStoredAdmin = (admin) => {
  if (admin) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  } else {
    localStorage.removeItem(ADMIN_KEY);
  }
};

/**
 * Get admin info from localStorage
 */
export const getStoredAdmin = () => {
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
};

/**
 * Remove admin info from localStorage
 */
export const removeStoredAdmin = () => {
  localStorage.removeItem(ADMIN_KEY);
};

/**
 * Clear all auth data
 */
export const clearAuth = () => {
  removeToken();
  removeStoredAdmin();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};
