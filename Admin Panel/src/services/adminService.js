/**
 * Admin CRUD service
 * Handles all admin entity API calls
 */

import { apiRequest } from './api.js';

/**
 * Get all admins
 * @returns {Promise<Array>} List of admins
 */
export const getAllAdmins = async () => {
  return apiRequest('/admins', { method: 'GET' }, true);
};

/**
 * Get admin by id
 * @param {string} id - Admin id
 * @returns {Promise<object>} Admin
 */
export const getAdminById = async (id) => {
  return apiRequest(`/admins/${id}`, { method: 'GET' }, true);
};

/**
 * Create a new admin
 * @param {object} payload - { firstName, lastName, phoneNumber, username, password }
 * @returns {Promise<object>} Created admin
 */
export const createAdmin = async (payload) => {
  return apiRequest(
    '/admins',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true
  );
};

/**
 * Update admin (partial or full)
 * @param {string} id - Admin id
 * @param {object} payload - Fields to update
 * @returns {Promise<object>} Updated admin
 */
export const updateAdmin = async (id, payload) => {
  return apiRequest(
    `/admins/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    true
  );
};

/**
 * Delete admin
 * @param {string} id - Admin id
 * @returns {Promise<null>}
 */
export const deleteAdmin = async (id) => {
  return apiRequest(
    `/admins/${id}`,
    { method: 'DELETE' },
    true
  );
};
