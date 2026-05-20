/**
 * ApplicationForm CRUD service
 * Handles all application form (so'rovnoma) API calls
 */

import { apiRequest } from './api.js';

/**
 * Get all application forms
 * @returns {Promise<Array>}
 */
export const getAllApplicationForms = async () => {
  return apiRequest('/application-forms', { method: 'GET' }, true);
};

/**
 * Get application form by id
 * @param {string} id
 * @returns {Promise<object>}
 */
export const getApplicationFormById = async (id) => {
  return apiRequest(`/application-forms/${id}`, { method: 'GET' }, true);
};

/**
 * Get application form by vacancy id
 * @param {string} vacancyId
 * @returns {Promise<object>}
 */
export const getApplicationFormByVacancyId = async (vacancyId) => {
  return apiRequest(`/application-forms/vacancy/${vacancyId}`, { method: 'GET' }, true);
};

/**
 * Create a new application form
 * @param {object} payload
 * @returns {Promise<object>}
 */
export const createApplicationForm = async (payload) => {
  return apiRequest(
    '/application-forms',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true
  );
};

/**
 * Update application form (partial or full)
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<object>}
 */
export const updateApplicationForm = async (id, payload) => {
  return apiRequest(
    `/application-forms/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    true
  );
};

/**
 * Delete application form
 * @param {string} id
 * @returns {Promise<null>}
 */
export const deleteApplicationForm = async (id) => {
  return apiRequest(`/application-forms/${id}`, { method: 'DELETE' }, true);
};

/**
 * Send application form link via SMS to the candidate's phone
 * @param {object} params
 * @param {string} params.phone - +998XXXXXXXXX
 * @param {string} params.vacancyId
 * @returns {Promise<object>} { success, vacancyId, formId, formUrl, sms }
 */
export const sendApplicationFormSmsLink = async ({ phone, vacancyId }) => {
  return apiRequest(
    '/application-forms/send-link-sms',
    {
      method: 'POST',
      body: JSON.stringify({ phone, vacancyId }),
    },
    true
  );
};
