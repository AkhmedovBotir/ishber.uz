import { apiRequest } from './api.js';

export const getTemplates = async () => {
  return apiRequest('/certificates/templates', { method: 'GET' }, true);
};

export const getTemplateById = async (id) => {
  return apiRequest(`/certificates/templates/${id}`, { method: 'GET' }, true);
};

export const createTemplate = async (payload) => {
  return apiRequest(
    '/certificates/templates',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true
  );
};

export const updateTemplate = async (id, payload) => {
  return apiRequest(
    `/certificates/templates/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    true
  );
};

export const deleteTemplate = async (id) => {
  return apiRequest(`/certificates/templates/${id}`, { method: 'DELETE' }, true);
};

export const setDefaultTemplate = async (id) => {
  return apiRequest(`/certificates/templates/${id}/default`, { method: 'PATCH' }, true);
};

export const getEligibleCandidates = async () => {
  return apiRequest('/certificates/eligible-candidates', { method: 'GET' }, true);
};

export const issueCertificate = async (payload) => {
  return apiRequest(
    '/certificates/issue',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true
  );
};

export const listCertificates = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/certificates?${query}`, { method: 'GET' }, true);
};

export const getCertificateById = async (id) => {
  return apiRequest(`/certificates/${id}`, { method: 'GET' }, true);
};

export const revokeCertificate = async (id, reason) => {
  return apiRequest(
    `/certificates/${id}/revoke`,
    {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    },
    true
  );
};

export const deleteCertificate = async (id) => {
  return apiRequest(`/certificates/${id}`, { method: 'DELETE' }, true);
};
