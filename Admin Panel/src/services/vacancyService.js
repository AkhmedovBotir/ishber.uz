/**
 * Vacancy CRUD service
 */

import { apiRequest } from './api.js';

/**
 * Get all vacancies
 * @returns {Promise<Array>}
 */
export const getAllVacancies = async () => {
  return apiRequest('/vacancies', { method: 'GET' }, true);
};

/**
 * Get vacancy by id
 * @param {string} id
 * @returns {Promise<object>}
 */
export const getVacancyById = async (id) => {
  return apiRequest(`/vacancies/${id}`, { method: 'GET' }, true);
};

/**
 * Create a new vacancy
 * @param {object} payload
 * @returns {Promise<object>}
 */
export const createVacancy = async (payload) => {
  return apiRequest(
    '/vacancies',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true
  );
};

/**
 * Update vacancy (partial or full)
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<object>}
 */
export const updateVacancy = async (id, payload) => {
  return apiRequest(
    `/vacancies/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    true
  );
};

/**
 * Delete vacancy
 * @param {string} id
 * @returns {Promise<null>}
 */
export const deleteVacancy = async (id) => {
  return apiRequest(`/vacancies/${id}`, { method: 'DELETE' }, true);
};
