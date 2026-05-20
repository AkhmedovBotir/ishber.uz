/**
 * API service configuration
 * Base API configuration and request utilities
 */

const BASE_URL = 'https://api.ishber.uz/api'

/**
 * Create headers with optional authorization
 * @param {boolean} includeAuth - Whether to include auth token
 * @returns {object} Headers object
 */
const createHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = localStorage.getItem('admin_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

/**
 * Handle API response
 * @param {Response} response - Fetch response
 * @returns {Promise} Parsed JSON response
 */
const handleResponse = async (response) => {
  // 204 No Content
  if (response.status === 204) {
    return null;
  }

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  if (!response.ok) {
    const error = {
      message: (data && data.message) || 'Xatolik yuz berdi',
      status: response.status,
    };
    throw error;
  }

  return data;
};

/**
 * Make API request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @param {boolean} requireAuth - Whether authentication is required
 * @returns {Promise} API response
 */
export const apiRequest = async (endpoint, options = {}, requireAuth = false) => {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...createHeaders(requireAuth),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    if (error && error.message) {
      throw error;
    }
    throw {
      message: 'Tarmoq xatosi. Internet aloqangizni tekshiring.',
      status: 0,
    };
  }
};
