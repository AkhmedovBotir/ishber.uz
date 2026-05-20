/**
 * Nomzod arizalari (ApplicationSubmissions) — admin API
 */

import { apiRequest } from './api.js';

/** @param {string} vacancyId */
export const getSubmissionsByVacancy = async (vacancyId) => {
  return apiRequest(`/application-submissions/vacancy/${vacancyId}`, { method: 'GET' }, true);
};

/** @param {string} id */
export const getSubmissionById = async (id) => {
  return apiRequest(`/application-submissions/${id}`, { method: 'GET' }, true);
};

/**
 * Nomzod telefoni va/yoki forma javoblarini yangilash
 * @param {string} id
 * @param {{ applicantPhone?: string, answers?: Array<{ questionId: string, value: unknown }> }} body
 */
export const patchSubmission = async (id, body) => {
  return apiRequest(
    `/application-submissions/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
    true
  );
};

/**
 * @param {string} id
 * @param {{ status: 'accepted' | 'rejected', sendSms?: boolean, rejectionReason?: string }} body
 */
export const patchSubmissionStatus = async (id, body) => {
  return apiRequest(
    `/application-submissions/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
    true
  );
};

/** @param {string} id */
export const patchSubmissionContact = async (id) => {
  return apiRequest(
    `/application-submissions/${id}/contact`,
    {
      method: 'PATCH',
      body: JSON.stringify({}),
    },
    true
  );
};

/**
 * @param {string} id
 * @param {{ text: string, outcome?: string }} body
 */
export const postSubmissionContactNote = async (id, body) => {
  return apiRequest(
    `/application-submissions/${id}/contact-notes`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    true
  );
};
