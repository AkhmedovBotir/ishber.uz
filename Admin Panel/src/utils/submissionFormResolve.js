/**
 * Ariza uchun so'rovnoma (forma) yuklash va savol metama'lumotlari
 */

import {
  getApplicationFormById,
  getApplicationFormByVacancyId,
} from '../services/applicationFormService.js';
import { normalizeId } from './submissionAnswers.js';

/** @param {unknown} value */
export function resolveEntityId(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    const s = value.trim();
    return s || null;
  }
  if (typeof value === 'object' && value._id != null) {
    return String(value._id);
  }
  return null;
}

/**
 * @param {object} submission
 * @param {{ fallbackVacancyId?: string|null }} [options]
 * @returns {Promise<object|null>}
 */
export async function loadApplicationFormForSubmission(submission, options = {}) {
  if (!submission || typeof submission !== 'object') return null;

  const embedded = submission.applicationForm ?? submission.form;
  if (embedded && typeof embedded === 'object' && Array.isArray(embedded.questions)) {
    return embedded;
  }

  const formId =
    resolveEntityId(submission.applicationFormId) ??
    resolveEntityId(submission.formId) ??
    resolveEntityId(submission.applicationForm);

  if (formId) {
    try {
      return await getApplicationFormById(formId);
    } catch {
      /* vakansiya orqali qayta uriniladi */
    }
  }

  const vacancyId =
    resolveEntityId(submission.vacancyId) ??
    resolveEntityId(submission.vacancy) ??
    resolveEntityId(options.fallbackVacancyId);

  if (vacancyId) {
    try {
      return await getApplicationFormByVacancyId(vacancyId);
    } catch {
      return null;
    }
  }

  return null;
}

/** @param {string|number} id */
const shortIdHint = (id) => {
  const s = String(id);
  return s.length > 10 ? `${s.slice(0, 8)}…` : s;
};

/**
 * @param {object|null} form
 * @returns {{ labelById: Record<string, string>, typeById: Record<string, string>, orderById: Record<string, number> }}
 */
export function buildQuestionMaps(form) {
  const labelById = {};
  const typeById = {};
  const orderById = {};
  const list = Array.isArray(form?.questions) ? form.questions : [];

  for (const q of list) {
    const key = normalizeId(q?._id);
    if (!key) continue;
    const text = typeof q.question === 'string' ? q.question.trim() : '';
    labelById[key] = text || `Savol (${shortIdHint(id)})`;
    typeById[key] = typeof q.type === 'string' ? q.type : 'text';
    orderById[key] = typeof q.order === 'number' ? q.order : 0;
  }

  return { labelById, typeById, orderById };
}

/**
 * @param {object|null} form
 * @param {object} submission
 */
export function getFormDisplayName(form, submission) {
  const fromForm = typeof form?.nom === 'string' ? form.nom.trim() : '';
  if (fromForm) return fromForm;

  const fromSub =
    (typeof submission?.applicationFormName === 'string' && submission.applicationFormName.trim()) ||
    (typeof submission?.formName === 'string' && submission.formName.trim()) ||
    (typeof submission?.applicationFormNom === 'string' && submission.applicationFormNom.trim()) ||
    '';

  return fromSub;
}
