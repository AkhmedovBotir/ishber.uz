/**
 * Nomzod suhbatlari (Interviews) — admin API
 * Base path: /api/interviews
 */

import { apiRequest } from './api.js';

/**
 * @param {object} payload
 * @param {string} payload.candidateName
 * @param {string} payload.candidatePhone
 * @param {string} payload.vacancyId
 * @param {string} [payload.applicationSubmissionId]
 * @param {string} payload.topic
 * @param {string} payload.interviewerName
 * @param {'text'|'url'|'place'} payload.addressMode
 * @param {string} [payload.addressText]
 * @param {string} [payload.placeLabel]
 * @param {{ lat: number, lng: number }} [payload.coordinates]
 * @param {string} payload.scheduledAt - ISO 8601
 */
export const createInterview = async (payload) => {
  return apiRequest(
    '/interviews',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true
  );
};

/**
 * @param {{ vacancyId?: string, status?: string }} [query]
 */
export const getInterviews = async (query = {}) => {
  const params = new URLSearchParams();
  if (query.vacancyId) params.set('vacancyId', query.vacancyId);
  if (query.status) params.set('status', query.status);
  const qs = params.toString();
  const path = qs ? `/interviews?${qs}` : '/interviews';
  return apiRequest(path, { method: 'GET' }, true);
};

/** @param {string} id */
export const getInterviewById = async (id) => {
  return apiRequest(`/interviews/${id}`, { method: 'GET' }, true);
};

/**
 * @param {string} id
 * @param {object} body - scheduledAt, rating, passed, rescheduleRequested, adminNotes, markEvaluated, status, ...
 */
export const patchInterview = async (id, body) => {
  return apiRequest(
    `/interviews/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
    true
  );
};
