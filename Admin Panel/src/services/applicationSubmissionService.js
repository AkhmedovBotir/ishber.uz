/**
 * Nomzod arizalari (ApplicationSubmissions) — admin API
 */

import { apiRequest } from './api.js';

/** @param {object} [params] */
export const getAllSubmissions = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.vacancyId) searchParams.set('vacancyId', params.vacancyId);
  if (params.status) searchParams.set('status', params.status);
  if (params.isCandidate !== undefined && params.isCandidate !== null && params.isCandidate !== '') {
    searchParams.set('isCandidate', String(params.isCandidate));
  }
  if (params.includeAnswers) searchParams.set('includeAnswers', 'true');
  const qs = searchParams.toString();
  return apiRequest(`/application-submissions${qs ? `?${qs}` : ''}`, { method: 'GET' }, true);
};

/**
 * @param {string} id
 * @param {boolean|null} [isCandidate]
 */
export const patchSubmissionCandidate = async (id, isCandidate = null) => {
  return apiRequest(
    `/application-submissions/${id}/candidate`,
    {
      method: 'PATCH',
      body: JSON.stringify(typeof isCandidate === 'boolean' ? { isCandidate } : {}),
    },
    true
  );
};

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
