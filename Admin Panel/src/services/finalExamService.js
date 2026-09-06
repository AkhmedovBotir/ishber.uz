/**
 * Yakuniy Nazorat Testi va Topshiriqlar API xizmati
 */

import { apiRequest } from './api.js';

export const getFinalExamByVacancy = async (vacancyId) => {
  return apiRequest(`/final-exams/vacancy/${vacancyId}`, { method: 'GET' }, true);
};

export const saveFinalExamForVacancy = async (vacancyId, payload) => {
  return apiRequest(
    `/final-exams/vacancy/${vacancyId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    true
  );
};

export const listExamSubmissions = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.vacancyId) query.append('vacancyId', params.vacancyId);
  if (params.status) query.append('status', params.status);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return apiRequest(`/final-exams/submissions${qStr}`, { method: 'GET' }, true);
};

export const getExamSubmissionById = async (id) => {
  return apiRequest(`/final-exams/submissions/${id}`, { method: 'GET' }, true);
};

export const reviewExamSubmission = async (id, status, adminNote = '') => {
  return apiRequest(
    `/final-exams/submissions/${id}/review`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNote }),
    },
    true
  );
};
