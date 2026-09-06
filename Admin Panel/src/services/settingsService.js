/**
 * Tizim Sozlamalari (System Settings) API xizmati
 */

import { apiRequest } from './api.js';

export const getSystemSettings = async () => {
  const res = await apiRequest('/settings', { method: 'GET' }, true);
  return res?.data || res;
};

export const updateSystemSettings = async (payload) => {
  return apiRequest(
    '/settings',
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    true
  );
};

export const testEskizConnection = async (credentials = null) => {
  return apiRequest(
    '/settings/test-eskiz',
    {
      method: 'POST',
      body: JSON.stringify(credentials || {}),
    },
    true
  );
};

export const sendTestSms = async (phone, message = '') => {
  return apiRequest(
    '/settings/test-sms',
    {
      method: 'POST',
      body: JSON.stringify({ phone, message }),
    },
    true
  );
};
