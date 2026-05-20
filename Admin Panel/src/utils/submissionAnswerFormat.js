/**
 * Forma javobi qiymatlarini ko'rsatish (sana/vaqt va boshqalar)
 */

import { formatUzDate, formatUzDateTime } from './uzDateFormat.js';

const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}/;

/** @param {unknown} value */
export function looksLikeIsoDateString(value) {
  if (typeof value !== 'string') return false;
  const s = value.trim();
  if (!ISO_DATE_PREFIX.test(s)) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

/**
 * @param {unknown} value
 * @param {string} [questionType]
 * @returns {string|null} formatlangan matn yoki null (oddiy matn sifatida qoldirish)
 */
export function formatAnswerDisplayValue(value, questionType = '') {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? 'Ha' : "Yo'q";
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);

  const s = typeof value === 'string' ? value.trim() : String(value);
  if (!looksLikeIsoDateString(s)) return s;

  const type = (questionType || '').toLowerCase();

  if (type === 'date' || type === 'month' || type === 'week') {
    return formatUzDate(s);
  }

  if (type === 'time') {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  if (type === 'datetime' || ISO_DATETIME.test(s)) {
    return formatUzDateTime(s);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return formatUzDate(s);
  }

  return formatUzDateTime(s);
}
