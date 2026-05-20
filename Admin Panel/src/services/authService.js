/**
 * Authentication service
 * Handles all authentication-related API calls
 */

import { apiRequest } from './api.js';
import { setToken, setStoredAdmin, clearAuth } from '../utils/token.js';

/**
 * Login admin
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {Promise<object>} { token, admin }
 */
export const login = async (username, password) => {
  const response = await apiRequest(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
    false
  );

  if (response && response.token) {
    setToken(response.token);
    if (response.admin) {
      setStoredAdmin(response.admin);
    }
  }

  return response;
};

/**
 * Logout admin
 */
export const logout = () => {
  clearAuth();
};
