/**
 * O'qitish materiallari (Learning Materials) API xizmati
 */

import { apiRequest } from './api.js';

export const getMaterialsByVacancy = async (vacancyId) => {
  return apiRequest(`/learning-materials/vacancy/${vacancyId}`, { method: 'GET' }, true);
};

export const getMaterialById = async (id) => {
  return apiRequest(`/learning-materials/${id}`, { method: 'GET' }, true);
};

export const createMaterial = async (payload) => {
  return apiRequest(
    '/learning-materials',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true
  );
};

export const updateMaterial = async (id, payload) => {
  return apiRequest(
    `/learning-materials/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    true
  );
};

export const deleteMaterial = async (id) => {
  return apiRequest(`/learning-materials/${id}`, { method: 'DELETE' }, true);
};

export const reorderMaterials = async (vacancyId, orderedIds) => {
  return apiRequest(
    '/learning-materials/reorder',
    {
      method: 'PATCH',
      body: JSON.stringify({ vacancyId, orderedIds }),
    },
    true
  );
};
